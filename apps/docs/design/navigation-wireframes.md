# Docs navigation: decision record

A living contract for the docs site's navigation. Wireframes: `navigation-wireframes.html` (open it in a
browser). A build that contradicts this file stops and re-checks it first; change this file in place when a
decision changes.

## Round two (2026-11-05): one shell, for real

### What was wrong

- **Studio left the shell.** On `/studio` the top bar became a slim one (logo, "← Docs", search; 48px, not 56px, no
  section links), the Studio stacked its own bar (system switcher, Foundations / Components / Accessibility tabs,
  actions) and then an inset section index styled unlike the Docs sidebar. Three levels of navigation, and it felt
  like leaving the site.
- **Components carried chrome.** An All | Native | Web filter above the sidebar, Native / Web chips on every row,
  and "All components" as a highlighted row with no heading over it.
- **Brief was over-built.** The `/brief` wizard duplicated Docs › Start a prototype and the `transcript-to-prototype`
  skill, which already takes a transcript or notes from chat.

Reference for the catalogue: untitledui.com/react/components (cards with a live canvas, a name and one quiet line;
a component page whose large, quiet preview has its name and Preview | Code in one header row; no badges in the
sidebar).

### Information architecture

| Top bar | Route | Sidebar |
| --- | --- | --- |
| Logo → Home | `/` | none |
| Docs | `/docs/*` | Get started · Design system · Project |
| Components | `/components/*` | Overview, then the groups, plain rows |
| Screens | `/screens` | none |
| Studio | `/studio`, `/studio/components`, `/studio/accessibility` | system switcher, then Foundations · Components · Accessibility |
| Search ⌘K, Get started (→ `/docs/install`), theme, GitHub | | |

`/brief` is gone (301 → `/docs/start/`).

### Rules

- **One bar, one sidebar.** Every section uses the same top bar and, where it has a tree, the same notebook
  sidebar: same width, same row style, same neutral selected fill. A section never swaps the bar or adds a second one.
  Why: moving between sections must never move the navigation. When to break: never; a tool that needs more room
  hides the sidebar, it doesn't replace the bar.
- **Two levels, not three.** The top bar says which section; the sidebar says where in it. Tabs inside a page are for
  views of one thing (Preview | Code, Native | Web), never for places. Why: a third level reads as stepping out of
  the site.
- **The sidebar's banner slot holds the section's one context control**: the system switcher in Studio, nothing in
  Components. Why: it is the one control that changes what every row shows.
- **Availability lives on the component, not in the sidebar.** No filter, no chips in rows. The index card's muted
  line and the preview header say Native · Web, Native only or Web only. Why: 86 of 110 entries are on both kits, so
  chips on every row are noise; a page says it once where it matters.
- **Native | Web is a view of the page.** In the preview header; it switches the preview, code, usage, API, Get it
  and Details; `?kit=` wins; the choice is remembered for the next component.
- **Preview | Code** sits beside it. Code is the kit's real demo source (the devkit demo function), with copy; where
  a demo isn't a named function it falls back to the API snippet.
- **The Components sidebar starts with Overview**, a normal row, then the groups. Group titles have no counts.
- **Merged entries.** The same component under another name in the other kit is one entry: Chart (native Line,
  Bar, Donut chart + web Chart) and Page header (native Screen header + web Page header). Old slugs redirect to the
  merged page. Native Option sheet and Action sheet stay native-only (web has Sheet and Drawer, different patterns);
  their page says what to use on web.
- **Studio's groups.** Foundations (Brand, Colours, Typography, Corners, Shadows, Borders, Controls) are anchors on
  one page with a scroll spy; the old Foundations "Components" section is called **Controls** so the sidebar never
  says Components twice. Components is one row (the group chips stay over the canvas). Accessibility carries the
  count of pairings below AA. Undo, redo, shuffle, light/dark and Use system are a slim toolbar over the canvas.
- **Phones.** The same drawer on Docs, Components and Studio: the four sections, then the section's tree.

### Explicitly deferred (round two)

- Porting one-kit components to the other kit: a later phase, picked one by one. Device features (camera, Face ID,
  share, keypad, tab bar) and desktop patterns (data table, pagination, command, app shell, hero) stay one-kit.
- A breadcrumb, "Copy page" and an on-this-page rail on component pages.
- One Studio sidebar row per catalogue group.
- A guided brief on the site (the wizard is in git history, commit `814a7ba`).

### Phases

1. **Shell:** four sections, Studio under the shared bar, Brief removed.
2. **Components:** sidebar, index cards, component page (preview header, Code tab), merges and redirects.
3. **Studio:** notebook layout, sidebar groups, routes, toolbar.

One PR each, one at a time.

---

The record below is round one (2026-10-09). Where it disagrees with round two, round two wins.

## The problem (2026-10-09)

- Two shells: Home, Screens and Themes used Fumadocs' home layout (links in a top bar), while Docs and
  Components used the docs layout, where the top bar disappears and the same links move into the top of the
  sidebar. Moving between sections moved the navigation.
- Install was a top-level nav item, but it is one Docs page (`/docs/install`); clicking it changed shells.
- Themes (`/themes`) was not in the nav at all; only the theme bar linked to it.

## The direction: A, one shell

A top bar that never moves, on every page; a sidebar only where a section has a tree. The pattern shadcn/ui,
Radix, gluestack and Mintlify use. Built on Fumadocs' notebook layout (`fumadocs-ui/layouts/notebook`,
`nav.mode: 'top'`) for Docs and Components, and the home layout's navbar, with the same links, for the rest.

### Information architecture

| Top bar | Route | Sidebar |
| --- | --- | --- |
| Logo → Home | `/` | none |
| Docs | `/docs/*` | Get started · Design system · Project |
| Components | `/components/*` | Mobile / Web switch, then categories in registry order |
| Screens | `/screens` | none (Mobile / Web chips stick under the bar) |
| Themes | `/themes` | none (the studio has its own inspector) |
| Search ⌘K, Get started (→ `/docs/install`), GitHub | | |

Docs sidebar groups: **Get started** (How it works, Install, Mobile kit, Web kit), **Design system**
(Foundations, Themes, Patterns), **Project** (Changelog).

### Rules

- The top bar is identical on every page: same links, same order, same position. Only the current section's
  underline changes.
- The current section is marked with a neutral underline (foreground), never the brand colour: the site's
  selected-state rule, and it passes contrast under any theme.
- Install is a "Get started" outline button at the right of the bar, not a nav link. The hero keeps its own
  buttons.
- A sidebar appears only for a tree. Gallery pages (Screens) and tools (Themes studio) are full width under
  the bar.
- Phones: logo, search and a menu button. The menu sheet lists the four sections, then the current section's
  tree.
- The theme bar stays at the bottom of every page except `/themes`, unchanged.

## Explicitly deferred

- Organising the site by kit (a Mobile / Web switch in the top bar, one tree per kit): cleanest IA, but new
  URLs and redirects, and cross-kit pages (Themes, how it works) have no home.
- A sidebar on Screens (one page per sample app): worth it once there are more sample apps.
- A single sidebar with no top bar (GitBook style): costs the landing page and frame width.
- An active state on the Screens chips (scroll spy).

## How it is built (2026-10-09)

- `components/site-header.tsx` is the one top bar. Both layouts render it in place of their own header
  (`nav.component` in `lib/layout.shared.tsx`): the home layout (Home, Screens, Themes) and the notebook layout
  (Docs, Components). Neither layout's built-in header could put the sections in the same place, so they share
  ours. The sections live in `lib/sections.ts`.
- On phones the home layout opens a menu (sections, Get started, theme, GitHub); the notebook layout opens its
  sidebar drawer, fed by `links` with `on: 'menu'` (sections, Get started), above the tree.
- The theme bar sits at z-30, under drawers and menus.
- Screens' Mobile / Web chips stick under the bar; they have no active state yet (deferred).
- The bar is full width on every page, like ui.shadcn.com. The notebook layout's own grid put the header in its
  middle three columns, which stop at `--fd-layout-width` (97rem), so above ~1550px the bar was inset on Docs and
  Components and full-bleed elsewhere. `notebookContainerProps` (`lib/layout.shared.tsx`) overrides the grid: the
  header row spans every column, the outer gutters are 0px (sidebar flush left), and each `DocsPage` centres its
  article (`*:mx-auto *:w-full`). The full-width pages share one content width, `max-w-site` (72rem, `global.css`).
  `scripts/check-a11y.mjs` fails if the bar's width or the logo's x differ between pages at 1920px.

## Superseded in part (2026-10-12)

The Components section is now one catalogue, not a tree per kit: see `components-wireframes.md`. "Mobile kit" is
called **Native** on the site, and sidebar group titles (Components and Docs) are bold with an icon.
