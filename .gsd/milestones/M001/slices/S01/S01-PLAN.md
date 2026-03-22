# S01: Supabase Setup & Story Persistence

**Goal:** Every generated story is persisted to Supabase with character(s), theme, length, prompt, full response, and timestamp. The client receives a `story_id` for downstream use (rating UI in S02).
**Demo:** Generate a story → row appears in Supabase `stories` table with all fields populated. Browser DevTools shows `X-Story-Id` response header with a UUID. StoryForm component holds the `storyId` in state after generation completes.

## Must-Haves

- `lib/supabase.ts` exports a singleton Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars
- `supabase/schema.sql` contains DDL for all three tables: `stories`, `ratings`, `custom_entries` (with `created_at timestamptz` on all — R013)
- `POST /api/generate` generates a `crypto.randomUUID()`, sets `X-Story-Id` response header, accumulates streamed text, and inserts a complete row into `stories` after `controller.close()` (R001, R002)
- DB insert is non-blocking — runs after the stream is fully delivered to the client (R002)
- Insert failures are caught and logged, never surfaced to the client (R002)
- `StoryForm.tsx` reads `X-Story-Id` from response headers and stores it as `storyId` in component state
- `.env.local.example` includes `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` placeholders
- Characters stored as `TEXT[]` (Postgres array) in the `stories` table

## Proof Level

- This slice proves: contract + integration (Supabase insert works, header delivery works, client reads the ID)
- Real runtime required: yes (Supabase insert requires a live project; streaming requires dev server)
- Human/UAT required: no (TypeScript compilation + manual smoke test sufficient)

## Verification

- `npx tsc --noEmit` — TypeScript compilation passes with all new and modified files
- `grep -q "createClient" lib/supabase.ts` — Supabase client module exists and exports client
- `grep -q "X-Story-Id" app/api/generate/route.ts` — API route sets the story ID header
- `grep -q "storyId" app/components/StoryForm.tsx` — Client component captures the story ID
- `grep -q "created_at" supabase/schema.sql` — Schema includes timestamp columns (R013)
- `grep -q "custom_entries" supabase/schema.sql` — All three tables defined in schema
- `node -e "require('@supabase/supabase-js')"` — Supabase package is installed
- `grep -q "console.error" app/api/generate/route.ts` — Insert failures are logged with correlation ID for server-side diagnosis

## Observability / Diagnostics

- Runtime signals: `console.error` log when Supabase insert fails (includes error message and story_id for correlation)
- Inspection surfaces: Supabase dashboard `stories` table; browser DevTools Network tab for `X-Story-Id` header
- Failure visibility: Insert errors logged server-side with story_id; client is unaffected (story still streams successfully)
- Redaction constraints: none (no PII; story content is AI-generated, not user-private)

## Integration Closure

- Upstream surfaces consumed: none (first slice)
- New wiring introduced in this slice: `lib/supabase.ts` singleton client, `X-Story-Id` response header contract, `storyId` state in StoryForm
- What remains before the milestone is truly usable end-to-end: S02 (rating UI using storyId), S03 (custom entries + popularity suggestions)

## Tasks

- [x] **T01: Install Supabase client, create schema, and configure env** `est:20m`
  - Why: Provides the database client, table definitions, and environment configuration that all subsequent tasks depend on. Creating all three tables now (stories, ratings, custom_entries) prevents migration ordering issues for S02/S03.
  - Files: `package.json`, `lib/supabase.ts`, `supabase/schema.sql`, `.env.local.example`
  - Do: Install `@supabase/supabase-js`. Create `lib/supabase.ts` with a singleton `createClient()` export using `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY`. Write `supabase/schema.sql` with DDL for `stories` (id UUID PK default gen_random_uuid(), characters TEXT[], theme TEXT, length TEXT, prompt TEXT, response TEXT, created_at TIMESTAMPTZ default now()), `ratings` (id UUID PK, story_id UUID FK references stories, stars INT check 1-5, feedback TEXT, created_at TIMESTAMPTZ), and `custom_entries` (id UUID PK, type TEXT, value TEXT, usage_count INT default 1, created_at TIMESTAMPTZ, UNIQUE(type, value)). Add Supabase env var placeholders to `.env.local.example`. Disable RLS on all tables per D003 (anonymous model).
  - Verify: `npx tsc --noEmit && node -e "require('@supabase/supabase-js')" && grep -q "created_at" supabase/schema.sql && grep -q "SUPABASE" .env.local.example`
  - Done when: `lib/supabase.ts` compiles, `supabase/schema.sql` defines all three tables with `created_at timestamptz`, `@supabase/supabase-js` is in `package.json` dependencies

- [x] **T02: Add story persistence and X-Story-Id header to generate API route** `est:30m`
  - Why: Core deliverable — implements R001 (persist every story) and R002 (non-blocking DB write). This is the most complex change: UUID generation, header on response, text accumulation during stream, and Supabase insert after stream close.
  - Files: `app/api/generate/route.ts`
  - Do: Import `createClient` from `@/lib/supabase`. At the top of the POST handler (after input validation), generate `const storyId = crypto.randomUUID()`. Add `X-Story-Id: storyId` and `Access-Control-Expose-Headers: X-Story-Id` to the Response headers. Inside the ReadableStream `start()`, accumulate each text chunk into a `fullResponse` buffer string. After `controller.close()`, call `supabase.from('stories').insert({ id: storyId, characters, theme, length, prompt, response: fullResponse })`. Wrap the insert in try/catch — log errors with `console.error` including storyId, never throw.
  - Verify: `npx tsc --noEmit && grep -q "X-Story-Id" app/api/generate/route.ts && grep -q "fullResponse" app/api/generate/route.ts && grep -q "controller.close" app/api/generate/route.ts`
  - Done when: `route.ts` compiles, generates a UUID, sets the header, accumulates the full response, and inserts to Supabase after stream close with error handling

- [x] **T03: Wire StoryForm to capture story_id from response header** `est:15m`
  - Why: Completes the client-side contract — S02's rating UI needs `storyId` from StoryForm state. Without this, the story_id is generated and sent but never captured by the client.
  - Files: `app/components/StoryForm.tsx`
  - Do: Add `const [storyId, setStoryId] = useState<string | null>(null)` to StoryForm state. In `handleSubmit`, after the `fetch()` call and before consuming the stream body, read `const id = response.headers.get('X-Story-Id')` and call `setStoryId(id)`. Reset `setStoryId(null)` at the start of `handleSubmit` (alongside the existing `setStory('')` reset). Pass `storyId` to `StoryDisplay` as a prop (add the prop to StoryDisplay's interface but don't use it yet — S02 will add the rating UI there).
  - Verify: `npx tsc --noEmit && grep -q "storyId" app/components/StoryForm.tsx && grep -q "X-Story-Id" app/components/StoryForm.tsx`
  - Done when: `StoryForm.tsx` compiles, reads the story ID from the response header, stores it in state, and passes it to StoryDisplay

## Files Likely Touched

- `package.json` — add `@supabase/supabase-js` dependency
- `lib/supabase.ts` — new file, Supabase client singleton
- `supabase/schema.sql` — new file, DDL for stories/ratings/custom_entries tables
- `.env.local.example` — add Supabase env var placeholders
- `app/api/generate/route.ts` — add UUID, header, text accumulation, DB insert
- `app/components/StoryForm.tsx` — read X-Story-Id header, store storyId state
- `app/components/StoryDisplay.tsx` — accept storyId prop (interface change only)
