# Codebase Map

Generated: 2026-05-15T22:59:25Z | Files: 55 | Described: 0/55
<!-- gsd:codebase-meta {"generatedAt":"2026-05-15T22:59:25Z","fingerprint":"22129c196ff1ea8ed3b7167d63cd4faed6172143","fileCount":55,"truncated":false} -->

### (root)/
- `.env.local.example`
- `.gitignore`
- `AGENTS.md`
- `CLAUDE.md`
- `eslint.config.mjs`
- `GSD_BRIEF.md`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `PROJECT.md`
- `proxy.ts`
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
- `app/components/StoryFormLoader.tsx`
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
