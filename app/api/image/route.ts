import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { characters, theme, story } = await request.json();

    if (!characters || !Array.isArray(characters) || characters.length === 0 || !theme) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const characterDesc = characters.length === 1
      ? `a ${characters[0]}`
      : characters.slice(0, -1).map((c: string) => `a ${c}`).join(', ') + ` and a ${characters[characters.length - 1]}`;

    // Use the story to extract the key emotional/learning moment for the illustration
    const storyContext = story ? story.slice(0, 1500) : '';

    const prompt = `You are illustrating a children's picture book. Create a single vivid cartoon scene that captures the key emotional turning point or central lesson from this story.

Characters: ${characterDesc}
Theme: ${theme}
Story excerpt: ${storyContext}

The illustration should:
- Show the most meaningful or dramatic moment from the story (the resolution, the "aha" moment, or the heart of the theme)
- Feel emotionally resonant and specific to THIS story, not generic
- Be in a warm, expressive cartoon style with bold colours and clear storytelling
- Be suitable for children aged 4-8
- Have no text, words, or letters anywhere in the image

Make it feel like the cover illustration of a picture book — something a child would want to stop and look at.`;

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
