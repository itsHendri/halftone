---
name: apply-theme
description: Apply a theme from the Halftone docs theme picker (a `ht1-…` or `ht2-…` code, a preset name like `editorial`, or a recipe file) to this kit's tokens, then verify it. Use when the user pastes a theme code, says "apply this theme", "use the Editorial preset", "re-brand to <colour>", or hands over the prompt the docs' "Use theme" panel copies.
---

# Apply a theme

A theme is a recipe (brand colour, neutral, radius, fonts, icon stroke, depth, density, border) that
`kit-tokens` expands into `tokens/tokens.json`. It only rewrites the paths a theme owns and records the
recipe under `$extensions["com.halftonedesignsystem.theme"]`; everything else in tokens.json is left alone.

## 1. Where am I?

- **Inside the Halftone monorepo** (a `scripts/theme-apply.mjs` two levels up): run it from the repo root so
  mobile, web and the docs stay one brand:

  ```bash
  npm run theme:apply -- <code|preset> --dry-run   # see what it will do, and what it adjusts for contrast
  npm run theme:apply -- <code|preset>
  ```

- **A kit copied out on its own**: from the app folder:

  ```bash
  npx kit-tokens theme apply <code|preset> --dry-run
  npx kit-tokens theme apply <code|preset>
  ```

`kit-tokens theme presets` lists the presets; `kit-tokens theme show` says which theme is applied now.

## 2. When it refuses

- **"no theme recorded"**: tokens.json predates themes. Ask whether its colours were customised; if not (or
  the user agrees to replace them), re-run with `--force`.
- **"edited by hand since …"**: someone changed theme tokens directly. Show the user the listed paths and ask
  before re-running with `--force` (which overwrites them).
- **"has a typo"**: the code was mangled in copy-paste. Ask for it again; never guess a code.

## 3. After applying

1. Tell the user which colours were **adjusted for contrast** (the apply output lists them, light and dark,
   before → after). The hue is kept; only lightness moves, so every pairing passes WCAG AA.
2. If the theme changes fonts, the apply step installs the `@expo-google-fonts/*` packages it needs; a
   running dev server must be restarted (`npm run dev`), and Expo Go reloads.
3. Run the **qc-pass** skill. Look at Foundations (colour, type, radius) and one sample screen in light and
   dark on the simulator.
4. `git diff --stat`: only `tokens/tokens.json` and generated files (global.css, lib/theme.ts,
   tokens/generated/*, DESIGN.md, lib/fonts.ts) should change, plus package.json for new fonts.

Never hand-edit the generated files to "tweak" a theme; change the theme (in the docs studio, or another
code) and apply again.
