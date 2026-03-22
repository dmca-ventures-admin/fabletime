---
estimated_steps: 5
estimated_files: 2
skills_used:
  - accessibility
  - frontend-design
  - make-interfaces-feel-better
  - react-best-practices
---

# T02: Build star rating UI in StoryDisplay and wire hasRated state

**Slice:** S02 — Per-Story Rating & Feedback
**Milestone:** M001

## Description

Add the user-facing rating feature: a 5-star rating input with optional text feedback that appears below the story after generation completes, submits to `POST /api/rate`, and is replaced by a thank-you message after submission (R003, R005). Wire `hasRated` state in `StoryForm` so the rating resets when a new story is generated.

The rating must be accessible (radio group semantics, keyboard navigation, screen reader labels) and styled to match the existing claymorphism design system in both light and dark modes.

**Current state of `StoryDisplay.tsx`:** Receives `{ story, isLoading, storyId }` props. Renders story text with a book icon header and loading indicator. No rating UI exists yet.

**Current state of `StoryForm.tsx`:** Has `storyId` state (set from `X-Story-Id` header). Passes `story`, `isLoading`, `storyId` to `StoryDisplay`. No `hasRated` state exists yet.

## Steps

1. **Add `hasRated` state to `StoryForm.tsx`:** Add `const [hasRated, setHasRated] = useState(false);`. In `handleSubmit`, add `setHasRated(false);` alongside the existing `setStoryId(null)` reset at the top of the function. Update the `<StoryDisplay>` render to pass `hasRated={hasRated}` and `onRated={() => setHasRated(true)}` as new props.

2. **Update `StoryDisplay` props and interface:** Add `hasRated: boolean` and `onRated: () => void` to the `StoryDisplayProps` interface. Destructure them in the component.

3. **Build the rating UI section in `StoryDisplay.tsx`:** Below the story card `<div>`, add a new card (same claymorphism styling) that renders only when `!isLoading && story && storyId && !hasRated`. Inside:
   - A heading: "Rate This Story" with a star emoji.
   - A `<fieldset>` with `role="radiogroup"` and `aria-label="Story rating"` containing 5 radio inputs. Each radio: `<input type="radio" name="rating" value={n} className="sr-only" id={`star-${n}`} />` with a `<label htmlFor={`star-${n}`} aria-label={`${n} star${n > 1 ? 's' : ''}`}>` that renders a star SVG. Filled stars (index ≤ selected) use the CTA orange color (`text-cta` or `text-[var(--color-cta)]`), unfilled use a muted color. Support hover preview (highlight stars up to the hovered one).
   - An optional `<textarea>` for feedback text with placeholder "What did you think? (optional)" styled with existing surface/border variables.
   - A submit button styled like a secondary claymorphism button.

4. **Handle submission:** On submit button click, POST to `/api/rate` with `{ story_id: storyId, stars: selectedRating, feedback: feedbackText || null }`. On success (201), call `onRated()`. On error, show a brief inline error message. Disable the button during submission to prevent double-clicks.

5. **Thank-you state:** When `hasRated` is true and `storyId` is set, render a simple thank-you message card instead of the rating form: "Thanks for your feedback! ⭐" in a styled card matching the existing design.

## Must-Haves

- [ ] `StoryForm` has `hasRated` state that resets to `false` on new story generation
- [ ] `StoryDisplay` receives and uses `hasRated` and `onRated` props
- [ ] Star rating uses radio group with `role="radiogroup"`, individual radio inputs, and `aria-label` per star
- [ ] Stars support keyboard navigation (arrow keys to change selection within the radio group)
- [ ] Rating form is visible only when `!isLoading && story && storyId && !hasRated`
- [ ] Successful submission calls `onRated()` which shows thank-you message
- [ ] Submit button is disabled during API call to prevent duplicate submissions
- [ ] Styling uses existing CSS variables (claymorphism shadows, surface colors, CTA orange for filled stars)
- [ ] Works in both light and dark mode themes

## Verification

- `npx tsc --noEmit` passes with no errors
- `grep -q "hasRated" app/components/StoryForm.tsx` — state exists in parent
- `grep -q "radiogroup\|radio" app/components/StoryDisplay.tsx` — accessible star markup present
- `grep -q "onRated" app/components/StoryDisplay.tsx` — callback wired

## Inputs

- `app/components/StoryDisplay.tsx` — Current component to add rating UI to
- `app/components/StoryForm.tsx` — Parent component to add `hasRated` state to
- `app/api/rate/route.ts` — API endpoint created in T01, called by the rating form
- `app/globals.css` — Reference for CSS variable names and design tokens

## Expected Output

- `app/components/StoryDisplay.tsx` — Updated with rating UI (stars, textarea, submit, thank-you state)
- `app/components/StoryForm.tsx` — Updated with `hasRated` state, reset logic, and new props passed to StoryDisplay
