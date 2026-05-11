import { anthropic } from '@/lib/anthropic';
import { MODELS } from '@/lib/models';
import { logApiCall } from '@/lib/cost-logger';

interface ContentSafetyResult {
  safe: boolean;
  reason: string;
}

/**
 * Server-side content safety check for story generation inputs.
 * 
 * Uses Claude Haiku for fast, cheap classification. Runs before story
 * generation to catch any inappropriate content that bypassed frontend
 * validation.
 * 
 * Fails CLOSED: returns { safe: false } on any error so inappropriate
 * content cannot reach the story generator.
 */
export async function checkContentSafety(
  characters: string[],
  theme: string
): Promise<ContentSafetyResult> {
  const t0 = Date.now();
  
  try {
    const response = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 128,
      messages: [
        {
          role: 'user',
          content: `You are a content safety filter for a children's storytelling app (ages 4-8). Check these story inputs for inappropriate content (sexual, violent, offensive, adult, or harmful material).

Characters: ${characters.join(', ')}
Theme: ${theme}

Reply with ONLY a JSON object (no markdown, no code fences):
{"safe": true/false, "reason": "brief reason if unsafe, null if safe"}`,
        },
      ],
    });

    logApiCall({
      endpoint: '/api/generate#safety',
      model: MODELS.haiku,
      usage: response.usage,
      durationMs: Date.now() - t0,
      meta: { characters, theme },
    });

    const text =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();

    let result: { safe: boolean; reason: string | null };
    try {
      result = JSON.parse(cleaned);
    } catch {
      console.error('[SAFETY] Failed to parse AI response:', cleaned);
      // Fail closed — block generation on parse error
      return { safe: false, reason: 'Content could not be verified' };
    }

    if (!result.safe) {
      console.log(
        `[SAFETY] Blocked generation — characters: [${characters.join(', ')}], theme: ${theme}, reason: ${result.reason}`
      );
    }

    return {
      safe: !!result.safe,
      reason: result.reason || '',
    };
  } catch (error) {
    console.error('[SAFETY] Content check failed:', error);
    // Fail closed — block generation on API error
    return { safe: false, reason: 'Content could not be verified' };
  }
}
