# @halftone-ds/tokens

The token build behind [Halftone](https://github.com/itsHendri/halftone). One `tokens.json` in the
[W3C design-token format](https://www.designtokens.org/tr/2025.10/format/) becomes everything an app reads,
and every build checks the palette against WCAG AA.

```bash
npm install -D @halftone-ds/tokens
npx halftone-tokens build      # write every output in tokens/tokens.config.json
npx halftone-tokens check      # write nothing; exit 1 if an output is stale (CI)
npx halftone-tokens build --strict   # fail on contrast instead of warning (or HALFTONE_STRICT=1)
npx halftone-tokens figma      # mirror the tokens into Figma Variables
```

## Inputs

- `tokens/tokens.json`: `primitive` ramps and scales, and `semantic.color.<name>` with a `{ light, dark }`
  value per colour, using the shadcn names (`background`, `primary`, `primary-foreground`, `muted`, …) plus
  `success`, `warning` and `info`. `semantic.radius.base` sets `--radius`.
- `tokens/tokens.config.json`: which targets to write, and where (paths relative to the app root):

```json
{
  "source": "tokens/tokens.json",
  "scan": ["app", "components"],
  "targets": {
    "nativewind3": { "css": "global.css", "tailwind": "tokens/generated/tailwind.theme.js" },
    "ts-theme": { "out": "lib/theme.ts", "navTheme": "expo-router/react-navigation" },
    "shadcn-web": { "out": "app/tokens.css" },
    "design-md": { "out": "DESIGN.md", "name": "My Kit" }
  }
}
```

`scan` (optional) lists source folders for the text-on-tint check below.

## Targets

| Target | Writes |
|---|---|
| `nativewind3` | NativeWind 4 / Tailwind 3 CSS variables (HSL, `:root` + `.dark:root`) and the Tailwind colour + radius map |
| `shadcn-web` | Tailwind 4 / shadcn v4 CSS: oklch variables in `:root` + `.dark`, `@theme inline`, base layer |
| `ts-theme` | `THEME` (hex per scheme), `TOKENS` (space, radius, type, motion) and an optional React Navigation theme |
| `registry-theme` | the theme as shadcn registry `cssVars`, native and web |
| `design-md` | a [DESIGN.md](https://github.com/google-labs-code/design.md) (spec alpha) |
| `llms` | a tokens section for `llms.txt` |
| `figma` | the input `halftone-tokens figma` pushes to Figma Variables |

## Themes

A theme is a recipe (brand colour, neutral, radius, fonts, icon stroke, depth, density, border, typeset) that
`theme apply` expands into `tokens.json`, recording it so `theme show` can tell when tokens were edited by hand.

```bash
npx halftone-tokens theme apply <theme> [--dry-run] [--force]   # write it into tokens.json and rebuild
npx halftone-tokens theme show [--check]       # the applied theme, and any hand edits since
npx halftone-tokens theme presets              # the presets and their codes
npx halftone-tokens theme encode <theme>       # the Halftone code for a theme
npx halftone-tokens theme decode <code> [--json]   # what a code holds
npx halftone-tokens theme resolve [--json]     # the code for tokens.json as it is (exit 1 if none or edited)
npx halftone-tokens theme shadcn <theme> [--out file] [--fonts-url url]   # a shadcn registry:theme item
```

`<theme>` is a Halftone code (`ht1-…`, `ht2-…`, `ht3-…`), a preset name, a recipe `.json`, a system
`.halftone.json` (see Systems), or a
[shadcn/ui](https://ui.shadcn.com/create) preset code (`b5owWMfJ8l`). A shadcn code becomes the nearest Halftone
recipe, and what it approximates or drops (shadcn-only greys, radius steps, fonts outside the list, icon
libraries, chart colours, menu options, styles) is listed on stderr. The other way, `theme shadcn` writes the
theme as a `registry:theme` item for `npx shadcn add`: colours for light and dark, radius, shadows, and its fonts
as `registry:font` dependencies (hosted at halftonedesignsystem.com/r/font, or `--fonts-url`).

From code: `decodeShadcnPreset`, `recipeFromShadcn`, `shadcnTheme` and `shadcnFont` in
`@halftone-ds/tokens/theme` (browser-safe). The preset codec is ported from shadcn/ui (MIT).

## Systems

A **system** (`name.halftone.json`, what the Halftone Studio saves) is a recipe plus whatever was edited by hand
on top of it: a seed per colour role (brand, neutral, danger, success, warning, info) with a 50–950 ramp, steps
edited by hand, the role mapping for light and dark, text styles (h1–h4, lead, p, large, small, muted, code,
blockquote), any Google Fonts family, corners, shadows, borders, named extras, and the brand (name, logos, icon
background).

```bash
npx halftone-tokens theme apply ./acme.halftone.json   # writes tokens.json and records the system
npx halftone-tokens theme show                         # the system, its overrides, and any contrast warnings
npx halftone-tokens theme encode ./acme.halftone.json  # its ht- code, when it has no overrides
```

- `tokens.json` records the document under `$extensions`, without its brand images. A system with overrides has
  no `ht-` code: a code only carries a recipe.
- Generated colours are fixed for contrast as a recipe's are. A colour chosen by hand (a mapped role, an edited
  step) is never moved: a pairing it fails is a warning.
- A status ramp from a seed replaces the file's; applying a theme without one puts the curated ramp back.
- Edited text styles are written as `semantic.type.<style>.{size,leading,weight,tracking,font}`, corners as
  `semantic.radius.<step>` (the build uses them as fixed px), extras under `extra.*` (exported, not drawn by
  the kits).
- Every text style (`h1 h2 h3 h4 lead p large small muted code blockquote`), edited or not, is built as
  `--type-<style>-{size,leading,weight,tracking}` (plus `-font` on Tailwind 4, and `-tracking-native` in px for
  NativeWind's native build). nativewind3 adds the `text-`, `leading-`, `tracking-` and `font-type-<style>` keys;
  shadcn-web adds `type-<style>` utilities; ts-theme adds `TOKENS.textStyles`. With no edits they draw exactly
  what Tailwind's `text-*` classes did. `themeVars` carries them to live previews (`textStyleVars`,
  `themeTextStyles`).

From code (`@halftone-ds/tokens/system`, also in `/theme`, browser-safe): `normalizeSystem` / `validateSystem`,
`createSystem`, `migrate(recipe | code, brand)` and `systemToRecipe`, `generateSystem(system, tokens)` (the same
shape as `generateTheme`, plus `warnings`), `systemRamps`, `textStyles`, `systemRadii`, `systemCode` and
`applySystem`. The document's shape is described in `lib/system/schema.mjs`.

## Guarantees

- **Contrast check.** Every `X` / `X-foreground` pairing, body and muted text on every surface, each status
  colour used as text, and each status icon on its own tint is checked against WCAG AA in both themes. A
  pairing that falls short is named with its ratio, and the generated DESIGN.md lists it. By default that is a
  warning and the build carries on; with `--strict` (or `HALFTONE_STRICT=1`) the build fails and writes
  nothing. The same goes for a tone's text on a tint the palette can't carry, when the config has `scan`.
- **APCA, for reading only.** `apcaContrast(text, background)` (from `@halftone-ds/tokens/theme` or
  `@halftone-ds/tokens/lib/apca`) gives the APCA Lc of a pair, and `contrastReport(theme.resolved)` lists every
  pairing the gate checks, in both themes, with its WCAG ratio, `pass`, and Lc. Lc is advisory: WCAG AA stays
  the gate, and nothing fails on APCA.
- **Colour vision, as a warning.** `cvdWarnings(theme.resolved)` (from `@halftone-ds/tokens/theme` or
  `@halftone-ds/tokens/lib/cvd`) simulates protanopia, deuteranopia and tritanopia (Machado 2009,
  `simulateCvd`) and lists the status pairs (success / destructive and the rest) and adjacent chart colours
  that end up closer than OKLab ΔE 0.05 under any of them, or under normal sight. `theme apply` prints them.
  Nothing fails on it: the kit pairs every status with an icon or a label, and the warning says where colour
  alone stops doing the work.
- **Text on tints.** A status colour as text on its own tint (`text-success` on `bg-success/15`) loses
  contrast fast: 4.09:1 with a typical green. The build works out, per colour, the strongest tint that
  still clears AA in both themes, and writes it into `DESIGN.md` and the `llms` section
  (`primary up to /5, …, destructive never`). With `scan` set, `build` and `check` also read every class
  string in those folders and fail on a tone's text over a tint stronger than that, naming the file and line.
  An element that holds only an icon (3:1) is exempt with a `halftone-tokens-ignore tint-text` comment. A class
  string has to contain both classes, so React Native's `View` > `Text` nesting is out of its reach;
  `DESIGN.md` states the rule for that case.
- **No drift between platforms.** Every oklch value must render back to the same 8-bit hex as the source,
  so the web theme and the native theme are the same colours.
- **Radius scale.** `rounded-*` classes are offsets from `radius.lg`, so with the default base each class
  equals its primitive and moving `semantic.radius.base` shifts the whole scale.

MIT licence.
