---
'@halftone-ds/tokens': patch
---

`ts-theme`: a component's and a text style's `tracking` in `TOKENS` is typed as `number`. `TOKENS` is `as const`, so a
system that set a non-zero tracking (Small at 0.01em, which Chip and Badge draw) made it a literal, and the mobile
kit's `tracking !== 0` checks in Button, Badge, Input, Textarea and FilterChip stopped typechecking.
