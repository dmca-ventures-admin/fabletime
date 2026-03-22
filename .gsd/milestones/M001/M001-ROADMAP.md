# M001: Data Layer & User Engagement

**Vision:** Add Supabase persistence to Fabletime — every story is saved, users can rate stories, and character/theme suggestions evolve dynamically based on popularity with content-filtered promotion.

## Success Criteria

- Every story generation persists a complete record (inputs, prompt, response, timestamp) to Supabase without delaying the streaming response
- Users can rate any generated story with 1-5 stars and optional text feedback
- Character and theme pickers show the top 10 most popular entries from the database
- Users can enter custom characters (up to 3 total) and custom themes
- Content filter gates what enters the top 10 suggestions — inappropriate entries are skipped
- Works in both local dev and Vercel production

## Key Risks / Unknowns

- **story_id flow** — Streaming response is plain text. Client needs a story_id for the rating foreign key. Need to deliver it without breaking the stream.
- **Content filter latency** — Claude API call to check child-friendliness adds latency to the suggestions endpoint. Needs to be fast enough for page load.

## Proof Strategy

- story_id flow → retire in S01 by proving the client receives a story_id alongside the streamed story and can reference it later
- Content filter latency → retire in S03 by proving suggestions endpoint responds within acceptable page-load time

## Verification Classes

- Contract verification: TypeScript compilation, Supabase row insertion, API response shape
- Integration verification: End-to-end flow — generate story → DB row → rate story → DB row with FK → custom entry → suggestion list
- Operational verification: Vercel env vars configured, Supabase tables exist with correct schema
- UAT / human verification: Visual check of rating UI, suggestion buttons, custom input UX

## Milestone Definition of Done

This milestone is complete only when all are true:

- All three slice deliverables are complete and verified
- Supabase tables (stories, ratings, custom_entries) exist with correct schema and seeds
- Story persistence, rating, and suggestions work end-to-end on fabletime.co
- Streaming performance is not degraded by DB writes
- Success criteria are re-checked against live behavior

## Requirement Coverage

- Covers: R001, R002, R003, R004, R005, R006, R007, R008, R009, R010, R011, R012, R013, R014
- Partially covers: none
- Leaves for later: R020 (auth), R021 (user history)
- Orphan risks: none

## Slices

- [x] **S01: Supabase Setup & Story Persistence** `risk:medium` `depends:[]`
  > After this: generate a story → row appears in Supabase `stories` table with character(s), theme, length, prompt, response, and timestamp. Client receives a `story_id` for downstream use.

- [x] **S02: Per-Story Rating & Feedback** `risk:low` `depends:[S01]`
  > After this: after a story finishes generating, a 5-star rating UI with optional text appears below the story → submit → row in `ratings` table linked to story via story_id → form replaced with thank-you message.

- [ ] **S03: Custom Characters & Themes with Popularity** `risk:medium` `depends:[S01]`
  > After this: character/theme pickers show dynamic top 10 from DB → user can type custom entries → generate → usage count increments → popular child-friendly entries appear in suggestions.

## Boundary Map

### S01 → S02

Produces:
- `lib/supabase.ts` → singleton Supabase client (`createClient()`)
- `stories` table in Supabase with schema: id (UUID), created_at, character (TEXT), theme, length, prompt, response
- `POST /api/generate` → returns story_id to client (via response header or wrapper) alongside streamed text
- StoryForm state: `storyId` available after generation completes

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- `lib/supabase.ts` → shared Supabase client
- `stories` table (S03 reads character/theme data for popularity, though custom_entries is the primary tracking table)

Consumes:
- nothing (first slice)

### S02 → (terminal)

Produces:
- `ratings` table in Supabase: id, story_id (FK), created_at, stars, feedback
- `POST /api/rate` → accepts { story_id, stars, feedback }
- Rating UI in StoryDisplay.tsx

Consumes from S01:
- `lib/supabase.ts` → Supabase client
- `storyId` from StoryForm state (delivered by generate API)

### S03 → (terminal)

Produces:
- `custom_entries` table in Supabase: id, type, value, usage_count, created_at, UNIQUE(type, value)
- `GET /api/suggestions` → returns top 10 characters and top 10 themes (content-filtered)
- Refactored StoryForm with dynamic suggestions + custom text inputs
- Seed data for default characters and themes

Consumes from S01:
- `lib/supabase.ts` → Supabase client
- `POST /api/generate` → upserts character/theme usage counts after generation
