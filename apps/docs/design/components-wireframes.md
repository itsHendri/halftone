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
