# S02: Per-Story Rating & Feedback — Research

**Date:** 2026-03-22
**Depth:** Light — standard CRUD with known patterns already in the codebase

## Summary

This slice adds a 5-star rating UI with optional text feedback below each generated story, a `POST /api/rate` server route, and persists ratings to the existing Supabase `ratings` table. All prerequisites from S01 are in place: `lib/supabase.ts` exports a singleton client, `supabase/schema.sql` already defines the `ratings` table with FK to `stories(id)`, and the client already captures `storyId` from the `X-Story-Id` response header in `StoryForm.tsx`.

The work is straightforward: one new API route, one new client component (or inline in `StoryDisplay.tsx`), and minor state wiring in `StoryForm`. No new libraries needed — Tailwind + existing CSS custom properties cover the star rating UI.

## Recommendation

Build in two tasks: (1) the API route `POST /api/rate` first — it's independently testable with `curl`, (2) then the rating UI component wired into `StoryDisplay.tsx`. Keep the rating component as a sibling rendered by `StoryDisplay` (or inside it) rather than a separate page route, since the rating appears inline below the story.

Use client-side session state (a `hasRated` boolean) to enforce the single-submission constraint (R005). No need for server-side uniqueness enforcement since there are no user accounts (D003) — the table has no unique constraint on `(story_id)` by design, and the requirement says "once per session."

## Implementation Landscape

### Key Files

- **`lib/supabase.ts`** — Existing singleton Supabase client. Used as-is by the new API route.
- **`supabase/schema.sql`** — Already defines `ratings` table: `id (UUID PK)`, `story_id (UUID FK → stories)`, `stars (INT 1-5 CHECK)`, `feedback (TEXT nullable)`, `created_at (TIMESTAMPTZ)`. No schema changes needed.
- **`app/api/generate/route.ts`** — Returns `X-Story-Id` header. Already consumed by `StoryForm`. No changes needed.
- **`app/components/StoryForm.tsx`** — Already has `storyId` state (`string | null`), already passes it to `StoryDisplay`. Needs: a `hasRated` state boolean, a `setHasRated` callback passed to `StoryDisplay`, and reset of `hasRated` to `false` when a new story is generated (in `handleSubmit`).
- **`app/components/StoryDisplay.tsx`** — Currently renders story text and loading indicator. Needs: rating UI added below story content, visible only when `!isLoading && storyId && !hasRated`. After submission, show thank-you message.
- **`app/api/rate/route.ts`** *(new)* — `POST` handler: parse `{ story_id, stars, feedback }`, validate (stars 1-5, story_id is UUID), insert to `ratings` table, return `201` or error.
- **`app/globals.css`** — May need a `--clay-rating` shadow variable and star color variables for theme-awareness. The existing `--color-cta` (orange) works well for filled stars.

### Build Order

1. **T01: `POST /api/rate` route** — Create `app/api/rate/route.ts`. Validate inputs (stars 1-5 integer, story_id present as string, feedback optional string). Insert to Supabase `ratings` table using the `{ data, error }` pattern from KNOWLEDGE.md. Return 201 on success, 400 on validation failure, 500 on DB error. Testable immediately with `curl`.

2. **T02: Rating UI in StoryDisplay** — Add star rating (5 clickable stars) + optional textarea + submit button below the story card. Wire `hasRated` / `onRated` props through from `StoryForm`. On submit, `POST /api/rate` with `storyId`, selected stars, and feedback text. On success, swap form for thank-you message. Reset `hasRated` when a new story is generated. Stars should use the existing `--color-cta` (orange) for filled state, `--color-secondary` for unfilled, matching the claymorphism design system.

### Verification Approach

1. **API contract:** `curl -X POST http://localhost:3000/api/rate -H 'Content-Type: application/json' -d '{"story_id":"<valid-uuid>","stars":4,"feedback":"Great story!"}'` → 201 response. Check Supabase dashboard for row in `ratings` table with correct FK.
2. **Validation:** POST with `stars: 0`, `stars: 6`, missing `story_id` → 400 responses.
3. **UI flow:** Generate a story → star rating appears below → select stars → optionally type feedback → submit → form replaced with thank-you → generate another story → rating form reappears fresh.
4. **Single submission (R005):** After rating, the form is gone. No re-submission possible without generating a new story.
5. **Theme check:** Toggle dark mode — stars and feedback form should use theme-aware colors.
6. **TypeScript:** `npx tsc --noEmit` passes.

## Constraints

- `storyId` is set from the `X-Story-Id` header after the fetch response arrives, but *before* streaming completes. The rating UI should only appear after streaming finishes (`!isLoading && story && storyId`).
- The `ratings` table has a CHECK constraint `stars >= 1 AND stars <= 5` — server validation must enforce this before insert to give a clean 400 rather than a raw Postgres error.
- Supabase client errors don't throw (KNOWLEDGE.md) — must destructure `{ error }` from insert result AND wrap in try/catch.
- No unique constraint on `(story_id)` in the `ratings` table — multiple ratings for the same story are technically possible at the DB level. R005's "once per session" constraint is enforced purely client-side via `hasRated` state.

## Common Pitfalls

- **Forgetting to reset `hasRated` on new generation** — If `StoryForm.handleSubmit` doesn't reset `hasRated` to `false`, the thank-you message persists across stories. Already noted in build order.
- **Star accessibility** — Clickable stars need proper `role="radio"` or `role="radiogroup"` semantics, `aria-label` per star, and keyboard navigation (arrow keys). A `<fieldset>` with radio buttons styled as stars is more accessible than div-with-onClick.
