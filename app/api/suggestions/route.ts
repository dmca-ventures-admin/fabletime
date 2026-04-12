import { supabase } from '@/lib/supabase';
import { isChildFriendly } from '@/lib/content-filter';

/**
 * GET /api/suggestions
 *
 * Returns top-9 characters and top-8 themes from the `custom_entries`
 * table, ordered by usage_count DESC, filtered to child-friendly entries
 * only.
 *
 * Entries with `child_friendly = null` are classified lazily in the
 * background and cached in the DB column — the response is returned
 * immediately using already-classified entries so classification never
 * blocks the caller.
 */
export async function GET() {
  try {
    // Fetch top 20 per type to account for entries that may be filtered out
    const { data: characterRows, error: charError } = await supabase
      .from('custom_entries')
      .select('id, value, child_friendly')
      .eq('type', 'character')
      .order('usage_count', { ascending: false })
      .limit(20);

    if (charError) {
      console.error('[S03] Failed to fetch character suggestions:', charError);
      return Response.json({ characters: [], themes: [] });
    }

    const { data: themeRows, error: themeError } = await supabase
      .from('custom_entries')
      .select('id, value, child_friendly')
      .eq('type', 'theme')
      .order('usage_count', { ascending: false })
      .limit(20);

    if (themeError) {
      console.error('[S03] Failed to fetch theme suggestions:', themeError);
      return Response.json({ characters: [], themes: [] });
    }

    // Filter to already-classified child-friendly entries for the immediate response.
    // Unclassified entries (child_friendly = null) are classified asynchronously
    // in the background so they appear on the next request.
    const characters = (characterRows ?? [])
      .filter((row) => row.child_friendly === true)
      .slice(0, 9)
      .map((row) => row.value);

    const themes = (themeRows ?? [])
      .filter((row) => row.child_friendly === true)
      .slice(0, 8)
      .map((row) => row.value);

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
