/**
 * Short-lived HMAC token that authorises writes to a specific story row from
 * `/api/image`.
 *
 * Why: `/api/image` accepts `storyId` in the request body and updates the
 * `stories` row identified by that id (writing back the cached style and
 * generated image URL). Without a proof of ownership, any client that knows
 * a story id can overwrite another user's row — an IDOR.
 *
 * How: at story-creation time `/api/generate` mints
 *   token = base64url(HMAC-SHA256(`${storyId}:${sessionId}`, IMAGE_TOKEN_SECRET))
 * and returns it to the client via the `X-Image-Token` response header. The
 * client passes it back to `/api/image` alongside `storyId` and `sessionId`;
 * the route recomputes the HMAC and rejects mismatches with 403.
 *
 * We use Web Crypto (SubtleCrypto) so the same code path works from both the
 * Node and Edge runtimes.
 */

const ENCODER = new TextEncoder();

function getImageTokenSecret(): string | null {
  const secret = process.env.IMAGE_TOKEN_SECRET?.trim();
  return secret && secret.length > 0 ? secret : null;
}

function base64UrlEncode(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let bin = '';
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
 * Mint an image token binding `storyId` to `sessionId`.
 *
 * Returns `null` if `IMAGE_TOKEN_SECRET` is not configured — callers should
 * treat that as a soft failure (log + skip binding the token). The
 * verification path also treats a missing secret as a hard reject when a
 * token is supplied, so this never opens a "no secret = anything goes" hole.
 */
export async function signImageToken(
  storyId: string,
  sessionId: string | null,
): Promise<string | null> {
  const secret = getImageTokenSecret();
  if (!secret) return null;
  return hmacSign(`${storyId}:${sessionId ?? ''}`, secret);
}

/**
 * Verify an image token. Returns true iff:
 *   - `IMAGE_TOKEN_SECRET` is configured
 *   - the recomputed HMAC matches `token` (constant-time compare)
 */
export async function verifyImageToken(
  storyId: string,
  sessionId: string | null,
  token: string,
): Promise<boolean> {
  const secret = getImageTokenSecret();
  if (!secret) return false;
  const expected = await hmacSign(`${storyId}:${sessionId ?? ''}`, secret);
  return safeEqual(token, expected);
}
