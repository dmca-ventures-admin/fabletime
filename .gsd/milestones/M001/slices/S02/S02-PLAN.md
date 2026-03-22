# S02: Per-Story Rating & Feedback

**Goal:** Users can rate any generated story with 1–5 stars and optional text feedback, persisted to Supabase.
**Demo:** Generate a story → star rating UI appears below → select stars → optionally type feedback → submit → row in `ratings` table with correct FK → form replaced with thank-you message → generate another story → rating form reappears fresh.

## Must-Haves

- `POST /api/rate` route that validates input (stars 1–5, story_id UUID, feedback optional), inserts to `ratings` table, returns 201 on success and 400/500 on errors
- Star rating UI (5 clickable stars) with optional textarea and submit button, visible only after story finishes loading
- Client-side `hasRated` state: after submission, form is replaced with thank-you message; reset when a new story is generated
- Accessible star input using radio group semantics with keyboard navigation
- Theme-aware styling matching the claymorphism design system (light + dark mode)

## Proof Level

- This slice proves: integration (API + UI + DB persistence)
- Real runtime required: yes (Supabase insert)
- Human/UAT required: yes (visual check of rating UI, dark mode, accessibility)

## Verification

- `npx tsc --noEmit` — TypeScript compilation passes with no errors
- `test -f app/api/rate/route.ts` — API route file exists
- `grep -q "hasRated" app/components/StoryForm.tsx` — single-submission state is wired
- `grep -q "radiogroup\|radio" app/components/StoryDisplay.tsx` — accessible star markup present
- Manual runtime check: `curl -X POST http://localhost:3000/api/rate -H 'Content-Type: application/json' -d '{"story_id":"00000000-0000-0000-0000-000000000000","stars":4}'` → returns 400 or 500 (invalid FK), not a crash. With a real story_id → returns 201 and row appears in Supabase `ratings` table.
- Manual UAT: generate story → rating appears → rate → thank-you shown → new story → rating form resets

## Observability / Diagnostics

- Runtime signals: `console.error('[S02]', ...)` on DB insert failures in the rate API route
- Inspection surfaces: Supabase `ratings` table — rows with `story_id`, `stars`, `feedback`, `created_at`
- Failure visibility: API returns structured JSON `{ error: "..." }` with appropriate HTTP status codes
- Redaction constraints: none (no PII in ratings)

## Integration Closure

- Upstream surfaces consumed: `lib/supabase.ts` (Supabase client), `storyId` state from `StoryForm.tsx` (set from `X-Story-Id` header in generate route)
- New wiring introduced in this slice: `POST /api/rate` route, `hasRated` / `onRated` callback threaded from `StoryForm` → `StoryDisplay`, rating UI component in `StoryDisplay`
- What remains before the milestone is truly usable end-to-end: S03 (custom characters/themes with popularity)

## Tasks

- [x] **T01: Create POST /api/rate server route with validation** `est:30m`
  - Why: R004 requires ratings to be persisted to Supabase. The API route is independently testable and is a prerequisite for the UI.
  - Files: `app/api/rate/route.ts`
  - Do: Create a POST handler that parses `{ story_id, stars, feedback }` from the request body. Validate: `stars` is an integer 1–5, `story_id` is a non-empty string, `feedback` is optional string or null. On validation failure return 400 with JSON `{ error }`. Insert to Supabase `ratings` table using the `{ data, error }` destructure pattern (KNOWLEDGE.md) AND try/catch for network errors. Return 201 with `{ success: true }` on success, 500 with `{ error }` on DB/network failure. Log errors with `[S02]` prefix.
  - Verify: `npx tsc --noEmit` passes, `test -f app/api/rate/route.ts`
  - Done when: POST with valid data returns 201, POST with `stars: 0` or missing `story_id` returns 400, DB errors return 500 with structured JSON

- [ ] **T02: Build star rating UI in StoryDisplay and wire hasRated state** `est:1h`
  - Why: R003 (rating appears after story), R005 (once per session). This task delivers the user-facing feature: star picker, feedback textarea, submission, thank-you message, and reset on new generation.
  - Files: `app/components/StoryDisplay.tsx`, `app/components/StoryForm.tsx`
  - Do: (1) Add `hasRated` state and `setHasRated` to `StoryForm`. Reset `hasRated` to false in `handleSubmit` before generating. Pass `onRated={() => setHasRated(true)}` and `hasRated` as props to `StoryDisplay`. (2) In `StoryDisplay`, add a rating section below the story card, visible when `!isLoading && story && storyId && !hasRated`. Use a `<fieldset>` with `role="radiogroup"` and 5 radio inputs styled as stars for accessibility. Support keyboard navigation (arrow keys). Add an optional `<textarea>` for feedback and a submit button. On submit, POST to `/api/rate` with `{ story_id: storyId, stars, feedback }`. On success, call `onRated()`. When `hasRated` is true, show a thank-you message instead. (3) Style with theme-aware CSS variables: `--color-cta` / orange for filled stars, `--color-secondary` for unfilled, claymorphism shadows matching existing card design.
  - Verify: `npx tsc --noEmit` passes, `grep -q "hasRated" app/components/StoryForm.tsx`, `grep -q "radiogroup\|radio" app/components/StoryDisplay.tsx`
  - Done when: Full flow works — generate story → stars appear → select + submit → thank-you → generate again → rating resets. Accessible via keyboard. Themed in both light and dark mode.

## Files Likely Touched

- `app/api/rate/route.ts` (new)
- `app/components/StoryDisplay.tsx`
- `app/components/StoryForm.tsx`
