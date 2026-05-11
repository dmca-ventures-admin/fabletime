import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { logApiCall } from '@/lib/cost-logger';
import { MODELS } from '@/lib/models';
import { supabase } from '@/lib/supabase';

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
      model: MODELS.haiku,
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Given this children's story, which illustration style best fits? Reply with ONLY the number (1-7).

Styles:
1. Whimsical watercolour illustration, vivid saturated colours, painterly brushwork
2. Dreamy soft-focus illustration, muted watercolour washes, gentle light
3. Bright vibrant digital illustration, bold flat colours, dynamic composition
4. Warm cheerful illustration, thick textured strokes, playful energy, rich colours
5. Delicate pastel illustration, soft diffused light, cosy intimate mood
6. Rich textured illustration, layered warm tones, expressive mark-making
7. Bold graphic illustration, strong confident lines, vivid colour fills, expressive characters

Characters: ${characters.join(', ')}
Theme: ${theme}
Story excerpt: ${storyExcerpt.slice(0, 800)}`,
      }],
    });

    logApiCall({ endpoint: '/api/image#selectStyle', model: MODELS.haiku, usage: response.usage, durationMs: Date.now() - t0 });
    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '1';
    const num = parseInt(text.match(/[1-7]/)?.[0] || '1', 10);
    return STYLES[num] ? num : 1;
  } catch {
    return 1; // fallback to whimsical watercolor
  }
}

// Try to read cached style and image_url from stories table
async function getCachedImageData(storyId: string): Promise<{ style: number | null; image_url: string | null } | null> {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('style, image_url')
      .eq('id', storyId)
      .single();
    if (error) {
      console.error('[IMG] Cache read error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[IMG] Cache read exception:', err);
    return null;
  }
}

// Save style and/or image_url back to stories table
async function saveCachedImageData(storyId: string, style: number, imageUrl: string | null): Promise<void> {
  try {
    const updateData: { style: number; image_url?: string } = { style };
    if (imageUrl) {
      updateData.image_url = imageUrl;
    }
    const { error } = await supabase
      .from('stories')
      .update(updateData)
      .eq('id', storyId);
    if (error) {
      console.error('[IMG] Cache write error:', error.message);
    }
  } catch (err) {
    console.error('[IMG] Cache write exception:', err);
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

    // Optional storyId for caching
    const storyId: string | null = typeof body.storyId === 'string' ? body.storyId : null;

    // Check cache if storyId provided
    let cachedStyle: number | null = null;
    if (storyId) {
      const cached = await getCachedImageData(storyId);
      if (cached?.style && cached?.image_url) {
        console.log(`[IMG] Cache hit for story ${storyId} — skipping DALL-E`);
        return NextResponse.json({ url: cached.image_url, style: cached.style });
      }
      // If we have cached style but no image_url, we'll use the style below
      if (cached?.style) {
        cachedStyle = cached.style;
        console.log(`[IMG] Partial cache hit for story ${storyId} — using cached style ${cachedStyle}`);
      }
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

    // Select the best illustration style for this story (or use cached)
    let styleNum: number;
    if (cachedStyle) {
      styleNum = cachedStyle;
    } else {
      styleNum = await selectStyle(characters, theme, storyContext);
      console.log(`[IMG] Selected style ${styleNum}: ${STYLES[styleNum]}`);
    }
    
    const styleDesc = STYLES[styleNum];

    const prompt = `${styleDesc}. A scene featuring ${characterDesc} exploring the theme of ${theme}. Capture the emotional heart of the moment — warmth, wonder, connection. Full-bleed illustration, edge to edge, no white borders, no margins.

Pure illustration only. No text, letters, words, numbers, or symbols anywhere in the image.`;

    const response = await openai.images.generate({
      model: MODELS.dalleImage,
      prompt,
      size: '1024x1024',
      quality: 'hd',
      n: 1,
    });

    const url = response.data?.[0]?.url;
    if (!url) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    // Save to cache if storyId provided
    if (storyId) {
      await saveCachedImageData(storyId, styleNum, url);
      console.log(`[IMG] Cached style=${styleNum} and image_url for story ${storyId}`);
    }

    return NextResponse.json({ url, style: styleNum });
  } catch (error) {
    console.error('[IMG] Error generating image:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
