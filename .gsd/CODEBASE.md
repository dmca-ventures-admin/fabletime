# Codebase Map

Generated: 2026-05-11T07:43:24Z | Files: 54 | Described: 0/54
<!-- gsd:codebase-meta {"generatedAt":"2026-05-11T07:43:24Z","fingerprint":"ff1cf5cc813b1db0a614a71416adcf9470745c60","fileCount":54,"truncated":false} -->

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
- `PROJECT.md`
- `README.md`
- `tsconfig.json`
- `vercel.json`

### app/
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`

### app/api/contact/
- `app/api/contact/route.ts`

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
- `app/components/ContactForm.tsx`
- `app/components/Footer.tsx`
- `app/components/FunninessSlider.tsx`
- `app/components/GenerateButton.tsx`
- `app/components/IssueForm.tsx`
- `app/components/StoryDisplay.tsx`
- `app/components/StoryForm.tsx`
- `app/components/ThemePicker.tsx`
- `app/components/ThemeToggle.tsx`

### app/contact/
- `app/contact/page.tsx`

### app/feedback/
- `app/feedback/page.tsx`

### app/privacy/
- `app/privacy/page.tsx`

### app/terms/
- `app/terms/page.tsx`

### lib/
- `lib/anthropic.ts`
- `lib/constants.ts`
- `lib/content-filter.ts`
- `lib/content-safety.ts`
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
