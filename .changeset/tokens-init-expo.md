---
'@halftone-ds/tokens': minor
---

`halftone-tokens init` also sets up an Expo app on NativeWind: `tokens/generated/tokens.css` imported first by `global.css`, a Tailwind preset added to `tailwind.config.js`, and `lib/theme.ts` and `lib/fonts.ts` where the app's `@/lib` points (`--platform web|expo` overrides the detection, `--no-install` prints the theme's font packages instead of installing them). The `nativewind3` target gains `partial: true` (only the variables, for the app's own `global.css` to import) and `preset` (the theme extension as a Tailwind preset, with NativeWind's hairline border).
