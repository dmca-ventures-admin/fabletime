# Codebase Map

Generated: 2026-05-11T06:58:14Z | Files: 46 | Described: 0/46
<!-- gsd:codebase-meta {"generatedAt":"2026-05-11T06:58:14Z","fingerprint":"1a9e5f1a836ffb599bcd1a719db328d6090c1e17","fileCount":46,"truncated":false} -->

### (root)/
- `.env.local.example`
- `.gitignore`
- `AGENTS.md`
- `CLAUDE.md`
- `eslint.config.mjs`
- `GSD_BRIEF.md`
- `middleware.ts`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `README.md`
- `tsconfig.json`
- `vercel.json`

### app/
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`

### app/api/generate/
- `app/api/generate/route.ts`

### app/api/image/
- `app/api/image/route.ts`

### app/api/questions/
- `app/api/questions/route.ts`

### app/api/rate/
- `app/api/rate/route.ts`

### app/api/submit-issue/
- `app/api/submit-issue/route.ts`

### app/api/suggestions/
- `app/api/suggestions/route.ts`

### app/api/validate/
- `app/api/validate/route.ts`

### app/bug/
- `app/bug/page.tsx`

### app/components/
- `app/components/CharacterPicker.tsx`
- `app/components/FunninessSlider.tsx`
- `app/components/GenerateButton.tsx`
- `app/components/IssueForm.tsx`
- `app/components/StoryDisplay.tsx`
- `app/components/StoryForm.tsx`
- `app/components/ThemePicker.tsx`
- `app/components/ThemeToggle.tsx`

### app/feedback/
- `app/feedback/page.tsx`

### lib/
- `lib/anthropic.ts`
- `lib/constants.ts`
- `lib/content-filter.ts`
- `lib/cost-logger.ts`
- `lib/models.ts`
- `lib/ratelimit.ts`
- `lib/sanitize.ts`
- `lib/supabase.ts`

### public/
- `public/.keepalive`

### scripts/
- `scripts/check-models.ts`

### supabase/
- `supabase/schema.sql`
- `supabase/seed.sql`
