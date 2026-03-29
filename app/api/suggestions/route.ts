import { supabase } from '@/lib/supabase';
import { isChildFriendly } from '@/lib/content-filter';

/**
 * GET /api/suggestions
 *
 * Returns top-9 characters and top-8 themes from the `custom_entries`
 * table, ordered by usage_count DESC, filtered to child-friendly entries
 * only.
 *
 * Entries with `child_friendly = null` are lazily classified on first
 * request and the result is cached in the DB column.
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

    // For entries with child_friendly = null, classify and cache the result
    const allRows = [...(characterRows ?? []), ...(themeRows ?? [])];
    const uncheckedRows = allRows.filter((row) => row.child_friendly === null);

    if (uncheckedRows.length > 0) {
      await Promise.all(
        uncheckedRows.map(async (row) => {
          const isFriendly = await isChildFriendly(row.value);
          row.child_friendly = isFriendly;

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
      );
    }

    // Filter to child-friendly only, take top 9 characters and top 8 themes
    const characters = (characterRows ?? [])
      .filter((row) => row.child_friendly === true)
      .slice(0, 9)
      .map((row) => row.value);

    const themes = (themeRows ?? [])
      .filter((row) => row.child_friendly === true)
      .slice(0, 8)
      .map((row) => row.value);

    return Response.json({ characters, themes });
  } catch (error) {
    console.error('[S03] Suggestions endpoint error:', error);
    return Response.json({ characters: [], themes: [] });
  }
}
