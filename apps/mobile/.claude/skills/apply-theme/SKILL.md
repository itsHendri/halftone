---
name: apply-theme
description: Apply a theme or system from Halftone Studio on the docs site (a `ht1-…`, `ht2-…` or `ht3-…` code, a system's `.halftone.json` file, a preset name like `editorial`, a recipe file, or a shadcn/ui preset code like `b5owWMfJ8l`) to this kit's tokens, then verify it. Use when the user pastes a theme code, hands over a `.halftone.json`, says "apply this theme", "use the Editorial preset", "re-brand to <colour>", or hands over the prompt Studio's "Use system" panel copies. Also for a brand zip (`brand-mobile.zip`, `brand-web.zip`, `brand.zip`) from Studio's Brand assets: a logo, app icon or favicon.
---

# Apply a theme

A theme is a recipe (brand colour, neutral, radius, fonts, icon stroke, depth, density, border) that
`halftone-tokens` expands into `tokens/tokens.json`. It only rewrites the paths a theme owns and records the
recipe under `$extensions["com.halftonedesignsystem.theme"]`; everything else in tokens.json is left alone.

A **system** is what Studio (halftonedesignsystem.com/studio) saves: a recipe plus whatever was edited by hand on
top of it (colour ramps and roles, text styles, corners, shadows, extras, the brand). One with no hand edits has
an `ht` code; one with edits travels as `<name>.halftone.json`, which Studio's **Use system** downloads. Both
apply the same way.

## 1. Where am I?

- **Inside the Halftone monorepo** (a `scripts/theme-apply.mjs` two levels up): run it from the repo root so
  mobile, web and the docs stay one brand:

  ```bash
  npm run theme:apply -- <code|preset> --dry-run   # see what it will do, and what it adjusts for contrast
  npm run theme:apply -- <code|preset>
  ```

  A `.halftone.json` path is read from `apps/mobile` (where the script runs), so pass it absolute:
  `npm run theme:apply -- "$PWD/acme.halftone.json"`.

- **A kit copied out on its own**: from the app folder:

  ```bash
  npx halftone-tokens theme apply <code|preset|./name.halftone.json> --dry-run
  npx halftone-tokens theme apply <code|preset|./name.halftone.json>
  ```

`halftone-tokens theme presets` lists the presets; `halftone-tokens theme show` says which theme or system is
applied now (a system's overrides and contrast warnings too).

**A shadcn/ui preset code** (from ui.shadcn.com/create, e.g. `b5owWMfJ8l`) applies the same way: it becomes the
nearest Halftone theme, and the command lists every value it approximated or dropped (fonts outside Halftone's
list, other icon libraries, chart colours, shadcn's styles). Tell the user what it listed.
`halftone-tokens theme decode <code>` shows the mapping without applying anything. A kit copied out before
`@halftone-ds/tokens` supported shadcn codes says the code is not a theme code: import it in Studio at
halftonedesignsystem.com/studio (the systems menu › **Import file or code…**), then apply the `ht` code **Use
system** gives.

**An `ht3-…` code** carries button and field styles (soft or raised buttons, filled or underline fields). It needs
`@halftone-ds/tokens` 1.2 or later; an older one says it's a newer theme code: update it
(`npm i -D @halftone-ds/tokens@^1.2.0`) and apply again. The styles show on every `Button`, `Input`, `Textarea`
and `Select` with no code change; check the Components page's Actions and Inputs in both themes.

**A `.halftone.json`** (a system with edits) needs `@halftone-ds/tokens` 1.3.1 or later: 1.3 brought systems, extras
and the component layer, and 1.3.1 lets a kit typecheck once a system with overrides is applied. Update with
`npm i -D @halftone-ds/tokens@^1.3.1`.

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
   tokens/generated/*, DESIGN.md, lib/fonts.ts) should change,
   plus what `registry:build` writes (apply runs it: DESIGN_SYSTEM.md, llms.txt, registry.json,
   registry/generated/token-usage.json), since which components draw a colour follows the roles a system maps, plus package.json for new fonts.

Never hand-edit the generated files to "tweak" a theme; change the system (in Studio, or another
code) and apply again.

## 4. Brand assets (a logo, app icon and splash)

A theme code carries no logo, and applying a `.halftone.json` leaves its logo out too. Studio's **Use system ›
Brand assets** downloads one as a zip laid out like the kit, drawn in the theme's colours:

| Zip | Unzip at | It writes |
| --- | --- | --- |
| `brand-mobile.zip` | this kit's root | `lib/brand.ts` (the logo `<Logo>` shows), `assets/images/{icon,adaptive-icon,splash,splash-dark,favicon}.png`, `assets/brand/brand.json` |
| `brand.zip` | the Halftone monorepo's root | the same under `apps/mobile`, and the web kit's under `apps/web` |

1. `unzip -o <zip>` at that root, then `git diff --stat` to show the person what it replaced.
2. Leave `app.json` alone: `app.config.ts` reads `assets/brand/brand.json` for the Android icon background and
   the splash colours, light and dark.
3. `npm run typecheck`. The logo shows wherever `<Logo>` is (the kit home, every sample's header) as soon as
   Expo reloads. The app icon and splash only change in a build: `LANG=en_US.UTF-8 npx expo prebuild -p ios
   --clean`, then `npx expo run:ios` (or an EAS build). Expo Go keeps its own icon.
4. Run the **qc-pass** skill: the logo in light and dark (a one-colour logo takes the text colour; a coloured
   one switches to its dark version when it has one), and the icon and splash on the dev client.

Never redraw the icons by hand: change the logo in the studio and download again. Without the zip, `<Logo>` draws a
placeholder square and the name. To go back: `git checkout -- lib/brand.ts assets/images`, then delete
`assets/brand/` and `assets/images/splash-dark.png`.
