# 🧙 Fabletime

**Magical stories, made just for you.**

Fabletime is an AI-powered children's story generator designed for **parents to use with their kids**. Parents select a character, story length, and learning theme, then read the generated story aloud to their child (ages 4–8).

## How It Works

1. **Pick your heroes** — Choose one or more characters (Fox, Bear, Wizard, Knight, Scientist, Mermaid)
2. **Set the length** — Short (~300 words), Medium (~500 words), or Long (~800 words)
3. **Choose a learning theme** — Vocabulary, Empathy, Courage, or Kindness
4. **Generate** — Claude Opus creates a unique story with a three-act structure, complete with a challenge the characters overcome using the chosen theme
5. **Read aloud** — The parent reads the story to their child

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, Claymorphism design system
- **AI:** Anthropic Claude Opus (via streaming API)
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
# Add your ANTHROPIC_API_KEY and GITHUB_TOKEN

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Powers story generation via Claude |
| `GITHUB_TOKEN` | Yes | Powers feedback/bug report submission to GitHub Issues |

## Project Structure

```
app/
├── page.tsx                    # Home — story generator
├── layout.tsx                  # Root layout (fonts, analytics)
├── globals.css                 # Design system (Claymorphism tokens)
├── feedback/page.tsx           # User feedback form
├── bug/page.tsx                # Bug report form
├── components/
│   ├── StoryForm.tsx           # Character/length/theme picker
│   ├── StoryDisplay.tsx        # Streamed story renderer
│   └── IssueForm.tsx           # Shared feedback/bug form
└── api/
    ├── generate/route.ts       # POST — streams AI-generated story
    └── submit-issue/route.ts   # POST — creates GitHub Issue
```

## Content Safety

All generated stories include explicit child-safety guardrails ensuring content is fully appropriate for children aged 8 and under. No violence, scary content, or mean-spirited behavior.

## Deployment

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

Production is live at [fabletime.co](https://fabletime.co).
