---
"@halftone-ds/tokens": minor
---

Add a colour-vision check (`lib/cvd.mjs`): `simulateCvd(hex, 'protanopia' | 'deuteranopia' | 'tritanopia')` (Machado 2009, severity 1.0, in linear sRGB) and `cvdWarnings(theme.resolved)`, which lists the status-tone pairs and adjacent chart colours that fall below OKLab ΔE 0.05 (`MIN_DELTA_E`) under normal sight or any of the three, in either theme. `color.mjs` gains `hexToOklab` and `deltaEOK`. Exported from `@halftone-ds/tokens/theme`; `halftone-tokens theme apply` prints the warnings. A warning only: nothing fails on it.
