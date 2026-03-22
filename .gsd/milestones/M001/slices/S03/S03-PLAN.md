# S03: Custom Characters & Themes with Popularity

**Goal:** Replace hardcoded character/theme arrays with dynamic suggestions from Supabase, support custom user input, track usage via upserts, and content-filter entries before surfacing them as suggestions.
**Demo:** Character/theme pickers show dynamic top 10 from DB → user can type custom entries → generate a story → usage count increments → popular child-friendly entries appear in suggestions on next page load.

## Must-Haves

- Seed data for the 6 default characters and 4 default themes exists in `custom_entries` (R014)
- `GET /api/suggestions` returns up to 10 characters and 10 themes from DB, ordered by popularity, filtered for child-friendliness (R006, R007, R011)
- Content filter utility uses Claude API to classify entries as child-friendly or not, with results cached in a `child_friendly` boolean column on `custom_entries` (R011)
- Story generation upserts each character and theme into `custom_entries` with atomic `usage_count` increment via a Postgres function (R010)
- StoryForm fetches suggestions on mount and renders them as selectable buttons (R006, R007)
- Users can type custom characters (comma-separated) and custom themes via text inputs (R008, R009)
- Max 3 characters enforced across suggestion buttons + custom text input (R012)
- Custom entries validated to max 3 words (client + server) (R012)

## Proof Level

- This slice proves: integration
- Real runtime required: yes (Supabase + Claude API for content filter)
- Human/UAT required: yes (visual check of suggestion buttons, custom input UX)

## Verification

- `npx tsc --noEmit` — all new/modified files compile without errors
- `curl -s http://localhost:3000/api/suggestions | python3 -m json.tool` — returns JSON `{ characters: [...], themes: [...] }` with arrays of strings, each ≤10 entries
- `test -f supabase/seed.sql && grep -c "INSERT" supabase/seed.sql` — seed file exists with INSERT statements
- `grep -q "child_friendly" supabase/schema.sql` — schema includes the cached content filter column
- `grep -q "upsert_entry" supabase/schema.sql` — schema includes the atomic upsert function
- `grep -q "custom" app/components/StoryForm.tsx` — StoryForm contains custom input handling
- `grep -q "api/suggestions" app/components/StoryForm.tsx` — StoryForm fetches from suggestions endpoint

## Observability / Diagnostics

- Runtime signals: Console errors with `[S03]` prefix on content filter failures, upsert failures, and suggestions fetch failures
- Inspection surfaces: `GET /api/suggestions` returns current suggestion state; `custom_entries` table shows all entries with `usage_count` and `child_friendly` columns
- Failure visibility: Content filter errors are logged and the entry is excluded from suggestions (fail-closed); upsert errors are logged but don't block story generation
- Redaction constraints: none (no PII — entries are character/theme names)

## Integration Closure

- Upstream surfaces consumed: `lib/supabase.ts` (Supabase client singleton from S01), `app/api/generate/route.ts` (generate endpoint from S01, modified here to add upserts), `supabase/schema.sql` (schema from S01, extended with function + column)
- New wiring introduced in this slice: `GET /api/suggestions` route, `lib/content-filter.ts` utility, Postgres `upsert_entry` function, `StoryForm.tsx` fetch-on-mount and custom input UI
- What remains before the milestone is truly usable end-to-end: nothing — S03 is the final slice

## Tasks

- [x] **T01: Add seed data, Postgres upsert function, and content filter utility** `est:45m`
  - Why: Establishes the data layer (seed entries, atomic upsert, cached content filter) that the API endpoints and frontend depend on. Without seeds the suggestions page is empty on first load (R014). Without the upsert function, concurrent story generations cause race conditions. Without the content filter, inappropriate entries could surface (R011).
  - Files: `supabase/schema.sql`, `supabase/seed.sql`, `lib/content-filter.ts`
  - Do: (1) Add `child_friendly BOOLEAN DEFAULT NULL` column to `custom_entries` in schema.sql. (2) Add `upsert_entry(p_type TEXT, p_value TEXT)` Postgres function that does INSERT ... ON CONFLICT DO UPDATE SET usage_count = usage_count + 1. (3) Create seed.sql with idempotent INSERTs for 6 characters (Fox, Bear, Little Wizard, Brave Knight, Young Scientist, Mermaid) and 4 themes (Kindness, Courage, Empathy, Vocabulary). (4) Create lib/content-filter.ts exporting `isChildFriendly(text: string): Promise<boolean>` using Anthropic SDK with Claude Haiku for fast classification.
  - Verify: `npx tsc --noEmit && test -f supabase/seed.sql && test -f lib/content-filter.ts && grep -q "upsert_entry" supabase/schema.sql && grep -q "child_friendly" supabase/schema.sql`
  - Done when: Schema extended with function + column, seed file has 10 entries, content filter compiles and exports `isChildFriendly`

- [ ] **T02: Build suggestions endpoint and add usage tracking to generate route** `est:45m`
  - Why: Creates the API surface that powers dynamic suggestions (R006, R007) and tracks what characters/themes are actually used (R010). The suggestions endpoint content-filters using the cached `child_friendly` column, only calling Claude for entries not yet checked. The generate route upserts each character and the theme after DB insert.
  - Files: `app/api/suggestions/route.ts`, `app/api/generate/route.ts`
  - Do: (1) Create GET /api/suggestions that queries `custom_entries` for top entries by usage_count. For entries where `child_friendly IS NULL`, call `isChildFriendly()` and update the column. Return only entries where `child_friendly = true`, up to 10 per type. (2) In generate/route.ts, after the story insert block, call `supabase.rpc('upsert_entry', ...)` for each character and the theme. Add server-side validation: reject characters arrays > 3, reject entries > 3 words. Log errors with `[S03]` prefix.
  - Verify: `npx tsc --noEmit && grep -q "upsert_entry" app/api/generate/route.ts && grep -q "isChildFriendly" app/api/suggestions/route.ts`
  - Done when: `GET /api/suggestions` returns `{ characters: string[], themes: string[] }`, generate route upserts character/theme usage, server-side validation rejects > 3 characters and > 3-word entries

- [ ] **T03: Refactor StoryForm with dynamic suggestions, custom inputs, and max-3 enforcement** `est:1h`
  - Why: Connects the frontend to the new API surface (R006, R007), adds custom character and theme text inputs (R008, R009), and enforces the max-3-character limit across both suggestion buttons and custom input (R012). This is the user-facing completion of the slice.
  - Files: `app/components/StoryForm.tsx`
  - Do: (1) Add `useEffect` to fetch `/api/suggestions` on mount, store in state with loading/error handling. (2) Replace hardcoded `characters` array with dynamic suggestions — render as buttons without emoji (use first letter as avatar). (3) Replace hardcoded `themes` array with dynamic suggestions — render as buttons without SVG icons (use simple text buttons). (4) Add a text input below character buttons for custom characters (comma-separated), with placeholder "Or type custom characters...". (5) Add a text input below theme buttons for a custom theme, with placeholder "Or type a custom theme...". (6) Enforce max 3 characters total across selected buttons + parsed custom input entries. Disable further selection when at 3. Validate max 3 words per custom entry on change. (7) Merge custom characters into the characters array and use custom theme (if set) when submitting — the `handleSubmit` body must include all selected + custom characters and the final theme. (8) Show a loading skeleton while suggestions are being fetched. Fall back gracefully if suggestions fetch fails (show only the custom input).
  - Verify: `npx tsc --noEmit && grep -q "api/suggestions" app/components/StoryForm.tsx && grep -q "custom" app/components/StoryForm.tsx`
  - Done when: StoryForm renders dynamic suggestions from API, custom text inputs work for characters and themes, max 3 character limit is enforced, form submits with correct merged data

## Files Likely Touched

- `supabase/schema.sql`
- `supabase/seed.sql`
- `lib/content-filter.ts`
- `app/api/suggestions/route.ts`
- `app/api/generate/route.ts`
- `app/components/StoryForm.tsx`
