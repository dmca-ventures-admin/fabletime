# Knowledge Base

## Supabase two-project setup (preview + production)

**Context:** Fabletime uses two separate Supabase projects for environment isolation. Vercel env vars are split so preview deployments hit the preview DB and production hits the prod DB.

**Projects:**
- **Preview/Dev:** `krunpmrbijfghbnpcodw` (fabletime-preview) — used by local dev and Vercel preview deployments
- **Production:** `ltojwsoqaomzalfxxzwt` (fabletime-prod) — used by Vercel production deployments

**Vercel env var mapping:**
| Variable | Preview + Development | Production |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | fabletime-preview URL | fabletime-prod URL |
| `SUPABASE_ANON_KEY` | fabletime-preview anon key | fabletime-prod anon key |
| `ANTHROPIC_API_KEY` | Shared across all | Shared across all |
| `GITHUB_TOKEN` | Shared across all | Shared across all |

**Schema management:** Both databases need schema changes applied separately. Use the Supabase Management API:
```bash
export $(grep -v '^#' .env.local | xargs)
# Preview
curl -s -X POST "https://api.supabase.com/v1/projects/krunpmrbijfghbnpcodw/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -Rs '{query: .}' supabase/schema.sql)"
# Production
curl -s -X POST "https://api.supabase.com/v1/projects/ltojwsoqaomzalfxxzwt/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -Rs '{query: .}' supabase/schema.sql)"
```

**Discovered:** Post-S03 session — user requested environment separation after noticing preview and production shared a single DB.

## Vercel preview deployment protection

**Context:** Vercel hobby accounts have "Standard Protection" (SSO authentication) enabled by default on preview deployments. This blocks unauthenticated `curl` and API requests to preview URLs with a 401. The setting can only be fully disabled from the Vercel dashboard UI at Settings → Deployment Protection — the API changes (`ssoProtection`, `vercelAuthentication`) don't fully override it.

**Workaround:** Access preview URLs through a browser where you're logged into Vercel. Production deployments on custom domains are unaffected.

**Dashboard path:** https://vercel.com/dmca-ventures-admins-projects/fabletime/settings/deployment-protection

**Discovered:** Post-S03 session — `curl` to preview `/api/suggestions` returned 401 despite API-level protection changes.

## Applying SQL to Supabase without psql

**Context:** The Supabase CLI v2.75 doesn't have `db execute`. Use the Management API endpoint instead.

**Pattern:**
```bash
curl -s -X POST "https://api.supabase.com/v1/projects/<PROJECT_REF>/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -Rs '{query: .}' path/to/file.sql)"
```
Returns `[]` on success (no rows), or a JSON array of result rows.

**Discovered:** Post-S03 session — needed to apply schema.sql and seed.sql to both Supabase projects without psql or Supabase CLI execute support.

## Tag GitHub issues as in-progress when work starts

**Context:** User wants `in-progress` label applied to GitHub issues when active development begins on them.

**Pattern:** `gh issue edit <number> --repo dmca-ventures-admin/fabletime --add-label "in-progress"`. The label (yellow, `#FBCA04`) was created in the repo. Recorded as decision D006.

**Discovered:** Post-S03 session — user requested as standard practice.

## Push milestone branches to origin after slice completion

**Context:** User wants every milestone branch pushed to GitHub after each slice completes, so Vercel preview deployments are triggered automatically.

**Pattern:** After the final task of a slice is committed, run `git push origin milestone/<MID>`. The first push needs `-u` to set tracking. Subsequent pushes are plain `git push`.

**Discovered:** T03 (S03/M001) — user explicitly requested this as default workflow behavior. Recorded as decision D005.

## supabase-js does not throw on DB errors

**Context:** `@supabase/supabase-js` `.insert()`, `.select()`, `.update()`, `.delete()` return `{ data, error }` — they resolve the Promise even on database errors (constraint violations, missing tables, permission denied, etc.). A bare `try/catch` only catches network-level failures.

**Pattern:** Always destructure `{ error }` from the result AND wrap in try/catch:
```typescript
try {
  const { error } = await supabase.from('table').insert({ ... });
  if (error) {
    console.error('DB error:', error);
  }
} catch (networkError) {
  console.error('Network error:', networkError);
}
```

**Discovered:** T02 (S01/M001) — the task plan only specified try/catch, which would have silently swallowed all DB-level insert failures.

## Content filter model name must be exact

**Context:** The content filter (`lib/content-filter.ts`) was using model name `claude-haiku-4-20250514` which doesn't exist. The API returned 404 on every call, the fail-closed catch returned `false`, and every user-submitted entry was incorrectly marked as not child-friendly. No entries appeared as suggestions despite having usage_count > 0.

**Correct model:** `claude-haiku-4-5` — no date suffix. Verified working. Older Haiku models (3, 3.5) are retired as of Feb 2026.

**Diagnostic:** If suggestions stop appearing for user-submitted entries, check `SELECT value, child_friendly FROM custom_entries WHERE child_friendly = false;` — if everything is false, the content filter API call is likely failing silently. Reset with `UPDATE custom_entries SET child_friendly = NULL WHERE child_friendly = false;` after fixing.

**Discovered:** Post-S03 session — all user-submitted entries (Robot, Friendship, Rabbit, Fish) were missing from suggestions.

## Rating FK violation — story persist timing

**Context:** The generate route sends `X-Story-Id` as a response header at stream start, but persists the story to Supabase AFTER the stream closes. The rating UI appears when the stream ends, so users can submit a rating before the story row exists → FK violation on `ratings.story_id → stories.id`.

**Fix:** The rate endpoint retries up to 3 times with 2s delay on FK violations, giving the generate route time to complete the DB insert. If still failing, the retry window (6s total) may need increasing, or the architecture should change to insert a placeholder story row before streaming.

**Discovered:** Post-S03 session — user reported "failed to save rating" on production.

## Store .env.local in project root, not just worktrees

**Context:** The `.env.local` file was only in the git worktree directory (`.gsd/worktrees/M001/.env.local`). Running `git reset --hard` on the main repo checkout wiped the worktree directory, destroying all stored credentials. User had to re-enter tokens.

**Pattern:** Always ensure `.env.local` exists in the main project root (`/Users/dmca-ventures/projects/fabletime/.env.local`), not just in worktrees. Worktrees are ephemeral.

**Discovered:** Post-S03 session — worktree was destroyed and all tokens were lost.

## Vercel CLI deploys fail on Hobby plan with mismatched git author

**Context:** `vercel --prod` fails with "Git author must have access to the team's projects" when the local git committer email (`dmca-ventures@Mac.localdomain`) doesn't match the Vercel account. Hobby plans don't support team collaboration, so there's no way to add the local author.

**Workaround:** Deploy to production by merging to `main` and pushing — Vercel's GitHub integration handles auth through the connected repo. Don't use `vercel --prod` CLI on Hobby plans.

**Discovered:** Post-S03 session — CLI deploy returned team access error.
