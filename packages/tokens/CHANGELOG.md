# @halftone-ds/tokens

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
