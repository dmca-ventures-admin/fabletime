import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  // Rate limit: 20 ratings per minute per IP
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`rate:${ip}`, 20, 60_000);
  if (!allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { story_id, stars, feedback } = body;

    // Validate story_id: must be a non-empty UUID string
    if (!story_id || typeof story_id !== 'string' || !UUID_RE.test(story_id)) {
      return Response.json(
        { error: 'story_id must be a valid UUID' },
        { status: 400 }
      );
    }

    // Validate stars: must be an integer between 1 and 5 inclusive
    if (
      stars === undefined ||
      stars === null ||
      typeof stars !== 'number' ||
      !Number.isInteger(stars) ||
      stars < 1 ||
      stars > 5
    ) {
      return Response.json(
        { error: 'stars is required and must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate feedback: optional, but if provided must be a string within max length
    if (feedback !== undefined && feedback !== null) {
      if (typeof feedback !== 'string') {
        return Response.json(
          { error: 'feedback must be a string if provided' },
          { status: 400 }
        );
      }
      if (feedback.length > 5000) {
        return Response.json(
          { error: 'feedback must be 5000 characters or fewer' },
          { status: 400 }
        );
      }
    }

    // Insert into Supabase ratings table
    // CRITICAL: supabase-js does not throw on DB errors — must destructure { error }
    // The story row is inserted after the stream closes (generate/route.ts), so the
    // rating request can arrive before the story exists. Retry once after a short
    // delay if the insert fails with a foreign key violation.
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const { error } = await supabase.from('ratings').insert({
        story_id,
        stars,
        feedback: feedback || null,
      });

      if (!error) break;

      const isFKViolation = error.message?.includes('foreign key constraint');
      if (isFKViolation && attempt < MAX_RETRIES) {
        console.warn(`[S02] Story ${story_id} not yet persisted, retrying in ${RETRY_DELAY_MS}ms (attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }

      console.error('[S02] Failed to save rating:', error);
      return Response.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    return Response.json({ success: true }, { status: 201 });
  } catch (err) {
    // Catches network errors and JSON parse failures
    console.error('[S02] Unexpected error in rate route:', err);
    return Response.json(
      { error: 'Failed to save rating' },
      { status: 500 }
    );
  }
}
