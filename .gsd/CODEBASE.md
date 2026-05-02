# Codebase Map

Generated: 2026-04-23T12:26:29Z | Files: 34 | Described: 0/34
<!-- gsd:codebase-meta {"generatedAt":"2026-04-23T12:26:29Z","fingerprint":"3afd33d993e5d4184b6566f6d9ac08c8e1da4b77","fileCount":34,"truncated":false} -->

### (root)/
- `.env.local.example`
- `.gitignore`
- `AGENTS.md`
- `CLAUDE.md`
- `eslint.config.mjs`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `README.md`
- `tsconfig.json`

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
- `app/components/GenerateButton.tsx`
- `app/components/IssueForm.tsx`
- `app/components/StoryDisplay.tsx`
- `app/components/StoryForm.tsx`
- `app/components/ThemeToggle.tsx`

### app/feedback/
- `app/feedback/page.tsx`

### lib/
- `lib/anthropic.ts`
- `lib/constants.ts`
- `lib/content-filter.ts`
- `lib/ratelimit.ts`
- `lib/supabase.ts`

### supabase/
- `supabase/schema.sql`
- `supabase/seed.sql`
