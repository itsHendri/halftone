# Roadmap

Where Halftone is going, in order. Small items live in each kit's `BACKLOG.md`; this file is the shape.

Halftone's ground: **one brand on phone and web, from one design-token file**, with a theme recipe deeper than
colours (radius, fonts, depth, density, border, icon stroke, typeset), contrast checked on every build, and
agents that build only from what the kits ship. Free, open, and run by your own agent.

## Done, in review: trust and pitch

- **Guardrails in lint.** `halftone/*` ESLint rules in both kits (raw colours, imports outside the registry,
  other UI libraries, platform primitives in screens) and a Claude Code hook that lints each edited file.
- **Contrast warns; Halftone builds strict.** `tokens:build` names failing pairings and carries on;
  `--strict` / `HALFTONE_STRICT=1` fails. Halftone's own CI is strict.
- **The pitch:** "One brand. Phone and web. Built by your agent."

## Now: a brief wizard on the site

A `/brief` page that turns a guided brief, or a pasted transcript, into a planning session.

- Guided sections for a prototype: product, users and jobs, platform (phone, web or both), screens or pages,
  key flows, data, voice and tone, proof and constraints, not in v1. Each question can be marked "does not
  apply". Answers stay in the browser, with a share link.
- An optional theme code from the studio.
- Out: a `BRIEF.md` download and one prompt that sets up the kit, applies the theme, and runs
  transcript-to-prototype in **planning mode**: the agent stops after the brief and screen list for approval
  before writing code.
- transcript-to-prototype gains a brief template (the same fields) and that approval stop, in both kits.

## Then: themes that travel

- **Read shadcn preset codes** into a Halftone recipe (`halftone-tokens theme apply <shadcn code>`, and a paste
  box in the studio), with contrast fixed on the way in.
- **Publish Halftone themes as shadcn registry items**: a `registry:theme` download from the studio, the presets
  at `/r/theme/<preset>.json`, and later any theme code by URL.
- `theme decode` and `theme resolve` in the CLI.

## Then: brand assets

A logo in the studio, carried with the theme: a `Logo` component in both kits, the favicon on the web, and the
**app icon and splash screen** on mobile.

## Later: looks beyond tokens

Component styles in the recipe, for both kits: button style (solid, soft, outline-heavy, raised) and input style
(outline, filled, underline), and more named presets with a mood each. Needs a new theme-code version.

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
