# 📖 Fabletime

**Magical stories, made just for you.**

Fabletime is an AI-powered children's story generator designed for **parents to use with their kids**. Parents pick characters, a learning theme, and a funniness level, then read the generated story aloud to their child (ages 4–8).

## How It Works

1. **Pick your heroes** — Choose up to 3 characters from the top suggestions (dynamically ranked by popularity) or type your own
2. **Set the length** — Short (~300 words), Medium (~500 words), or Long (~800 words)
3. **Choose a learning theme** — Pick from the top 8 most popular themes or enter your own (e.g. Kindness, Courage, Friendship)
4. **Set the funniness level** — Slider from 😐 to 🤣 (5 levels, default: "A little funny")
5. **Generate** — Claude Opus streams a unique story with character flaws, a failure beat, and the theme woven in naturally
6. **Read aloud** — The parent reads the story to their child
7. **Discuss** — Three AI-generated discussion questions appear after the story
8. **Rate** — Optional 5-star rating + feedback saved to the database
9. **Generate another** — Keep the same settings and generate a fresh story instantly

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, Claymorphism design system
- **AI:** Anthropic Claude Opus (story generation), Claude Haiku (discussion questions, input validation)
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
| `ANTHROPIC_API_KEY` | Yes | Powers story generation, discussion questions, and input validation |
| `GITHUB_TOKEN` | Yes | Powers feedback/bug report submission to GitHub Issues |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_ACCESS_TOKEN` | Optional | For running migrations via Supabase CLI |

## Project Structure

```
app/
├── page.tsx                    # Home — story generator
├── layout.tsx                  # Root layout (fonts, analytics)
├── globals.css                 # Design system (Claymorphism tokens + funniness slider CSS)
├── feedback/page.tsx           # User feedback form
├── bug/page.tsx                # Bug report form
├── components/
│   ├── StoryForm.tsx           # Main form — characters, length, theme, funniness picker
│   ├── StoryDisplay.tsx        # Streamed story renderer + discussion questions + rating
│   ├── ThemeToggle.tsx         # Light/Dark mode toggle
│   └── IssueForm.tsx           # Shared feedback/bug form
└── api/
    ├── generate/route.ts       # POST — streams AI-generated story, saves to Supabase
    ├── questions/route.ts      # POST — generates 3 discussion questions via Claude Haiku
    ├── rate/route.ts           # POST — saves star rating + feedback to Supabase
    ├── validate/route.ts       # POST — validates custom character/theme inputs
    ├── suggestions/route.ts    # GET — returns top 9 characters and top 8 themes from DB
    └── submit-issue/route.ts   # POST — creates GitHub Issue for feedback/bug reports
```

## Database Schema

Three tables in Supabase:

**`stories`** — every generated story
```sql
id, created_at, characters[], theme, length, prompt, response, funniness_level
```

**`ratings`** — user ratings per story
```sql
id, story_id (FK), stars, feedback, created_at, read
```

**`custom_entries`** — tracks character/theme usage for suggestions
```sql
id, type (character|theme), value, usage_count, created_at, child_friendly
```

## Content Safety

All generated stories include explicit child-safety guardrails. Custom characters and themes are automatically validated for age-appropriateness via Claude before being saved to the database.

## Deployment

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

Production is live at [fabletime.co](https://fabletime.co).
