import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[anthropic] Missing ANTHROPIC_API_KEY – story generation will fail');
}

/**
 * Shared Anthropic client — instantiated once per process.
 * Import this instead of calling `new Anthropic()` in each route.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'missing-key',
});
