---
id: T02
parent: S02
milestone: M001
provides:
  - Star rating UI with 1-5 star radio group, optional feedback textarea, and thank-you state in StoryDisplay
  - hasRated state management in StoryForm with reset on new story generation
key_files:
  - app/components/StoryDisplay.tsx
  - app/components/StoryForm.tsx
key_decisions:
  - Used native radio inputs with sr-only class for star selection — provides built-in keyboard arrow key navigation without custom JS
  - Used peer-focus-visible for focus ring on star labels — shows focus only on keyboard navigation, not mouse clicks
  - Local rating state (selectedRating, hoveredRating, feedbackText) lives in StoryDisplay, while hasRated lifecycle state lives in parent StoryForm
patterns_established:
  - Star rating pattern — fieldset with role=radiogroup, sr-only radio inputs, label-wrapped SVGs with hover preview and filled/unfilled color states using CSS variables
  - Inline error messages for API failures using role=alert
observability_surfaces:
  - "Rating submission errors show inline in the UI and in browser console"
  - "POST /api/rate network requests visible in browser DevTools Network tab"
  - "hasRated state transition observable via visible switch from rating form to thank-you message"
duration: 20m
verification_result: passed
completed_at: 2026-03-22
blocker_discovered: false
---

# T02: Build star rating UI in StoryDisplay and wire hasRated state

**Add accessible 5-star rating UI with optional feedback textarea, submission to POST /api/rate, thank-you state, and hasRated reset on new story generation**

## What Happened

Built the complete rating feature UI in `StoryDisplay.tsx`:

1. **Star rating radio group:** A `<fieldset>` with `role="radiogroup"` containing 5 native radio inputs (visually hidden with `sr-only`), wrapped in labels with star SVG icons. Stars fill with the CTA orange color (`text-cta`) up to the selected/hovered rating. Hover preview highlights stars up to the hovered position. Keyboard navigation works via native radio group behavior (arrow keys). Each star label has an `aria-label` (e.g., "4 stars"). Focus ring uses `peer-focus-visible` so it only shows on keyboard navigation.

2. **Optional feedback textarea:** Labeled textarea with placeholder "What did you think? (optional)", styled with the claymorphism design system variables.

3. **Submission flow:** Submit button POSTs to `/api/rate` with `{ story_id, stars, feedback }`. Button is disabled when no stars are selected or during submission (shows spinner). On 201 success, calls `onRated()`. On error, shows inline error message with `role="alert"`.

4. **Thank-you state:** When `hasRated` is true, the rating form is replaced with a green success card: "Thanks for your feedback! ⭐".

5. **State management in StoryForm:** Added `hasRated` state initialized to `false`. Resets to `false` in `handleSubmit` before generating a new story. Passes `hasRated` and `onRated={() => setHasRated(true)}` to `StoryDisplay`.

All styling uses existing CSS variables — claymorphism shadows, surface/border colors, CTA orange for filled stars. Works in both light and dark mode.

## Verification

All task-level and slice-level verification checks pass:

- `npx tsc --noEmit` — zero errors
- `grep -q "hasRated" app/components/StoryForm.tsx` — passes
- `grep -q "radiogroup\|radio" app/components/StoryDisplay.tsx` — passes
- `grep -q "onRated" app/components/StoryDisplay.tsx` — passes
- `test -f app/api/rate/route.ts` — passes (from T01)
- curl with invalid FK returns 500 with `{ error: "Failed to save rating" }` — no crash
- curl with validation error returns 400 with structured JSON error
- Browser UAT: generate story → rating appears → select 4 stars (orange fill) → type feedback → submit → thank-you card shown → generate again → rating form resets fresh
- Dark mode: rating card renders correctly with dark theme variables

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4.0s |
| 2 | `grep -q "hasRated" app/components/StoryForm.tsx` | 0 | ✅ pass | <1s |
| 3 | `grep -q "radiogroup\|radio" app/components/StoryDisplay.tsx` | 0 | ✅ pass | <1s |
| 4 | `grep -q "onRated" app/components/StoryDisplay.tsx` | 0 | ✅ pass | <1s |
| 5 | `test -f app/api/rate/route.ts` | 0 | ✅ pass | <1s |
| 6 | `curl POST /api/rate (invalid FK)` | 0 | ✅ pass (500 JSON) | <1s |
| 7 | `curl POST /api/rate (validation error)` | 0 | ✅ pass (400 JSON) | <1s |
| 8 | Browser UAT: full rating flow | — | ✅ pass | manual |
| 9 | Browser UAT: dark mode | — | ✅ pass | manual |

## Diagnostics

- **Browser DevTools Network tab:** Check `POST /api/rate` requests for status codes and payloads
- **Inline error messages:** Submission failures show error text below the submit button with `role="alert"`
- **Visual state transitions:** Rating form → thank-you card transition is immediately visible. New story generation resets the form.
- **Accessibility audit:** `role="radiogroup"` with `aria-label="Story rating"`, individual `aria-label` per star, `sr-only` radio inputs, `peer-focus-visible` focus ring, submit button `disabled` during API call

## Deviations

- Added a "How many stars?" legend inside the fieldset for additional clarity — not in the plan but improves accessibility (every fieldset should have a legend).
- Used `peer-focus-visible` pattern (sibling span with absolute positioning) for focus ring rather than styling the label directly — more precise control over ring offset against the card background.
- Used a `StarIcon` sub-component extracted within the file for the star SVG — cleaner than inlining the SVG 5 times in the map.

## Known Issues

None.

## Files Created/Modified

- `app/components/StoryDisplay.tsx` — Added star rating UI (radio group, hover preview, feedback textarea, submission, thank-you state)
- `app/components/StoryForm.tsx` — Added `hasRated` state, reset in `handleSubmit`, passes `hasRated` and `onRated` props to StoryDisplay
- `.gsd/milestones/M001/slices/S02/tasks/T02-PLAN.md` — Added Observability Impact section (pre-flight fix)
