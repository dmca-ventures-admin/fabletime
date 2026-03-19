import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

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
    const { character, length, theme } = await request.json();

    if (!character || !length || !theme) {
      return new Response('Missing required fields', { status: 400 });
    }

    const lengthDesc = lengthDescriptions[length] || '300-400 words';

    const prompt = `Write an engaging children's story (ages 4-8) featuring a ${character} as the main character.

Story requirements:
- Length: ${lengthDesc}
- Learning theme: ${theme} — weave this naturally into the story
- Age-appropriate vocabulary and concepts
- A clear beginning, middle, and end
- An uplifting, positive resolution
- The story should be engaging and imaginative

If the learning theme is "vocabulary", include 3-5 interesting new words with context clues that help children understand them.
If the theme is "empathy", show a character learning to understand someone else's feelings.
If the theme is "courage", show the character overcoming a fear or challenge.
If the theme is "kindness", show acts of kindness and their positive effects.

Write the story directly without any preamble or meta-commentary. Begin with "Once upon a time..." or a creative variation.`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = client.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
          });

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error generating story:', error);
    return new Response('Failed to generate story', { status: 500 });
  }
}
