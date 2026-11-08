# Plan: the web kit in any React app

2026-11-08. Follows the decisions on the workspace-install feedback (`2026-11-06-workspace-install.md`): the web kit
works in **any React app**, for **prototypes and real products**; links through one place the app sets; the brand
file through `halftone-tokens init`; and our own copies of the shadcn parts that pull in a button.

## In plain words

Today the web kit assumes Next.js in three places, and the install leaves the brand file half-delivered. After this
work, someone with any React app (Vite, React Router, Next.js…) can:

1. write one settings file and run `npx halftone-tokens init` (with a Studio theme code if they have one),
2. add kit parts with `npx shadcn add`, in any order, without our button being swapped out,
3. tell the kit, once, how their app makes links,

and everything looks and works the way it does in our own kit. A check runs on every change and builds the kit
into a small Vite + React Router app, so this keeps working.

The work is four pieces, each its own pull request, one at a time. Pieces 1–3 don't depend on each other. Piece 4
(the guide and the check) needs all three.

## A change to a decision: where the link setting lives

You chose "one swappable link file". While planning, I found a catch. When someone adds or updates a kit part, the
installer re-copies the kit's files, including that link file. With the "overwrite" answer the guide recommends,
**their edit is silently replaced**, and their links break again. That's the same trap as the button swap.

**Recommended instead: the same idea, set in the app's own code.** The kit's parts still get their links from one
place, but the app says which link to use **once, at the top of its own code** (a few lines in its root file), not
by editing a kit file. The installer never touches the app's own code, so the setting survives every update. If an
app doesn't set it, links still work as plain web links (each click reloads the page). This is how well-known
component libraries (React Aria, Mantine) handle it.

**Decided (2026-11-08):** set once in the app's own code.

## Piece 1: links (web kit)

- New `apps/web/lib/link.tsx` (`'use client'`): `KitLinkProvider` (props `link`: a component taking `href`,
  `className`, `children` and anchor props; `usePathname`: a hook), `KitLink` and `usePathname` read from it.
  Defaults: a plain `<a>` and `window.location.pathname`. Ships automatically as the `lib-link` registry item
  (`@/lib/…` imports already map to `lib-*` items in `scripts/registry-build.mjs`).
- The six kit files (`list-row`, `footnote`, `promo-card`, `section-header`, `action-grid`, `app-shell`) import
  `KitLink`/`usePathname` from `@/lib/link` instead of `next/link`/`next/navigation`.
- The kit's own app sets it once with Next.js's link and `usePathname` in `components/site/providers.tsx` (a client
  file, because a component can't be passed from the server layout).
- Lint: `no-restricted-imports` of `next/link` and `next/navigation` in `components/kit/**`, with the reason, so
  new kit parts don't bring Next.js back.
- Docs: the guide's snippets for Next.js, React Router and "nothing" (plain links). `llms.txt` and the AGENTS
  gotchas say kit parts link through `@/lib/link`.
- Checks: typecheck, lint, registry build and roundtrip, `qc:look` on pages with AppShell and linked rows. Clicks
  stay client-side in the kit (no full reload) and the sidebar still highlights the open page.

## Piece 2: `halftone-tokens init` and web fonts (tokens package)

- `npx halftone-tokens init [--theme <code|preset|file>] [--css <path>] [--force]`:
  - writes `tokens/tokens.json` (a starting brand shipped in the package as `templates/tokens.json`) and a
    `tokens/tokens.config.json` with only `shadcn-web` (plus `fonts` when the theme has custom fonts);
  - picks where `tokens.css` goes next to the app's main stylesheet (`app/globals.css`, `src/index.css`,
    `src/app.css`…, or `--css`); applies the theme if given; runs the first build (contrast checked);
  - adds `@import './tokens.css'` to that stylesheet if it's missing, and **warns, without deleting**, about
    `:root`, `.dark`, `@theme` or `body` rules that would override the kit;
  - refuses to overwrite an existing `tokens.json` without `--force`.
- `fonts` target, `platform: 'web'` (feedback #11): a `fonts.css` with the Google Fonts `@import` and the
  `--kit-font-*` variables, for apps without `next/font`.
- `templates/tokens.json` stays one brand with the kits: `npm run tokens:sync` copies it there too, and
  `--check` covers it in CI.
- Tests: init into a temp folder (default, with a theme code, with custom fonts, refusing to overwrite, finding
  each stylesheet name), and the web fonts output. `npm pack --dry-run` shows the template is shipped.
- A **minor** changeset. The guide can only point to `init` once it's on npm, so publishing needs your go. Until
  then the guide keeps today's five steps.

## Piece 3: button-safe copies (web registry)

- Rule in `scripts/registry-build.mjs`: an unchanged shadcn file that imports a file the kit **has** changed
  (directly or through another file) is published as **our** item, not as a pointer to shadcn's. Its button
  dependency then points at ours. Today that's alert-dialog, dialog and pagination. The rule picks up any new case
  by itself, and the same rule decides how other parts depend on them (so a part that uses dialog gets ours too).
- The docs component pages show these as kit installs (`@halftone-web/dialog`), with a note: "unchanged from
  shadcn/ui; published by the kit so it uses the kit's button".
- `registry:drift` and the roundtrip already cover them; the roundtrip proves they reinstall identically.
- Guide: keep the note for shadcn parts **outside** the kit that use a button (carousel, sidebar…).

## Piece 4: the guide, the rules and the check

- **install.md**: path D becomes "add kit components to an existing React app": one path for Next.js, Vite + React
  Router and the rest, with small "Next.js" / "React Router" / "other" notes only where they differ (links, the
  stylesheet name, `rsc`). It uses `halftone-tokens init` once 1.5.0 (or whatever version) is published. The
  component pages' "Existing Next.js app" tab becomes "Existing React app".
- **Real products**: a short "Using the kit in a real product" section in both kits' `AGENTS.md` and in
  install.md's rules. The component and token rules stay the same; real data and real APIs are fine; folders and
  routing follow the host app. "Mock data, never call real APIs" becomes a prototype rule, with its reason (a
  prototype must run anywhere without accounts).
- **The check**: `tests/react-app/`, a minimal committed Vite + React Router + Tailwind 4 app (outside the npm
  workspaces, own pinned `package.json`). A new CI job: build the registry, serve it locally, `halftone-tokens init`
  from the packed workspace package, `shadcn add` every kit item, set the router link, `tsc` and `vite build`, then
  open one page in Playwright: no console errors, the AppShell highlights the open page, and a link navigates
  without a reload.
- The `ROADMAP.md` entry moves to Done.

## Not in this plan

- A ready-made Vite starter next to the Next.js one: a third app to maintain. Its own decision if people ask.
- `halftone-tokens doctor`: still a good idea for setups that go wrong in other ways. Later.
- Promising named support for Astro, Remix and others: "should work, same steps"; only Vite + React Router is tested.
- The mobile kit's install note still prints once per part (path C). Not raised by this feedback; same fix as the
  web one, if wanted.

## Order

0. Commit the fix-now branch (`fix/workspace-install-feedback`) and open its PR.
1. Pieces 1, 2, 3, one at a time, each its own PR (any order; links first, since it's the one users hit first).
2. Release `@halftone-ds/tokens` with `init`, on your go.
3. Piece 4.
