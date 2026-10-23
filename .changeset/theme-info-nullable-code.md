---
'@halftone-ds/tokens': patch
---

`ts-theme`: `ThemeInfo.code` is `string | null`. A system (`.halftone.json`) with overrides has no theme code, so
`theme apply` wrote `"code": null` into `lib/theme.ts` against a `code: string` type, and the kit's typecheck (and
the web kit's `next build`) failed. `THEME_INFO.name` is now the system's name when a system is applied.
