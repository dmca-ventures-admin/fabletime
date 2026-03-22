# S03: Custom Characters & Themes with Popularity — Research

**Date:** 2026-03-22
**Depth:** Targeted

## Summary

This slice replaces the hardcoded character and theme arrays in `StoryForm.tsx` with dynamic suggestions fetched from Supabase, adds custom text inputs for user-submitted characters and themes, tracks usage via upserts to `custom_entries`, and content-filters entries before promoting them to suggestions. The risk profile from the roadmap — content filter latency — is the main concern, but the decision (D002) to filter at suggestion-promotion time rather than generation-time keeps it off the hot path.

The codebase is small and the patterns are well-established by S01/S02. The `custom_entries` table already exists in `supabase/schema.sql` with the correct schema (`type TEXT, value TEXT, usage_count INTEGER, UNIQUE(type, value)`). The Supabase client singleton at `lib/supabase.ts` is ready. The Anthropic SDK is already imported in `generate/route.ts` and can be reused for the content filter. The main work is: (1) a new `GET /api/suggestions` route, (2) a content-filter utility using Claude, (3) refactoring `StoryForm.tsx` to fetch suggestions and accept custom input, and (4) adding upsert logic to the generate route.

## Recommendation

Build in this order:

1. **Seed data first** — Insert the 6 default characters and 4 default themes into `custom_entries` so the suggestions endpoint has data to return immediately. Create a `supabase/seed.sql` file. This satisfies R014.

2. **`GET /api/suggestions` route** — Query `custom_entries` for top 10 characters and top 10 themes ordered by `usage_count DESC`. Return JSON `{ characters: string[], themes: string[] }`. Initially skip the content filter to get the endpoint working, then layer it in.

3. **Content filter utility** — A function `isChildFriendly(text: string): Promise<boolean>` in `lib/content-filter.ts` that uses the Anthropic SDK to classify a single entry. Called per entry when building the suggestions response. Use a fast, cheap model (Claude Haiku) with a simple system prompt asking if the text is appropriate for ages 8 and under.

4. **Upsert in generate route** — After the story DB insert (which already runs post-stream), upsert each character and the theme into `custom_entries` with `ON CONFLICT (type, value) DO UPDATE SET usage_count = usage_count + 1`. This satisfies R010.

5. **Refactor StoryForm.tsx** — Fetch suggestions on mount via `useEffect` → `fetch('/api/suggestions')`. Replace hardcoded arrays with dynamic data. Add a text input for custom characters (comma-separated, max 3 total) and a text input for custom themes. Keep the button grid for suggestions, add the text input below each grid. Enforce the max-3-character limit (R012) across both suggestion buttons and custom input.

6. **Validation** — Max 3 words per custom entry (client-side + server-side in generate route). Max 3 characters total (client-side in StoryForm, server-side in generate route).

## Implementation Landscape

### Key Files

- `app/components/StoryForm.tsx` — The main refactoring target. Currently has hardcoded `characters` and `themes` arrays. Needs: `useEffect` to fetch suggestions, dynamic button grid from API data, custom text inputs for characters (comma-separated) and themes, max-3-character enforcement across buttons + custom input, loading state while suggestions load.
- `app/api/suggestions/route.ts` — **New file.** GET handler that queries `custom_entries` for top entries, runs content filter, returns JSON. Must handle the case where fewer than 10 child-friendly entries exist.
- `app/api/generate/route.ts` — Needs upsert logic added after the existing story insert. Upserts each character and the theme into `custom_entries`. Also needs server-side validation for custom entries (max 3 words, max 3 characters).
- `lib/content-filter.ts` — **New file.** Exports `isChildFriendly(text: string): Promise<boolean>`. Uses Anthropic SDK with Claude Haiku for fast, cheap classification.
- `lib/supabase.ts` — No changes needed. Already exports the singleton client.
- `supabase/seed.sql` — **New file.** INSERT statements for the 10 default entries (6 characters + 4 themes) with `ON CONFLICT DO NOTHING` so it's idempotent.
- `supabase/schema.sql` — No changes needed. `custom_entries` table already defined.

### Build Order

1. **`supabase/seed.sql`** — Seed data for defaults. Unblocks the suggestions endpoint (R014).
2. **`lib/content-filter.ts`** — Content filter utility. Unblocks the suggestions endpoint's filtering (R011).
3. **`app/api/suggestions/route.ts`** — Suggestions endpoint. Unblocks the frontend refactor (R006, R007).
4. **`app/api/generate/route.ts` modifications** — Upsert logic for usage tracking (R010). Independent of the frontend work.
5. **`app/components/StoryForm.tsx` refactor** — Dynamic suggestions, custom inputs, max-3 enforcement (R006, R007, R008, R009, R012). Depends on steps 3-4.

### Verification Approach

- **TypeScript compilation:** `npx tsc --noEmit` must pass with all new/modified files.
- **Seed data:** Run `seed.sql` in Supabase SQL editor → verify 10 rows in `custom_entries` (6 type=character, 4 type=theme).
- **Suggestions endpoint:** `curl http://localhost:3000/api/suggestions` → returns JSON with `characters` (array of strings) and `themes` (array of strings), each with up to 10 entries.
- **Content filter:** Manually test with known-good ("Fox") and known-bad entries to verify classification works.
- **Upsert:** Generate a story with "Fox" → check `custom_entries` row for Fox has incremented `usage_count`. Generate with a new custom character → new row appears.
- **Custom input UX:** Type a custom character name → it appears in the selected list → max 3 limit enforced (can't add 4th). Type custom theme → it replaces the selected suggestion.
- **Latency (risk retirement):** Measure suggestions endpoint response time — should be under 2 seconds for page load. Content filter adds ~200-500ms per entry but only runs on entries not yet checked.

## Constraints

- **`custom_entries` UNIQUE constraint** — `(type, value)` is unique. Upserts must use `ON CONFLICT` to increment `usage_count` rather than inserting duplicates. Supabase JS supports this via `.upsert()` with `onConflict`.
- **Supabase `.upsert()` for incrementing** — Supabase JS `upsert()` replaces the row, it doesn't support SQL expressions like `usage_count + 1`. Must use `.rpc()` with a Postgres function, or a raw SQL approach via `.rpc()`. Alternative: use `.select()` first to get current count, then `.upsert()` with the incremented value — but this has a race condition. Best approach: create a small Postgres function `upsert_entry(p_type, p_value)` or use Supabase's raw SQL via `.rpc()`.
- **Max 3 words per entry** — Client and server validation. Split on whitespace, reject if > 3 tokens.
- **Max 3 characters per story** — Already enforced in `StoryForm.tsx` for button selection. Must extend to include custom text input characters in the count.
- **Emoji-less suggestions** — The current hardcoded characters have emojis (🦊, 🐻, etc.). Dynamic suggestions from the DB are plain text. The UI needs to gracefully handle suggestions without emojis — use the first letter or a generic icon.
- **No auth on endpoints** — Both `/api/suggestions` (GET) and the upsert in `/api/generate` (POST) use the anon key. No RLS policies needed (D003).

## Common Pitfalls

- **Supabase upsert doesn't increment** — `supabase.from('custom_entries').upsert({ type, value, usage_count: 1 })` will *replace* the row, resetting `usage_count` to 1 every time. Must either use a Postgres function or fetch-then-update pattern. A simple Postgres function (`increment_usage`) is cleanest.
- **Content filter batching** — Calling Claude for each of 10+ entries sequentially will be slow (~200ms × 10 = 2s). Use `Promise.all()` to parallelize, or better: add a `child_friendly` boolean column to `custom_entries` and cache the result so the filter only runs once per unique entry, not on every suggestions request.
- **Empty suggestions on first load** — If seed data hasn't been run, the endpoint returns empty arrays. The UI should fall back gracefully — show the text input as the primary UX rather than an empty grid.
- **Race condition on upsert** — Two simultaneous story generations with the same character could both read `usage_count = 5`, then both write `usage_count = 6` instead of `7`. The Postgres function approach with `SET usage_count = usage_count + 1` avoids this.
- **Custom input whitespace handling** — Comma-separated characters need trim on each entry. "Fox, Bear" should produce ["Fox", "Bear"], not ["Fox", " Bear"].

## Open Risks

- **Content filter cost** — Each Claude API call costs tokens. If suggestions are fetched on every page load with no caching, this could be expensive. Mitigation: cache the `child_friendly` flag per entry in the DB so each entry is only checked once. The suggestions endpoint then filters by `child_friendly = true` with a simple SQL WHERE clause.
- **Suggestions endpoint latency (risk to retire)** — The roadmap marks this as a risk to retire in S03. If we cache content filter results in the DB, the endpoint is just a simple SELECT with ORDER BY and LIMIT — sub-100ms. First-time filter checks add latency only when new entries appear.
