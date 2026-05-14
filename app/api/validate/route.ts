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

    const characterChecks = `Check the input for THREE things:
1. Is it appropriate for young children? Reject anything sexual, violent, offensive, or adult in nature.
2. Is it a recognisable, named fictional character from existing media — a movie, TV show, book, video game, or any other IP (Disney, Pixar, Marvel, DC, Nintendo, Dreamworks, Cartoon Network, Nickelodeon, etc.)? Examples to reject: Mickey Mouse, Minnie, Donald Duck, Elsa, Anna, Olaf, Moana, Spider-Man, Iron Man, Batman, Superman, Harry Potter, Hermione, Ron Weasley, Dumbledore, Pikachu, Charizard, Mario, Luigi, Sonic, Peppa Pig, Bluey, Dora, PAW Patrol characters (Chase, Marshall, Skye, Rubble), Shrek, Woody, Buzz Lightyear, Olaf, SpongeBob, Bart Simpson, Pokémon, Yoda, Darth Vader, etc. If the input is a recognisable named character from existing media, reject it. Generic character types (dragon, princess, astronaut, robot, wizard, knight) are fine.
3. Is it a recognisable character type suitable for a children's story?`;

    const themeChecks = `Check the input for TWO things:
1. Is it appropriate for young children? Reject anything sexual, violent, offensive, or adult in nature.
2. Is it a recognisable story theme suitable for a children's story?`;

    const characterReasonRules = `- valid: true only if ALL checks pass
- reason: "inappropriate" if it fails check 1, "trademark" if it fails check 2 (named character from existing media), "invalid" if it fails check 3 only, null if valid
- suggestion: corrected spelling if misspelled but otherwise valid, null otherwise`;

    const themeReasonRules = `- valid: true only if BOTH checks pass
- reason: "inappropriate" if it fails check 1, "invalid" if it fails check 2 only, null if valid
- suggestion: corrected spelling if misspelled but otherwise valid, null otherwise`;

    const checksBlock = type === 'character' ? characterChecks : themeChecks;
    const reasonRules = type === 'character' ? characterReasonRules : themeReasonRules;
    const reasonValues = type === 'character'
      ? 'null/"inappropriate"/"trademark"/"invalid"'
      : 'null/"inappropriate"/"invalid"';

    const response = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 128,
      messages: [
        {
          role: 'user',
          content: `You are a strict content filter for a children's storytelling app (ages 4-8).

${checksBlock}

Input: "${trimmed}"

Reply with ONLY a JSON object (no markdown, no code fences):
{"valid": true/false, "reason": ${reasonValues}, "suggestion": "corrected spelling or null"}

${reasonRules}`,
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
