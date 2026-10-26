---
'@halftone-ds/tokens': minor
---

Tint roles from the ramps, so nothing in a kit draws a colour at partial opacity: `primary-subtle`, `success-subtle`,
`warning-subtle`, `destructive-subtle`, `info-subtle` (a tinted surface, 100 light / 950 dark), each with a `-border`
(300 / 900), `muted-subtle` (neutral 50 / 900) and the pressed fills `primary-pressed` (the next brand step away from
the page) and `secondary-pressed` (neutral 200 / 700). A theme writes them with the rest of its semantic colours, and
an existing preset or code keeps every colour it had.

The contrast gate checks text (`foreground`, `muted-foreground`) on every tint, each tone's icon on its own tint
(3:1, in place of the alpha blends) and the labels on the pressed fills. The fixer moves a derived role (a tint, a
pressed fill), never the ink on it. The source scan also flags a tone's text on its own `-subtle` tint when the
palette can't carry it, and DESIGN.md / llms.txt name the roles. A token file from before them keeps the alpha checks.
