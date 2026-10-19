---
"@halftone-ds/tokens": major
---

`tokens:build` and `tokens:check` now **warn** on contrast instead of failing. Every pairing below WCAG AA
(4.5:1), and every tone's text on a tint the palette can't carry, is still named with its ratio, and the
build carries on. Pass `--strict` (or set `HALFTONE_STRICT=1`) to fail on them as before; `theme apply`
passes `--strict` through to its rebuild. Major, because a CI that relied on the build failing has to add
`--strict` to keep that.

A palette built below AA without `--strict` names its failing pairings in the generated DESIGN.md and
llms tokens section. Output for a passing palette is unchanged.

When this is released, also reword the passing-palette sentence in `targets/design-md.mjs` and
`targets/llms.mjs` ("the build refuses a palette that does not" / "enforced by `npm run tokens:build`")
and regenerate the apps' DESIGN.md, llms.txt and llms-tokens.md in the same release PR.
