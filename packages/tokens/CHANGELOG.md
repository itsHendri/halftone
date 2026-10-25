# @halftone-ds/tokens

## 1.3.2

### Patch Changes

- 577fc40: `ts-theme`: a component's and a text style's `tracking` in `TOKENS` is typed as `number`. `TOKENS` is `as const`, so a
  system that set a non-zero tracking (Small at 0.01em, which Chip and Badge draw) made it a literal, and the mobile
  kit's `tracking !== 0` checks in Button, Badge, Input, Textarea and FilterChip stopped typechecking.

## 1.3.1

### Patch Changes

- adbfaba: `theme apply` also runs the app's `registry:build` when it has one: which components draw a colour follows the roles
  a system maps, so the registry's token usage (and its `--check`) went stale after applying a `.halftone.json`. The
  apply and `theme show` summaries name a system's own fonts (they showed the recipe's), and the colour-vision warning
  counts pairs of tones as the Studio does ("4 pairs, in 6 views").
- 634bae6: `ts-theme`: `ThemeInfo.code` is `string | null`. A system (`.halftone.json`) with overrides has no theme code, so
  `theme apply` wrote `"code": null` into `lib/theme.ts` against a `code: string` type, and the kit's typecheck (and
  the web kit's `next build`) failed. `THEME_INFO.name` is now the system's name when a system is applied.

## 1.3.0

### Minor Changes

- 155eb03: A component layer: Button, Chip, Badge and Input as tokens both kits read (`semantic.component.<name>.*`). Each has a
  corner, heights and padding, a text style (the component keeps its own weight) and fixed variants (Input: states)
  whose fill, label, border and pressed colours are roles. Pressed is derived from the fill unless set; Input's focus
  and error rings from their borders. The defaults are what the mobile kit drew.

  - The HalftoneSystem document's `components` key is now validated: `{ button|chip|badge|input: { style, radius,
size, text, variants } }`, overrides only. Button and Input styles fold into `recipe.button` / `recipe.field`;
    Chip (outline, soft, solid) and Badge (pill, square, soft) styles are overrides. `systemOverrides` lists them.
  - `generateTheme` and `generateSystem` return `semantic.component` and `components` (resolved). The style numbers
    that were `semantic.button.*` and `semantic.field.*` live there now (`semantic.component.button.alpha`,
    `semantic.component.input.border-width`…); `theme apply` moves them, and an older file still builds.
  - CSS variables in nativewind3, shadcn-web and `themeVars`: `--button-radius`, `--button-h-md`, `--button-x`,
    `--button-text-size`, `--button-primary-bg` (+ `-a`), `--chip-selected-bg`, `--badge-radius`, `--field-focus-border`…
    with Tailwind keys (`bg-button-primary-bg`, `rounded-button`, `h-button-md`, `text-type-button`) and, on Tailwind
    4, `type-button`/`type-chip`/`type-badge`/`type-field` utilities. `--field-radius`, `--field-radius-b` and
    `--field-x` come from the layer (16px of padding in both kits).
  - ts-theme writes `TOKENS.components` (sizes, corner, the text's font role) and `COMPONENT_VARS`.
  - The contrast gate checks every variant's label on its fill (`componentContrast`, `componentPairs`).
  - `tokenUsage` counts component classes as `component.<name>` and as the role each colour points at, and skips
    comments (an apostrophe in one hid a file's classes).
  - DESIGN.md and llms describe the layer; design-md's `buttonRadius` and llms' `controlRadius` options are gone
    (use `platform: 'web'`).
  - New from `/theme`: `COMPONENTS`, `COMPONENT_NAMES`, `CORNERS`, `SLOTS`, `SLOT_VAR`, `TOUCH_TARGET`,
    `componentVars`, `componentVarNames`, `componentColors`, `componentPairs`, `componentContrast`, `defaultCorner`,
    `defaultStyle`, `fittedLeading`.

- a523d18: Halftone systems. A system (`name.halftone.json`) is a theme recipe plus what was edited by hand on top of it, the document the Studio will keep: a seed for every colour role (brand, neutral, danger, success, warning, info) with steps edited by hand, the role mapping for light and dark, text styles, any Google Fonts family, corners, shadows, borders, named extras and the brand.

  - `@halftone-ds/tokens/system` (also re-exported from `/theme`): `normalizeSystem`, `validateSystem`, `createSystem`, `migrate`, `systemToRecipe`, `generateSystem`, `systemRamps`, `textStyles`, `systemRadii`, `systemCode`, `systemOverrides` and `applySystem`, with types. A system with no overrides generates exactly what `generateTheme` does for its recipe.
  - `theme apply ./name.halftone.json` writes it into `tokens.json` and records the document (without brand images) in `$extensions`; `theme show` lists its overrides and warnings. `theme encode` and `theme resolve` give its `ht-` code when it has no overrides, and say why when it has.
  - Contrast: generated colours are fixed as before. A colour chosen by hand (a mapped role, an edited step) is never moved; a pairing it fails is reported in the new `theme.warnings`.
  - The status ramps can be themed from a seed, and their tones follow the step the seed sits on. `brandRamp(seed, { anchor })` pins a seed to any step, and `neutralSeedRamp` makes a neutral from any colour.
  - Fonts: the `fonts` target and `theme apply` accept any Google Fonts family (`fontByFamily`), not only the curated list.
  - New tokens a system can write: `semantic.type.<style>.*`, `semantic.radius.<step>` (built as fixed px instead of a multiple of the base), `semantic.border.style` and the `extra` group. Shadows take `inset`. Existing themes and codes build exactly as before.
  - `components` is reserved in the document for component-level edits later (Button, Chip, Tag…): it is checked to be an object of objects, kept as given, and not generated from yet.

- 9783182: A system's extras reach every output, and the kits can say which components draw which token.

  - Extras (`extra.*` in tokens.json, from a `.halftone.json`) are now emitted by every target, and no kit component reads them:
    - `shadcn-web`: `--<name>` variables in `:root` and `.dark` (a ramp's `--<name>-<step>`), `bg-` / `text-` / `border-<name>` and `rounded-<name>` through `@theme`, and `shadow-`, `border-` and `type-<name>` utilities.
    - `nativewind3`: the variables in `global.css` and the classes in `tailwind.theme.js` (colours, corners, shadows, border widths, text styles).
    - `design-md` and `llms`: an "Extras (this brand's own)" section naming each one, its classes, and that screens may use them.
    - `themeVars` (the live theme) carries them too. `extraList` and `describeExtras` are in `lib/theme/extras.mjs`.
  - An extra can't take a name its token or class would collide with: a built-in slot, a Tailwind colour (`red`, `white`), a theme variable (`radius`, `type-…`), or a Tailwind corner, shadow or border class (`none`, `lg`, `dashed`). `extraNameProblem(kind, name, taken)` says why, as `normalizeSystem` does.
  - `lib/usage.mjs` `tokenUsage({ root, components, tokens })` maps each token (`color.primary`, `radius.md`, `shadow.2`, `type.h2`, `font.heading`, `border.width`) to the registry components that draw it. The kits' `registry:build` writes it to `registry/generated/token-usage.json`.
  - `theme apply` takes an absolute path to a `.halftone.json`.

- 4ad1328: Per-style text tokens: every Text variant (`h1 h2 h3 h4 lead p large small muted code blockquote`) is built as
  `--type-<style>-{size,leading,weight,tracking}` variables (`-font` on Tailwind 4), with
  `text-/leading-/tracking-/font-type-<style>` keys in nativewind3, `type-<style>` utilities in shadcn-web and
  `TOKENS.textStyles` in ts-theme. A system's edited styles (`semantic.type.<style>`) change just their variables.
  With none, the output draws exactly what the `text-*` classes did, except that tracking is em on native too: it
  scales with the style's size, where NativeWind's own `tracking-tight` was a fixed -0.25px. `themeVars` carries the
  styles to live previews. New: `resolveTextStyles`, `textEdits`, `textStyleVars`, `themeTextStyles`, `TEXT_STYLES`
  and `TEXT_DEFAULTS` from `/theme`.

### Patch Changes

- efa3f71: The theme pages moved to Studio: a `theme shadcn` item's default description links to
  `halftonedesignsystem.com/studio/?t=<code>` (was `/themes/?t=`, which now redirects), and the generated
  `DESIGN.md` says codes and `.halftone.json` files come from Studio.

## 1.2.0

### Minor Changes

- aa5526c: Add `apcaContrast(text, background)` (APCA-W3 0.0.98G-4g Lc, in `lib/apca.mjs`) and `contrastReport(resolved)`, which lists every pairing the contrast gate checks in both themes with its WCAG ratio, pass/fail and the APCA Lc. Both are exported from `@halftone-ds/tokens/theme`, along with `contrastPairs`, `AA` and `AA_NON_TEXT`. APCA is advisory: the build still gates on WCAG 2.1 AA only.
- aa5526c: Add a colour-vision check (`lib/cvd.mjs`): `simulateCvd(hex, 'protanopia' | 'deuteranopia' | 'tritanopia')` (Machado 2009, severity 1.0, in linear sRGB) and `cvdWarnings(theme.resolved)`, which lists the status-tone pairs and adjacent chart colours that fall below OKLab ΔE 0.05 (`MIN_DELTA_E`) under normal sight or any of the three, in either theme. `color.mjs` gains `hexToOklab` and `deltaEOK`. Exported from `@halftone-ds/tokens/theme`; `halftone-tokens theme apply` prints the warnings. A warning only: nothing fails on it.
- 6cdb66e: Button and field styles. A theme recipe now has `button` (solid, soft, outline, raised) and `field` (outline, filled, underline). They expand into five colours (`button`, `button-foreground`, `button-edge`, `field`, `field-edge`) and a few variables (`--button-alpha`, `--button-border-w`, `--button-edge-w`, `--field-alpha`, `--field-border-w`, `--field-edge-w`, `--field-radius`, `--field-radius-b`, `--field-x`) in every target. The contrast gate checks the button's label, and the line of a filled or underline field at 3:1. A theme with styles is an `ht3-` code (18 characters). Themes with the default styles keep their `ht1-`/`ht2-` codes, and a token file from before the styles builds as it always did.

  The Soft, Playful and Editorial presets use styles now, so their codes change; their old codes still open the old look. There are two new presets, Tactile and Studio. `theme show` lists the styles. The shadcn export leaves the style colours out, because shadcn's components don't read them.

- 04937c4: `tokens:build` and `tokens:check` now **warn** on contrast instead of failing. Every pairing below WCAG AA
  (4.5:1), and every tone's text on a tint the palette can't carry, is still named with its ratio, and the
  build carries on. Pass `--strict` (or set `HALFTONE_STRICT=1`) to fail on them as before; `theme apply`
  passes `--strict` through to its rebuild. A CI that relied on the build failing should add `--strict` to keep
  that.

  A palette built below AA without `--strict` names its failing pairings in the generated DESIGN.md and
  llms tokens section; for a passing palette they now say the build names any pairing that falls short, and
  `--strict` fails on it.

- 3c09fc4: Bridge Halftone themes and shadcn/ui.

  - `theme apply`, `encode` and `shadcn` accept a shadcn/ui preset code (`b5owWMfJ8l`) as well as a Halftone code,
    preset or recipe file. It becomes the nearest Halftone recipe; every value it approximates or drops is listed.
  - `theme decode <code> [--json]` explains a Halftone code, a preset or a shadcn code (with the Halftone theme it
    maps to).
  - `theme resolve [--json]` prints the code for `tokens.json` as it is, and exits 1 when none is recorded or it was
    edited by hand.
  - `theme shadcn <theme> [--out] [--fonts-url]` writes the theme as a shadcn `registry:theme` item: colours for light
    and dark, radius, shadows, and its fonts as `registry:font` dependencies.
  - New in `@halftone-ds/tokens/theme`: `isShadcnPresetCode`, `decodeShadcnPreset`, `encodeShadcnPreset` (a port of
    shadcn/ui's preset codec, MIT), `recipeFromShadcn`, `shadcnTheme`, `shadcnFont`, `shadcnFontPath` and
    `SHADCN_FONTS_URL`.

## 1.1.0

### Minor Changes

- 91d47dd: The package is `@halftone-ds/tokens`, for Halftone (halftonedesignsystem.com), and its command is `halftone-tokens`. Theme codes start `ht1-` (the default typeset) or `ht2-` (any theme), a theme applied to tokens.json is recorded under `$extensions["com.halftonedesignsystem.theme"]`, and the tint-text exemption comment is `halftone-tokens-ignore tint-text`.
- 4d1a660: The contrast gate also checks shadcn's sidebar pairings (`sidebar-foreground` on `sidebar`, `sidebar-primary-foreground` on `sidebar-primary`, `sidebar-accent-foreground` on `sidebar-accent`) when a palette defines them.
- bc5cf48: Theme density. Themes write `semantic.density.scale` and `semantic.density.control.{sm,md,lg,x}`. `nativewind3` exposes them as `h-control-sm` / `h-control` / `h-control-lg` (with `min-h-*` and `w-*`) and `px-control-x`; `shadcn-web` scales Tailwind 4's whole `--spacing` scale by `--density` (turn it off with the target option `density: false`).
- 8432db6: Themes. `@halftone-ds/tokens/theme` (browser-safe, typed) expands a small recipe (brand colour, neutral, radius, fonts, stroke, depth, density, border) into ramps, semantic tokens and CSS variables, auto-fixes contrast (same hue, least lightness change, strict WCAG AA in both modes) and packs the recipe into a `ht1-` code. `halftone-tokens theme apply <code|preset> | show | presets | encode` commits a theme into tokens.json (only the paths a theme owns, recorded under `$extensions["com.halftonedesignsystem.theme"]`, hand edits detected as drift). Eight personality presets. The contrast gate now also checks tones as text on `muted` and `accent`, and `ts-theme` emits `THEME_INFO`, the applied theme.
- 13d0309: Groundwork for theme presets: `lib/theme/refs.mjs`, a browser-safe DTCG reference resolver held to Style Dictionary's output, and a `strict` option on the contrast gate that also checks tones as text on `muted` and `accent`. The build prints strict failures as warnings.
- edb0d76: Theme fonts, depth, borders and icon stroke. Themes now write `semantic.radius.control`, `semantic.border.width`, `semantic.icon.stroke`, `semantic.shadow.{1,2,3}` (DTCG shadows, light and dark) and `primitive.font.family.{heading,body}`. A new `fonts` target writes the code that loads them (`platform: 'expo'`: per-weight `@expo-google-fonts` imports and `FONT_FAMILY`; `platform: 'next'`: `next/font/google` with `--kit-font-heading` / `--kit-font-body`), and `theme apply` installs the Expo font packages. `nativewind3` and `shadcn-web` map the theme's depth onto Tailwind's own `shadow-*` scale, its border width onto `border`, and add `rounded-control`. The `rounded-*` scale is now a multiple of `--radius` (not an offset), so radius `none` squares everything; at the default base the values are unchanged. The Figma target adds the theme's radius, border, stroke and font variables.
- aeb3414: Typeset in the theme: a mono font and four new recipe axes. **size** is the body text size (14, 15, 16 or 18px), and every text size scales with it. **leading** is the line height of running text, and the text sizes' line heights scale with it. **flow** (space between blocks) and **measure** (longest line) apply to long-form text.

  - `shadcn-web` scales `--text-xs…4xl` and their line heights through `--type-scale` and `--leading-factor`. It adds `--font-mono`, and `typeset: false` leaves a site's own sizes alone.
  - `nativewind3` writes the scaled `fontSize` plus `leading-prose`, `gap-flow` and `max-w-measure`.
  - `fonts` loads the mono font.

  A theme with the default typeset keeps its `ht1-` code. Any other theme gets a `ht2-` code (16 characters). Older halftone-tokens can't read ht2 codes and say so.

  This release also fixes the contrast auto-fix: when neither label colour read on a brand fill, it moved the fill the wrong way and threw (for example `#cc4575`).

- 44583c9: Text on tints. The build now works out, per status colour, the strongest tint of that colour its own text can sit on and still clear WCAG AA in both themes (`primary up to /5, …, destructive never`), and writes it into `DESIGN.md` and the `llms` section. A new optional `scan` config (source folders) makes `build` and `check` fail on class strings that put a tone's text on a stronger tint, such as `bg-success/15 text-success` (4.09:1), naming the file and line. Icon-only elements are exempt with a `halftone-tokens-ignore tint-text` comment.

### Patch Changes

- bed5910: The `ts-theme` target's comment on `THEME` no longer reads as React Native–only (it is used by web apps too).
- 0f0833b: Each preset has its own typeset: Editorial 18px, relaxed, IBM Plex Mono; Mono 14px, tight, 80ch, Geist Mono; and so on. Default keeps the kits' typeset, so its code is still `ht1-29B3XC60003T`. The other presets now have ht2 codes.
