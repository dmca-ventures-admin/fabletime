---
estimated_steps: 4
estimated_files: 2
skills_used:
  - best-practices
  - react-best-practices
---

# T02: Build suggestions endpoint and add usage tracking to generate route

**Slice:** S03 — Custom Characters & Themes with Popularity
**Milestone:** M001

## Description

Creates the `GET /api/suggestions` endpoint that returns top-10 characters and themes (content-filtered, popularity-ranked) and adds usage tracking upserts to the existing generate route. These two API changes power the frontend refactor in T03.

## Steps

1. **Create `app/api/suggestions/route.ts`** — A Next.js App Router GET handler that:
   - Imports `supabase` from `@/lib/supabase` and `isChildFriendly` from `@/lib/content-filter`
   - Queries `custom_entries` where `type = 'character'` ordered by `usage_count DESC`, limit 20 (fetch extra to account for filtered-out entries)
   - Does the same for `type = 'theme'`
   - For each entry: if `child_friendly` is `null`, call `isChildFriendly(entry.value)` and update the row in DB with the result (caching the check). Use `Promise.all()` to parallelize these checks for unchecked entries.
   - Filter to only entries where `child_friendly = true`, take the first 10
   - Return `Response.json({ characters: string[], themes: string[] })` with just the `value` strings
   - On any DB error, log with `[S03]` prefix and return `Response.json({ characters: [], themes: [] })` (graceful degradation)
   - CRITICAL: Remember that supabase-js does not throw on DB errors — always destructure `{ data, error }` and check `error` (see project KNOWLEDGE.md)

2. **Add server-side validation to `app/api/generate/route.ts`** — After the existing field validation block:
   - Reject if `characters.length > 3` with a 400 response: "Maximum 3 characters allowed"
   - Reject any individual character or theme that has more than 3 words (split on whitespace, check length): "Character/theme names must be 3 words or fewer"
   - Keep the existing validation (non-empty characters array, length, theme required)

3. **Add usage tracking upserts to `app/api/generate/route.ts`** — Inside the `start(controller)` callback, after the existing story insert block (the `try { const { error: dbError } = await supabase.from('stories').insert(...)` block), add a new block that:
   - For each character in the `characters` array, calls `supabase.rpc('upsert_entry', { p_type: 'character', p_value: character })`
   - Calls `supabase.rpc('upsert_entry', { p_type: 'theme', p_value: theme })`
   - Uses `Promise.all()` to parallelize the upserts
   - Wraps in try/catch, logs errors with `[S03]` prefix but does NOT throw (usage tracking failure must not break story generation)
   - Destructures `{ error }` from each `.rpc()` call (supabase-js pattern)

4. **Verify** — `npx tsc --noEmit` passes. Grep for key patterns to confirm wiring.

## Must-Haves

- [ ] `GET /api/suggestions` returns `{ characters: string[], themes: string[] }` JSON
- [ ] Suggestions are ordered by `usage_count DESC` and limited to 10 per type
- [ ] Entries with `child_friendly = null` are checked via `isChildFriendly()` and result cached in DB
- [ ] Only `child_friendly = true` entries appear in suggestions response
- [ ] Generate route rejects `characters.length > 3` with 400 status
- [ ] Generate route rejects entries with > 3 words with 400 status
- [ ] Generate route upserts each character and the theme via `supabase.rpc('upsert_entry', ...)`
- [ ] Upsert failures are logged but do not break story generation
- [ ] All Supabase calls destructure `{ data, error }` and check `error` (not just try/catch)
- [ ] TypeScript compiles without errors

## Verification

- `npx tsc --noEmit` passes
- `test -f app/api/suggestions/route.ts` succeeds
- `grep -q "isChildFriendly" app/api/suggestions/route.ts` succeeds
- `grep -q "upsert_entry" app/api/generate/route.ts` succeeds
- `grep -q "characters.length > 3" app/api/generate/route.ts` succeeds

## Observability Impact

- Signals added/changed: `[S03]` prefixed console.error for content filter failures, upsert failures, and suggestions query failures
- How a future agent inspects this: `GET /api/suggestions` shows current suggestion state; `custom_entries` table shows all entries with `usage_count` and `child_friendly` status
- Failure state exposed: content filter errors → entry excluded from suggestions (fail-closed); upsert errors → logged but story generation continues

## Inputs

- `lib/content-filter.ts` — content filter utility from T01 (imports `isChildFriendly`)
- `lib/supabase.ts` — Supabase client singleton
- `app/api/generate/route.ts` — existing generate route to modify
- `supabase/schema.sql` — schema with `upsert_entry` function and `child_friendly` column (from T01)

## Expected Output

- `app/api/suggestions/route.ts` — new file, GET handler returning filtered top-10 suggestions
- `app/api/generate/route.ts` — modified with server-side validation and usage tracking upserts
