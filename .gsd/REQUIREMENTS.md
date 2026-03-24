# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R001 — Story Persistence
- Class: core-capability
- Status: active
- Description: Every generated story is automatically saved to Supabase with character(s), theme, length, full prompt, and full response
- Why it matters: Without persistence, all usage data and generated content is lost on page refresh — no analytics, no feedback loop, no audit trail
- Source: user (#8)
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Stories are anonymous — no user accounts. Admin viewing only via Supabase dashboard.

### R002 — Non-blocking DB Write
- Class: quality-attribute
- Status: active
- Description: Database writes must not delay the streaming response — the story streams to the user first, DB insert happens after stream completes
- Why it matters: Streaming UX is the core experience — any delay breaks the "watching the story appear" feel
- Source: user (#8)
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Fire-and-forget or await after stream close — either way, the user never waits

### R003 — Per-Story Rating UI
- Class: primary-user-loop
- Status: active
- Description: After a story finishes generating, a 5-star rating with optional text feedback appears at the bottom of the story
- Why it matters: Gives parents a way to signal story quality, enabling future quality improvements
- Source: user (#15)
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Hidden during generation. One submission per story (client-side enforcement). Thank-you message replaces form after submit.

### R004 — Rating DB Persistence
- Class: core-capability
- Status: active
- Description: Submitted ratings are saved to Supabase `ratings` table with stars, optional feedback text, story_id foreign key, and timestamp
- Why it matters: Ratings data is useless if not persisted — needs to survive page refreshes and be queryable
- Source: user (#15)
- Primary owning slice: M001/S02
- Supporting slices: M001/S01
- Validation: unmapped
- Notes: story_id must flow from API response back to client for the foreign key link

### R005 — Single Rating Per Story
- Class: constraint
- Status: active
- Description: A story can only be rated once per session — after submission, the rating form is replaced with a thank-you message
- Why it matters: Prevents spam/duplicate ratings from the same generation
- Source: user (#15)
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Client-side enforcement via React state — no cross-session persistence needed

### R006 — Dynamic Character Suggestions
- Class: primary-user-loop
- Status: active
- Description: Character picker shows top 10 most popular characters from the database as selectable buttons, replacing the hardcoded 6
- Why it matters: Suggestions evolve organically based on what parents actually use — the app gets better over time
- Source: user (#7)
- Primary owning slice: M001/S03
- Supporting slices: M001/S01
- Validation: unmapped
- Notes: Fetched via GET /api/suggestions on page load

### R007 — Dynamic Theme Suggestions
- Class: primary-user-loop
- Status: active
- Description: Theme picker shows top 10 most popular themes from the database as selectable buttons, replacing the hardcoded 4
- Why it matters: Same organic evolution as characters — popular themes surface naturally
- Source: user (#7)
- Primary owning slice: M001/S03
- Supporting slices: M001/S01
- Validation: unmapped
- Notes: One theme at a time (existing behavior preserved)

### R008 — Custom Character Input
- Class: core-capability
- Status: active
- Description: Users can type custom characters in a text field alongside suggestion buttons, comma-separated for multiple entries
- Why it matters: Parents and kids have favorite characters beyond the defaults — custom input unlocks creativity
- Source: user (#7)
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Max 3 words per entry enforced client-side and server-side

### R009 — Custom Theme Input
- Class: core-capability
- Status: active
- Description: Users can type a custom learning theme in a text field alongside suggestion buttons
- Why it matters: Learning themes are personal — parents may want specific topics like "sharing" or "patience"
- Source: user (#7)
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Max 3 words per entry enforced client-side and server-side. One theme at a time.

### R010 — Popularity Tracking
- Class: core-capability
- Status: active
- Description: Every story generation upserts the used character(s) and theme into `custom_entries` table, incrementing usage_count
- Why it matters: Drives the dynamic suggestions — without tracking, suggestions can't reflect actual usage
- Source: user (#7)
- Primary owning slice: M001/S03
- Supporting slices: M001/S01
- Validation: unmapped
- Notes: Upsert on conflict (type, value) — increment count, don't duplicate rows

### R011 — Content Filter for Suggestions
- Class: constraint
- Status: active
- Description: Before adding an entry to the top 10 suggestions, check via Claude API if it's child-friendly (ages 8 and under). If not, skip it and try the next most popular.
- Why it matters: Prevents inappropriate user-submitted content from being surfaced as suggestions to other families
- Source: user (#7, discussion)
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Filter runs at suggestion recalculation time only — not on every generation. Inappropriate entries still work for direct generation (Claude's prompt guardrail handles safety there).

### R012 — Max 3 Characters
- Class: constraint
- Status: active
- Description: Users can select up to 3 characters total (mix of suggestion buttons and custom text input)
- Why it matters: More than 3 characters makes stories unfocused and hard to follow for young children
- Source: user (#7)
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Client-side enforcement. Current hardcoded limit is 6 (all selectable) — this tightens it.

### R013 — Timestamps on All DB Entries
- Class: quality-attribute
- Status: active
- Description: All database tables (stories, ratings, custom_entries) have created_at timestamps with timezone
- Why it matters: Enables time-based queries, analytics, and debugging
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02, M001/S03
- Validation: unmapped
- Notes: Postgres DEFAULT NOW() on all tables

### R014 — Seed Default Entries
- Class: launchability
- Status: active
- Description: Hardcoded defaults (Fox, Bear, Wizard, Knight, Scientist, Mermaid / Kindness, Courage, Empathy, Vocabulary) are seeded as initial data in custom_entries
- Why it matters: Without seeds, the app launches with empty suggestion lists — bad first impression
- Source: user (#7)
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Seed script or initial migration

## Deferred

### R020 — User Accounts / Auth
- Class: core-capability
- Status: deferred
- Description: User authentication and accounts for personalized history
- Why it matters: Would enable per-user story history, saved favorites, personalized suggestions
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Not needed for current anonymous usage model. Revisit if user-facing history is requested.

### R021 — User-Facing Story History
- Class: primary-user-loop
- Status: deferred
- Description: Users can see their previously generated stories
- Why it matters: Parents might want to re-read favorite stories
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Depends on R020 (auth) or session-based approach. Deferred per user decision.

## Out of Scope

### R030 — Story Deletion / Expiry
- Class: constraint
- Status: out-of-scope
- Description: No mechanism to delete or expire stories from the database
- Why it matters: Prevents scope creep into admin tooling
- Source: user (#8)
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Stories retained indefinitely per user requirement

### R031 — Block Inappropriate Content at Generation
- Class: anti-feature
- Status: out-of-scope
- Description: Custom characters/themes are NOT blocked at generation time — only filtered from suggestions
- Why it matters: Prevents over-engineering the safety layer. Claude's prompt guardrail handles generation safety. The content filter only gates what gets promoted to suggestions for other users.
- Source: user (discussion)
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Explicit design decision from discussion

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | active | M001/S01 | none | unmapped |
| R002 | quality-attribute | active | M001/S01 | none | unmapped |
| R003 | primary-user-loop | active | M001/S02 | none | unmapped |
| R004 | core-capability | active | M001/S02 | M001/S01 | unmapped |
| R005 | constraint | active | M001/S02 | none | unmapped |
| R006 | primary-user-loop | active | M001/S03 | M001/S01 | unmapped |
| R007 | primary-user-loop | active | M001/S03 | M001/S01 | unmapped |
| R008 | core-capability | active | M001/S03 | none | unmapped |
| R009 | core-capability | active | M001/S03 | none | unmapped |
| R010 | core-capability | active | M001/S03 | M001/S01 | unmapped |
| R011 | constraint | active | M001/S03 | none | unmapped |
| R012 | constraint | active | M001/S03 | none | unmapped |
| R013 | quality-attribute | active | M001/S01 | M001/S02, M001/S03 | unmapped |
| R014 | launchability | active | M001/S03 | none | unmapped |
| R020 | core-capability | deferred | none | none | unmapped |
| R021 | primary-user-loop | deferred | none | none | unmapped |
| R030 | constraint | out-of-scope | none | none | n/a |
| R031 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 14
- Mapped to slices: 14
- Validated: 0
- Unmapped active requirements: 0
