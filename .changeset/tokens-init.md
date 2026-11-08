---
'@halftone-ds/tokens': minor
---

`halftone-tokens init` sets up Halftone's tokens in an existing web app (any React app on Tailwind 4 and shadcn): it writes `tokens/tokens.json` and `tokens/tokens.config.json`, applies `--theme` if given, builds `tokens.css` and `fonts.css` next to the app's stylesheet, adds their imports, and names any rules in the stylesheet that would override the kit. The `fonts` target gains `platform: 'web'`: a Google Fonts `@import` and the `--kit-font-*` variables, for apps without `next/font`.
