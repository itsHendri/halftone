# Halftone lab: decisions

Phase 0 of the ambient-halftone work. These picks decide what Phases 2 and 3 build.

The lab is `index.html` in this folder. To open it, start the `design-lab` launch config (a static server at the
repo root on port 8095) and go to `http://localhost:8095/apps/docs/design/halftone-lab/`. Click **Copy picks**,
paste the result under "Picks", and add notes.

## Settled before the lab

- **The website takes colour only.** Fonts, radius, border, shadows, icon stroke and density apply to components
  only: kit frames, studio previews and specimens. That is Phase 1, and it doesn't wait on these picks.
- **Ambient until the visitor picks.** With no stored theme and no `?t=` code, the colours drift.
  - The site drifts smoothly.
  - Kit frames re-theme in steps of a few seconds.
  - Picking a colour stops the drift. Reset brings it back.
- **The drift can be paused.** The theme pill has a pause control, which WCAG 2.2.2 requires for motion over 5 s.
  Reduced motion gets one still hue per day.
- **Contrast is kept on every frame.** Each frame's theme goes through the generator with the contrast fixer on.
  The lab measures about 1.5–2 ms per new hue, cached at 0.5° steps, and about 1–2 ms of script per frame in total.
- **Halftone effects go in four places:** the hero field, a site-wide click ripple, the dot swarm on the hero
  CTAs, and a faint page texture.

## Picks (2026-10-15)

- **Hue route:** A · Curated stops (violet 292° → orange 40° → pink 355° → blue 262°, smoothstep between)
- **Neutrals:** Grey (zinc). Surfaces stay still; the hue moves `--primary`, `--ring`, `--sidebar-primary`, `--chart-1`
- **Gradient:** Off. The lit dot grid carries the colour.
- **Hero dot field:** A · Lit grid (Surface Field)
- **Click ripple:** A · Push
- **CTA hover:** B · Gather into mark (a halftone sphere)
- **Page texture:** Fine (12 px)

| Setting | Value |
|---|---|
| Gradient cycle | 60 s |
| Kit frame step | 4 s |
| Dot spacing | 15 px |
| Light radius (A) | 260 px |
| Brightness (A) | 0.5 |
| Cursor distortion | 8 px |
| Ripple duration | 1000 ms |
| Ripple strength | 1× |

Consequences for the build: no gradient layer and no Paper Shaders dependency. Everything is canvas 2D plus one CSS texture.

## Notes

- **Neutrals:** with grey (zinc) neutrals only `--primary`, `--ring`, `--sidebar-primary` and `--chart-1` follow
  the hue. "Tinted" (`neutral: 'brand'`) makes every surface drift, which is closer to "all colours change".
- **Paper Shaders** (`@paper-design/shaders@0.0.81`, Apache-2.0) is loaded from a CDN only when a WebGL variant
  is on. If one wins, the site pins that exact version in `apps/docs`.
  - Its halftone filter needs an `<img>`, so the gradient is redrawn to an image about 5 times a second.
  - The canvas-2D variant C draws the dots directly every frame.
