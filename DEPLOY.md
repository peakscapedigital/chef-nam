# Deploying the Chef Nam Catering Website

## How it works (one sentence)

**Push to GitHub → a GitHub Action builds the Astro site and `wrangler deploy`s it to the Cloudflare Worker `chef-nam`.**

- The live site is the **Worker `chef-nam`** (apex `chefnamcatering.com` attached as a Worker custom domain). The
  old `chef-nam` **Pages** project was deleted 2026-06-15 (CN-006) — there is no Pages deploy anymore.
- GitHub repo `peakscapedigital/chef-nam`, **production branch `main`**, CF account `090ff2bbc69fa3773a65881f1decb269`.
- **`git push` to `main` → `.github/workflows/deploy.yml`** runs `astro check` → `npm run build` → `npx wrangler deploy`
  → `wrangler secret bulk` → live at https://chefnamcatering.com.
- **`git push` of any other branch → `.github/workflows/preview.yml`** deploys a separate `chef-nam-preview` Worker,
  reachable only at `https://chef-nam-preview.jason-090.workers.dev` (does NOT touch production).
- `www.chefnamcatering.com` is a **redirect-only host (Option 1)**: proxied `A → 192.0.2.1` (RFC 5737 dummy) + a
  zone Single Redirect rule (`301 → apex`, query preserved). `www` is NOT attached to the Worker, so a removed/broken
  rule makes `www` **522** (never a 200 duplicate). **Do not** use `AAAA → 100::` as the dummy (that's CF's
  managed-service sentinel → 404). See `systems/site-deploy-standard.md` rule 6.

## Deploy (production)

```bash
git push origin main      # deploy.yml builds + wrangler-deploys the Worker
```

## Preview a branch before going live

```bash
git push origin <your-branch>     # preview.yml deploys chef-nam-preview at chef-nam-preview.jason-090.workers.dev
```

## Environment variables / secrets

The live site is the **Worker `chef-nam`** (serves `chefnamcatering.com`); the `chef-nam` Pages project is
deprecated (only `chef-nam.pages.dev`). Secrets are **Worker secrets**, managed by the deploy Action via
`wrangler secret bulk secrets.json` (built from the CI `.env`), or manually with
`npx wrangler secret put <NAME>` (deploys to the Worker named in wrangler.toml). Server code reads them via
`import { env } from 'cloudflare:workers'` (Astro 6; `Astro.locals.runtime.env` was removed).

Production currently has (verified via CF API 2026-06-12): `BIGQUERY_PROJECT_ID`, `BIGQUERY_CREDENTIALS`,
`FIREBASE_CREDENTIALS`, `TRELLO_API_KEY`, `TRELLO_API_TOKEN`, `BREVO_API_KEY`, `GA4_API_SECRET`,
`GA4_MEASUREMENT_ID`, `GOOGLE_ADS_*`, `PUBLIC_SANITY_API_TOKEN`, `PUBLIC_SUPABASE_*`.

`AIRTABLE_API_KEY` (Airtable PAT, value in `~/.claude/mcp-secrets.env`) is the **activation switch** for the
Airtable lead-pipeline parallel track (CN-006). Until it is set, the Airtable write in `submit-form.ts` is
skipped and the existing BigQuery/Firestore/Trello path is unchanged. Set it in Production to start mirroring
new leads into the Airtable `Leads` kanban.
**The Preview environment is empty** — a preview deploy renders but skips lead writes unless those are added to Preview.

## Wrangler fallback (rarely needed)

Git push is canonical. Only reach for wrangler if the GitHub integration is down — and note the local
wrangler OAuth token expires (fails with `Authentication error [code: 10000]`); re-login with `npx wrangler login`.
If you must: `npm run build && npx wrangler pages deploy dist --project-name chef-nam`.

## Build / test locally

```bash
npm install
npm run build       # production build → dist/
npm run preview     # run the built worker locally on workerd (http://localhost:4321)
npm run dev         # dev server
```

## Custom domains

- chefnamcatering.com (primary)
- www.chefnamcatering.com → redirects to primary

---
*Last verified: 2026-06-12 (Astro 6 / @astrojs/cloudflare v13).*
