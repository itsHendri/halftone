# Studio: decision record

A living contract for `/studio`, the design system manager that replaces the theme studio at `/themes`.
The wireframes are in `studio-wireframes.html` (open it in a browser). A build that contradicts this file stops
and re-checks it first. When a decision changes, change this file in place.

Workshopped on 2026-10-20 after a walk through Subframe's Theme page and research on uicolors.app, tweakcn,
zeroheight, Supernova, Tokens Studio, Untitled UI, Realtime Colors and Material Theme Builder.

## The problem

- **Two places for every edit, and the bigger one is read-only.** Values change in a 256px rail
  (`components/theme/studio/rail.tsx` `Row`) while the result shows in a masonry canvas (`canvas.tsx`) you can't click.
- **Colour is the smallest thing on the page.** You edit one hex. The 50–950 ramp `ramp.mjs#brandRamp` already
  generates is never shown. Error, success, warning and info can't be themed at all.
- **Three layers of chrome:** the site nav, the floating rail and a bottom-right view switcher. Three of the five
  views (Mobile, Web, Typeset) are previews, not editing.
- **The masonry has no reading order.** A spec sheet should read top to bottom.
- **The logo is a sentence until you upload one** (`brand-specimen.tsx`), and the upload lives in the rail.
- **One theme per browser.** No way to keep a portfolio system and a client system side by side.

## The direction: concept A, a spec sheet you edit in place

Subframe's Theme page, plus uicolors' ramps.
- **One scroll:** Foundations is a single page with a sticky section index.
- **Popovers in place:** every item opens a small editor right where it sits.
- **Live preview elsewhere:** there's no live component rail (concept B was dropped). The Components tab is one
  click away.
- Concepts C (foundations as sub-pages) and D (a Figma-style inspector) were rejected. C loses the whole-system
  overview; D brings back the edit-here, look-there split.

### Names
- The area is **Studio**, at `/studio`. `/themes` redirects there, and `?t=` / `?s=` links still work.
- Each saved item is a **system**.
- The tabs are **Foundations**, **Components** and **Accessibility**. Accessibility is today's Contrast view,
  renamed.

### Information architecture

| Top bar (left → right) | What it does |
| --- | --- |
| System switcher (the system's name) | List, switch, New, Import; per system: Rename, Duplicate, Export `.halftone.json`, Copy share link, Delete |
| Foundations · Components · Accessibility | The three tabs; Accessibility shows its warning count |
| Undo · Redo · Shuffle · Light/dark | Undo works across the whole system; Shuffle respects locks (today's `LOCK_KEYS`) |
| **Use system** | The one primary action. Opens today's export panel (code, agent prompt, `.halftone.json`, brand zip) |

- **Slim site header on `/studio`** (decided 2026-10-20). The site's Docs / Components / Screens nav shrinks to a
  slim header (logo, a way back to the docs, search), because the Studio is a tool, not a docs page. The Studio bar
  sits directly under it.
- The site-wide theme pill follows the active system. The ambient colour drift stops once someone has a system
  they've edited.

## Foundations, section by section

Every section header has, in order: its name and count; its **base knob**; and **+ New**.
- The base knob rewrites every item you haven't edited. It's today's recipe axis: Scale, Base radius, Depth.
- **+ New** adds an extra.

| Section | Items (fixed slots) | Base knob | Notes |
| --- | --- | --- | --- |
| Brand | Logo, Logo dark, Mark, Mark dark, App icon; system name | (none) | Slots always show (see "Logo placeholder" below); upload, replace and remove happen in the slot's popover |
| Colours | **Roles** (21 aliases: primary, background, foreground, border, muted, destructive, ring, card, popover, secondary, accent, input, sidebar-\*, chart-1–5…), then **ramps**: Brand, Neutral, Error, Success, Warning, Info, each 50–950 | Light / dark switch | The ramps share one 50–950 axis. The input step is outlined |
| Typography | Font cards (Heading, Body, Mono), then 11 text styles: Heading 1–4 (`h1`–`h4`), Lead, Large, Body (`p`), Small, Muted, Quote (`blockquote`), Code | Scale (base size, leading, flow) | Fonts can be any Google Font; the curated 22 come first as "Halftone picks" |
| Corners | Small, Medium, Large, XL, 2XL, Full (`sm`…`2xl`, `full`) | Base radius | |
| Shadows | Shadow 1–3 | Depth | Multi-layer shadows, as in Subframe |
| Borders | Default, Input | (none) | Width, style and a colour role |
| Controls | Button style, field style, mobile button shape, icon stroke, density | (none) | Grows into **Components** later (see below) |

### Rules

- **Fixed slots can't be deleted or renamed.** Renaming would desync DESIGN.md and llms.txt, which tell agents
  to use `h2` and so on. Extras can be renamed and deleted.
- **Extras show inline in their own section**, with a "Not used by components" tag. They export to tokens.json
  and CSS, but the kits don't read them.
- **Ramps:**
  - One input colour per ramp. The input is pinned to its nearest step ("auto"), or to a step you choose, like
    uicolors' "lock to 500". There's an optional hue drift.
  - Changing the input regenerates every step that hasn't been edited.
  - A step can be overridden. It then shows "edited", with a reset.
  - A seventh ramp is an extra (+ New colour → Ramp). The six role ramps can't be deleted.
- **Dark mode:** the ramps are shared. Each role points at one step in light and another in dark. Generated by
  default; the Light/dark switch shows and edits the dark mapping.
- **Contrast:**
  - Warns on your own choices and never changes them silently. Auto-fixes only generated values, which matches
    ROADMAP's "warns by default".
  - Shows in the step and role popovers where you edit, and is collected on the Accessibility tab.
- **Logo placeholder:** the system's name set in its heading font. The first letter is the mark; the app icon
  sits on the brand colour. Previews and the kits always have a logo. An upload replaces it.

## Popovers (wireframe 2)

- **One shape:**
  1. Name row: for fixed slots, a lock and a slot tag (`h2`, `md`); for extras, an editable name and a trash.
  2. Preview.
  3. Values.
  4. Footer for status: "edited · reset" (or "N edited · reset all"), contrast, "used by…".
- **Behaviour:** edits apply live, save automatically and can be undone with ⌘Z. Esc or clicking outside closes
  the popover. One is open at a time; it opens beside its item and flips at the edge. On a phone it is a bottom
  sheet.
- **Where each one opens from:**

| Popover | Opens from | Fields |
| --- | --- | --- |
| Ramp | the row label | Input hex, pin (auto/step), hue drift, reset all |
| Step | a swatch | Hex override, contrast on white and on 950, used by |
| Role | a role chip | Light step and dark step (token picker with search, as in Subframe), contrast of its foreground |
| Text style | a row | Font role, weight, size, line height, tracking; reset to scale |
| Font | a font card | Search; Halftone picks, then all Google Fonts with weight ranges |
| Corner | a corner | Radius; follows base or overridden; used by |
| Shadow | a card | Layers (x, y, blur, spread, colour, alpha, inset), plus and minus a layer |
| Border | a card | Style, width, colour role |
| Logo slot | a slot | Upload SVG/PNG (`lib/brand/upload.ts` limits), replace, remove |
| Extra | the item | Editable name, delete, a value or a link to a step |

- **Not drawn yet:** the "+ New" menus (New colour → single or ramp; New text style copies the nearest style)
  and right-click "Show usage".

## Systems (wireframe 3)

- **Storage:** IndexedDB holds the documents, because four logos per system would overflow localStorage.
  localStorage keeps only the active id and the boot CSS cache. The switcher says "Saved in this browser"; that
  line becomes "Sign in to sync" once accounts land.
- **New system:** a name, plus one of: a preset (the 10 presets; Default is the blank), a copy of the current
  system, or an import (`.halftone.json`, an `ht-` code or a shadcn preset code). There is no empty system.
- **First run:**
  - The existing `halftone.theme` and `halftone.brand` move in once, silently, as "My system", with a
    dismissible banner.
  - A first-time visitor with nothing saved gets "Halftone" (the committed theme).
- **Shared links** (`?t=` code, `?s=` JSON) open read-only as "<name> · shared", with Save as new system or
  Discard. They never overwrite your work, which is a change from today. Links don't carry logos; copying a link
  for a system with a logo says so.
- **Delete** confirms once, then offers undo in a toast.

## Components tab (wireframe 4)

Every catalogue tile (`components/kit-tiles.tsx` `GroupTiles`, `lib/catalogue.ts` `GROUPS`), live on the active
system.
- A group filter, a Web / Mobile toggle, and light/dark from the top bar.
- Read-only: clicking a tile opens its docs page.

## Accessibility tab (wireframe 5)

`ContrastTable` and `ColourVision`, with a summary first:
- Pairings passing AA.
- Your edits to check.
- Values that were auto-fixed.
- Colour-vision previews.

The pairing table shows light and dark, with "fix" on your own choices. Below it, each ramp gets a contrast grid
(text on every step).

## Phone width (wireframe 6)

- The section index becomes a jump menu under the top bar; the tabs stay.
- Undo, shuffle and light/dark go into a ⋯ menu.
- Popovers become bottom sheets.

## Later: component-level editing (wireframe 7)

After foundations, the user wants a fully editable system: Controls grows into a **Components section of
Foundations** (Option 1, chosen over making the Components tab editable).
- Button, Chip and Tag come first, each a card with the same popover pattern (style, corner token, height,
  padding, colour roles).
- Every value points at a foundation token or is overridden.
- Stored under the document's reserved `components` key (PR #55).

## Explicitly deferred

- **Accounts and cloud sync:** a Worker with Hono, D1, Better Auth, R2 for logos, version history. Planned
  separately; changes ROADMAP's "free, open" wording.
- **Uploaded custom fonts.** They need storage, so they come with accounts.
- **A live component rail beside Foundations** (concept B).
- **A full "Your systems" library page.** The menu is enough until accounts and teams.
- **Sample apps (Shop, Dashboard…) inside the Studio.** The user finds components enough context.
- **A Typeset view.** Typeset lives in Typography's Scale knob and the text styles.
- **Renaming fixed slots.**
- **Spacing as a themeable foundation.**

## Phasing (one PR each)

| Phase | What | State |
| --- | --- | --- |
| 0 | These wireframes and this record | done 2026-10-20 |
| 1 | `HalftoneSystem` v1 document, `generateSystem`, `migrate`, CLI apply of `.halftone.json` (packages/tokens) | PR #55 |
| 2 | The kits read per-style text tokens (`semantic.type.<variant>.*`) in both kits and the embed payloads | PR #58 |
| 3 | Studio shell: `/studio`, systems in IndexedDB, switcher, migration, tabs; the rail and the Mobile/Web/Typeset views removed | |
| 4 | Foundations sections and popovers | |
| 5 | Components and Accessibility tabs | |
| 6 | Component-level editing (Button, Chip, Tag) | later |
| 7 | Accounts | later, planned separately |
