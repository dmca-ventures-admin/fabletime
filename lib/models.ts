// lib/models.ts — single source of truth for AI model names
// Updated automatically by scripts/check-models.ts (weekly via HEARTBEAT.md)

export const MODELS = {
  opus:  'claude-opus-4-5',
  haiku: 'claude-haiku-4-5',
} as const;

export type ModelKey = keyof typeof MODELS;
