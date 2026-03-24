---
id: T01
parent: S03
milestone: M001
provides:
  - child_friendly column on custom_entries table
  - upsert_entry Postgres function for atomic usage tracking
  - 10 idempotent seed entries (6 characters, 4 themes)
  - isChildFriendly content filter utility using Claude Haiku
key_files:
  - supabase/schema.sql
  - supabase/seed.sql
  - lib/content-filter.ts
key_decisions:
  - Fail-closed content filter — returns false on any Anthropic API error
  - Claude Haiku (claude-haiku-4-20250514) chosen for speed/cost on classification
  - Seed entries pre-marked child_friendly=true to skip redundant API calls
patterns_established:
  - "[S03]" console prefix for all slice-related error logging
  - Anthropic client instantiation at module scope (matches generate/route.ts pattern)
observability_surfaces:
  - "[S03] Content filter failed for entry:" console error on classification failures
  - custom_entries table child_friendly column (NULL=unchecked, true=safe, false=filtered)
duration: 15m
verification_result: passed
completed_at: 2026-03-22
blocker_discovered: false
---

# T01: Add seed data, Postgres upsert function, and content filter utility

**Extended schema.sql with child_friendly column and upsert_entry function, created seed.sql with 10 default entries, and built lib/content-filter.ts with fail-closed Claude Haiku classification**

## What Happened

Added three foundational pieces for the dynamic suggestions feature:

1. **Schema extension** (`supabase/schema.sql`): Added `child_friendly BOOLEAN DEFAULT NULL` column to `custom_entries` inline in the CREATE TABLE. Added `upsert_entry(p_type, p_value)` PL/pgSQL function that does INSERT ON CONFLICT DO UPDATE to atomically increment `usage_count`, avoiding the read-then-write race condition with concurrent story generations.

2. **Seed data** (`supabase/seed.sql`): 10 idempotent INSERT statements — 6 characters (Fox, Bear, Little Wizard, Brave Knight, Young Scientist, Mermaid) and 4 themes (Kindness, Courage, Empathy, Vocabulary). All use ON CONFLICT DO NOTHING so the file is safe to run multiple times. All seeds pre-set `child_friendly = true` since they're known-good values.

3. **Content filter** (`lib/content-filter.ts`): Exports `isChildFriendly(text)` which calls Claude Haiku with a tight system prompt and `max_tokens: 3`. Parses "yes"/"no" response. Fails closed on any error (returns `false` and logs with `[S03]` prefix). Module-scope Anthropic client matches the existing pattern in `app/api/generate/route.ts`.

## Verification

All 6 task-level checks pass: TypeScript compiles cleanly, both new files exist, schema.sql contains `upsert_entry` and `child_friendly`, seed.sql has exactly 10 INSERT statements. Slice-level checks for T01-owned concerns (tsc, seed.sql, child_friendly, upsert_entry) also pass; T02/T03-owned checks expectedly fail.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | ~3s |
| 2 | `test -f supabase/seed.sql` | 0 | ✅ pass | <1s |
| 3 | `test -f lib/content-filter.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -q "upsert_entry" supabase/schema.sql` | 0 | ✅ pass | <1s |
| 5 | `grep -q "child_friendly" supabase/schema.sql` | 0 | ✅ pass | <1s |
| 6 | `grep -c "INSERT" supabase/seed.sql` → 10 | 0 | ✅ pass | <1s |

## Diagnostics

- **Content filter errors**: `grep "[S03]"` in server logs shows any classification failures with the rejected entry text.
- **Entry state inspection**: `SELECT type, value, usage_count, child_friendly FROM custom_entries ORDER BY usage_count DESC;` — NULL means unchecked, true means safe, false means filtered out.
- **Seed verification**: After applying seed.sql, `SELECT count(*) FROM custom_entries WHERE child_friendly = true;` should return ≥10.
- **Upsert function**: `SELECT proname FROM pg_proc WHERE proname = 'upsert_entry';` confirms the function exists.

## Deviations

None — implementation matched the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `supabase/schema.sql` — Added `child_friendly BOOLEAN DEFAULT NULL` column and `upsert_entry` PL/pgSQL function
- `supabase/seed.sql` — New file with 10 idempotent INSERT statements for default characters and themes
- `lib/content-filter.ts` — New file exporting `isChildFriendly` async function using Claude Haiku for content classification
