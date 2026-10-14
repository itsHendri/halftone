# Halftone docs site

How the kits work, setup, and every component live in a phone or browser frame. Next.js 16 + Fumadocs 16, styled with
the kit's own tokens, built as a fully static site and served by Cloudflare as static assets (no Worker
script, so no request or CPU limits apply on the free plan).

This app is monorepo-only by design: it reads `apps/mobile` and `apps/web` (tokens, registries,
`DESIGN_SYSTEM.md`, `llms.txt`) and embeds both kits: the mobile kit's web export under `/m` (phone frames)
and the web kit's static export under `/w` (browser frames). Component pages live at
`/components/mobile/<id>` and `/components/web/<id>`.

## Develop

```bash
npm install                 # at the repo root
npm run docs:dev            # http://localhost:3000
```

The frames load the kits from `/m` and `/w`, which only exist after a build. To see them live while
developing, run the kits alongside and point the site at them (each kit must accept the site's origin):

```bash
EXPO_PUBLIC_EMBED_ORIGINS=http://localhost:3000 npm run web -- --port 8090          # terminal 1: mobile kit
NEXT_PUBLIC_EMBED_ORIGINS=http://localhost:3000 npm run web:dev                     # terminal 2: web kit, :3100
NEXT_PUBLIC_KIT_WEB_URL=http://localhost:8090 NEXT_PUBLIC_WEB_KIT_URL=http://localhost:3100 npm run docs:dev
```

## Build and preview

```bash
npm run docs:build          # → apps/docs/out (a few minutes: includes both kits' exports)
npm run docs:preview        # serves out/ with Cloudflare's own rules, http://localhost:8788
npm run check:links -w apps/docs
```

`scripts/build-docs.mjs` does, in order: `kit-tokens build` (→ `app/tokens.css`), the generated pages
(`scripts/prepare-content.mjs`), the mobile kit's web export with `KIT_WEB_BASE_URL=/m` into `public/m`,
its shadcn registry into `public/r/native`, the web kit's static export with `KIT_WEB_BASE_PATH=/w` into
`public/w`, its registry into `public/r/web`, `_redirects` (one rule per mobile kit route; a blanket `/m/*`
rule would swallow the kit's JavaScript; the web kit prerenders every route and needs none) and `_headers`,
then `next build`, then a check that it all landed in `out/`.

## Deploy (Cloudflare Workers, static assets)

One-time, in the Cloudflare dashboard: **Workers & Pages → Create → Import a repository**, pick
`itsHendri/halftone`, then:

| Setting | Value |
|---|---|
| Root directory | `/` (the repo root: the lockfile lives there, and the build needs both kits) |
| Build command | `npm ci && npm run docs:build` |
| Deploy command | `npx wrangler deploy --config apps/docs/wrangler.jsonc` |
| Non-production branch deploy command | `npx wrangler versions upload --config apps/docs/wrangler.jsonc` |
| Build variables | `NODE_VERSION=24` |

Every push to `main` deploys; other branches get preview URLs. Once you know the production URL, set
`siteUrl` in the repo-root `kit.json` so `install.md` and `llms.txt` use absolute links.

Manual deploy instead: `npm run docs:build && npx wrangler deploy` from `apps/docs` (after `npx wrangler login`).
