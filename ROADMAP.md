# Roadmap

Where Halftone is going, in order. Small items live in each kit's `BACKLOG.md`; this file is the shape.

Halftone's ground: **one brand on phone and web, from one design-token file**, with a theme recipe deeper than
colours (radius, fonts, depth, density, border, icon stroke, typeset), contrast checked on every build, and
agents that build only from what the kits ship. Free, open, and run by your own agent.

**Plan before building.** Every phase below gets its own plan first, with wireframes when it has UI, and is built
only once that plan is agreed. Where the UX is still open, the item lists the questions its plan has to answer.

**Where we left off (2026-11-08).** Everything below marked Done is merged on `main`, and `@halftone-ds/tokens` 1.4.0
is published (Version Packages #90: the Phase 6.1 component properties, tint roles and flat fields, and
`halftone-tokens init` for web and Expo apps). What comes next is not chosen yet: "The thinking beside the screens"
was passed over for now, and the candidates are under "Ideas waiting for a decision".

## Done: trust and pitch

- **Guardrails in lint.** `halftone/*` ESLint rules in both kits (raw colours, imports outside the registry,
  other UI libraries, platform primitives in screens) and a Claude Code hook that lints each edited file.
- **Contrast warns; Halftone builds strict.** `tokens:build` names failing pairings and carries on;
  `--strict` / `HALFTONE_STRICT=1` fails. Halftone's own CI is strict.
- **The pitch:** "One brand. Phone and web. Built by your agent."

## Done: the whole brand file for an existing Expo app

The mobile kit's theme item brought colours and radius only, so its parts arrived undersized in someone else's Expo
app. `halftone-tokens init` now sets up an Expo app too: `tokens/generated/tokens.css` imported first by `global.css`
(Tailwind's build inlines it, so it reaches native), a Tailwind preset added to `tailwind.config.js`, `lib/theme.ts`
and `lib/fonts.ts`. The kit itself uses the same shape. CI's `expo-app` job installs every phone part into a plain
Expo app, exports it for the web and opens it. Plan: `feedback/2026-11-08-mobile-tokens-plan.md`.

## Done: the web kit in any React app

From the first real install (Hendri's workspace dashboard, Vite + React Router on Cloudflare Workers): the web kit
works in any React app, for prototypes and real products. Kit components link through `@/lib/link`, which the app
points at its router once (`KitLinkProvider`); `halftone-tokens init` brings the tokens and fonts; the kit publishes
its own copies of the shadcn parts that would otherwise swap its button; both kits' guides say how to use them in a
real product; and CI's `react-app` job installs the kit into a Vite + React Router app and opens it. Plan:
`feedback/2026-11-08-any-react-app-plan.md`. Feedback: `feedback/2026-11-06-workspace-install.md`.

## Removed: a brief wizard on the site

Removed on 2026-11-05 (docs nav round two, `apps/docs/design/navigation-wireframes.md`): it was over-built for
what it did. The agent can ask the same questions itself, and Docs › Start a prototype now shows how to hand it a
transcript, notes or a brief. The approval stop and the brief template stayed in transcript-to-prototype. The
wizard is in git history (`814a7ba`). What it was:

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

Still to come: a docs page, "Use your Halftone theme in any shadcn kit" (the DESIGN.md, the `registry:theme` file
and the preset code), for workspaces like Design Studio that take all three.

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
- **The open-card component editor** (Phase 6.1, wireframe 9, #86–#88): a variants × sizes specimen with a states
  row and an in-context strip, beside an always-visible panel (Style · Shape · Size · Type · Icon and effects ·
  Colours). New properties in tokens and both kits: border width, gap, weight, case, icon size, shadow, focus ring,
  placeholder, Chip S/M/L and Badge S/M.
- **Nothing drawn at partial opacity** (#89, #91): tint and pressed roles (`primary-subtle`, `primary-pressed`, …)
  come from the ramps in both kits and the docs site; fields are flat until a system gives them a shadow (#93).
  Waiting to publish as 1.4.0 (#90).

## Done: first run and agent tooling

- `npm run setup` in both kits: name, app id, samples and theme, planned and confirmed (flags and `--yes` for an
  agent or CI).
- `npm run eject-samples` one sample at a time, with `--status`; CI ejects each one and runs the gates.
- `npm run qc:look` (Playwright and axe) in both kits, and an `.mcp.json` per kit for its dev server. Every web kit
  page passes it at 375px and 1280px in both themes (#94).
- The lint-on-edit hook covers the docs site as well as both kits (#95).

## Done: rules with reasons

Every rule in both kits' guides and the docs says why, and when to break it (#93; the research behind each rule,
with sources, is `apps/docs/design/rules-research.md`). New rules are written the same way as they land.

## Planned, not started: the thinking beside the screens

A prototype keeps its reasoning next to its screens, in both kits. Learned from Design Studio
(itspatmorgan/design-studio), which keeps briefs, decisions and diagrams beside each prototype. It was next in line
until 2026-11-04, when the maintainer chose not to start it yet; no plan or wireframes exist.
- **The brief, the decisions and a handoff note** in the prototype's folder. The handoff note says what is real,
  what is simulated and what still needs a production decision. transcript-to-prototype writes them, and the kit
  shell shows them beside the screens.
- **A Sketch preset:** greyscale with a handwritten font, for a wireframe pass before the brand goes on.
- **`PERSONAS.md` for agents**, including the engineer who receives the handoff.

Plan first. Open UX questions:
- Where do the notes show on a phone (a sheet over the screen, a tab, the kit's Home?) and on the web (a side
  panel?)? Do they show in the published web export, or only while building?
- One file per prototype, or brief, decisions and handoff as separate files?
- Is Sketch a preset you apply to the whole kit, or a switch per prototype or screen, so a sketch and the branded
  version can sit side by side?
- How does a reviewer move between a screen and the note about it?

## Ideas waiting for a decision

Proposed on 2026-11-03 after a look at Cofounder (cofounder.co; notes in `apps/docs/design/cofounder-research.md`),
which runs a company through the person's own agent and has shipped a shallow "theme from a URL". None is agreed;
each needs its plan first.
- **Component editing, round two.** Feedback from using the open-card editor, then more components as editable
  cards: Card, Tabs, Switch and Checkbox, Avatar, the Select menu (the recipe's reserved card and tab style bits).
- **A theme from a URL, landing in the Studio** (moved up from "Later: agent reach"): a site becomes a full editable
  system, ramps from its colours, contrast fixed, both kits. Cofounder stops at a JSON file.
- **The Studio MCP, local first** (moved up from "Later: agent reach"): systems live in the browser, so before
  accounts it needs a local bridge, for example `halftone-tokens studio connect` linking an agent session to the
  open Studio tab. Decide this before accounts.
- **Agent conventions in the CLI and skills:** `next_steps` in every command's output, `--json` everywhere, steps
  only the person can do handed back as a link, "suggest 2–3 next tasks, recommend one".
- **The site:** a "what it replaces" page (a design-system project from an agency vs. free and open) and a free
  guide, such as "Brand a prototype in an afternoon".

## Later: agent reach

- **Skills any agent can use.** The skills live once in `.agents/skills/`, with `.claude/skills` generated from
  them, and AGENTS.md gets a routing block ("when the person asks for X, read skill Y"), so Codex and Cursor pick
  them up too. Before the plugin, as it reaches more people for less. Learned from Design Studio.
- The skills as a Claude Code plugin, so they load outside the kit folders.
- `DESIGN.md` linted against the open DESIGN.md spec in CI.
- qc-pass driving the app through Expo's MCP tools: screenshots by test ID, every route in both themes.
- A theme from a URL (a client's site → a recipe).
- Two or three theme variants side by side before the build (was: in the brief wizard, now removed).
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
- **A path map** in each kit: which files are the kit's (updates may change them) and which are the project's
  (updates never do). The project's own agent guidance goes in `AGENTS.project.md`, appended to AGENTS.md, which
  updates never overwrite.

Design Studio built a scripted updater and dropped it a week later (0.1.1) for reviewed Git merges, so `--status`
and the per-file diffs come first; applying changes waits until those have proved themselves.

## Later: accounts

The Studio's phase 7, planned separately: accounts and cloud sync (a Worker with Hono, D1, Better Auth, R2 for
logos, version history), then uploaded custom fonts and a "Your systems" library. It changes the "free, open"
wording at the top.

## Parked

- Expo SDK 58: on `chore/sdk-58`, until 58 is stable.
- Package releases: `RELEASES_ENABLED` is on, so changes to `@halftone-ds/tokens` collect in a Version Packages PR,
  which publishes only when merged on the maintainer's go. Published so far: 1.0–1.4.0 (1.4.0 on 2026-11-08, #90).
