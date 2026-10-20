---
'@halftone-ds/tokens': minor
---

Per-style text tokens: every Text variant (`h1 h2 h3 h4 lead p large small muted code blockquote`) is built as
`--type-<style>-{size,leading,weight,tracking}` variables (`-font` on Tailwind 4), with
`text-/leading-/tracking-/font-type-<style>` keys in nativewind3, `type-<style>` utilities in shadcn-web and
`TOKENS.textStyles` in ts-theme. A system's edited styles (`semantic.type.<style>`) change just their variables.
With none, the output draws exactly what the `text-*` classes did, except that tracking is em on native too: it
scales with the style's size, where NativeWind's own `tracking-tight` was a fixed -0.25px. `themeVars` carries the
styles to live previews. New: `resolveTextStyles`, `textEdits`, `textStyleVars`, `themeTextStyles`, `TEXT_STYLES`
and `TEXT_DEFAULTS` from `/theme`.
