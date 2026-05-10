import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { logApiCall } from '@/lib/cost-logger';
import { MODELS } from '@/lib/models';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

import { sanitizePromptInput } from '@/lib/sanitize';

const STYLES: Record<number, string> = {
  1: 'Whimsical watercolor scene, full-bleed, vivid colours, painterly',
  2: 'Soft pencil and wash scene, full-bleed, gentle dreamy atmosphere',
  3: 'Bright vibrant digital art scene, full-bleed, bold colours, dynamic',
  4: 'Charming crayon art scene, full-bleed, warm and playful',
  5: 'Delicate watercolour scene, full-bleed, soft pastel tones, cosy',
  6: 'Coloured pencil scene, full-bleed, warm textures, expressive',
  7: 'Bold ink and colour scene, full-bleed, strong lines, expressive characters',
};

async function selectStyle(characters: string[], theme: string, storyExcerpt: string): Promise<number> {
  try {
    const t0 = Date.now();
    const response = await anthropic.messages.create({
      model: MODELS.fast,
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Given this children's story, which illustration style best fits? Reply with ONLY the number (1-7).

Styles:
1. Whimsical watercolor scene, vivid colours, painterly
2. Soft pencil and wash scene, gentle dreamy atmosphere
3. Bright vibrant digital art scene, bold colours, dynamic
4. Charming crayon art scene, warm and playful
5. Delicate watercolour scene, soft pastel tones, cosy
6. Coloured pencil scene, warm textures, expressive
7. Bold ink and colour scene, strong lines, expressive characters

Characters: ${characters.join(', ')}
Theme: ${theme}
Story excerpt: ${storyExcerpt.slice(0, 800)}`,
      }],
    });

    logApiCall({ endpoint: '/api/image#selectStyle', model: MODELS.fast, usage: response.usage, durationMs: Date.now() - t0 });
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

    const prompt = `RULE: NO TEXT OF ANY KIND IN THIS IMAGE. No words, no letters, no numbers, no signs, no labels, no captions, no writing, no speech bubbles, no caption boxes. VIOLATION of this rule means the image is rejected. Pure visual illustration only.

ADDITIONAL RULE: FULL IMAGE COVERAGE. The scene must fill the ENTIRE image frame edge to edge. No white margins, no page borders, no book page layout, no text columns, no empty white space. The illustration bleeds to all edges with zero borders.

${styleDesc}.

Illustrate the key emotional moment from this children's story:
Characters: ${characterDesc}
Theme: ${theme}
Scene: ${storyContext.slice(0, 600)}

Show the most meaningful or dramatic moment — the resolution, the heartfelt connection, or the central lesson in action. The scene fills the entire frame edge to edge with no margins or borders.

REMINDER: ZERO text of any kind. Full-bleed illustration only.`;

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
