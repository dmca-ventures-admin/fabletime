---
estimated_steps: 5
estimated_files: 1
skills_used:
  - react-best-practices
  - frontend-design
  - accessibility
  - make-interfaces-feel-better
---

# T03: Refactor StoryForm with dynamic suggestions, custom inputs, and max-3 enforcement

**Slice:** S03 — Custom Characters & Themes with Popularity
**Milestone:** M001

## Description

Replaces the hardcoded character and theme arrays in `StoryForm.tsx` with dynamic suggestions fetched from `GET /api/suggestions`, adds custom text inputs for user-submitted characters and themes, and enforces the max-3-character limit across all input methods. This is the user-facing completion of the slice.

## Steps

1. **Add suggestion fetching** — Add a `useEffect` that calls `fetch('/api/suggestions')` on component mount. Store results in state: `suggestions: { characters: string[], themes: string[] }`, `suggestionsLoading: boolean`, `suggestionsError: boolean`. On fetch failure, set `suggestionsError = true` and log to console — the UI falls back to showing only custom text inputs.

2. **Replace hardcoded character buttons with dynamic suggestions** — Remove the static `characters` array at module scope. Render `suggestions.characters` as buttons in the same grid layout. Since DB entries don't have emojis, display the first letter of each character name as an avatar (e.g., a small circle with the letter "F" for "Fox"). Keep the same visual style (rounded-2xl, border-4, selected/unselected states). Show a loading skeleton (3 placeholder buttons with pulse animation) while `suggestionsLoading` is true. If `suggestionsError` or suggestions are empty, show only the custom input with a helpful message.

3. **Replace hardcoded theme buttons with dynamic suggestions** — Remove the static `themes` array at module scope. Render `suggestions.themes` as buttons in the same grid layout. Without SVG icons, use simple text-only buttons with the same styling. Single-select behavior stays the same. Show a loading skeleton (2 placeholder buttons) while loading. Same error/empty fallback as characters.

4. **Add custom input fields** — Below the character suggestion buttons, add a text input with placeholder "Or type custom characters (comma-separated)..." and an `aria-label="Custom characters"`. Parse on comma to get individual entries. Below the theme suggestion buttons, add a text input with placeholder "Or type a custom theme..." and `aria-label="Custom theme"`. Store custom input values in state: `customCharacterInput: string`, `customThemeInput: string`. Validate each custom entry to max 3 words on input — if exceeded, show inline error text in red below the input. Trim whitespace from each parsed entry.

5. **Enforce max-3-character limit and wire form submission** — Compute `totalCharacters` = selected suggestion buttons count + parsed custom character entries count. When `totalCharacters >= 3`, disable further character suggestion button selection and show a hint "(max 3 reached)". The custom input should also visually indicate when adding more would exceed the limit. On form submit: merge selected suggestion characters + parsed custom characters into the `characters` array. Use the custom theme if the text input is non-empty, otherwise use the selected suggestion theme. Pass the merged data to `handleSubmit`'s fetch body. Ensure at least 1 character is selected or typed (show error if zero).

## Must-Haves

- [ ] StoryForm fetches from `GET /api/suggestions` on mount
- [ ] Character suggestion buttons render dynamically from API data with first-letter avatars
- [ ] Theme suggestion buttons render dynamically from API data as text-only buttons
- [ ] Loading skeleton shown while suggestions are being fetched
- [ ] Graceful fallback when suggestions fetch fails (shows custom input only)
- [ ] Custom character text input exists, supports comma-separated entries, and trims whitespace
- [ ] Custom theme text input exists
- [ ] Max 3 words per custom entry validated on input with inline error
- [ ] Max 3 total characters enforced across suggestion buttons + custom input
- [ ] Form submits with merged characters (suggestions + custom) and final theme (custom or selected)
- [ ] At least 1 character required for submission (suggestion or custom)
- [ ] TypeScript compiles without errors

## Verification

- `npx tsc --noEmit` passes
- `grep -q "api/suggestions" app/components/StoryForm.tsx` succeeds
- `grep -q "customCharacter" app/components/StoryForm.tsx` succeeds
- `grep -q "customTheme" app/components/StoryForm.tsx` succeeds
- `grep -q "max" app/components/StoryForm.tsx` succeeds (max-3 enforcement)

## Observability Impact

- **New signal**: `[S03] Failed to fetch suggestions:` console error when the `/api/suggestions` fetch fails — the UI falls back to showing only custom text inputs.
- **Inspection**: The component's visual state (loading skeletons → suggestion buttons or fallback message → custom inputs) is directly observable in the browser. No new API endpoints are added.
- **Failure visibility**: Suggestions fetch errors are logged with `[S03]` prefix and the UI degrades gracefully (shows custom inputs only). Validation errors (max 3 chars, max 3 words) are shown inline in the form and prevent submission. Submit errors are shown as inline alerts.
- **How a future agent inspects this task**: Open the app in the browser, verify dynamic buttons render from API data, verify custom inputs accept comma-separated characters, verify max-3 enforcement disables further selection, verify form submits with merged characters + theme.

## Inputs

- `app/components/StoryForm.tsx` — existing form component with hardcoded arrays (to be refactored)
- `app/api/suggestions/route.ts` — suggestions endpoint from T02 (API contract: `{ characters: string[], themes: string[] }`)

## Expected Output

- `app/components/StoryForm.tsx` — refactored with dynamic suggestions, custom inputs, validation, and max-3 enforcement
