# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001 | library | Database provider | Supabase (Postgres) | Free tier, built-in admin UI, works seamlessly with Next.js + Vercel. Credentials already configured in .env.local. | Yes — if self-hosted or different provider needed |
| D002 | M001 | arch | Content filter trigger point for custom characters/themes | Filter at suggestion promotion time only — not at generation time | Cheaper (one check per unique entry vs per generation), faster (no blocking API call in hot path), and Claude's prompt guardrail handles generation safety anyway | No |
| D003 | M001 | arch | Story ownership model | Anonymous — no user accounts, stories are not tied to users | User explicitly deferred auth and user-facing history. Stories are for admin analytics only at this stage. | Yes — if user accounts are added later |
