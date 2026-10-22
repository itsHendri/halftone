---
'@halftone-ds/tokens': minor
---

A component layer: Button, Chip, Badge and Input as tokens both kits read (`semantic.component.<name>.*`). Each has a
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
