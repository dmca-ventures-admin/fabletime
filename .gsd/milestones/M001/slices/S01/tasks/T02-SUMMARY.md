---
id: T02
parent: S01
milestone: M001
provides:
  - "Story persistence to Supabase after stream delivery"
  - "X-Story-Id UUID response header on POST /api/generate"
  - "Full response text accumulation during streaming"
  - "Non-blocking insert with error logging"
key_files:
  - app/api/generate/route.ts
key_decisions:
  - "Check Supabase { error } return value in addition to try/catch, since supabase-js resolves (not throws) on DB errors"
patterns_established:
  - "Supabase insert error handling pattern: destructure { error } from await, log if truthy, plus outer try/catch for network-level failures"
  - "Story correlation: storyId from crypto.randomUUID() is included in both the X-Story-Id response header and any console.error log for failed inserts"
observability_surfaces:
  - "console.error('[S01] Failed to persist story:', storyId, dbError) — logs both Supabase-level and network-level insert failures with correlation ID"
  - "X-Story-Id response header — visible in browser DevTools Network tab"
duration: 5m
verification_result: passed
completed_at: 2026-03-22T10:58:51Z
blocker_discovered: false
---

# T02: Add story persistence and X-Story-Id header to generate API route

**Added UUID generation, X-Story-Id response header, full response accumulation, and non-blocking Supabase insert after stream close to the generate API route**

## What Happened

Modified `app/api/generate/route.ts` to implement story persistence (R001, R002). Added import of the Supabase singleton client from `@/lib/supabase`. Before creating the ReadableStream, the handler now generates a UUID via `crypto.randomUUID()`. Inside the stream's `start()` callback, a `fullResponse` buffer accumulates every text chunk alongside the existing `controller.enqueue()`. After `controller.close()` — meaning the client has already received the full story — a Supabase insert writes the complete story record (id, characters, theme, length, prompt, response) to the `stories` table. The insert uses a dual error-handling pattern: destructuring `{ error }` from the Supabase response (since supabase-js resolves rather than throws on DB errors), plus an outer try/catch for network-level failures. Both paths log via `console.error` with the `[S01]` prefix and the storyId for correlation. The response now includes `X-Story-Id` and `Access-Control-Expose-Headers` headers.

## Verification

All task-level must-haves confirmed:
- `crypto.randomUUID()` generates a unique ID per request
- `X-Story-Id` header is set on the streaming response
- `Access-Control-Expose-Headers: X-Story-Id` is set for cross-origin access
- `fullResponse` accumulates the complete streamed text
- Supabase insert happens after `controller.close()` (verified by reading code order)
- Insert includes all fields: id, characters, theme, length, prompt, response
- Insert failures are caught via both `{ error }` check and try/catch, logged with storyId
- Insert failures cannot affect the client response (stream is already closed)
- `npx tsc --noEmit` passes with zero errors

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 14.5s |
| 2 | `grep -q "X-Story-Id" app/api/generate/route.ts` | 0 | ✅ pass | <1s |
| 3 | `grep -q "randomUUID" app/api/generate/route.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -q "fullResponse" app/api/generate/route.ts` | 0 | ✅ pass | <1s |
| 5 | `grep -q "controller.close" app/api/generate/route.ts` | 0 | ✅ pass | <1s |
| 6 | `grep -q "console.error" app/api/generate/route.ts` | 0 | ✅ pass | <1s |
| 7 | `grep -q "createClient" lib/supabase.ts` | 0 | ✅ pass | <1s |
| 8 | `grep -q "created_at" supabase/schema.sql` | 0 | ✅ pass | <1s |
| 9 | `grep -q "custom_entries" supabase/schema.sql` | 0 | ✅ pass | <1s |
| 10 | `node -e "require('@supabase/supabase-js')"` | 0 | ✅ pass | <1s |
| 11 | `grep -q "storyId" app/components/StoryForm.tsx` | 1 | ⏳ expected fail (T03) | <1s |

## Diagnostics

- **Insert failure logging:** Search server logs for `[S01] Failed to persist story` followed by a UUID to find failed inserts. The error object from Supabase is included in the log.
- **Header verification:** In browser DevTools Network tab, check the response headers on the `/api/generate` POST for `X-Story-Id` with a UUID value.
- **Insert ordering:** The Supabase insert runs after `controller.close()` — the client receives the full story before any DB write attempt. This means insert failures are invisible to the user.
- **Dual error handling:** supabase-js resolves (doesn't throw) on database errors, returning `{ error }`. The code checks both the returned error object and wraps in try/catch for network-level exceptions.

## Deviations

- Added `{ error }` destructuring from the Supabase insert response in addition to the try/catch from the plan. The plan only specified try/catch, but supabase-js doesn't throw on DB errors — it returns `{ data, error }`. Without this check, insert failures (constraint violations, missing tables, etc.) would be silently ignored.

## Known Issues

None.

## Files Created/Modified

- `app/api/generate/route.ts` — added Supabase import, UUID generation, X-Story-Id header, response accumulation, and non-blocking Supabase insert with error logging
