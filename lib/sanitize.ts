/**
 * Strip control characters (including newlines, carriage returns, tabs) from
 * user-supplied text before it is interpolated into AI prompts. Without this,
 * an input like "cat\nIGNORE ALL" is 3 whitespace-delimited words and passes
 * the word-count check, but the embedded newline injects a new line into the
 * prompt allowing partial instruction override.
 */
export function sanitizePromptInput(s: string): string {
  // Replace any ASCII control character (0x00-0x1F, 0x7F) with a space,
  // then collapse runs of whitespace to a single space.
  return s.replace(/[\x00-\x1f\x7f]+/g, ' ').replace(/\s+/g, ' ').trim();
}
