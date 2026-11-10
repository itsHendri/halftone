---
'@halftone-ds/tokens': minor
---

Motion is part of a theme. A recipe's new `speed` (normal, snappy, relaxed, slow) scales every duration and spring, and rides in ht3 codes in two bits that were reserved, so every older code reads as Speed normal and a theme at normal keeps its code. Themes now write `primitive.duration`, `primitive.easing` and a new `primitive.spring` group (snappy and gentle, as stiffness, damping and mass). A system document takes an optional `motion` section (`durations`, `easings`, `springs`) with set values; documents without it are unchanged. The targets draw it: `--duration-*`, `--ease-*` and `--spring-*` with their classes (shadcn-web), a typed `MOTION` object (ts-theme), `duration-*` and `ease-*` (nativewind3), DESIGN.md and llms, and durations as Figma variables. `motionFor`, `springCss` and `motionVars` are exported.
