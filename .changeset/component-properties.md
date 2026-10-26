---
'@halftone-ds/tokens': minor
---

The component layer gets the open card's properties (Studio Phase 6.1). A system's `components` can now set a border
width, the icon gap, a label's weight and case, an icon size, a shadow and focus ring (Button and Input) and Input's
placeholder role; Chip has S/M/L heights and Badge S/M, and Input's focus and error states have a fill and text of
their own. They reach `semantic.component.*` and both kits' variables (`--button-gap`, `--chip-border-w`,
`--button-ring-w`, `--field-placeholder`, `--button-<variant>-shadow`…), and `TOKENS.components` carries the weight,
case, icon size and shadow the mobile kit picks in JS (`TOKENS.shadows` draws a field's shadow on native). Every
property defaults to what the kits drew before, except where the two kits differed: one icon size (Button 16,
Badge 12) and one shadow (Button: Shadow 1 but Ghost; Input: Shadow 1 on a boxed field) now hold in both. The
contrast gate also checks the placeholder on the field.
