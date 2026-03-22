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

export async function POST(request: NextRequest) {
  try {
    const { characters, length, theme } = await request.json();

    if (!characters || !Array.isArray(characters) || characters.length === 0 || !length || !theme) {
      return new Response('Missing required fields', { status: 400 });
    }

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
- Age-appropriate vocabulary and concepts
- A clear beginning, middle, and end with a three-act structure:
  1. Setup: Introduce the character(s) and their world
  2. Conflict: Present a meaningful but age-appropriate challenge or roadblock that the character(s) must face. This should create gentle tension and keep the reader engaged.
  3. Resolution: The character(s) overcome the challenge by applying the learning theme (${theme}), leading to an uplifting, positive ending
- The story should be engaging, imaginative, and emotionally resonant
${characters.length > 1 ? '- Give each character a distinct personality and role in the story\n- Show the characters working together and supporting each other to overcome the challenge' : ''}
If the learning theme is "vocabulary", include 3-5 interesting new words with context clues that help children understand them.
If the theme is "empathy", show a character learning to understand someone else's feelings.
If the theme is "courage", show the character overcoming a fear or challenge.
If the theme is "kindness", show acts of kindness and their positive effects.

Write the story directly without any preamble or meta-commentary. Begin with "Once upon a time..." or a creative variation.`;

    const storyId = crypto.randomUUID();

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

          // Persist story after stream is fully delivered to the client
          try {
            const { error: dbError } = await supabase.from('stories').insert({
              id: storyId,
              characters,
              theme,
              length,
              prompt,
              response: fullResponse,
            });
            if (dbError) {
              console.error('[S01] Failed to persist story:', storyId, dbError);
            }
          } catch (dbError) {
            console.error('[S01] Failed to persist story:', storyId, dbError);
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
