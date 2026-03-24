---
id: T02
parent: S03
milestone: M001
provides:
  - GET /api/suggestions endpoint returning top-10 child-friendly characters and themes
  - Server-side validation rejecting >3 characters and >3-word entries
  - Usage tracking upserts in generate route via supabase.rpc('upsert_entry')
  - Lazy content-filter classification with DB caching for unchecked entries
key_files:
  - app/api/suggestions/route.ts
  - app/api/generate/route.ts
key_decisions:
  - Fetch 20 entries per type from DB then filter to 10 child-friendly — accounts for filtered-out entries without over-fetching
  - Content filter checks parallelized with Promise.all for unchecked entries on first request
patterns_established:
  - Supabase RPC calls destructure { error } and log with [S03] prefix on failure
  - Usage tracking upsert failures are non-blocking — logged but don't break story generation
observability_surfaces:
  - "GET /api/suggestions" returns current suggestion state as JSON
  - "[S03] Failed to fetch character suggestions:" console error on DB query failure
  - "[S03] Failed to cache child_friendly for entry:" console error on classification cache failure
  - "[S03] Usage tracking upsert failed:" console error on upsert failure
  - "[S03] Usage tracking failed:" console error on network-level upsert failure
duration: 10m
verification_result: passed
completed_at: 2026-03-22
blocker_discovered: false
---

# T02: Build suggestions endpoint and add usage tracking to generate route

**Created GET /api/suggestions endpoint with popularity-ranked child-friendly filtering and added server-side validation plus usage tracking upserts to the generate route**

## What Happened

Implemented two API changes that power the frontend refactor in T03:

1. **Suggestions endpoint** (`app/api/suggestions/route.ts`): New GET handler that queries `custom_entries` for top 20 entries per type (character/theme) ordered by `usage_count DESC`. For entries where `child_friendly` is null, it lazily calls `isChildFriendly()` via Promise.all and caches the result in the DB. Filters to only `child_friendly = true` entries and returns the top 10 per type as `{ characters: string[], themes: string[] }`. Gracefully degrades to empty arrays on any DB error, with `[S03]` prefixed console errors.

2. **Generate route changes** (`app/api/generate/route.ts`): Added two blocks after existing validation:
   - **Server-side validation**: Rejects `characters.length > 3` (400 "Maximum 3 characters allowed") and any character or theme exceeding 3 words (400 "Character/theme names must be 3 words or fewer").
   - **Usage tracking**: After the story insert block, calls `supabase.rpc('upsert_entry', ...)` for each character and the theme via Promise.all. Destructures `{ error }` from each RPC result and logs failures with `[S03]` prefix. Wrapped in try/catch so upsert failures never break story generation.

All Supabase calls follow the project pattern: destructure `{ data, error }` and check `error` explicitly rather than relying on try/catch alone.

## Verification

All 5 task-level checks pass: TypeScript compiles cleanly, suggestions route file exists, `isChildFriendly` is referenced in suggestions route, `upsert_entry` and `characters.length > 3` are present in generate route. Slice-level checks for T01+T02 concerns all pass; T03-owned StoryForm checks expectedly fail.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | ~9s |
| 2 | `test -f app/api/suggestions/route.ts` | 0 | ✅ pass | <1s |
| 3 | `grep -q "isChildFriendly" app/api/suggestions/route.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -q "upsert_entry" app/api/generate/route.ts` | 0 | ✅ pass | <1s |
| 5 | `grep -q "characters.length > 3" app/api/generate/route.ts` | 0 | ✅ pass | <1s |
| 6 | `test -f supabase/seed.sql && grep -c "INSERT" supabase/seed.sql` → 10 | 0 | ✅ pass | <1s |
| 7 | `grep -q "child_friendly" supabase/schema.sql` | 0 | ✅ pass | <1s |
| 8 | `grep -q "upsert_entry" supabase/schema.sql` | 0 | ✅ pass | <1s |
| 9 | `grep -q "custom" app/components/StoryForm.tsx` | 1 | ⏳ T03 | <1s |
| 10 | `grep -q "api/suggestions" app/components/StoryForm.tsx` | 1 | ⏳ T03 | <1s |

## Diagnostics

- **Suggestions state**: `GET /api/suggestions` returns current top-10 characters and themes as JSON.
- **Usage tracking**: `SELECT type, value, usage_count FROM custom_entries ORDER BY usage_count DESC;` shows which entries have been used in story generation.
- **Content filter cache**: `SELECT value, child_friendly FROM custom_entries WHERE child_friendly IS NULL;` shows entries not yet classified.
- **Error visibility**: `grep "[S03]"` in server logs shows any suggestion fetch failures, content filter cache failures, or upsert failures.

## Deviations

None — implementation matched the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `app/api/suggestions/route.ts` — New GET handler returning top-10 child-friendly characters and themes from custom_entries
- `app/api/generate/route.ts` — Added server-side validation (max 3 characters, max 3 words per entry) and usage tracking upserts via supabase.rpc('upsert_entry')
