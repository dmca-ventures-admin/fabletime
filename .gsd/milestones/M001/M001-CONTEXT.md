# M001: Data Layer & User Engagement

**Gathered:** 2026-03-22
**Status:** Ready for planning

## Project Description

Fabletime is an AI-powered children's story generator for parents. It currently generates stories via Claude Opus with streaming, multi-character selection, light/dark theme, and feedback via GitHub Issues. All state is client-side — stories vanish on refresh. This milestone adds Supabase persistence, per-story ratings, and dynamic custom characters/themes with popularity-driven suggestions.

## Why This Milestone

The app has no memory. Every story disappears, there's no feedback mechanism tied to specific stories, and character/theme options are hardcoded. This milestone gives Fabletime a data layer so usage patterns emerge, story quality can be measured, and the app evolves based on what parents actually use.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Generate a story and know it's been saved (no visible change to UX, but data persists)
- Rate a story with 1-5 stars and optional text feedback after it finishes generating
- Type custom character names and learning themes instead of only choosing from presets
- See the most popular characters and themes surfaced as suggestions (evolving over time)

### Entry point / environment

- Entry point: https://fabletime.co (Vercel)
- Environment: browser (desktop + mobile)
- Live dependencies involved: Supabase (Postgres), Anthropic API (content filtering)

## Completion Class

- Contract complete means: stories persist, ratings link to stories, suggestions query returns top 10
- Integration complete means: streaming + DB write + rating flow works end-to-end in production
- Operational complete means: Supabase credentials configured in Vercel, tables created, seeds populated

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Generate a story on fabletime.co → row appears in Supabase `stories` table → rate it → row appears in `ratings` table linked by story_id
- Type a custom character → generate multiple stories with it → it appears in the top 10 suggestions (if child-friendly)
- Streaming performance is not degraded by DB writes

## Risks and Unknowns

- **story_id flow** — The API currently streams plain text. The client needs a story_id to submit ratings. Need to either return the ID in a header, or have the client call a separate endpoint. Medium risk.
- **Supabase table creation** — No migration tooling set up. Tables need to be created manually or via SQL in the Supabase dashboard. Low risk but manual step.

## Existing Codebase / Prior Art

- `app/api/generate/route.ts` — Streaming route handler, currently stateless. Will need to capture full response and insert to DB after stream ends.
- `app/components/StoryForm.tsx` — Client component with multi-select characters, length, theme. Will need custom input fields and dynamic suggestions.
- `app/components/StoryDisplay.tsx` — Renders streamed story. Will need rating UI added below story content.
- `app/globals.css` — Theme-aware CSS custom properties. Rating stars will need theme-aware colors.
- `.env.local` — Already has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY`.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions.

## Relevant Requirements

- R001–R002: Story persistence and non-blocking writes
- R003–R005: Rating UI, DB persistence, single-submission constraint
- R006–R014: Dynamic suggestions, custom inputs, popularity tracking, content filtering, seeding

## Scope

### In Scope

- Supabase client setup and shared utility
- `stories`, `ratings`, `custom_entries` tables
- Story persistence after stream completes
- Rating UI and API route
- Custom character/theme inputs with multi-select (max 3 characters)
- Popularity tracking via upsert
- Content filtering at suggestion recalculation time
- Seed data for defaults
- Vercel environment variable configuration

### Out of Scope / Non-Goals

- User accounts / authentication
- User-facing story history
- Story deletion or expiry
- Blocking inappropriate content at generation time
- Admin dashboard for viewing stories/ratings

## Technical Constraints

- DB writes must not block streaming response
- Content filter calls are via Anthropic API (existing SDK) — only at suggestion promotion time
- Max 3 words per custom character/theme entry (client + server validation)
- Max 3 characters selectable per story

## Integration Points

- **Supabase** — Postgres database via `@supabase/supabase-js` client
- **Anthropic API** — Content filtering for suggestion promotion (reuses existing SDK)
- **Vercel** — Environment variables for Supabase credentials in production

## Open Questions

- **story_id delivery** — Leaning toward returning it as a custom response header (`X-Story-Id`) so the streaming body isn't affected. Will validate in S01.
