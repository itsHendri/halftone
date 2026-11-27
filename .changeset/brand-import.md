---
'@halftone-ds/tokens': minor
---

`halftone-tokens import <tokens.json>`: a brand's own DTCG tokens into a Halftone system. It reads the brand's own
names (named colour sets, `background-secondary`, `brand`, `ink` …), keeps its colours exactly, seeds the ramps from
them, turns other colours into extras, checks fonts against Google Fonts, and lists each guess. `systemFromTokens` and
`fontFamiliesToCheck` in `@halftone-ds/tokens/system` do the same in the browser. A system can now carry a `tokens`
section: the brand's tokens that no slot holds (spacing, a line weight, a grid), kept whole and never drawn by the kits.
