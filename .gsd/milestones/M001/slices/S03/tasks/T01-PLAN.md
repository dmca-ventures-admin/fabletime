---
estimated_steps: 4
estimated_files: 3
skills_used:
  - best-practices
  - react-best-practices
---

# T01: Add seed data, Postgres upsert function, and content filter utility

**Slice:** S03 — Custom Characters & Themes with Popularity
**Milestone:** M001

## Description

Establishes the data-layer foundation for dynamic suggestions: seed data so the app isn't empty on first load, an atomic Postgres function for race-free usage tracking, a cached `child_friendly` column to avoid repeated Claude API calls, and a content filter utility that classifies entries.

## Steps

1. **Extend `supabase/schema.sql`** — Add a `child_friendly BOOLEAN DEFAULT NULL` column to the `custom_entries` table definition (add it inline in the CREATE TABLE, after `usage_count`). Then add a Postgres function `upsert_entry(p_type TEXT, p_value TEXT)` that does:
   ```sql
   INSERT INTO custom_entries (type, value, usage_count)
   VALUES (p_type, p_value, 1)
   ON CONFLICT (type, value)
   DO UPDATE SET usage_count = custom_entries.usage_count + 1;
   ```
   This avoids the race condition documented in the research (two concurrent generations both reading count=5 and writing count=6 instead of 7).

2. **Create `supabase/seed.sql`** — Write idempotent INSERT statements for the 10 default entries. Use `INSERT INTO custom_entries (type, value, usage_count, child_friendly) VALUES (...) ON CONFLICT (type, value) DO NOTHING;` so it's safe to run multiple times. The 6 characters: Fox, Bear, Little Wizard, Brave Knight, Young Scientist, Mermaid. The 4 themes: Kindness, Courage, Empathy, Vocabulary. Set `child_friendly = true` for all seeds (they're known-good). Set `usage_count = 1` as the baseline.

3. **Create `lib/content-filter.ts`** — Export an async function `isChildFriendly(text: string): Promise<boolean>` that:
   - Uses the `@anthropic-ai/sdk` package (already a project dependency — import `Anthropic` from it)
   - Creates an Anthropic client (same pattern as `app/api/generate/route.ts` — use `process.env.ANTHROPIC_API_KEY`)
   - Sends a message to `claude-haiku-4-20250514` (fast, cheap model) with a system prompt asking: "You are a content filter for a children's storytelling app (ages 4-8). Respond with only 'yes' or 'no'. Is the following text appropriate as a character name or story theme for young children?"
   - The user message is just the `text` parameter
   - Parses the response: if it starts with "yes" (case-insensitive), return `true`; otherwise return `false`
   - Wraps the call in try/catch — on any error, log with `[S03]` prefix and return `false` (fail-closed: if the filter can't run, the entry is excluded from suggestions)
   - Uses `max_tokens: 3` since we only need "yes" or "no"

4. **Verify** — Run `npx tsc --noEmit` to confirm all TypeScript compiles. Check that seed.sql has the right entry count. Check that schema.sql has the new column and function.

## Must-Haves

- [ ] `custom_entries` table in schema.sql has `child_friendly BOOLEAN DEFAULT NULL` column
- [ ] `upsert_entry` Postgres function exists in schema.sql and atomically increments usage_count
- [ ] `supabase/seed.sql` contains exactly 10 idempotent INSERT statements (6 characters + 4 themes) with `child_friendly = true`
- [ ] `lib/content-filter.ts` exports `isChildFriendly` function that calls Claude Haiku and returns boolean
- [ ] Content filter fails closed (returns `false` on error)
- [ ] TypeScript compiles without errors

## Verification

- `npx tsc --noEmit` passes
- `test -f supabase/seed.sql` succeeds
- `test -f lib/content-filter.ts` succeeds
- `grep -q "upsert_entry" supabase/schema.sql` succeeds
- `grep -q "child_friendly" supabase/schema.sql` succeeds
- `grep -c "INSERT" supabase/seed.sql` returns 10

## Inputs

- `supabase/schema.sql` — existing schema with `custom_entries` table definition (needs column + function added)
- `lib/supabase.ts` — existing Supabase client singleton (reference for import pattern)
- `app/api/generate/route.ts` — existing generate route (reference for Anthropic SDK import pattern)

## Expected Output

- `supabase/schema.sql` — extended with `child_friendly` column and `upsert_entry` function
- `supabase/seed.sql` — new file with 10 seed INSERT statements
- `lib/content-filter.ts` — new file exporting `isChildFriendly` function
