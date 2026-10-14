# Halftone — agent guide (repo root)

A monorepo of prototype kits. Each app is self-contained; this file only covers how they fit together.

```
apps/mobile/    Expo mobile kit. Its AGENTS.md, DESIGN_SYSTEM.md and .claude/skills are the rules for any mobile work.
apps/docs/      Docs site (Next + Fumadocs, static export for Cloudflare). Reads apps/mobile; the one app allowed to.
apps/web/       Web kit: Next.js + shadcn/ui. Its AGENTS.md, DESIGN_SYSTEM.md and .claude/skills are the rules for web work.
packages/tokens/ @halftone/tokens: the token build (DTCG → NativeWind, Tailwind 4, TS, DESIGN.md, Figma) every app uses.
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
- **One brand.** `apps/mobile/tokens/tokens.json` is the source; `npm run tokens:sync` copies it to `apps/web` and
  rebuilds. CI fails when the copies differ.
- React and react-dom are pinned once, in the root `overrides`, to the version the Expo SDK requires.
  An SDK upgrade moves every app.
- Tailwind 3 (mobile, NativeWind) and Tailwind 4 (docs, web) coexist: the root pins `tailwindcss@^3`
  so v3 hoists and v4 nests under the Next apps. `npm ls tailwindcss` should show that.

## Packages and releases

- `packages/tokens` is `@halftone/tokens`. Apps depend on it by range (`^1.0.0`); inside the repo npm
  links the workspace copy, outside it installs from npm. Change the build there, run
  `npm test -w packages/tokens`, then rebuild an app's tokens (`npm run tokens:build -w apps/mobile`).
- Anything in a package that should ship needs a changeset: `npx changeset` at the root. Merging to main
  opens a "Version Packages" PR; merging that publishes to npm (`.github/workflows/release.yml`, trusted
  publishing). Never bump package versions by hand, and keep app ranges on the same major.
- CI's `extract` job copies apps/mobile out of the repo and runs its checks standalone. If it fails, an app
  has started depending on something outside its folder.

## Skills

The mobile kit's skills (`add-component`, `apply-theme`, `qc-pass`, `transcript-to-prototype`) live in
`apps/mobile/.claude/skills` and travel with the app. Claude Code loads them once a file under
`apps/mobile` is opened, or start Claude from `apps/mobile`.
