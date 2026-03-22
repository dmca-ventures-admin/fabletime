# S01: Supabase Setup & Story Persistence — Research

**Date:** 2026-03-22
**Depth:** Targeted

## Summary

This slice adds Supabase persistence to Fabletime so every generated story is saved with its inputs, prompt, full response, and timestamp. The primary risk — delivering a `story_id` to the client without breaking the streaming response — is solved cleanly by generating a UUID server-side before the stream starts and returning it via a custom `X-Story-Id` response header. The client reads the header before consuming the stream body.

The codebase is small and straightforward. The API route (`app/api/generate/route.ts`) creates a `ReadableStream` with an `async start()` function that streams Claude's response. The DB insert can happen inside that function after `controller.close()`, making it non-blocking by design — the response is already fully delivered to the client before the insert runs. No background job or queue needed.

Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`) already exist in the main project's `.env.local` but need to be added to the worktree's `.env.local.example` and configured in Vercel for production. The `@supabase/supabase-js` package needs to be installed. No `@supabase/ssr` is needed since there's no auth.

## Recommendation

Use the simplest viable approach:

1. **Supabase client:** Single `lib/supabase.ts` exporting a `createClient()` singleton. Server-only (no client-side Supabase calls in this slice). Use `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars that already exist.

2. **Story ID delivery:** Generate a `crypto.randomUUID()` at the top of the POST handler, set it as `X-Story-Id` response header, read it in the client via `response.headers.get('X-Story-Id')` before consuming the stream. This is the cleanest approach — headers are sent before the body, so the client has the ID immediately.

3. **Non-blocking DB write (R002):** After the stream loop completes and `controller.close()` is called, insert to Supabase with `.insert()`. This runs inside the ReadableStream's `start()` callback — the response is already delivered to the client, so the insert cannot delay streaming. Wrap in try/catch to prevent insert failures from affecting the response.

4. **Table schemas:** Create all three tables (stories, ratings, custom_entries) via a single SQL migration file, even though S02/S03 use the latter two. This avoids migration ordering issues and satisfies R013 (all tables need `created_at timestamptz`).

5. **Characters storage:** Store as `TEXT[]` (Postgres array) — the characters field is always a string array of 1-3 items. Supabase JS handles arrays natively.

## Implementation Landscape

### Key Files

- `app/api/generate/route.ts` — The streaming API route. Currently stateless. Needs: UUID generation, `X-Story-Id` header on response, prompt capture, full response accumulation during stream, Supabase insert after stream completes.
- `app/components/StoryForm.tsx` — Client component with `handleSubmit`. Needs: read `X-Story-Id` from response headers, store in state as `storyId` for S02's rating UI.
- `lib/supabase.ts` — **New file.** Exports a singleton Supabase client for server-side use.
- `supabase/schema.sql` — **New file.** SQL DDL for all three tables (stories, ratings, custom_entries). Executed manually in Supabase SQL editor.
- `.env.local.example` — Needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` entries added.

### Build Order

1. **Install `@supabase/supabase-js`** and create `lib/supabase.ts` — unblocks everything.
2. **Write `supabase/schema.sql`** with all three table DDLs — schema must exist before insert works, and defining all tables now prevents migration ordering issues for S02/S03.
3. **Modify `app/api/generate/route.ts`** — generate UUID, add header, accumulate response text, insert after stream. This is the core deliverable.
4. **Modify `app/components/StoryForm.tsx`** — read `X-Story-Id` header, store in component state. This makes `storyId` available for S02.
5. **Update `.env.local.example`** — add Supabase env var placeholders.

### Verification Approach

- **TypeScript compilation:** `npx tsc --noEmit` must pass with the new `lib/supabase.ts` and modified route.
- **Manual smoke test:** Run `npm run dev`, generate a story, check Supabase dashboard for a new row in `stories` table with all fields populated.
- **Header verification:** In browser DevTools Network tab, confirm the generate response includes `X-Story-Id` header with a UUID value.
- **Client state:** Console.log or React DevTools to confirm `storyId` is set in StoryForm state after generation.
- **Non-blocking verification (R002):** Story text must begin streaming immediately — DB insert timing is after stream close, so no observable delay. Can add `console.log` timestamps to confirm.

## Constraints

- **No auth** — Using anon key directly. Row-Level Security (RLS) must either be disabled on the `stories` table or have a permissive policy allowing inserts with the anon key. Recommend disabling RLS for now (D003 — anonymous model).
- **`NEXT_PUBLIC_SUPABASE_URL` prefix** — The `NEXT_PUBLIC_` prefix exposes this var to the browser bundle. That's fine for the URL (it's public), but the anon key uses `SUPABASE_ANON_KEY` (no prefix) — server-only access is sufficient for this slice.
- **Postgres array type** — `TEXT[]` for characters column. Supabase JS passes JS arrays directly; no JSON serialization needed.
- **UUID generation** — Use `crypto.randomUUID()` (available in Node.js 19+ and all modern runtimes including Vercel Edge/Node). Alternatively, let Postgres generate UUIDs via `gen_random_uuid()` default, but we need the ID *before* the insert to set the header — so generate in JS and pass to the insert.

## Common Pitfalls

- **CORS on custom headers** — The `X-Story-Id` header won't be readable by the browser unless `Access-Control-Expose-Headers: X-Story-Id` is set on the response. Same-origin requests (Next.js API routes) don't need this, but if the app ever moves to a separate API domain, it will break. Add the expose header proactively.
- **Stream response accumulation** — Must accumulate the full text during streaming (append each chunk to a buffer string). Forgetting this means the `response` field in the DB row will be empty.
- **RLS blocking inserts** — Supabase enables RLS by default on new tables. If RLS is enabled and no policy exists for `anon`, inserts will silently return `null` data with no error. Either disable RLS or add an `INSERT` policy for `anon`.
- **Response already sent before insert error** — If the Supabase insert fails, the client already has their story. Log the error server-side but don't try to notify the client. This is correct behavior per R002.

## Open Risks

- **Supabase project readiness** — The credentials exist in `.env.local` but we haven't verified the Supabase project is active and tables can be created. If the project was deleted or paused, setup will fail.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Supabase | `supabase/agent-skills@supabase-postgres-best-practices` (44.3K installs) | available — recommended for SQL schema best practices |
| Supabase + Next.js | `sickn33/antigravity-awesome-skills@nextjs-supabase-auth` (3.5K installs) | available — but auth-focused, not needed for S01 |
