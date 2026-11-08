---
'@halftone-ds/tokens': minor
---

`halftone-tokens doctor`: checks an app's setup for kit components and prints a fix for each problem. It covers the tokens being built and up to date, the stylesheet or `global.css` imports, the Tailwind preset (Expo), the new-york style and the `@/` aliases. It also catches a kit file in `components/ui` that shadcn's or react-native-reusables' stock version has replaced, by comparing it with the registry. It warns about overriding rules, a missing dark mode, `KitLinkProvider` or `KitThemeProvider`, unloaded fonts and a second `cn`. `--offline`, `--json`. `init` no longer counts a `height` inside `keyframes` as overriding the kit's heights.
