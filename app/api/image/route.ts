import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Strip control characters (including newlines) from prompt-bound user input. */
function sanitizePromptInput(s: string): string {
  return s.replace(/[\x00-\x1f\x7f]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const STYLES: Record<number, string> = {
  1: 'Whimsical watercolor illustration suitable for a children\'s book',
  2: 'Gentle pencil sketch suitable for a bedtime story',
  3: 'Bright and colorful digital painting suitable for a children\'s adventure story',
  4: 'Charming crayon drawing suitable for gentle children\'s stories',
  5: 'Gentle watercolor painting suitable for a lovely children\'s story',
  6: 'Whimsical colored pencil drawing suitable for a variety of children\'s stories',
  7: 'Detailed ink drawing suitable for strong expressive characters',
};

async function selectStyle(characters: string[], theme: string, storyExcerpt: string): Promise<number> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Given this children's story, which illustration style best fits? Reply with ONLY the number (1-7).

Styles:
1. Whimsical watercolor illustration
2. Gentle pencil sketch (bedtime/soothing)
3. Bright colorful digital painting (adventure/exciting)
4. Charming crayon drawing (gentle/simple)
5. Gentle watercolor painting (lovely/cosy)
6. Whimsical colored pencil drawing (versatile)
7. Detailed ink drawing (strong/expressive characters)

Characters: ${characters.join(', ')}
Theme: ${theme}
Story excerpt: ${storyExcerpt.slice(0, 800)}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '1';
    const num = parseInt(text.match(/[1-7]/)?.[0] || '1', 10);
    return STYLES[num] ? num : 1;
  } catch {
    return 1; // fallback to whimsical watercolor
  }
}

export async function POST(request: NextRequest) {
  // Rate limit: 5 image generations per minute per IP (DALL-E 3 costs ~$0.04/call)
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`image:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();

    if (!body.characters || !Array.isArray(body.characters) || body.characters.length === 0 || !body.theme) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sanitize all user-supplied text before interpolating into AI prompts.
    const characters: string[] = body.characters.map((c: unknown) =>
      sanitizePromptInput(typeof c === 'string' ? c : String(c))
    );
    const theme: string = sanitizePromptInput(typeof body.theme === 'string' ? body.theme : String(body.theme));
    // Story is AI-generated but originates from a user session; sanitize as a precaution.
    const storyContext: string = body.story
      ? sanitizePromptInput(body.story).slice(0, 1500)
      : '';

    const characterDesc = characters.length === 1
      ? `a ${characters[0]}`
      : characters.slice(0, -1).map((c: string) => `a ${c}`).join(', ') + ` and a ${characters[characters.length - 1]}`;

    // Select the best illustration style for this story
    const styleNum = await selectStyle(characters, theme, storyContext);
    const styleDesc = STYLES[styleNum];

    console.log(`[IMG] Selected style ${styleNum}: ${styleDesc}`);

    const prompt = `IMPORTANT: This image must contain absolutely NO text, NO words, NO letters, NO numbers, NO signs, NO labels of any kind. Pure illustration only.

${styleDesc}.

Illustrate the key emotional moment from this children's story:
Characters: ${characterDesc}
Theme: ${theme}
Scene: ${storyContext.slice(0, 600)}

Show the most meaningful or dramatic moment — the resolution, the heartfelt connection, or the central lesson in action. Make it feel like the perfect picture book illustration. ZERO text of any kind in the image.`;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    const url = response.data?.[0]?.url;
    if (!url) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    return NextResponse.json({ url, style: styleNum });
  } catch (error) {
    console.error('[IMG] Error generating image:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
