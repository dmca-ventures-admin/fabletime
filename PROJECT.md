# PROJECT.md — Fabletime

## Project Info

- **repo:** `dmca-ventures-admin/fabletime`
- **local_path:** `~/projects/fabletime`
- **doppler_project:** `fabletime`
- **doppler_config:** `prd`
- **discord_channel:** `1485963277342085190`

## Deploy Workflow

**NEVER push directly to main.** Always:
1. GSD → commit to `preview/issue-NNN` or `preview/description` branch
2. Push branch → get Vercel preview URL
3. Share preview URL with Daniel and wait for explicit sign-off ("ship it", "looks good")
4. Only then: merge to main and push

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Anthropic SDK (`@anthropic-ai/sdk`)
- Vercel (deployment)
- Supabase (Postgres DB)
- Doppler (secrets)

## GSD Command

```bash
cd ~/projects/fabletime && doppler run --project fabletime --config prd -- ~/.npm-global/bin/gsd --model anthropic/claude-sonnet-4-6 --print '<brief>'
```

Use `anthropic/claude-opus-4-5` for complex builds (new API routes, DB changes, security work).
