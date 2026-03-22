---
estimated_steps: 4
estimated_files: 4
skills_used:
  - best-practices
  - lint
---

# T01: Install Supabase client, create schema, and configure env

**Slice:** S01 — Supabase Setup & Story Persistence
**Milestone:** M001

## Description

Install the `@supabase/supabase-js` package, create a singleton Supabase client module at `lib/supabase.ts`, write the SQL schema for all three milestone tables (stories, ratings, custom_entries), and add Supabase env var placeholders to `.env.local.example`. This task produces the foundation that T02 and T03 (and S02/S03) depend on.

## Steps

1. Run `npm install @supabase/supabase-js` to add the dependency.
2. Create `lib/supabase.ts` that imports `createClient` from `@supabase/supabase-js` and exports a singleton client instance. Use `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables. The client is server-only in this slice (no `'use client'` directive). Use a module-level singleton pattern — instantiate once and reuse.
3. Create `supabase/schema.sql` with DDL for three tables:
   - `stories`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `characters TEXT[] NOT NULL`, `theme TEXT NOT NULL`, `length TEXT NOT NULL`, `prompt TEXT NOT NULL`, `response TEXT NOT NULL`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `ratings`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `story_id UUID NOT NULL REFERENCES stories(id)`, `stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5)`, `feedback TEXT`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `custom_entries`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `type TEXT NOT NULL`, `value TEXT NOT NULL`, `usage_count INTEGER NOT NULL DEFAULT 1`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `UNIQUE(type, value)`
   - Add `ALTER TABLE stories DISABLE ROW LEVEL SECURITY;` (and same for ratings, custom_entries) per D003 — anonymous model, no auth.
4. Append `NEXT_PUBLIC_SUPABASE_URL=your-supabase-url` and `SUPABASE_ANON_KEY=your-supabase-anon-key` to `.env.local.example`.

## Must-Haves

- [ ] `@supabase/supabase-js` is in `package.json` dependencies (not devDependencies)
- [ ] `lib/supabase.ts` exports a working `createClient()` result using the two env vars
- [ ] `supabase/schema.sql` defines all three tables with `created_at TIMESTAMPTZ` columns (R013)
- [ ] `stories` table has `characters TEXT[]` column (Postgres array)
- [ ] `ratings` table has `story_id UUID REFERENCES stories(id)` foreign key
- [ ] `custom_entries` table has `UNIQUE(type, value)` constraint
- [ ] RLS is disabled on all tables per D003
- [ ] `.env.local.example` contains both Supabase env var placeholders
- [ ] `npx tsc --noEmit` passes

## Verification

- `npx tsc --noEmit` passes without errors
- `node -e "require('@supabase/supabase-js')"` exits 0
- `grep -q "createClient" lib/supabase.ts` confirms client module exists
- `grep -c "created_at" supabase/schema.sql` returns 3 (one per table)
- `grep -q "SUPABASE_ANON_KEY" .env.local.example` confirms env placeholders
- `grep -q "DISABLE ROW LEVEL SECURITY" supabase/schema.sql` confirms RLS disabled

## Observability Impact

- **New signals:** `lib/supabase.ts` will fail at import time with a clear error if `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_ANON_KEY` are missing/empty. This surfaces immediately during dev server start, not at first DB call.
- **Inspection surfaces:** `supabase/schema.sql` serves as the canonical schema reference. A future agent can read it to understand table structure without needing database access.
- **Failure state visible:** If the Supabase client module has type errors, `npx tsc --noEmit` will catch them. If the package is missing, `node -e "require('@supabase/supabase-js')"` will exit non-zero.

## Inputs

- `package.json` — current dependencies to add `@supabase/supabase-js` to
- `.env.local.example` — current env template to append Supabase vars to
- `tsconfig.json` — confirms path alias `@/*` is configured for imports

## Expected Output

- `package.json` — updated with `@supabase/supabase-js` dependency
- `lib/supabase.ts` — new file, singleton Supabase client
- `supabase/schema.sql` — new file, DDL for all three tables
- `.env.local.example` — updated with Supabase env var placeholders
