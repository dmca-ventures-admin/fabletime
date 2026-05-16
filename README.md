# 📖 Fabletime

**Magical stories, made just for you.**

Fabletime is an AI-powered children's story generator designed for **parents to use with their kids**. Parents pick characters, a learning theme, and a funniness level, then read the generated story aloud to their child (ages 4–8).

## How It Works

1. **Pick your heroes** — Choose up to 3 characters from the top suggestions (dynamically ranked by popularity) or type your own
2. **Set the length** — Short (300–400 words), Medium (500–700 words), or Long (800–1000 words)
3. **Choose a learning theme** — Pick from the top 8 most popular themes or enter your own (e.g. Kindness, Courage, Friendship)
4. **Set the funniness level** — Slider from 😐 to 🤣 (5 levels, default: "A little funny")
5. **Generate** — Claude Opus 4 streams a unique story with character flaws, a failure beat, and the theme woven in naturally
6. **Illustration** — A unique cartoon illustration is generated via DALL-E 3 (style chosen by Claude Haiku to match the story's tone) and appears between the story and discussion questions
7. **Read aloud** — The parent reads the story to their child
8. **Discuss** — Three AI-generated discussion questions appear after the story
9. **Rate** — Optional 5-star rating + feedback saved to the database
10. **Generate another** — Keep the same settings and generate a fresh story instantly

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, Claymorphism design system
- **AI:** Anthropic Claude Opus 4 (story generation), Claude Haiku 4.5 (discussion questions, input validation, illustration style selection, emoji assignment), OpenAI DALL-E 3 (story illustrations)
- **Database:** Supabase (Postgres) — stories, ratings, custom entries
- **Fonts:** Fredoka (headings), Nunito (body)
- **Analytics:** Vercel Analytics + Speed Insights
- **Feedback:** GitHub Issues API (bug reports + user feedback)
- **Hosting:** Vercel ([fabletime.co](https://fabletime.co))

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your keys (see Environment Variables section)

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Powers story generation, discussion questions, input validation, and illustration style selection |
| `OPENAI_API_KEY` | Yes | Powers DALL-E 3 story illustration generation |
| `GITHUB_TOKEN` | Yes | Powers feedback/bug report submission to GitHub Issues |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_ACCESS_TOKEN` | Optional | For applying schema changes via the Supabase Management API (see Knowledge Base in `.gsd/`) |

## Project Structure

```
proxy.ts                        # Next.js 16 middleware (renamed from middleware.ts in v16)
                                # Admin auth guard + security headers + CSP

app/
├── page.tsx                    # Home — story generator
├── layout.tsx                  # Root layout (fonts, analytics)
├── globals.css                 # Design system (Claymorphism tokens + funniness slider CSS)
├── feedback/page.tsx           # User feedback form
├── bug/page.tsx                # Bug report form
├── admin/
│   ├── page.tsx                # Admin dashboard (metrics, stories, ratings)
│   └── login/page.tsx          # Admin login (HMAC-signed cookie, 24h TTL)
├── components/
│   ├── StoryForm.tsx           # Main form — characters, length, theme, funniness picker
│   ├── StoryDisplay.tsx        # Streamed story renderer + discussion questions + rating
│   ├── GenerateButton.tsx      # Shared generate/submit button (inline + sticky mobile)
│   ├── ThemeToggle.tsx         # Light/Dark mode toggle
│   └── IssueForm.tsx           # Shared feedback/bug form
└── api/
    ├── generate/route.ts       # POST — streams AI-generated story, saves to Supabase (10 req/min)
    ├── image/route.ts          # POST — generates DALL-E 3 cartoon illustration for a story (5 req/min)
    ├── questions/route.ts      # POST — generates 3 discussion questions via Claude Haiku (20 req/min)
    ├── rate/route.ts           # POST — saves star rating + feedback to Supabase (20 req/min)
    ├── validate/route.ts       # POST — AI validates custom character/theme inputs, fail-open (30 req/min)
    ├── suggestions/route.ts    # GET — returns top-50 characters and themes; client randomly samples 9/8 for display, uses full 50 for autocomplete (30 req/min)
    └── submit-issue/route.ts   # POST — creates GitHub Issue for feedback/bug reports (5 req/min)

lib/
├── anthropic.ts                # Shared Anthropic client singleton
├── admin-auth.ts               # HMAC-signed session cookie helpers for admin dashboard
├── admin-metrics.ts            # Server-only metrics aggregation for admin dashboard (service role)
├── constants.ts                # CHARACTER_EMOJI, THEME_EMOJI maps and emoji helper functions
├── content-filter.ts           # isChildFriendly() — Claude Haiku classifier for custom entries (fail-closed)
├── content-safety.ts           # checkContentSafety() — server-side safety check before story generation
├── cost-logger.ts              # Per-request API cost logger (structured JSON → Vercel logs)
├── models.ts                   # Centralised AI model config (MODELS.opus, MODELS.haiku, MODELS.dalleImage)
├── ratelimit.ts                # In-memory rate limiter (per-IP, per-route)
├── sanitize.ts                 # sanitizePromptInput() — strip control chars + flag prompt-injection
└── supabase.ts                 # Supabase client (anon) + getServiceSupabase() (service role, server-only)
```

## Database Schema

Three tables in Supabase:

**`stories`** — every generated story
```sql
id, created_at, characters[], theme, length, prompt, response, funniness_level, session_id
```
`session_id` — anonymous browser session id for unique-user metrics (#140)

**`ratings`** — user ratings per story
```sql
id, story_id (FK), stars, feedback, created_at, read
```

**`custom_entries`** — tracks character/theme usage for suggestions
```sql
id, type (character|theme), value, usage_count, created_at, child_friendly, emoji, excluded
```

### Row Level Security

RLS is intentionally **disabled** on all three tables (`stories`, `ratings`, `custom_entries`). The app uses an anonymous, server-side Supabase client — there are no authenticated users, so RLS rules would have no effect. All access is gated through the Next.js API routes; the Supabase anon key is only used server-side and is never exposed to the browser. This is recorded as decision D003 in `.gsd/DECISIONS.md`.

## Admin Dashboard

Available at `/admin` (redirects to `/admin/login` when unauthenticated).

- **Auth:** Username `admin`, password set via `ADMIN_PASSWORD` env var
- **Session:** HMAC-signed cookie (`fabletime_admin_session`), 24h TTL
- **Metrics:** Total/today/week/month stories, unique users (via `session_id`), top characters/themes, ratings distribution, GitHub feedback/bug counts
- **Service role:** All admin queries use `getServiceSupabase()` to bypass RLS

Env vars required: `ADMIN_PASSWORD`, `ADMIN_USERNAME`, `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_TOKEN`

## Content Safety

All generated stories include explicit child-safety guardrails. Custom characters and themes are automatically validated for age-appropriateness via Claude before being saved to the database.

## Deployment

Deployments are handled automatically by Vercel's GitHub integration:

- **Production:** merge to `main` and push — Vercel deploys to [fabletime.co](https://fabletime.co) automatically
- **Preview:** push any feature branch — Vercel creates a preview deployment (SSO-gated; access via a browser logged into Vercel)

> **Note:** `vercel --prod` via the CLI does not work on the Hobby plan when the local git committer email doesn't match the Vercel account. Use the git push workflow above instead.

Production is live at [fabletime.co](https://fabletime.co).
