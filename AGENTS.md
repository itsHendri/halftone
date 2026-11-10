# Halftone — agent guide (repo root)

A monorepo of prototype kits. Each app is self-contained; this file only covers how they fit together.

```
apps/mobile/    Expo mobile kit. Its AGENTS.md, DESIGN_SYSTEM.md and .claude/skills are the rules for any mobile work.
apps/docs/      Docs site (Next + Fumadocs, static export for Cloudflare). Reads apps/mobile; the one app allowed to.
apps/web/       Web kit: Next.js + shadcn/ui. Its AGENTS.md, DESIGN_SYSTEM.md and .claude/skills are the rules for web work.
apps/vite/      Starter: Vite + React Router + a Cloudflare Worker, built from the web kit's registry. Its own AGENTS.md.
packages/tokens/ @halftone-ds/tokens: the token build (DTCG → NativeWind, Tailwind 4, TS, DESIGN.md, Figma) every app uses.
tests/react-app/ a plain Vite + React Router app the web kit installs into (npm run check:react-app; CI job react-app).
tests/expo-app/  a plain Expo + NativeWind app the native kit installs into (npm run check:expo-app; CI job expo-app).
kit.json        The kit's name and addresses, read by the generators.
```

## Rules

- **Work inside one app.** Read that app's `AGENTS.md` first. For the mobile kit: `apps/mobile/AGENTS.md`
  and `apps/mobile/DESIGN_SYSTEM.md`.
- **Apps never import from each other or reach outside their folder** (except apps/docs, which documents them
  and is never extracted). An app must keep working when it
  is copied out on its own (`npx giget gh:itsHendri/halftone/apps/mobile`). Shared code goes through a
  published package in `packages/`, depended on by version range.
- **One install, at the root.** `npm install` at the repo root (npm workspaces). Run an app's scripts
  from its folder or with `-w apps/<name>`. Never add a lockfile inside an app.
- **One brand.** `apps/mobile/tokens/tokens.json` is the source; `npm run tokens:sync` copies it to `apps/web`, `apps/vite` and
  rebuilds. CI fails when the copies differ.
- React and react-dom are pinned once, in the root `overrides`, to the version the Expo SDK requires.
  An SDK upgrade moves every app.
- **The kits' colour rules lint the docs site too** (`apps/docs/eslint.config.mjs` reads `apps/mobile/eslint/halftone.mjs`):
  no raw colours, no colour at an opacity. In Claude Code the lint-on-edit hook covers it as it does the kits
  (`.claude/settings.json` here and in `apps/docs`), so an edit that breaks one comes straight back with the error.
  *Why:* the site shows the brand, so it follows the brand's rules; finding out at CI is a round trip too late.
- Tailwind 3 (mobile, NativeWind) and Tailwind 4 (docs, web) coexist: the root pins `tailwindcss@^3`
  so v3 hoists and v4 nests under the Next apps. `npm ls tailwindcss` should show that.

## Packages and releases

- `packages/tokens` is `@halftone-ds/tokens`. Apps depend on it by range (`^1.0.0`); inside the repo npm
  links the workspace copy, outside it installs from npm. Change the build there, run
  `npm test -w packages/tokens`, then rebuild an app's tokens (`npm run tokens:build -w apps/mobile`).
- Anything in a package that should ship needs a changeset: `npx changeset` at the root. Merging to main
  opens a "Version Packages" PR; merging that publishes to npm (`.github/workflows/release.yml`, trusted
  publishing). Never bump package versions by hand, and keep app ranges on the same major.
- CI's `react-app` job installs the web kit into `tests/react-app` the way install.md tells anyone to (its own
  `components.json`, `halftone-tokens init` from this commit, every kit component from this commit's registry), builds it
  and opens it in Chromium. If it fails, a kit component has started to need Next.js, or the install path broke.
- **The starter's kit files are generated.** `apps/vite/src/components/{ui,kit}` (and `src/hooks`, `src/lib/link.tsx`)
  are what the web kit's registry hands out: `npm run registry:dist -w apps/web && npm run vite:sync` writes them,
  and CI's `vite` job fails when they differ. Change a kit component in `apps/web`, never in `apps/vite`. *Why:* the
  starter is the registry's output, so it can't drift from the kit, and it shows what anyone installing it gets.
- **The docs site's Controls are generated too.** `apps/docs/components/controls`, `apps/docs/lib/controls` and
  `apps/docs/hooks` are the web kit's Controls family as its registry hands it out: `npm run registry:dist -w apps/web &&
  npm run docs:sync` writes them, and CI's `vite` job fails when they differ. Change a Control in `apps/web`, never in
  `apps/docs`. *Why:* the Studio then runs on exactly what an install gets, and every import resolves in the docs site's
  own folders.
- CI's `vite` job also copies apps/vite out, installs it on its own and opens it, Worker included, in Chromium
  (`npm run check:vite`).
- CI's `extract` job copies apps/mobile out of the repo and runs its checks standalone. If it fails, an app
  has started depending on something outside its folder.

## Skills

The mobile kit's skills (`add-component`, `apply-theme`, `qc-pass`, `transcript-to-prototype`) live in
`apps/mobile/.claude/skills` and travel with the app. Claude Code loads them once a file under
`apps/mobile` is opened, or start Claude from `apps/mobile`.
