# Components: one catalogue (2026-10-12)

A living contract for the Components section, the home page's sample apps and Screens. Builds that contradict it
stop and re-check here first. Wireframes: `components-wireframes.html`. Update both in place.

## The reframe

The site documented **kits**; people look for **components**. Today `/components/mobile/*` and `/components/web/*`
are two parallel trees: the 33 components both kits have appear twice, and "mobile" names a device, though the
web kit is responsive and runs on phones too. The real difference is technology: **Native** (Expo, React Native,
iOS and Android) and **Web** (Next.js, any screen).

## Decisions

- **One catalogue** (direction A). `/components` is the index, `/components/<id>` one page per component, whichever
  kits have it. Grouped by category, not by kit.
- **Naming: Native and Web.** "App kit"/"Mobile kit" go; badges, the filter and copy say Native and Web. The kits
  keep their folders (`apps/mobile`, `apps/web`); only the site's words change.
- **Availability on every item.** Sidebar items and index tiles carry `Native`, `Web` or both. A component page
  shows the badges under its title and, when both kits have it, a `Native | Web` switch that swaps the preview,
  usage, API, install command and details (the two versions have different props).
- **Filter.** One `All | Native | Web` control at the top of the sidebar narrows the sidebar and the index and sets
  the default side of the switch. Remembered per visitor.
- **No concept pages.** Same idea, different names (web `chart` vs native line/bar/donut charts, `page-header` vs
  `screen-header`, `drawer` vs `option-sheet`/`action-sheet`) stay separate pages that cross-link ("Web: Chart").
- **Sidebar groups**: bold titles with an icon, items indented under them (as Kumo does). Categories first
  (Actions, Inputs, Navigation, Data, Feedback, Layout, Overlays, Media); then **Native only** (device and touch:
  camera, code scanner, Face ID, permissions, share, notifications, tab bar, swipe to confirm, numeric keypad) and
  **Web only** (hero, feature grid, navigation menu, breadcrumb, pagination, data table, table, scroll area,
  command, app shell). The same bold-title treatment applies to the Docs sidebar.
- **Previews on a plain stage**, no device chrome: the component alone on a neutral surface (native components at
  phone width, 390px). Screen-level native components (tab bar, sheets, sticky bottom bar, camera, Face ID,
  success screen) keep a phone outline so they read correctly.
- **Index of live tiles** like kumo-ui.com: a grid of components, each live on its stage, lazy-loaded by category,
  following the theme bar.
- **Parity, both directions, phased.** About 39 web versions of native-only components and about 11 native
  versions of web ones (the AI set, pricing card). Each lands through the kit's add-component skill and shows up
  in the catalogue with its badge.
- **Home page:** no floating phone beside the showcase band (components already explain the system). In Sample apps,
  the browser frame matches the phone screen's height.
- **Screens:** no Native/Web split. Each sample product shown on both devices side by side, which needs matching
  pairs: web versions of Shop and Habits, a native version of the invoicing product. Built after the catalogue.

## Parity list (for the build phases)

- **Needs a web version (39):** floating-button, icon-badge, action-grid, filter-chip, segmented-control,
  search-field, quantity-stepper, rating, amount-input, otp-input, password-input, selectable-card,
  range-selector, menubar, stepper, section-header, pager-dots, horizontal-pager, avatar-group, list-row,
  list-group, icon-circle, summary-card, percent-change, progress-ring, status-dot, timeline, value-header,
  spinner, success-screen, sticky-bottom-bar, promo-card, footnote, context-menu, hover-card, image-tile,
  aspect-ratio, placeholder, spot.
- **Web has it under another name (cross-link):** line-chart, bar-chart, donut-chart → chart; screen-header →
  page-header; option-sheet, action-sheet → drawer.
- **Native only:** photo-capture, code-scanner, biometric-gate, permission-primer, share, notify, tab-bar,
  swipe-to-confirm, numeric-keypad. `text` and `icon` stay listed in their groups with a Native badge (they are the
  native kit's building blocks); only `kit-chip`, scaffolding, is left out of the catalogue.
- **Needs a native version (11):** chat-message, chat-composer, attachment-chip, chat-thread-list, sources,
  follow-up-suggestions, streaming-text, thinking-indicator, tool-call-card, approval-card, pricing-card.
- **Web only:** app-shell, navigation-menu, breadcrumb, pagination, command, data-table, table, scroll-area, hero,
  feature-grid.

## Cross-cutting rules

- A component's URL is its registry id: `/components/button`. When the kits use different ids for one thing they
  stay two pages. The old `/components/mobile/<id>` and `/components/web/<id>` redirect (Cloudflare `_redirects`).
- Search returns one result per component, with its badges.
- A page for a component the filter excludes still opens (links and search must work); the switch starts on the
  platform that has it.
- The registries (`/r/native`, `/r/web`), `llms.txt` and `install.md` keep their per-kit shape: agents install from
  one kit at a time.

## Explicitly deferred

- Concept pages that merge differently named twins.
- Showing Native and Web previews side by side on one component page (direction D).

## Phasing

1. **The catalogue**: merged tree and pages, badges, `Native | Web` switch, filter, plain-stage previews (a
   `kit:size` autosize in the native kit too), Native only / Web only groups, bold group titles (Components and
   Docs), redirects. With today's components.
2. **Live-tile index** at `/components`.
3. **Home page**: remove the band's phone; Sample apps browser matches the phone height.
4. **Parity, web versions** in batches by category (inputs and data first), one PR per batch.
5. **Parity, native versions** of the AI set and pricing card.
6. **Screens as matching pairs**: web Shop and Habits, native invoicing; one Screens gallery, both devices side by
   side.

## How it is built (phase 1)

- `lib/catalogue.ts`: the two registries joined by id; groups, the Native only / Web only sets, counterparts,
  screen-level ids and which stages need room for overlays.
- `lib/components-tree.tsx`: the sidebar (separators with lucide icons, items with badges and `data-sides`).
- `components/kit-availability.tsx`: badges, the All | Native | Web filter (`<html data-kit-filter>`, set before
  paint by the boot script) and the Native | Web switch. `app/global.css` hides filtered entries with CSS.
- `components/kit-stage.tsx`: the plain stage, an iframe of the kit's single demo sized by `kit:size`
  (`?autosize=1`; the native kit reports it from `onLayout`, the web kit from `[data-autosize]`).
- Old URLs: `scripts/build-docs.mjs` writes `/components/{mobile,web}/* → /components/:splat` into `_redirects`.

## Status and next steps (updated 2026-10-13)

A fresh session can pick up here. PRs merge with `gh pr merge <n> --rebase --delete-branch`, and only when the user
says so. Required checks: 6 CI jobs plus `Workers Builds: halftone-docs`.

**Done (on main and live).** Every phase of this contract is built.
- Phase 1, the catalogue: #30. It also renamed the device components (Camera, Code scanner, Face ID, Permission
  primer, Share, Notifications).
- Phase 2, live tiles: #31. Tile grid fix: #33.
- Phase 3, home page: no phone in the band, and the dashboard matches the phone's height. #32.
- Phase 4, web versions of the 39 native-only components: #34 (inputs, data) and #35 (actions, navigation, feedback,
  layout, overlays, media; the web kit gained a `media` category). #35 also made kit links use `next/link`, so they
  keep the base path (`/w` in the docs).
- Phase 5, native versions of the AI set and the pricing card: #36. The native kit gained `marketing` and `ai`
  categories. Where a phone differs: presses are `onPress`, the composer's files come from `onAttach`, source
  previews open in a Sheet.
- Phase 6, Screens as matching pairs: web Shop and Habits (#37), native Northwind (#38), and `/screens` showing each
  product on a phone and in a browser with one screen picker (#39, `components/screen-pair.tsx`). Northwind's
  web-only pages (landing, assistant) sit under its pair; the home band pairs Northwind on both devices.

**Next:** nothing planned. The UI-audit items below are done.

### How a parity batch is built (what #34 did)
1. Read the native source in `apps/mobile/components/kit/<id>.tsx`. Write `apps/web/components/kit/<id>.tsx` with
   the **same id** and the native props. Use web idioms for presses (`onClick`, `href`) and labels (`aria-label`).
   Style with className only, `cn` from `cn`, and the web radius scale (no pills). Anything that moves uses
   `useReducedMotion()`.
2. Register it in `apps/web/registry/components.ts` under the same category as the native one. Add a demo to
   `TWIN_DEMOS` in `apps/web/components/devkit/demos-native-twins.tsx`. Run `npm run registry:build -w apps/web`.
3. Check: `npm run typecheck -w apps/web`, `npm run lint -w apps/web`, `npm run tokens:check -w apps/web`,
   `registry:build -- --check`, `registry:dist` and `registry:roundtrip`. Then root `npm run check`, plus the docs
   `build`, `check:links` and `check:a11y`.
4. Look at it: the web dev server (launch config `web-dev-embed`, port 3100) at
   `/components?embed=1&tiles=<id>,<id>` shows the tiles exactly as the docs index does. Check 1280px and 375px, in
   light and dark.

### Things learned building it
- Tiles: `?tiles=a,b,c&embed=1&autosize=1` on either kit's Kitchen Sink route. A kit reports its height with
  `kit:size`: the web kit from `[data-autosize]`, the native kit from `reportEmbedSize` in an `onLayout`. A tile's
  title posts `kit:open` and the docs navigate. One frame per kit per group; native frames are expensive.
- Embedded web-kit pages drop the `(kit)` layout's width cap and padding (`[[data-embed]_&]:…`).
- The docs filter is pure CSS: `<html data-kit-filter>` plus `data-sides` on sidebar items, index links and group
  titles (`app/global.css`).
- A `'use client'` module's functions can't be called from a server component. Server-safe constants live in
  `lib/device.ts`.
- `check-a11y` waits up to 60s for networkidle, then checks the page as it is (the studio loads every font).
- Dev servers: launch configs `kit-web-embed` (8090), `web-dev-embed` (3100), `docs-dev-live` (3000).
  Screenshots: headless Playwright from the repo's `node_modules/playwright` works when the browser pane is
  hidden.

### UI audit (2026-10-11), done 2026-10-13
- Studio rail: single-line rows (label left, value right), compact group titles, the preset row untitled at the top, a
  scroll fade (`ScrollFade`) at whichever edge has more, and a two-row footer. Every group fits at 900px tall.
  Each picker opens with one line on what it changes (`HINTS` in `rail.tsx`).
- Studio Overview: the colour grid fills the panel (`auto-fill`, 7.5rem minimum), and the first card says what the
  theme does in our words.
- Home hero: one primary action (Copy prompt); Browse components is outline, How it works plain.
- Radio groups: `lib/roving.ts` gives every pick-one group one tab stop, arrows, Home and End: the rail's pickers and
  swatches (focus previews, Enter picks), the studio's preview chips, the Screens picker and the components filter
  (arrows pick), and the theme bar's presets and colours.
- Phones: the theme bar slides away while it would cover anything marked `data-theme-bar-avoid` (the hero's copy row
  and buttons). The rail's subtitle reads "Kit default". Locks are always visible, and the footer says what they do.
