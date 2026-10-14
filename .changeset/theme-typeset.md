---
'@halftone/tokens': minor
---

Typeset in the theme: a mono font and four new recipe axes. **size** is the body text size (14, 15, 16 or 18px), and every text size scales with it. **leading** is the line height of running text, and the text sizes' line heights scale with it. **flow** (space between blocks) and **measure** (longest line) apply to long-form text.

- `shadcn-web` scales `--text-xs…4xl` and their line heights through `--type-scale` and `--leading-factor`. It adds `--font-mono`, and `typeset: false` leaves a site's own sizes alone.
- `nativewind3` writes the scaled `fontSize` plus `leading-prose`, `gap-flow` and `max-w-measure`.
- `fonts` loads the mono font.

A theme with the default typeset keeps its `ht1-` code. Any other theme gets a `ht2-` code (16 characters). Older halftone-tokens can't read ht2 codes and say so.

This release also fixes the contrast auto-fix: when neither label colour read on a brand fill, it moved the fill the wrong way and threw (for example `#cc4575`).
