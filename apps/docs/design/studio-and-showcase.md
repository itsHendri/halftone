# Studio, showcase and typeset (2026-10-09)

Compared with ui.shadcn.com, which has live components on its home page, the /create designer and /typeset.
Built as six stacked PRs (#24–#28).

## Decisions

- **One full-width top bar** on every page, as on shadcn. The notebook layout's grid is overridden so the header
  spans the viewport and the sidebar sits flush left (see navigation-wireframes.md › How it is built).
- **The typeset is part of the one theme**, not a separate builder: mono font, size, leading, flow, measure. Size
  and leading scale every `text-*` size in both kits (so components change); flow and measure apply to long-form
  text in `Prose`. A theme with the default typeset keeps its `ht1-` code; any other gets `ht2-`.
- **Icons stay Lucide**, stroke only. No icon-set swap.
- **Home page:** centred hero, then a full-bleed band of the web kit's `/showcase` (real registry components,
  in an iframe sized by `kit:size`), beside a live phone. The theme bar restyles all of it. The theme bar stays
  on every page except /themes.
- **Studio (/themes), like shadcn /create:** a floating control rail in the opposite scheme to the page (dark on
  light, light on dark), one compact row per choice opening a picker (fonts in their own face), a lock per row
  for shuffle, hover to preview on the whole page and in the frames. A floating 01–04 switcher: Overview
  (rendered by this site, instant), Mobile, Web (showcase and samples), Typeset (Prose beside components, with
  sample texts). On phones the rail is a panel opened from the switcher.

## How it is built

- `components/theme/studio/` (`rail.tsx`, `canvas.tsx`, `parts.tsx`), `components/theme/specimen.tsx`.
- The inverted rail: `InvertedSchemeStyle` writes the live theme's colours under `.kit-light` / `.kit-dark`;
  `global.css` re-points Fumadocs' `--color-fd-*` inside them. No `dark:` utilities inside the rail.
- Hover preview: `previewRecipe()` in `lib/theme/store.ts`; not persisted, not in undo, and ThemeRuntime skips its
  storage writes while previewing.
- Web kit: `app/showcase` (masonry), `app/showcase/typeset` (`?fixture=`), `?autosize=1` → `kit:size`.

## Deferred

- Shadcn's "Get code" variants per framework; a separate typeset export (`.typeset` CSS) outside the kits.
- A chromeless mobile showcase (phones show sample screens and the Components page instead).
