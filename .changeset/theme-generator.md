---
"@halftone-ds/tokens": minor
---

Themes. `@halftone-ds/tokens/theme` (browser-safe, typed) expands a small recipe (brand colour, neutral, radius, fonts, stroke, depth, density, border) into ramps, semantic tokens and CSS variables, auto-fixes contrast (same hue, least lightness change, strict WCAG AA in both modes) and packs the recipe into a `ht1-` code. `halftone-tokens theme apply <code|preset> | show | presets | encode` commits a theme into tokens.json (only the paths a theme owns, recorded under `$extensions["com.halftonedesignsystem.theme"]`, hand edits detected as drift). Eight personality presets. The contrast gate now also checks tones as text on `muted` and `accent`, and `ts-theme` emits `THEME_INFO`, the applied theme.
