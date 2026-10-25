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

## Done: looks beyond tokens

Component styles in the recipe, for both kits: **buttons** (solid, soft, outline, raised) and **inputs**
(outline, filled, underline), as theme tokens every Button, Input, Textarea and Select draws; two new presets with
a mood each (Tactile, Studio) and three presets that use the styles. Themes with styles are `ht3-` codes (18
characters, with room for more styles). Shipped in `@halftone-ds/tokens` 1.2. Still to come: more styles (cards,
tabs) in the reserved bits.

## Done: Studio, a design system manager

`/themes` became `/studio` (phases 0–6, #55–#71; the contract is `apps/docs/design/studio-wireframes.md`, the data
layer the `HalftoneSystem` document in `@halftone-ds/tokens`, shipped in 1.3):
- Several saved systems in the browser, with a switcher, shared `?s=` links and a `.halftone.json` export.
- **Foundations** edited in place: every role a 50–950 ramp from one colour with any step editable, text styles,
  fonts from all of Google Fonts, corners, shadows, borders, and "+ New" extras that reach every output.
- **Components**: Button, Chip, Badge and Input edited as tokens both kits read, so one theme looks the same on
  phone and web.
- **Components** and **Accessibility** tabs: every catalogue tile live on the system, Show usage, and contrast with
  fix and undo.
- Tested end to end in both kits copied out (#76–#82, 1.3.1); CI now applies a system with every kind of override
  to both kits (`system apply`).

## Done: first run and agent tooling

- `npm run setup` in both kits: name, app id, samples and theme, planned and confirmed (flags and `--yes` for an
  agent or CI).
- `npm run eject-samples` one sample at a time, with `--status`; CI ejects each one and runs the gates.
- `npm run qc:look` (Playwright and axe) in both kits, and an `.mcp.json` per kit for its dev server.

## Later: agent reach

- The skills as a Claude Code plugin, so they load outside the kit folders.
- `DESIGN.md` linted against the open DESIGN.md spec in CI.
- qc-pass driving the app through Expo's MCP tools: screenshots by test ID, every route in both themes.
- A theme from a URL (a client's site → a recipe).
- Two or three theme variants side by side in the brief wizard, before the build.
- An MCP server for the theme studio, so an agent changes the theme while you watch.

## Later: kits that keep up

A kit copied out with `npx giget` gets later fixes only through `@halftone-ds/tokens`. Fixes to the kit's own code
(components, the kit pages, the samples) never reach it: the web headings that follow the text styles (#81), or
the Foundations summary for a system without a code (#76). Learned from contentarchitecture.dev's `trim:update`.
- `npm run setup` records the kit version the project started from (the Halftone commit), in a file the project
  keeps.
- `npm run kit:update` fetches the kit at a newer version, applies its changes to the files the project hasn't
  edited since, and lists the ones it has, each with the upstream diff, instead of overwriting them.
- `kit:update -- --status`: what changed upstream since, and which of the project's files differ from the kit they
  started as.
- CI copies a kit out at an older release, updates it to this commit and runs the gates.

## Later: accounts

The Studio's phase 7, planned separately: accounts and cloud sync (a Worker with Hono, D1, Better Auth, R2 for
logos, version history), then uploaded custom fonts and a "Your systems" library. It changes the "free, open"
wording at the top.

## Parked

- Expo SDK 58: on `chore/sdk-58`, until 58 is stable.
- Package releases: `RELEASES_ENABLED` is on, so changes to `@halftone-ds/tokens` collect in a Version Packages PR,
  which publishes only when merged on the maintainer's go.
