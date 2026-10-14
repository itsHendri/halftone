---
"@halftone/tokens": minor
---

Renamed. The kit is called Halftone now and the package is `@halftone/tokens` (it was `@itshendri/kit-tokens`, never published). The `kit-tokens` command keeps its name. A theme applied to tokens.json is recorded under `$extensions["com.halftonedesignsystem.theme"]`; a record under the old `dev.protokit.theme` key is still read, and moved on the next `theme apply`.
