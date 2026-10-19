---
"@halftone-ds/tokens": minor
---

Bridge Halftone themes and shadcn/ui.

- `theme apply`, `encode` and `shadcn` accept a shadcn/ui preset code (`b5owWMfJ8l`) as well as a Halftone code,
  preset or recipe file. It becomes the nearest Halftone recipe; every value it approximates or drops is listed.
- `theme decode <code> [--json]` explains a Halftone code, a preset or a shadcn code (with the Halftone theme it
  maps to).
- `theme resolve [--json]` prints the code for `tokens.json` as it is, and exits 1 when none is recorded or it was
  edited by hand.
- `theme shadcn <theme> [--out] [--fonts-url]` writes the theme as a shadcn `registry:theme` item: colours for light
  and dark, radius, shadows, and its fonts as `registry:font` dependencies.
- New in `@halftone-ds/tokens/theme`: `isShadcnPresetCode`, `decodeShadcnPreset`, `encodeShadcnPreset` (a port of
  shadcn/ui's preset codec, MIT), `recipeFromShadcn`, `shadcnTheme`, `shadcnFont`, `shadcnFontPath` and
  `SHADCN_FONTS_URL`.
