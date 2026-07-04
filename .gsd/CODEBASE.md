# Codebase Map

Generated: 2026-07-03T23:50:22Z | Files: 63 | Described: 0/63
<!-- gsd:codebase-meta {"generatedAt":"2026-07-03T23:50:22Z","fingerprint":"c462c17438355ffa94eae0a49741b430a2362211","fileCount":63,"truncated":false} -->

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

### app/admin/
- `app/admin/actions.ts`
- `app/admin/layout.tsx`
- `app/admin/page.tsx`

### app/admin/login/
- `app/admin/login/LoginForm.tsx`
- `app/admin/login/page.tsx`

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
- `app/components/CharCounter.tsx`
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
- `lib/admin-auth.ts`
- `lib/admin-metrics.ts`
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
