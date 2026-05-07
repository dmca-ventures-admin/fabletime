// lib/models.ts — single source of truth for AI model names
// Updated automatically by scripts/check-models.ts (weekly via HEARTBEAT.md)

export const MODELS = {
  /** Primary story generation model — most capable */
  story: 'claude-opus-4-5-20251101',
  /** Fast model for quick tasks: validation, emoji, questions, style selection */
  fast: 'claude-haiku-4-5',
} as const;

export type ModelKey = keyof typeof MODELS;
