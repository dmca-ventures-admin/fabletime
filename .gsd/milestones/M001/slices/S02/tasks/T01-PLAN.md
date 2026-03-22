---
estimated_steps: 4
estimated_files: 1
skills_used:
  - best-practices
---

# T01: Create POST /api/rate server route with validation

**Slice:** S02 — Per-Story Rating & Feedback
**Milestone:** M001

## Description

Create the `POST /api/rate` API route that accepts `{ story_id, stars, feedback }`, validates the input, inserts a row into the Supabase `ratings` table, and returns appropriate HTTP status codes. This is the backend half of the rating feature (R004) and must be independently testable with `curl` before the UI is built.

The `ratings` table already exists in `supabase/schema.sql` with columns: `id` (UUID PK, auto-generated), `story_id` (UUID FK → stories), `stars` (INTEGER, CHECK 1–5), `feedback` (TEXT, nullable), `created_at` (TIMESTAMPTZ, auto-generated).

**CRITICAL PATTERN (from KNOWLEDGE.md):** Supabase `.insert()` does NOT throw on DB errors — it returns `{ data, error }`. You must destructure `{ error }` AND wrap in try/catch to handle both DB-level and network-level failures.

## Steps

1. Create `app/api/rate/route.ts` with a `POST` export function that takes a `NextRequest`.
2. Parse the JSON body and validate: `stars` must be an integer between 1 and 5 (inclusive), `story_id` must be a non-empty string, `feedback` is optional (string or null/undefined). Return `400` with `{ error: "..." }` JSON on validation failure.
3. Import `supabase` from `@/lib/supabase`. Insert into the `ratings` table: `{ story_id, stars, feedback: feedback || null }`. Destructure `{ error }` from the result. If `error`, log with `[S02]` prefix and return `500` with `{ error: "Failed to save rating" }`.
4. Wrap the entire insert in try/catch for network errors. On catch, log with `[S02]` prefix and return `500`. On success, return `Response` with status `201` and body `{ success: true }`.

## Must-Haves

- [ ] Route file exists at `app/api/rate/route.ts` with a named `POST` export
- [ ] Input validation rejects `stars` outside 1–5 and missing `story_id` with 400 status
- [ ] Supabase insert uses `{ data, error }` destructure pattern + try/catch
- [ ] Returns 201 with `{ success: true }` on successful insert
- [ ] Returns 500 with `{ error: "..." }` on DB or network failure
- [ ] Errors logged with `[S02]` prefix for grep-ability

## Verification

- `npx tsc --noEmit` passes with no errors
- `test -f app/api/rate/route.ts` succeeds
- `grep -q '\[S02\]' app/api/rate/route.ts` — error logging prefix present

## Inputs

- `lib/supabase.ts` — Supabase singleton client to import
- `supabase/schema.sql` — Reference for `ratings` table schema (id, story_id, stars, feedback, created_at)

## Observability Impact

- **New signal:** `console.error('[S02] Failed to save rating:', error)` — emitted on Supabase DB errors (constraint violations, permission denied, missing table). Grep server logs for `[S02]` to find all rating-related failures.
- **New signal:** `console.error('[S02] Unexpected error in rate route:', err)` — emitted on network errors or malformed JSON body. Distinguishes infrastructure failures from DB-level issues.
- **Inspection surface:** `POST /api/rate` returns structured JSON `{ error: "..." }` with 400 (validation) or 500 (DB/network) status codes. A future agent can `curl` this endpoint to verify it responds correctly without needing the UI.
- **Failure state visible:** Invalid FK (non-existent `story_id`) returns 500 with `{ error: "Failed to save rating" }` and logs the Supabase error object with full constraint violation details.

## Expected Output

- `app/api/rate/route.ts` — New API route file with POST handler, validation, Supabase insert, and error handling
