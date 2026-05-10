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
      return Response.json({ valid: false, suggestion: null });
    }

    const t0 = Date.now();
    const response = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 128,
      messages: [
        {
          role: 'user',
          content: `You are validating user input for a children's story generator. The user entered "${trimmed}" as a ${type}.

Check if this is:
1. A valid, recognizable ${type} for a children's story (ages 4-8)
2. Correctly spelled

Reply with ONLY a JSON object (no markdown, no code fences):
{"valid": true/false, "suggestion": "corrected spelling or null"}

If valid and correctly spelled: {"valid": true, "suggestion": null}
If misspelled but recognizable: {"valid": false, "suggestion": "correct spelling"}
If nonsensical/gibberish: {"valid": false, "suggestion": null}`,
        },
      ],
    });

    logApiCall({ endpoint: '/api/validate', model: MODELS.haiku, usage: response.usage, durationMs: Date.now() - t0, meta: { type, value: trimmed } });
    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();

    let result: { valid: boolean; suggestion: string | null };
    try {
      result = JSON.parse(cleaned);
    } catch {
      console.error('[V] Failed to parse AI response:', cleaned);
      // Fail open — don't block the user on a parse error
      return Response.json({ valid: true, suggestion: null });
    }

    return Response.json({
      valid: !!result.valid,
      suggestion: result.suggestion || null,
    });
  } catch (error) {
    console.error('[V] Error validating input:', error);
    // Fail open — don't block the user
    return Response.json({ valid: true, suggestion: null });
  }
}
