---
name: apply-theme
description: Apply a theme from the Halftone docs theme picker (a `ht1-…` or `ht2-…` code, a preset name like `editorial`, a recipe file, or a shadcn/ui preset code like `b5owWMfJ8l`) to this kit's tokens, then verify it. Use when the user pastes a theme code, says "apply this theme", "use the Editorial preset", "re-brand to <colour>", or hands over the prompt the docs' "Use theme" panel copies. Also for a brand zip (`brand-mobile.zip`, `brand-web.zip`, `brand.zip`) from the studio's Brand assets: a logo, app icon or favicon.
---

# Apply a theme

A theme is a recipe (brand colour, neutral, radius, fonts, icon stroke, depth, density, border) that
`halftone-tokens` expands into `tokens/tokens.json`. It only rewrites the paths a theme owns and records the
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
  npx halftone-tokens theme apply <code|preset> --dry-run
  npx halftone-tokens theme apply <code|preset>
  ```

`halftone-tokens theme presets` lists the presets; `halftone-tokens theme show` says which theme is applied now.

**A shadcn/ui preset code** (from ui.shadcn.com/create, e.g. `b5owWMfJ8l`) applies the same way: it becomes the
nearest Halftone theme, and the command lists every value it approximated or dropped (fonts outside Halftone's
list, other icon libraries, chart colours, shadcn's styles). Tell the user what it listed.
`halftone-tokens theme decode <code>` shows the mapping without applying anything. A kit copied out before
`@halftone-ds/tokens` supported shadcn codes says the code is not a theme code: open it in the studio at
halftonedesignsystem.com/themes (**Open**), then apply the `ht` code **Use theme** gives.

## 2. When it refuses

- **"no theme recorded"**: tokens.json predates themes. Ask whether its colours were customised; if not (or
  the user agrees to replace them), re-run with `--force`.
- **"edited by hand since …"**: someone changed theme tokens directly. Show the user the listed paths and ask
  before re-running with `--force` (which overwrites them).
- **"has a typo"**: the code was mangled in copy-paste. Ask for it again; never guess a code.

## 3. After applying

1. Tell the user which colours were **adjusted for contrast** (the apply output lists them, light and dark,
   before → after). The hue is kept; only lightness moves, so every pairing passes WCAG AA.
2. If the theme changes fonts, they load through `next/font` (app/fonts.ts, generated); restart a
   running dev server (`npm run dev`).
3. Run the **qc-pass** skill. Look at Foundations (colour, type, radius) and one sample page in light and
   dark, at 375px and 1280px.
4. `git diff --stat`: only `tokens/tokens.json` and generated files (lib/theme.ts,
   tokens/generated/*, DESIGN.md, app/tokens.css, app/fonts.ts) should change.

Never hand-edit the generated files to "tweak" a theme; change the theme (in the docs studio, or another
code) and apply again.

## 4. Brand assets (a logo and favicons)

A theme code carries no logo. The theme studio's **Use theme › Brand assets** downloads one as a zip laid out
like the kit, drawn in the theme's colours:

| Zip | Unzip at | It writes |
| --- | --- | --- |
| `brand-web.zip` | this kit's root | `lib/brand.ts` (the logo `<Logo>` shows), `app/icon.png` (the favicon), `app/apple-icon.png` |
| `brand.zip` | the Halftone monorepo's root | the same under `apps/web`, and the mobile kit's under `apps/mobile` |

1. `unzip -o <zip>` at that root, then `git diff --stat` to show the person what it replaced.
2. `npm run typecheck`. Next picks up `app/icon.png` and `app/apple-icon.png` by their names (no metadata to
   write); reload the dev server's page. The logo shows wherever `<Logo>` is: the kit header and every
   sample's shell.
3. Run the **qc-pass** skill: the logo in light and dark (a one-colour logo takes the text colour; a coloured
   one switches to its dark version when it has one), and the favicon in the tab.

Never redraw the icons by hand: change the logo in the studio and download again. Without the zip, `<Logo>` draws a
placeholder square and the name. To go back: `git checkout -- lib/brand.ts`, then delete `app/icon.png` and
`app/apple-icon.png`.
