---
'@halftone-ds/tokens': minor
---

Per-style text tokens: every Text variant (`h1 h2 h3 h4 lead p large small muted code blockquote`) is built as
`--type-<style>-{size,leading,weight,tracking}` variables (`-font` on Tailwind 4, `-tracking-native` in px for
NativeWind's native build), with `text-/leading-/tracking-/font-type-<style>` keys in nativewind3, `type-<style>`
utilities in shadcn-web and `TOKENS.textStyles` in ts-theme. A system's edited styles (`semantic.type.<style>`)
change just their variables; with none, the output draws exactly what the `text-*` classes did. `themeVars`
carries the styles to live previews. New: `resolveTextStyles`, `textEdits`, `textStyleVars`, `themeTextStyles`,
`TEXT_STYLES` and `TEXT_DEFAULTS` from `/theme`.
