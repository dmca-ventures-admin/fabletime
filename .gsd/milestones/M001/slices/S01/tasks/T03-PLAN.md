---
estimated_steps: 3
estimated_files: 2
skills_used:
  - react-best-practices
  - lint
---

# T03: Wire StoryForm to capture story_id from response header

**Slice:** S01 — Supabase Setup & Story Persistence
**Milestone:** M001

## Description

Modify `StoryForm.tsx` to read the `X-Story-Id` header from the generate API response and store it in component state. This makes `storyId` available for S02's rating UI. Also update `StoryDisplay.tsx` to accept `storyId` as a prop (interface change only — S02 will add the rating UI that uses it).

## Steps

1. In `app/components/StoryForm.tsx`, add a new state variable: `const [storyId, setStoryId] = useState<string | null>(null);`. Place it alongside the existing state declarations.
2. In the `handleSubmit` function, add `setStoryId(null);` at the top alongside the existing `setStory('')` and `setError('')` resets. After the `fetch()` call and after the `if (!response.ok)` / `if (!response.body)` checks, but BEFORE the `reader = response.body.getReader()` line, read the header: `const id = response.headers.get('X-Story-Id'); setStoryId(id);`. The header is available immediately — it's sent before the stream body.
3. Update the `<StoryDisplay>` JSX to pass the storyId prop: `<StoryDisplay story={story} isLoading={isLoading} storyId={storyId} />`. Then update `app/components/StoryDisplay.tsx` to accept the new prop:
   - Add `storyId: string | null;` to the `StoryDisplayProps` interface
   - Add `storyId` to the destructured props in the function signature
   - Do NOT add any UI for storyId yet — that's S02's job. The prop just needs to be accepted.

## Must-Haves

- [ ] `storyId` state is declared as `string | null`, initialized to `null`
- [ ] `storyId` is reset to `null` at the start of each new generation
- [ ] `X-Story-Id` header is read from the response BEFORE consuming the stream body
- [ ] `storyId` is passed to `StoryDisplay` as a prop
- [ ] `StoryDisplay` interface updated to accept `storyId: string | null`
- [ ] `npx tsc --noEmit` passes with both modified files

## Verification

- `npx tsc --noEmit` passes without errors
- `grep -q "storyId" app/components/StoryForm.tsx` — state variable exists
- `grep -q "X-Story-Id" app/components/StoryForm.tsx` — header is read from response
- `grep -q "storyId" app/components/StoryDisplay.tsx` — prop is accepted

## Inputs

- `app/components/StoryForm.tsx` — existing client component with handleSubmit
- `app/components/StoryDisplay.tsx` — existing display component to add storyId prop to
- `app/api/generate/route.ts` — modified by T02 to set X-Story-Id header (context only, not modified here)

## Expected Output

- `app/components/StoryForm.tsx` — modified with storyId state and header reading
- `app/components/StoryDisplay.tsx` — modified interface to accept storyId prop

## Observability Impact

- **New client state:** `storyId` in StoryForm is available for downstream components (S02 rating UI). It can be inspected via React DevTools in the browser.
- **Header consumption:** The `X-Story-Id` header set by T02 is now consumed client-side. Verify end-to-end by checking that `storyId` state is non-null after a successful generation (React DevTools → StoryForm → Hooks → storyId).
- **Failure visibility:** If the header is missing (server error before header is set), `storyId` will be `null` — downstream components should handle this gracefully. No console.error is added client-side since a missing header is not an error condition the user can act on.
