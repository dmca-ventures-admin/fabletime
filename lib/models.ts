// lib/models.ts — single source of truth for AI model names
// Anthropic aliases: no dated suffix — always resolves to latest within that family.
// Updated automatically by scripts/check-models.ts (weekly via HEARTBEAT.md)

export const MODELS = {
  opus:       'claude-opus-4-7',
  haiku:      'claude-haiku-4-5',
  dalleImage: 'gpt-image-1',
} as const;

export type ModelKey = keyof typeof MODELS;
