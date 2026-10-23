---
'@halftone-ds/tokens': patch
---

`theme apply` also runs the app's `registry:build` when it has one: which components draw a colour follows the roles
a system maps, so the registry's token usage (and its `--check`) went stale after applying a `.halftone.json`. The
apply and `theme show` summaries name a system's own fonts (they showed the recipe's), and the colour-vision warning
counts pairs of tones as the Studio does ("4 pairs, in 6 views").
