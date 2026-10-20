# Roadmap

Where Halftone is going, in order. Small items live in each kit's `BACKLOG.md`; this file is the shape.

Halftone's ground: **one brand on phone and web, from one design-token file**, with a theme recipe deeper than
colours (radius, fonts, depth, density, border, icon stroke, typeset), contrast checked on every build, and
agents that build only from what the kits ship. Free, open, and run by your own agent.

## Done: trust and pitch

- **Guardrails in lint.** `halftone/*` ESLint rules in both kits (raw colours, imports outside the registry,
  other UI libraries, platform primitives in screens) and a Claude Code hook that lints each edited file.
- **Contrast warns; Halftone builds strict.** `tokens:build` names failing pairings and carries on;
  `--strict` / `HALFTONE_STRICT=1` fails. Halftone's own CI is strict.
- **The pitch:** "One brand. Phone and web. Built by your agent."

## Done: a brief wizard on the site

A `/brief` page that turns a guided brief, or a pasted transcript, into a planning session.

- Guided sections for a prototype: product, users and jobs, platform (phone, web or both), screens or pages,
  key flows, data, voice and tone, proof and constraints, not in v1. Each question can be marked "does not
  apply". Answers stay in the browser, with a share link.
- An optional theme code from the studio.
- Out: a `BRIEF.md` download and one prompt that sets up the kit, applies the theme, and runs
  transcript-to-prototype in **planning mode**: the agent stops after the brief and screen list for approval
  before writing code.
- transcript-to-prototype gains a brief template (the same fields) and that approval stop, in both kits.

## Done: themes that travel

- **Read shadcn preset codes** into a Halftone recipe (`halftone-tokens theme apply <shadcn code>`, and a paste
  box in the studio), with contrast fixed on the way in.
- **Publish Halftone themes as shadcn registry items**: a `registry:theme` download from the studio, the presets
  at `/r/theme/<preset>.json`, and later any theme code by URL.
- `theme decode` and `theme resolve` in the CLI.

## Done: brand assets

A logo in the studio, beside the theme (a code has no room for it): a `Logo` component in both kits, used by
the kit shell and every sample; the favicon and apple icon on the web; the **app icon and splash screen** on
mobile. A one-colour SVG follows the theme's text colour; others can have a dark version. The studio draws
every size and downloads them as a zip laid out like each kit (`brand-mobile.zip`, `brand-web.zip`, `brand.zip`),
which the `apply-theme` skill unzips. Still to come: brand assets in the CLI, iOS tinted and dark icons, OG images.

## Now: looks beyond tokens

Component styles in the recipe, for both kits: **buttons** (solid, soft, outline, raised) and **inputs**
(outline, filled, underline), as theme tokens every Button, Input, Textarea and Select draws; two new presets with
a mood each (Tactile, Studio) and three presets that use the styles. Themes with styles are `ht3-` codes (18
characters, with room for more styles). Ships with `@halftone-ds/tokens` 1.2. Still to come: more styles (cards,
chips, tabs) in the reserved bits.

## Next: Studio, a design system manager

`/themes` becomes `/studio`: a page you edit in place, like Subframe's Theme page, with several saved systems
(say a portfolio and a client). Foundations, Components and Accessibility tabs:
- Every role is a full 50–950 ramp from one colour, and any step can be edited.
- Text styles, corners, shadows and borders are editable items, and "+ New" adds extras.
- The logo slot always shows a placeholder.

Saved in the browser first; accounts come later. After foundations comes component-level editing (Button, Chip,
Tag). The contract is `apps/docs/design/studio-wireframes.md`; the data layer is the `HalftoneSystem` document
in `@halftone-ds/tokens`.

## Later: agent reach

- The skills as a Claude Code plugin, so they load outside the kit folders.
- `DESIGN.md` linted against the open DESIGN.md spec in CI.
- qc-pass driving the app through Expo's MCP tools: screenshots by test ID, every route in both themes.
- A theme from a URL (a client's site → a recipe).
- Two or three theme variants side by side in the brief wizard, before the build.
- An MCP server for the theme studio, so an agent changes the theme while you watch.

## Parked

- Expo SDK 58: on `chore/sdk-58`, until 58 is stable.
- Package releases: changes to `@halftone-ds/tokens` collect in the Version Packages PR until a release is due.
