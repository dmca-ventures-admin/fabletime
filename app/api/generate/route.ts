import { NextRequest } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { logApiCall } from '@/lib/cost-logger';

/**
 * Strip control characters (including newlines, carriage returns, tabs) from
 * user-supplied text before it is interpolated into AI prompts.  Without this,
 * an input like "cat\nIGNORE ALL" is 3 whitespace-delimited words and passes
 * the word-count check, but the embedded newline injects a new line into the
 * prompt allowing partial instruction override.
 */
function sanitizePromptInput(s: string): string {
  // Replace any ASCII control character (0x00-0x1F, 0x7F) with a space,
  // then collapse runs of whitespace to a single space.
  return s.replace(/[\x00-\x1f\x7f]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const lengthDescriptions: Record<string, string> = {
  short: '300-400 words',
  medium: '500-700 words',
  long: '800-1000 words',
};

const funninessInstructions: Record<number, string> = {
  1: 'Keep the story warm and gentle with no particular emphasis on humour.',
  2: 'Include a light funny moment or two — a little playful, but not over the top.',
  3: 'Make the story noticeably amusing — include several funny moments and playful language.',
  4: 'Make the story hilarious — pack it with silly situations, funny characters, and laugh-out-loud moments throughout.',
  5: 'Go all out — make this story as funny as possible for young children. Absurd situations, ridiculous characters, maximum silliness — while keeping it warm and age-appropriate.',
};

export async function POST(request: NextRequest) {
  // Rate limit: 10 generations per minute per IP
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`generate:${ip}`, 10, 60_000);
  if (!allowed) {
    return new Response('Too many requests', { status: 429 });
  }

  try {
    const body = await request.json();

    if (!body.characters || !Array.isArray(body.characters) || body.characters.length === 0 || !body.length || !body.theme) {
      return new Response('Missing required fields', { status: 400 });
    }

    if (body.characters.length > 3) {
      return new Response('Maximum 3 characters allowed', { status: 400 });
    }

    // Sanitize inputs to remove control characters (including newlines) that
    // could be used to inject new lines into the AI prompt.
    const characters: string[] = body.characters.map((c: unknown) =>
      typeof c === 'string' ? sanitizePromptInput(c) : String(c)
    );
    const length: string = typeof body.length === 'string' ? body.length : String(body.length);
    const theme: string = typeof body.theme === 'string' ? sanitizePromptInput(body.theme) : String(body.theme);
    const funninessLevel = body.funninessLevel;

    // Validate that each character and the theme are 3 words or fewer
    for (const character of characters) {
      if (character.split(/\s+/).length > 3) {
        return new Response('Character/theme names must be 3 words or fewer', { status: 400 });
      }
    }
    if (theme.split(/\s+/).length > 3) {
      return new Response('Character/theme names must be 3 words or fewer', { status: 400 });
    }

    // Clamp funniness level to valid range, default to 2
    const clampedFunniness = Math.max(1, Math.min(5, Math.round(Number(funninessLevel) || 2)));
    const funninessInstruction = funninessInstructions[clampedFunniness] || funninessInstructions[2];

    const lengthDesc = lengthDescriptions[length] || '300-400 words';

    // Build character description based on how many were selected
    let characterDesc: string;
    if (characters.length === 1) {
      characterDesc = `a ${characters[0]} as the main character`;
    } else if (characters.length === 2) {
      characterDesc = `a ${characters[0]} and a ${characters[1]} as the main characters who are friends`;
    } else {
      const last = characters[characters.length - 1];
      const rest = characters.slice(0, -1).map((c: string) => `a ${c}`).join(', ');
      characterDesc = `${rest}, and a ${last} as the main characters who are friends`;
    }

    const prompt = `Write an engaging children's story (ages 4-8) featuring ${characterDesc}.

IMPORTANT: This story MUST be fully appropriate for children aged 8 and under. Do not include any violence, scary content, mean-spirited behavior, or anything that could frighten or upset a young child. Keep all language, themes, and situations gentle, safe, and positive.

Story requirements:
- Length: ${lengthDesc}
- Learning theme: ${theme} — show the theme through what the characters do and feel. Never state the moral directly. The reader should absorb the lesson without being told it. Avoid sentences like "And so they learned..." or any line that directly names the lesson.
- Give each character a unique, creative, and uncommon name. Avoid overused names like Finley, Bella, Max, Luna, Oliver, Rosie, Willow, Milo, or Daisy. Choose names that feel fresh, whimsical, and unexpected — draw from diverse cultures, nature, sounds, or invented words that suit the character's personality. Beyond the name — give each character a clear personality quirk, a small flaw, and an inner worry or fear that feels real. The story should grow naturally from who the characters are, not just what happens to them.
- Age-appropriate vocabulary and concepts
- Write with vivid, sensory language and a warm, playful voice. Vary sentence length for rhythm. Use specific, colourful details rather than generic descriptions.
- ${funninessInstruction}
- Story structure: Use a story arc with real shape: a normal day is disrupted by a problem; the character tries to fix it the wrong way first and it backfires; then they try a different approach that reflects the theme; end with a quiet moment that shows how they have changed. Vary the specific arc — not every story needs the same shape — but every story needs that middle failure beat. That failure is what gives the story depth.
- The story should be engaging, imaginative, and emotionally resonant
${characters.length > 1 ? '- Give each character a distinct personality and role in the story\n- Show the characters working together and supporting each other to overcome the challenge' : ''}
Make the learning theme of "${theme}" central to how the characters grow and how the story resolves — it should feel woven in naturally, not tacked on.

Write the story directly without any preamble or meta-commentary. Begin with "Once upon a time..." or a creative variation.`;

    const storyId = crypto.randomUUID();

    // Insert placeholder story row BEFORE streaming so the rating endpoint
    // can find it immediately when the user submits a rating.
    try {
      const { error: insertError } = await supabase.from('stories').insert({
        id: storyId,
        characters,
        theme,
        length,
        prompt,
        response: '',
        funniness_level: clampedFunniness,
      });
      if (insertError) {
        console.error('[S01] Failed to insert placeholder story:', storyId, insertError);
        // Continue anyway — story generation still works, rating may fail
      }
    } catch (insertErr) {
      console.error('[S01] Failed to insert placeholder story:', storyId, insertErr);
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';

          const streamStart = Date.now();
          const anthropicStream = anthropic.messages.stream({
            model: 'claude-opus-4-20250514',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
          });

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
              fullResponse += chunk.delta.text;
            }
          }
          const finalMsg = await anthropicStream.finalMessage();
          logApiCall({
            endpoint: '/api/generate',
            model: 'claude-opus-4-20250514',
            usage: finalMsg.usage,
            durationMs: Date.now() - streamStart,
            meta: { storyId, characters, theme, length },
          });
          controller.close();

          // Update the placeholder with the full story response
          try {
            const { error: dbError } = await supabase
              .from('stories')
              .update({ response: fullResponse })
              .eq('id', storyId);
            if (dbError) {
              console.error('[S01] Failed to update story response:', storyId, dbError);
            }
          } catch (dbError) {
            console.error('[S01] Failed to update story response:', storyId, dbError);
          }

          // Track usage for each character and the theme (S03)
          const entriesToTrack: { type: string; value: string }[] = [
            ...characters.map((character: string) => ({ type: 'character', value: character })),
            { type: 'theme', value: theme },
          ];

          try {
            const upsertResults = await Promise.all(
              entriesToTrack.map((entry) =>
                supabase.rpc('upsert_entry', { p_type: entry.type, p_value: entry.value })
              )
            );

            for (const result of upsertResults) {
              const { error } = result as { error: { message: string } | null };
              if (error) {
                console.error('[S03] Usage tracking upsert failed:', error);
              }
            }
          } catch (upsertError) {
            console.error('[S03] Usage tracking failed:', upsertError);
          }

          // Assign emojis for entries that don't have one yet — fire-and-forget, non-blocking (#80)
          for (const entry of entriesToTrack) {
            (async () => {
              try {
                const { data: entryData } = await supabase
                  .from('custom_entries')
                  .select('emoji')
                  .eq('type', entry.type)
                  .eq('value', entry.value)
                  .single();

                if (entryData && entryData.emoji === null) {
                  const t0emoji = Date.now();
                  const msg = await anthropic.messages.create({
                    model: 'claude-haiku-4-5',
                    max_tokens: 10,
                    messages: [{
                      role: 'user',
                      content: `What is the single best emoji for '${entry.value}' as a children's story character or theme? Reply with ONLY the emoji character, nothing else.`,
                    }],
                  });
                  logApiCall({ endpoint: '/api/generate#emoji', model: 'claude-haiku-4-5', usage: msg.usage, durationMs: Date.now() - t0emoji, meta: { entry } });
                  const emoji =
                    msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : null;
                  if (emoji) {
                    const { error: updateError } = await supabase
                      .from('custom_entries')
                      .update({ emoji })
                      .eq('type', entry.type)
                      .eq('value', entry.value);
                    if (updateError) {
                      console.error('[#80] Failed to update emoji for', entry.value, updateError);
                    }
                  }
                }
              } catch (err) {
                console.error('[#80] Emoji assignment error for', entry.value, err);
              }
            })();
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Story-Id': storyId,
        'Access-Control-Expose-Headers': 'X-Story-Id',
      },
    });
  } catch (error) {
    console.error('Error generating story:', error);
    return new Response('Failed to generate story', { status: 500 });
  }
}
