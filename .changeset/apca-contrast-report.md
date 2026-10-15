---
"@halftone-ds/tokens": minor
---

Add `apcaContrast(text, background)` (APCA-W3 0.0.98G-4g Lc, in `lib/apca.mjs`) and `contrastReport(resolved)`, which lists every pairing the contrast gate checks in both themes with its WCAG ratio, pass/fail and the APCA Lc. Both are exported from `@halftone-ds/tokens/theme`, along with `contrastPairs`, `AA` and `AA_NON_TEXT`. APCA is advisory: the build still gates on WCAG 2.1 AA only.
