---
"@halftone/tokens": minor
---

Text on tints. The build now works out, per status colour, the strongest tint of that colour its own text can sit on and still clear WCAG AA in both themes (`primary up to /5, …, destructive never`), and writes it into `DESIGN.md` and the `llms` section. A new optional `scan` config (source folders) makes `build` and `check` fail on class strings that put a tone's text on a stronger tint, such as `bg-success/15 text-success` (4.09:1), naming the file and line. Icon-only elements are exempt with a `kit-tokens-ignore tint-text` comment.
