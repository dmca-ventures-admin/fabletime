---
estimated_steps: 5
estimated_files: 1
skills_used:
  - react-best-practices
  - best-practices
  - review
---

# T02: Add story persistence and X-Story-Id header to generate API route

**Slice:** S01 — Supabase Setup & Story Persistence
**Milestone:** M001

## Description

Modify `app/api/generate/route.ts` to: (1) generate a UUID for each story, (2) set it as an `X-Story-Id` response header, (3) accumulate the full streamed response text, and (4) insert a complete story record into Supabase after the stream closes. The insert must be non-blocking — it runs after `controller.close()`, so the client already has the full story before the DB write happens. Insert failures are caught and logged, never surfaced to the client.

## Steps

1. Add import for the Supabase client at the top of the file: `import { supabase } from '@/lib/supabase';` (adjust the import name to match what T01 exported — likely a default export of the client instance or a named `supabase` export).
2. Inside the `POST` handler, after input validation and before creating the ReadableStream, generate a story ID: `const storyId = crypto.randomUUID();`. Also capture the `prompt` string in a variable (it's already constructed as `prompt` — just ensure it's accessible in the stream callback scope).
3. Inside the `ReadableStream`'s `async start(controller)` callback, declare `let fullResponse = '';` before the stream loop. In the existing `for await` loop, after `controller.enqueue(...)`, append the text chunk to `fullResponse`: `fullResponse += chunk.delta.text;`.
4. After `controller.close()` (still inside the `start()` callback's try block), add the Supabase insert wrapped in its own try/catch:
   ```typescript
   try {
     await supabase.from('stories').insert({
       id: storyId,
       characters,
       theme,
       length,
       prompt,
       response: fullResponse,
     });
   } catch (dbError) {
     console.error('[S01] Failed to persist story:', storyId, dbError);
   }
   ```
   This runs after the stream is fully delivered — the response is already sent to the client.
5. Update the `return new Response(stream, { headers: ... })` to include `X-Story-Id` and `Access-Control-Expose-Headers` headers:
   ```typescript
   return new Response(stream, {
     headers: {
       'Content-Type': 'text/plain; charset=utf-8',
       'Transfer-Encoding': 'chunked',
       'X-Story-Id': storyId,
       'Access-Control-Expose-Headers': 'X-Story-Id',
     },
   });
   ```

## Must-Haves

- [ ] `crypto.randomUUID()` generates a unique ID per request
- [ ] `X-Story-Id` header is set on the streaming response with the UUID value
- [ ] `Access-Control-Expose-Headers: X-Story-Id` is set (future-proofing for cross-origin)
- [ ] Full response text is accumulated during streaming (not empty in DB)
- [ ] Supabase insert happens AFTER `controller.close()` — never before
- [ ] Insert includes all fields: id, characters (array), theme, length, prompt, response
- [ ] Insert failures are caught with try/catch and logged via `console.error` with the storyId
- [ ] Insert failures do NOT affect the client response (story still streams successfully)
- [ ] `npx tsc --noEmit` passes

## Verification

- `npx tsc --noEmit` passes without errors
- `grep -q "X-Story-Id" app/api/generate/route.ts` — header is set
- `grep -q "randomUUID" app/api/generate/route.ts` — UUID generation exists
- `grep -q "fullResponse" app/api/generate/route.ts` — response accumulation exists
- `grep -q "controller.close" app/api/generate/route.ts` — stream close exists (insert must follow it)
- `grep -q "console.error" app/api/generate/route.ts` — error logging exists for insert failures

## Observability Impact

- Signals added: `console.error('[S01] Failed to persist story:', storyId, dbError)` — logs insert failures with correlation ID
- How a future agent inspects this: search server logs for `[S01] Failed to persist story` to find failed inserts; check Supabase dashboard `stories` table for row presence
- Failure state exposed: storyId in error log enables correlation between failed insert and client request

## Inputs

- `app/api/generate/route.ts` — existing streaming API route to modify
- `lib/supabase.ts` — Supabase client created by T01

## Expected Output

- `app/api/generate/route.ts` — modified with UUID generation, X-Story-Id header, response accumulation, and non-blocking Supabase insert
