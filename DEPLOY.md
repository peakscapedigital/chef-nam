# Deploying the Chef Nam Catering Website

## How it works (one sentence)

**Push to GitHub → Cloudflare Pages builds and deploys automatically. There is no wrangler step.**

- Cloudflare **Pages project: `chef-nam`** (the old name `chef-nam-website` is wrong/legacy — ignore it).
- GitHub repo `peakscapedigital/chef-nam`, **production branch `main`**, CF account `090ff2bbc69fa3773a65881f1decb269`.
- **`git push` to `main` → production build → live at https://chefnamcatering.com.**
- **`git push` of any other branch → a preview deploy** at `https://<branch-alias>.chef-nam.pages.dev` (does NOT touch production).
- No GitHub Actions workflow — the integration lives in the Cloudflare Pages dashboard, not `.github/workflows`.

## Deploy (production)

```bash
git push origin main      # that's it — Pages builds and goes live
```

To watch or trigger a build without wrangler, use the Cloudflare API:
`POST /accounts/090ff2bbc69fa3773a65881f1decb269/pages/projects/chef-nam/deployments` with form field `branch=main`,
then `GET .../deployments/{id}` to watch stages.

## Preview a branch before going live

```bash
git push origin <your-branch>     # Pages auto-builds a preview at <alias>.chef-nam.pages.dev
```

## Environment variables / secrets

Set in the **Cloudflare Pages dashboard**, per environment (Production vs Preview — they are separate).
Server code reads them via `import { env } from 'cloudflare:workers'` (Astro 6; `Astro.locals.runtime.env` was removed).

Production currently has (verified via CF API 2026-06-12): `BIGQUERY_PROJECT_ID`, `BIGQUERY_CREDENTIALS`,
`FIREBASE_CREDENTIALS`, `TRELLO_API_KEY`, `TRELLO_API_TOKEN`, `BREVO_API_KEY`, `GA4_API_SECRET`,
`GA4_MEASUREMENT_ID`, `GOOGLE_ADS_*`, `PUBLIC_SANITY_API_TOKEN`, `PUBLIC_SUPABASE_*`.
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
