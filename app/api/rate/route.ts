import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { story_id, stars, feedback } = body;

    // Validate story_id: must be a non-empty string
    if (!story_id || typeof story_id !== 'string' || story_id.trim().length === 0) {
      return Response.json(
        { error: 'story_id is required and must be a non-empty string' },
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

    // Validate feedback: optional, but if provided must be a string
    if (feedback !== undefined && feedback !== null && typeof feedback !== 'string') {
      return Response.json(
        { error: 'feedback must be a string if provided' },
        { status: 400 }
      );
    }

    // Insert into Supabase ratings table
    // CRITICAL: supabase-js does not throw on DB errors — must destructure { error }
    const { error } = await supabase.from('ratings').insert({
      story_id,
      stars,
      feedback: feedback || null,
    });

    if (error) {
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
