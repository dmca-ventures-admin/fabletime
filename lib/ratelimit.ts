/**
 * Rate limiter with two backends:
 *
 *   1. **Upstash Redis** (preferred) — sliding-window limiter shared across
 *      every serverless invocation. Enabled automatically when both
 *      `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set.
 *   2. **In-memory Map** (fallback) — only useful for local development.
 *      On Vercel every cold start gets its own process (and its own Map), so
 *      this backend is effectively no rate limiting at all in production.
 *
 * The in-memory Map is kept because it keeps `npm run dev` working without
 * requiring an Upstash account.
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Periodically prune expired entries to prevent unbounded growth.
// Runs every 5 minutes; only matters in long-lived processes.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

// -----------------------------------------------------------------------------
// Upstash backend
// -----------------------------------------------------------------------------

let upstashRedis: Redis | null = null;
/**
 * Limiter instances are keyed by `${limit}:${windowMs}` — we can't share one
 * across calls with different limits, and constructing them is cheap-ish but
 * not free, so we memoize.
 */
const upstashLimiters = new Map<string, Ratelimit>();

function isUpstashConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  if (!upstashRedis) {
    upstashRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!.trim(),
      token: process.env.UPSTASH_REDIS_REST_TOKEN!.trim(),
    });
  }
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: 'fabletime:rl',
      analytics: false,
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

// -----------------------------------------------------------------------------
// In-memory backend
// -----------------------------------------------------------------------------

function checkInMemory(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Check whether `key` is within its rate limit.
 *
 * Uses Upstash if configured, otherwise falls back to the in-memory Map.
 * The in-memory fallback is per-process and resets on cold start, so it is
 * NOT safe to rely on in production. Configure Upstash for real limits.
 *
 * @param key       - Unique identifier (e.g. `"generate:1.2.3.4"`)
 * @param limit     - Max requests allowed within `windowMs`
 * @param windowMs  - Window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  if (isUpstashConfigured()) {
    try {
      const limiter = getUpstashLimiter(limit, windowMs);
      const result = await limiter.limit(key);
      return { allowed: result.success, remaining: result.remaining };
    } catch (err) {
      // If Upstash flakes we don't want to hard-fail the request — fall
      // through to the in-memory limiter so the endpoint still responds.
      console.error('[ratelimit] Upstash error, falling back to in-memory:', err);
    }
  }
  return checkInMemory(key, limit, windowMs);
}

/**
 * Extract the true client IP from a Next.js request.
 *
 * Priority:
 *   1. `x-real-ip` — Vercel sets this to the client's real IP; it is not
 *      derived from client-supplied headers.
 *   2. The **last** entry in `x-forwarded-for`. The header is a list where
 *      each proxy appends the peer it saw. The FIRST entry is what the
 *      client (or an upstream proxy) claimed and is spoofable; the LAST
 *      entry is what our edge proxy saw and is authoritative in a
 *      single-proxy setup like Vercel.
 *   3. `"unknown"`.
 */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return 'unknown';
}
