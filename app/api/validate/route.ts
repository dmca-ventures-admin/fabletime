import { NextRequest } from 'next/server';
import { anthropic } from '@/lib/anthropic';

export const runtime = 'edge';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { logApiCall } from '@/lib/cost-logger';
import { MODELS } from '@/lib/models';

export async function POST(request: NextRequest) {
  // Rate limit: 30 validations per minute per IP
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`validate:${ip}`, 30, 60_000);
  if (!allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { value, type } = await request.json();

    if (!value || !type || !['character', 'theme'].includes(type)) {
      return Response.json(
        { error: 'Missing required fields: value, type (character|theme)' },
        { status: 400 }
      );
    }

    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 50) {
      return Response.json({ valid: false, reason: 'invalid', suggestion: null });
    }

    const t0 = Date.now();
    const response = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 128,
      messages: [
        {
          role: 'user',
          content: `You are a strict content filter for a children's storytelling app (ages 4-8).

Check the input for TWO things:
1. Is it appropriate for young children? Reject anything sexual, violent, offensive, or adult in nature.
2. Is it a recognisable ${type} type or story ${type === 'character' ? 'character' : 'theme'} suitable for a children's story?

Input: "${trimmed}"

Reply with ONLY a JSON object (no markdown, no code fences):
{"valid": true/false, "reason": null/"inappropriate"/"invalid", "suggestion": "corrected spelling or null"}

- valid: true only if BOTH checks pass
- reason: "inappropriate" if it fails check 1, "invalid" if it fails check 2 only, null if valid
- suggestion: corrected spelling if misspelled but otherwise valid, null otherwise`,
        },
      ],
    });

    logApiCall({ endpoint: '/api/validate', model: MODELS.haiku, usage: response.usage, durationMs: Date.now() - t0, meta: { type, value: trimmed } });
    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();

    let result: { valid: boolean; reason: string | null; suggestion: string | null };
    try {
      result = JSON.parse(cleaned);
    } catch {
      console.error('[V] Failed to parse AI response:', cleaned);
      // Fail open — don't block the user on a parse error
      return Response.json({ valid: true, reason: null, suggestion: null });
    }

    return Response.json({
      valid: !!result.valid,
      reason: result.reason || null,
      suggestion: result.suggestion || null,
    });
  } catch (error) {
    console.error('[V] Error validating input:', error);
    // Fail open — don't block the user
    return Response.json({ valid: true, reason: null, suggestion: null });
  }
}
