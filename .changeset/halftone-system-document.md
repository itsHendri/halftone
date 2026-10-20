---
"@halftone-ds/tokens": minor
---

Halftone systems. A system (`name.halftone.json`) is a theme recipe plus what was edited by hand on top of it, the document the Studio will keep: a seed for every colour role (brand, neutral, danger, success, warning, info) with steps edited by hand, the role mapping for light and dark, text styles, any Google Fonts family, corners, shadows, borders, named extras and the brand.

- `@halftone-ds/tokens/system` (also re-exported from `/theme`): `normalizeSystem`, `validateSystem`, `createSystem`, `migrate`, `systemToRecipe`, `generateSystem`, `systemRamps`, `textStyles`, `systemRadii`, `systemCode`, `systemOverrides` and `applySystem`, with types. A system with no overrides generates exactly what `generateTheme` does for its recipe.
- `theme apply ./name.halftone.json` writes it into `tokens.json` and records the document (without brand images) in `$extensions`; `theme show` lists its overrides and warnings. `theme encode` and `theme resolve` give its `ht-` code when it has no overrides, and say why when it has.
- Contrast: generated colours are fixed as before. A colour chosen by hand (a mapped role, an edited step) is never moved; a pairing it fails is reported in the new `theme.warnings`.
- The status ramps can be themed from a seed, and their tones follow the step the seed sits on. `brandRamp(seed, { anchor })` pins a seed to any step, and `neutralSeedRamp` makes a neutral from any colour.
- Fonts: the `fonts` target and `theme apply` accept any Google Fonts family (`fontByFamily`), not only the curated list.
- New tokens a system can write: `semantic.type.<style>.*`, `semantic.radius.<step>` (built as fixed px instead of a multiple of the base), `semantic.border.style` and the `extra` group. Shadows take `inset`. Existing themes and codes build exactly as before.
- `components` is reserved in the document for component-level edits later (Button, Chip, Tag…): it is checked to be an object of objects, kept as given, and not generated from yet.
