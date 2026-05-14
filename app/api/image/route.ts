import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
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

// #129: Pick a style uniformly at random across all 7 options so similar
// stories get visual variety across runs. Replaces the previous Haiku-based
// selection (saves one API call per image generation).
function selectStyle(): number {
  return Math.floor(Math.random() * 7) + 1;
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
  // Rate limit: 5 image generations per minute per IP (gpt-image-1 is metered per call)
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
        console.log(`[IMG] Cache hit for story ${storyId} — skipping image generation`);
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
    // #124/#129: story text is no longer needed — style selection is random.

    const characterDesc = characters.length === 1
      ? `a ${characters[0]}`
      : characters.slice(0, -1).map((c: string) => `a ${c}`).join(', ') + ` and a ${characters[characters.length - 1]}`;

    // Pick an illustration style (cached one if we have it, otherwise random).
    const styleNum: number = cachedStyle ?? selectStyle();
    if (!cachedStyle) {
      console.log(`[IMG] Selected style ${styleNum}: ${STYLES[styleNum]}`);
    }

    const styleDesc = STYLES[styleNum];

    const prompt = `${styleDesc}. A scene featuring ${characterDesc} exploring the theme of ${theme}. Capture the emotional heart of the moment — warmth, wonder, connection. Full-bleed illustration, edge to edge, no white borders, no margins.

Pure illustration only. No text, letters, words, numbers, or symbols anywhere in the image.`;

    // gpt-image-1 always returns base64-encoded images — `response_format` is
    // not accepted for GPT image models. We upload the bytes to Supabase Storage
    // and use the public URL going forward.
    const response = await openai.images.generate({
      model: MODELS.dalleImage,
      prompt,
      size: '1024x1024',
      quality: 'medium',
      n: 1,
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      console.error('[IMG] No b64_json in image response');
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    // Upload to Supabase Storage so we have a persistent public URL.
    // Use a service-role client locally so we bypass RLS on Storage writes.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const path = `${storyId || randomUUID()}.png`;
    const buffer = Buffer.from(b64, 'base64');
    const { error: uploadError } = await supabaseAdmin.storage
      .from('story-images')
      .upload(path, buffer, { contentType: 'image/png', upsert: true });
    if (uploadError) {
      console.error('[IMG] Supabase Storage upload error:', uploadError.message);
      return NextResponse.json({ error: 'Failed to store image' }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('story-images')
      .getPublicUrl(path);
    const url = publicUrlData.publicUrl;

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
