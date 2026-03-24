---
id: T01
parent: S01
milestone: M001
provides:
  - "@supabase/supabase-js dependency in package.json"
  - "lib/supabase.ts singleton client module"
  - "supabase/schema.sql DDL for stories, ratings, custom_entries tables"
  - "Supabase env var placeholders in .env.local.example"
key_files:
  - lib/supabase.ts
  - supabase/schema.sql
  - .env.local.example
  - package.json
key_decisions:
  - "Module-level singleton pattern for Supabase client — instantiated once at import, reused across requests"
  - "Fail-fast with thrown Error if NEXT_PUBLIC_SUPABASE_URL or SUPABASE_ANON_KEY is missing at import time"
patterns_established:
  - "Supabase client import: `import { supabase } from '@/lib/supabase'`"
  - "Schema lives at supabase/schema.sql, run manually via Supabase SQL Editor or psql"
observability_surfaces:
  - "lib/supabase.ts throws descriptive Error at import time if env vars are missing"
  - "npx tsc --noEmit catches type errors in the client module"
duration: 5m
verification_result: passed
completed_at: 2026-03-22T10:58:00Z
blocker_discovered: false
---

# T01: Install Supabase client, create schema, and configure env

**Installed @supabase/supabase-js, created singleton client at lib/supabase.ts, wrote DDL for all three tables in supabase/schema.sql, and added Supabase env var placeholders to .env.local.example**

## What Happened

Installed `@supabase/supabase-js@^2.99.3` as a production dependency. Created `lib/supabase.ts` as a server-only singleton that imports `createClient`, reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` from `process.env`, and throws a descriptive error at import time if either is missing. Created `supabase/schema.sql` with `CREATE TABLE IF NOT EXISTS` statements for `stories` (with `characters TEXT[]`, `theme`, `length`, `prompt`, `response`, `created_at TIMESTAMPTZ`), `ratings` (with FK to stories, stars CHECK 1-5, optional feedback), and `custom_entries` (with `UNIQUE(type, value)`, `usage_count` default 1). All three tables have RLS disabled per D003 (anonymous model). Appended `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` placeholders to `.env.local.example`.

## Verification

All must-haves confirmed:
- `@supabase/supabase-js` is in `package.json` `dependencies` (not devDependencies)
- `lib/supabase.ts` exports a `createClient()` result using both env vars
- `supabase/schema.sql` defines all three tables with `created_at TIMESTAMPTZ` columns
- `stories` has `characters TEXT[]` column
- `ratings` has `story_id UUID REFERENCES stories(id)` FK
- `custom_entries` has `UNIQUE(type, value)` constraint
- RLS disabled on all tables
- `.env.local.example` contains both Supabase env var placeholders
- `npx tsc --noEmit` passes cleanly

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 9.2s |
| 2 | `node -e "require('@supabase/supabase-js')"` | 0 | ✅ pass | <1s |
| 3 | `grep -q "createClient" lib/supabase.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -c "created_at" supabase/schema.sql` → 3 | 0 | ✅ pass | <1s |
| 5 | `grep -q "SUPABASE_ANON_KEY" .env.local.example` | 0 | ✅ pass | <1s |
| 6 | `grep -q "DISABLE ROW LEVEL SECURITY" supabase/schema.sql` | 0 | ✅ pass | <1s |
| 7 | `grep -q "custom_entries" supabase/schema.sql` | 0 | ✅ pass | <1s |

## Diagnostics

- **Missing env vars at startup:** If `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_ANON_KEY` is unset, `lib/supabase.ts` throws immediately at import time with a message identifying which var is missing and pointing to `.env.local.example`.
- **Schema reference:** `supabase/schema.sql` is the canonical DDL — read it to understand table structure without DB access.
- **Type checking:** `npx tsc --noEmit` validates the client module compiles correctly against `@supabase/supabase-js` types.

## Deviations

None — implementation matched the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `package.json` — added `@supabase/supabase-js@^2.99.3` to dependencies
- `lib/supabase.ts` — new file, singleton Supabase client with fail-fast env var validation
- `supabase/schema.sql` — new file, DDL for stories, ratings, and custom_entries tables with RLS disabled
- `.env.local.example` — appended NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY placeholders
