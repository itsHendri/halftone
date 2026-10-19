---
"@halftone-ds/tokens": minor
---

Button and field styles. A theme recipe now has `button` (solid, soft, outline, raised) and `field` (outline, filled, underline). They expand into five colours (`button`, `button-foreground`, `button-edge`, `field`, `field-edge`) and a few variables (`--button-alpha`, `--button-border-w`, `--button-edge-w`, `--field-alpha`, `--field-border-w`, `--field-edge-w`, `--field-radius`, `--field-radius-b`, `--field-x`) in every target. The contrast gate checks the button's label, and the line of a filled or underline field at 3:1. A theme with styles is an `ht3-` code (18 characters). Themes with the default styles keep their `ht1-`/`ht2-` codes, and a token file from before the styles builds as it always did.

The Soft, Playful and Editorial presets use styles now, so their codes change; their old codes still open the old look. There are two new presets, Tactile and Studio. `theme show` lists the styles. The shadcn export leaves the style colours out, because shadcn's components don't read them.
