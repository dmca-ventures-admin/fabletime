import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
  try {
    const { characters, length, theme, funninessLevel } = await request.json();

    if (!characters || !Array.isArray(characters) || characters.length === 0 || !length || !theme) {
      return new Response('Missing required fields', { status: 400 });
    }

    if (characters.length > 3) {
      return new Response('Maximum 3 characters allowed', { status: 400 });
    }

    // Validate that each character and the theme are 3 words or fewer
    for (const character of characters) {
      if (typeof character === 'string' && character.trim().split(/\s+/).length > 3) {
        return new Response('Character/theme names must be 3 words or fewer', { status: 400 });
      }
    }
    if (typeof theme === 'string' && theme.trim().split(/\s+/).length > 3) {
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
- Learning theme: ${theme} — weave this naturally into the story
- Give each character a unique, creative, and uncommon name. Avoid overused names like Finley, Bella, Max, Luna, Oliver, Rosie, Willow, Milo, or Daisy. Choose names that feel fresh, whimsical, and unexpected — draw from diverse cultures, nature, sounds, or invented words that suit the character's personality.
- Age-appropriate vocabulary and concepts
- Write with vivid, sensory language and a warm, playful voice. Vary sentence length for rhythm. Use specific, colourful details rather than generic descriptions.
- ${funninessInstruction}
- While the story should have a clear beginning, middle, and end, feel free to subvert expectations — a problem that gets solved in a surprising way, an unexpected helper, or a twist that feels delightful rather than predictable.
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

          const anthropicStream = client.messages.stream({
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
          try {
            const upsertResults = await Promise.all([
              ...characters.map((character: string) =>
                supabase.rpc('upsert_entry', { p_type: 'character', p_value: character })
              ),
              supabase.rpc('upsert_entry', { p_type: 'theme', p_value: theme }),
            ]);

            for (const result of upsertResults) {
              const { error } = result as { error: { message: string } | null };
              if (error) {
                console.error('[S03] Usage tracking upsert failed:', error);
              }
            }
          } catch (upsertError) {
            console.error('[S03] Usage tracking failed:', upsertError);
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
