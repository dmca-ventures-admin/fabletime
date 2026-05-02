import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isChildFriendly } from '@/lib/content-filter';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';

/**
 * GET /api/suggestions
 *
 * Returns top-50 characters and top-50 themes from the `custom_entries`
 * table, ordered by usage_count DESC, filtered to child-friendly entries
 * only. The client randomly samples 9 characters and 8 themes to display
 * on each page load, and uses the full 50 for autocomplete filtering.
 *
 * Entries with `child_friendly = null` are classified lazily in the
 * background and cached in the DB column — the response is returned
 * immediately using already-classified entries so classification never
 * blocks the caller.
 */
export async function GET(request: NextRequest) {
  // Rate limit: 30 requests per minute per IP
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`suggestions:${ip}`, 30, 60_000);
  if (!allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  try {
    // Fetch top 100 per type to account for entries that may be filtered out,
    // so we can reliably return up to 50 child-friendly entries.
    const { data: characterRows, error: charError } = await supabase
      .from('custom_entries')
      .select('id, value, child_friendly, emoji')
      .eq('type', 'character')
      .eq('excluded', false)
      .order('usage_count', { ascending: false })
      .limit(100);

    if (charError) {
      console.error('[S03] Failed to fetch character suggestions:', charError);
      return Response.json({ characters: [], themes: [] });
    }

    const { data: themeRows, error: themeError } = await supabase
      .from('custom_entries')
      .select('id, value, child_friendly, emoji')
      .eq('type', 'theme')
      .eq('excluded', false)
      .order('usage_count', { ascending: false })
      .limit(100);

    if (themeError) {
      console.error('[S03] Failed to fetch theme suggestions:', themeError);
      return Response.json({ characters: [], themes: [] });
    }

    // Filter to already-classified child-friendly entries for the immediate response.
    // Unclassified entries (child_friendly = null) are classified asynchronously
    // in the background so they appear on the next request.
    const characters = (characterRows ?? [])
      .filter((row) => row.child_friendly === true)
      .slice(0, 50)
      .map((row) => ({ value: row.value, emoji: row.emoji ?? undefined }));

    const themes = (themeRows ?? [])
      .filter((row) => row.child_friendly === true)
      .slice(0, 50)
      .map((row) => ({ value: row.value, emoji: row.emoji ?? undefined }));

    // Kick off background classification for unchecked entries — do not await.
    const allRows = [...(characterRows ?? []), ...(themeRows ?? [])];
    const uncheckedRows = allRows.filter((row) => row.child_friendly === null);
    if (uncheckedRows.length > 0) {
      Promise.all(
        uncheckedRows.map(async (row) => {
          const isFriendly = await isChildFriendly(row.value);
          const { error: updateError } = await supabase
            .from('custom_entries')
            .update({ child_friendly: isFriendly })
            .eq('id', row.id);
          if (updateError) {
            console.error(
              '[S03] Failed to cache child_friendly for entry:',
              row.value,
              updateError
            );
          }
        })
      ).catch((err) => {
        console.error('[S03] Background classification error:', err);
      });
    }

    return Response.json({ characters, themes });
  } catch (error) {
    console.error('[S03] Suggestions endpoint error:', error);
    return Response.json({ characters: [], themes: [] });
  }
}
