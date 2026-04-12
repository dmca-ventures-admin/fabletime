/**
 * In-memory rate limiter.
 *
 * State is per-process and resets on cold starts — this provides a
 * reasonable defence against accidental hammering and casual abuse, but
 * is not a substitute for a distributed store (e.g. Upstash Redis) in
 * high-traffic environments.
 */

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

/**
 * Check whether `key` is within its rate limit.
 *
 * @param key       - Unique identifier (e.g. `"generate:1.2.3.4"`)
 * @param limit     - Max requests allowed within `windowMs`
 * @param windowMs  - Window duration in milliseconds
 */
export function checkRateLimit(
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

/** Extract the best available IP from a Next.js request. */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
