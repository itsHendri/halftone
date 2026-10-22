# Halftone (native)

The phone half of Halftone: a brand-agnostic, themeable **Expo** starter your agent builds prototypes from.
It shares one set of design tokens with the web kit, so a prototype on a phone and one in a browser are the
same brand. Every component the kit ships is previewed live inside the app, and lint keeps screens to those
parts. Feed it a brief or a client transcript and get a first prototype in your theme, light and dark.

- **Expo SDK 57** · Expo Router · React Native 0.86 · TypeScript
- **react-native-reusables** (shadcn for React Native) + our own kit components, styled with **NativeWind**
- **Design tokens** in one JSON file → CSS variables + TypeScript, light and dark
- **Components** and **Foundations** screens, searchable, tap-to-copy
- Ships to phones with a **development build + EAS Update**, and to a **web URL** with EAS Hosting

## Quick start

```bash
npm install
npm run ios        # iOS Simulator (Expo Go) — or `npm run web`
```

Then open **Components** in the app.

## Start a real project

1. `npm run setup`. It asks for the app's name, slug, URL scheme and bundle id (`APP_ID`), sets them in
   `app.json`, `package.json` and `.env.local` (from `.env.example`), and offers to run `eas init`, remove the
   samples and apply a theme. It prints the plan and writes nothing until you say yes; `--dry-run` stops at the
   plan. A value already in `.env.local` is only replaced if you say so. `eas init` can't write to the dynamic
   `app.config.ts`, so setup puts the owner and project id it returns into `.env.local` for you; without the
   `eas` CLI, or logged out, it skips that step. Set the same names as EAS environment variables for cloud builds.
   Every question has a flag (`npm run setup -- --help`), so it also runs without questions:
   `npm run setup -- --yes --name "Acme Field" --eject all --theme calm`.
2. Brand: the theme comes from Studio (halftonedesignsystem.com/studio): pass its code or `.halftone.json` to
   setup, or later to `npx halftone-tokens theme apply`. Editing `tokens/tokens.json` by hand works too; run
   `npm run tokens:build` after.
3. Logo, app icon, splash and favicon: add your logo in Studio, download **Use system › Brand assets › Mobile kit**
   and unzip it here (the `apply-theme` skill's "Brand assets" steps).
4. The samples one at a time, later: `npm run eject-samples -- shop habits`; `npm run eject-samples -- --status`
   shows what is left.
5. Build your prototype as its own named segment, `app/<slug>/` (see `AGENTS.md › Building a prototype`).

## Figma

`npm run tokens:figma` writes `tokens/generated/figma-variables.json` (a Variables collection with Light/Dark
modes and `var(--name)` code syntax). With `FIGMA_TOKEN` and `FIGMA_FILE_KEY` set it POSTs to the Variables REST
API (Enterprise seat); otherwise import the JSON through the Figma MCP (`use_figma`) or a variables plugin.

## Sharing

- Phones: `eas build --profile development` once per platform, then `npm run share -- "what changed"`.
- Browser: `npm run export:web && eas deploy` → preview URL.
- Expo Go still works on simulators; on a physical iPhone it requires signing in to the same Expo account.

## Docs

- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — tokens, registry, patterns, anti-patterns. Read before writing UI.
- [`AGENTS.md`](./AGENTS.md) — engineering conventions, workflows, gotchas (also what Claude Code reads).
- [`BACKLOG.md`](./BACKLOG.md) — deferred work.
- [`DESIGN.md`](./DESIGN.md) and [`llms.txt`](./llms.txt) — generated summaries for agents (tokens and the component list).
- [`registry/components.ts`](./registry/components.ts) — what the kit ships. Feeds the Components page, the registry
  tables in `DESIGN_SYSTEM.md`, `llms.txt`, and `registry.json`, the shadcn registry that lets another Expo +
  react-native-reusables app install kit components (`npm run registry:dist` builds it into `dist/r/native`).
- `.claude/skills/` — `add-component`, `qc-pass`, `transcript-to-prototype`.
