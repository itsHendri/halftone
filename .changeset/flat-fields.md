---
'@halftone-ds/tokens': minor
---

Fields are flat until a system gives them a shadow: Input, Textarea and Select draw no shadow by default, whatever the
field style (a boxed field had Shadow 1). Content is flat in both kits; a shadow means something presses or floats.
A system that sets the field shadow keeps it. A token file applied from a code before this one still has Shadow 1, which
`theme show` now lists as a hand edit: apply the theme again with `--force` to take the flat default.
