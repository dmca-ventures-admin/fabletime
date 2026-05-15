/**
 * Admin auth — HMAC-signed session cookie.
 *
 * Design:
 *   - Single hardcoded username ("admin") + password from process.env.ADMIN_PASSWORD.
 *   - On successful login, we mint a cookie of the form `<expiresAtMs>.<sigBase64Url>`
 *     where the signature is HMAC-SHA256 over the expiry, keyed by ADMIN_PASSWORD.
 *   - Middleware/proxy verifies the cookie by recomputing the HMAC and checking
 *     the expiry — no DB round-trip, works in the Edge runtime.
 *   - 24h lifetime per the issue spec.
 *
 * Why ADMIN_PASSWORD as the HMAC key: avoids requiring a separate
 * ADMIN_SESSION_SECRET env var. Rotating ADMIN_PASSWORD invalidates all live
 * sessions, which is the desired behaviour.
 *
 * Why Web Crypto (SubtleCrypto): works in both the Edge runtime (middleware)
 * and the Node runtime (server actions). `node:crypto` is unavailable in
 * Edge, so this is the only portable option.
 */

const ENCODER = new TextEncoder();

export const ADMIN_COOKIE_NAME = 'admin_session';
export const ADMIN_USERNAME = 'admin';
export const ADMIN_SESSION_MAX_AGE_S = 24 * 60 * 60; // 24h

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error('ADMIN_PASSWORD env var is not set');
  }
  return secret;
}

/**
 * Server-side helper for pages/server-actions to check if the current request
 * carries a valid admin session cookie. Used by app/admin/page.tsx as a
 * defence-in-depth check on top of the middleware guard — if middleware ever
 * fails to run (route matcher misconfig, edge bug), the page still refuses
 * to render.
 *
 * Imported lazily because `next/headers` is only available in App Router
 * server contexts.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

/** Constant-time string compare. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function base64UrlEncode(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let bin = '';
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, ENCODER.encode(message));
  return base64UrlEncode(sig);
}

/**
 * Validate username + password against env. Returns true on match.
 * Username comparison is also constant-time even though it is fixed,
 * so a wrong username and a wrong password take the same time.
 */
export function verifyCredentials(username: string, password: string): boolean {
  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return false;
  }
  // Run both comparisons so a wrong username doesn't short-circuit and leak timing.
  const userOk = safeEqual(username, ADMIN_USERNAME);
  const passOk = safeEqual(password, secret);
  return userOk && passOk;
}

/** Mint a signed session token valid for ADMIN_SESSION_MAX_AGE_S seconds. */
export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE_S * 1000;
  const payload = String(expiresAt);
  const sig = await hmacSign(payload, getSecret());
  return `${payload}.${sig}`;
}

/**
 * Verify a session token. Returns true iff:
 *   - the token has the expected `<expiresAt>.<sig>` shape
 *   - the HMAC matches (constant-time compare)
 *   - expiry is in the future
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const dotIndex = token.indexOf('.');
  if (dotIndex < 1) return false;

  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  if (!payload || !sig) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  let expected: string;
  try {
    expected = await hmacSign(payload, getSecret());
  } catch {
    return false;
  }
  return safeEqual(sig, expected);
}
