# Knowledge Base

## supabase-js does not throw on DB errors

**Context:** `@supabase/supabase-js` `.insert()`, `.select()`, `.update()`, `.delete()` return `{ data, error }` — they resolve the Promise even on database errors (constraint violations, missing tables, permission denied, etc.). A bare `try/catch` only catches network-level failures.

**Pattern:** Always destructure `{ error }` from the result AND wrap in try/catch:
```typescript
try {
  const { error } = await supabase.from('table').insert({ ... });
  if (error) {
    console.error('DB error:', error);
  }
} catch (networkError) {
  console.error('Network error:', networkError);
}
```

**Discovered:** T02 (S01/M001) — the task plan only specified try/catch, which would have silently swallowed all DB-level insert failures.
