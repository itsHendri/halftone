---
"@halftone-ds/tokens": minor
---

`tokens:build` and `tokens:check` now **warn** on contrast instead of failing. Every pairing below WCAG AA
(4.5:1), and every tone's text on a tint the palette can't carry, is still named with its ratio, and the
build carries on. Pass `--strict` (or set `HALFTONE_STRICT=1`) to fail on them as before; `theme apply`
passes `--strict` through to its rebuild. A CI that relied on the build failing should add `--strict` to keep
that.

A palette built below AA without `--strict` names its failing pairings in the generated DESIGN.md and
llms tokens section; for a passing palette they now say the build names any pairing that falls short, and
`--strict` fails on it.
