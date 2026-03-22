---
id: T01
parent: S02
milestone: M001
provides:
  - POST /api/rate endpoint with input validation and Supabase persistence
key_files:
  - app/api/rate/route.ts
key_decisions:
  - Used Response.json() for structured JSON responses (cleaner than new Response with manual headers)
patterns_established:
  - Rate route follows same Supabase { data, error } + try/catch pattern from KNOWLEDGE.md
observability_surfaces:
  - "console.error('[S02]', ...) on DB or network failures in rate route"
  - "Structured JSON { error: '...' } returned with 400/500 status codes"
duration: 10m
verification_result: passed
completed_at: 2026-03-22
blocker_discovered: false
---

# T01: Create POST /api/rate server route with validation

**Add POST /api/rate route with stars 1–5 validation, Supabase ratings insert, and structured error responses**

## What Happened

Created `app/api/rate/route.ts` with a `POST` handler that accepts `{ story_id, stars, feedback }`. The route validates that `story_id` is a non-empty string, `stars` is an integer 1–5, and `feedback` (if provided) is a string. Validation failures return 400 with descriptive JSON error messages. On valid input, the handler inserts into the Supabase `ratings` table using the `{ data, error }` destructure pattern, with the entire operation wrapped in try/catch to handle both DB-level and network-level errors. DB errors log with `[S02]` prefix and return 500. Successful inserts return 201 with `{ success: true }`.

## Verification

All three task-level verification checks pass:

1. `npx tsc --noEmit` — TypeScript compilation clean (no errors)
2. `test -f app/api/rate/route.ts` — file exists
3. `grep -q '[S02]' app/api/rate/route.ts` — error logging prefix present

Slice-level checks for T02 (hasRated state, radiogroup markup) are expected to fail until the UI task is complete.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 7.5s |
| 2 | `test -f app/api/rate/route.ts` | 0 | ✅ pass | <1s |
| 3 | `grep -q '[S02]' app/api/rate/route.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -q "hasRated" app/components/StoryForm.tsx` | 1 | ⏳ expected fail (T02) | <1s |
| 5 | `grep -q "radiogroup\|radio" app/components/StoryDisplay.tsx` | 1 | ⏳ expected fail (T02) | <1s |

## Diagnostics

- **Grep for failures:** `grep '[S02]' <server-logs>` to find all rating-related errors
- **curl test with invalid FK:** `curl -X POST http://localhost:3000/api/rate -H 'Content-Type: application/json' -d '{"story_id":"00000000-0000-0000-0000-000000000000","stars":4}'` → should return 500 (FK constraint violation) with `{ error: "Failed to save rating" }`
- **curl test with missing fields:** `curl -X POST http://localhost:3000/api/rate -H 'Content-Type: application/json' -d '{"stars":0}'` → should return 400 with validation error
- **Supabase inspection:** Check `ratings` table for rows with `story_id`, `stars`, `feedback`, `created_at`

## Deviations

- Used `Response.json()` instead of `new Response(JSON.stringify(...))` — cleaner API available in the Next.js version used by this project, consistent with the Next.js route handler docs.
- Added explicit validation for `feedback` type (must be string if provided) — not in the plan but prevents type confusion at the DB layer.

## Known Issues

None.

## Files Created/Modified

- `app/api/rate/route.ts` — New POST route handler with validation, Supabase insert, and error handling
- `.gsd/milestones/M001/slices/S02/tasks/T01-PLAN.md` — Added Observability Impact section (pre-flight fix)
