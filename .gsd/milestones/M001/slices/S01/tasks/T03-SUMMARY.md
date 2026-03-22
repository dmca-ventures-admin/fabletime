---
id: T03
parent: S01
milestone: M001
provides:
  - "storyId state in StoryForm component for downstream use by S02 rating UI"
  - "X-Story-Id header consumed client-side before stream body"
  - "StoryDisplay accepts storyId prop (interface ready for S02)"
key_files:
  - app/components/StoryForm.tsx
  - app/components/StoryDisplay.tsx
key_decisions: []
patterns_established:
  - "Read response headers before calling response.body.getReader() — headers are available immediately on the Response object"
  - "Reset storyId to null at the start of each generation alongside story and error resets"
observability_surfaces:
  - "storyId state visible in React DevTools (StoryForm → Hooks → storyId) after successful generation"
  - "If X-Story-Id header is missing, storyId will be null — downstream components should handle gracefully"
duration: 3m
verification_result: passed
completed_at: 2026-03-22T10:59:00Z
blocker_discovered: false
---

# T03: Wire StoryForm to capture story_id from response header

**Added storyId state to StoryForm, read X-Story-Id header from generate API response before stream consumption, and passed storyId prop to StoryDisplay**

## What Happened

Added `const [storyId, setStoryId] = useState<string | null>(null)` to StoryForm alongside existing state declarations. In `handleSubmit`, added `setStoryId(null)` at the top with the existing resets (`setStory('')`, `setError('')`). After the `fetch()` response guards (`!response.ok`, `!response.body`) but before `response.body.getReader()`, the handler now reads `const id = response.headers.get('X-Story-Id')` and calls `setStoryId(id)`. The header is available immediately since it's sent before the stream body. Updated the `<StoryDisplay>` JSX to pass `storyId={storyId}`. In `StoryDisplay.tsx`, added `storyId: string | null` to the `StoryDisplayProps` interface and destructured it in the function signature. No UI for storyId was added — that's S02's responsibility.

## Verification

All task-level and slice-level must-haves confirmed:
- `storyId` state declared as `string | null`, initialized to `null`
- `storyId` reset to `null` at the start of each new generation
- `X-Story-Id` header read from response before consuming stream body
- `storyId` passed to `StoryDisplay` as a prop
- `StoryDisplay` interface updated to accept `storyId: string | null`
- `npx tsc --noEmit` passes with zero errors
- All 8 slice-level verification checks pass (final task — full gate)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 2.9s |
| 2 | `grep -q "storyId" app/components/StoryForm.tsx` | 0 | ✅ pass | <1s |
| 3 | `grep -q "X-Story-Id" app/components/StoryForm.tsx` | 0 | ✅ pass | <1s |
| 4 | `grep -q "storyId" app/components/StoryDisplay.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "createClient" lib/supabase.ts` | 0 | ✅ pass | <1s |
| 6 | `grep -q "X-Story-Id" app/api/generate/route.ts` | 0 | ✅ pass | <1s |
| 7 | `grep -q "created_at" supabase/schema.sql` | 0 | ✅ pass | <1s |
| 8 | `grep -q "custom_entries" supabase/schema.sql` | 0 | ✅ pass | <1s |
| 9 | `node -e "require('@supabase/supabase-js')"` | 0 | ✅ pass | <1s |
| 10 | `grep -q "console.error" app/api/generate/route.ts` | 0 | ✅ pass | <1s |

## Diagnostics

- **Client-side storyId inspection:** Open React DevTools in browser, navigate to StoryForm component, inspect Hooks tab — `storyId` should show a UUID string after a successful story generation, or `null` before/during generation.
- **End-to-end header flow:** The `X-Story-Id` UUID is generated in `route.ts` (T02), set as a response header, and consumed in `StoryForm.tsx` (T03). Browser DevTools Network tab confirms the header is sent; React DevTools confirms it's captured in state.
- **Null storyId:** If `storyId` remains `null` after generation, check that the server is setting the `X-Story-Id` header and that `Access-Control-Expose-Headers` includes it (both set in T02).

## Deviations

None — implementation matched the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `app/components/StoryForm.tsx` — added storyId state, reset logic, X-Story-Id header reading, and storyId prop pass-through to StoryDisplay
- `app/components/StoryDisplay.tsx` — added storyId to StoryDisplayProps interface and function signature
