import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { characters, theme } = await request.json();

    if (!characters || !Array.isArray(characters) || characters.length === 0 || !theme) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const characterDesc = characters.length === 1
      ? `a ${characters[0]}`
      : characters.slice(0, -1).map((c: string) => `a ${c}`).join(', ') + ` and a ${characters[characters.length - 1]}`;

    const prompt = `Cartoon illustration for a children's picture book. Characters: ${characterDesc}. The scene captures a warm, imaginative moment related to the theme of ${theme}. Style: friendly, colourful, hand-drawn cartoon with soft lines and rounded shapes, suitable for children aged 4-8. Bright, cheerful colours. No text, no words, no letters anywhere in the image.`;

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

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[IMG] Error generating image:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
