---
id: T03
parent: S03
milestone: M001
provides:
  - Dynamic character/theme suggestion buttons fetched from GET /api/suggestions
  - Custom character text input with comma-separated parsing and whitespace trimming
  - Custom theme text input with suggestion override behavior
  - Max-3-character enforcement across suggestion buttons + custom input
  - Max-3-words-per-entry validation with inline error feedback
  - Loading skeletons during suggestion fetch
  - Graceful fallback when suggestions endpoint fails or returns empty
  - Merged submission of suggestion selections + custom entries
key_files:
  - app/components/StoryForm.tsx
key_decisions:
  - Custom theme input clears selected suggestion theme to avoid ambiguity — custom always overrides suggestion
  - First-letter avatar circles replace emoji for dynamic characters since DB entries have no emoji data
  - transition-colors and transition-shadow used instead of transition-all per make-interfaces-feel-better guidelines
patterns_established:
  - "[S03] Failed to fetch suggestions:" console error prefix for client-side suggestion fetch failures
  - useEffect cleanup with cancelled flag pattern for fetch-on-mount to prevent state updates on unmounted components
observability_surfaces:
  - "[S03] Failed to fetch suggestions:" console error on suggestion fetch failure — UI falls back to custom inputs only
  - Inline validation errors visible in DOM for max-3-characters and max-3-words violations
  - Submit button disabled during loading; submit errors shown inline above CTA
duration: 12m
verification_result: passed
completed_at: 2026-03-22
blocker_discovered: false
---

# T03: Refactor StoryForm with dynamic suggestions, custom inputs, and max-3 enforcement

**Replaced hardcoded character/theme arrays with dynamic API-driven suggestions, added custom text inputs with comma-separated parsing, and enforced max-3-character limit across all input methods**

## What Happened

Rewrote `app/components/StoryForm.tsx` to complete the user-facing S03 feature:

1. **Dynamic suggestions fetch**: Added `useEffect` on mount calling `GET /api/suggestions`. State tracks `suggestions`, `suggestionsLoading`, and `suggestionsError`. On failure, logs with `[S03]` prefix and falls back to showing only custom text inputs. Uses a cancelled-flag cleanup to prevent state updates on unmounted components.

2. **Character suggestion buttons**: Removed the hardcoded 6-character array with emojis. Characters now render dynamically from API data as buttons with first-letter avatar circles (e.g., a circle with "F" for "Fox"). Selected state toggles the avatar from `bg-secondary/15` to `bg-secondary text-white`. Loading skeleton shows 3 pulse-animated placeholder buttons with circle+text shapes.

3. **Theme suggestion buttons**: Removed the hardcoded 4-theme array with SVG icons. Themes render as simple text-only buttons from API data. Single-select behavior preserved — selecting a suggestion clears any custom theme input. Loading skeleton shows 2 pulse-animated placeholders.

4. **Custom character input**: Text input below character buttons with `aria-label="Custom characters"` and comma-separated parsing. Each entry is trimmed. Max 3 words per entry validated on change with inline red error text. Input border turns red on validation failure.

5. **Custom theme input**: Text input below theme buttons with `aria-label="Custom theme"`. Max 3 words validated on change. Typing a custom theme overrides the selected suggestion theme; selecting a suggestion clears the custom input.

6. **Max-3-character enforcement**: `totalCharacters` computed as `selectedCharacters.size + parsedCustomCharacters.length`. When ≥3, further suggestion button selection is disabled (buttons get `disabled:opacity-50`). An amber "(max 3 reached)" indicator appears next to the legend. If custom input would push total past 3, an amber warning appears below the input.

7. **Form submission wiring**: On submit, merges selected suggestion characters + parsed custom characters into `finalCharacters`. Uses `customThemeInput.trim()` if non-empty, else `selectedTheme`. Validates at least 1 character, at most 3, no entries exceeding 3 words, and theme required. Submission errors shown inline above the CTA button.

## Verification

All task-level and slice-level checks pass. This is the final task of S03, so all 7 slice-level checks were verified:
- `npx tsc --noEmit` — 0 errors
- `test -f supabase/seed.sql && grep -c "INSERT" supabase/seed.sql` — 10 INSERT statements
- `grep -q "child_friendly" supabase/schema.sql` — present
- `grep -q "upsert_entry" supabase/schema.sql` — present
- `grep -q "custom" app/components/StoryForm.tsx` — present
- `grep -q "api/suggestions" app/components/StoryForm.tsx` — present
- Task-level: `grep -q "customCharacter"`, `grep -q "customTheme"`, `grep -q "max"` — all present

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | ~9s |
| 2 | `grep -q "api/suggestions" app/components/StoryForm.tsx` | 0 | ✅ pass | <1s |
| 3 | `grep -q "customCharacter" app/components/StoryForm.tsx` | 0 | ✅ pass | <1s |
| 4 | `grep -q "customTheme" app/components/StoryForm.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "max" app/components/StoryForm.tsx` | 0 | ✅ pass | <1s |
| 6 | `test -f supabase/seed.sql && grep -c "INSERT" supabase/seed.sql` → 10 | 0 | ✅ pass | <1s |
| 7 | `grep -q "child_friendly" supabase/schema.sql` | 0 | ✅ pass | <1s |
| 8 | `grep -q "upsert_entry" supabase/schema.sql` | 0 | ✅ pass | <1s |
| 9 | `grep -q "custom" app/components/StoryForm.tsx` | 0 | ✅ pass | <1s |

## Diagnostics

- **Suggestions fetch failure**: `grep "[S03]"` in browser console shows `[S03] Failed to fetch suggestions:` with the HTTP error. UI falls back to custom inputs only.
- **Validation state**: Inline error messages visible in the DOM when max-3-characters or max-3-words-per-entry is violated. Check for elements with `role="alert"` and red text classes.
- **Merged submission**: The `POST /api/generate` body now contains `characters` (merged from suggestion selections + custom entries) and `theme` (custom input or selected suggestion). Server-side validation in the generate route (from T02) re-validates the same constraints.
- **Visual inspection**: Load the app → see loading skeletons → suggestion buttons appear with first-letter avatars → custom inputs below each section → max-3 indicator and disabled buttons when limit reached.

## Deviations

- Used `transition-colors transition-shadow` instead of `transition-all` on buttons — follows the make-interfaces-feel-better skill guideline to specify exact properties rather than `all`.
- Initial `selectedCharacters` state is an empty Set (was `new Set(['Fox'])` before). With dynamic suggestions, pre-selecting a hardcoded value that might not exist in the API response would be incorrect. Users must actively choose.
- Added `submitError` state for form-level validation errors displayed inline above the submit button, not mentioned in the task plan but necessary for the "at least 1 character required" and "theme required" validation to be user-visible.

## Known Issues

None.

## Files Created/Modified

- `app/components/StoryForm.tsx` — Full refactor: removed hardcoded character/theme arrays, added useEffect suggestion fetching, dynamic suggestion buttons with first-letter avatars, custom text inputs with validation, max-3-character enforcement, and merged form submission
- `.gsd/milestones/M001/slices/S03/tasks/T03-PLAN.md` — Added Observability Impact section per pre-flight requirement
