# Halftone web kit: feedback from installing it in the workspace dashboard

2026-11-06. Hendri's workspace dashboard (workspace.hendri.design) moved from hand-written HTML to the Halftone web kit. It's a real, private app, not a prototype: React 19 and React Router on Vite, served by a Cloudflare Worker that also answers a small JSON API (Workers Free, D1). Install route: install.md path D (registry), adapted for Vite. Versions: registry as served on 2026-11-06, shadcn 4.22.1, @halftone-ds/tokens 1.3.2.

What follows is everything that got in the way or needed a workaround, most important first. Each item has what happened, why it matters, and a suggested fix. The good parts are at the end.

## Issues

### 1. The theme item doesn't carry the tokens the components need
- What happened: `npx shadcn add @halftone-web/theme` writes about 60 shadcn variables (colours and radius). The kit components use far more: `--button-h-md`, `--button-x`, `bg-field-default-bg`, `rounded-field`, `type-h2`, `type-button`, `bg-badge-default-bg`, the density-scaled spacing, the shadow scale. Those live only in the kit's generated `tokens.css`, about 750 lines. With path D as written, Button, Input, Badge and PageHeader install cleanly but render with missing values, and nothing says why.
- Workaround: installed `@halftone-ds/tokens`, copied `apps/web/tokens/tokens.json` from the monorepo, wrote a `tokens.config.json` with only the `shadcn-web` target, ran `halftone-tokens build`, and imported the result into the app's CSS. After that, everything rendered correctly in light and dark.
- Suggested fix: make `@halftone-web/theme` ship the full generated `tokens.css`, for example as a `registry:file` plus an `@import`, or as a `registry:style` with the complete CSS. Or make path D say plainly that the theme item is colours only, and give the three tokens commands.

### 2. Kit components import `next/link` and `next/navigation`, undeclared
- What happened: `app-shell`, `list-row` and `section-header` import `next/link`, and `app-shell` also imports `next/navigation` (`usePathname`). The registry items list only `cn` and `lucide-react` as dependencies, so a non-Next app fails at build time.
- Workaround: two small adapter files (`src/lib/next/link.tsx` and `navigation.ts`, built on React Router) and Vite aliases for `next/link` and `next/navigation`. The kit files stay untouched, so updates still apply.
- Suggested fix: route links through a kit-owned `@/lib/link`, shipped as a `lib-link` registry item that maps to `next/link` in Next and to a plain `<a>` or the app's router elsewhere. Or accept a `linkComponent` prop or `asChild` on the components that render links. At the very least, declare `next` in those items' dependencies so the failure is honest.

### 3. A plain shadcn item can silently replace a kit file
- What happened: adding `alert-dialog` (plain shadcn) together with kit items, with `--overwrite` as install.md recommends, replaced the kit's `button.tsx` with stock shadcn's. alert-dialog lists `button` in its registryDependencies, and stock won. Nothing warned about it. The only clue was buttons that looked slightly off.
- Workaround: re-ran `npx shadcn add @halftone-web/button --overwrite` last.
- Suggested fix, any of these:
  - Publish kit versions of the shadcn items that pull in `button` (alert-dialog, calendar, pagination and so on), so they depend on `@halftone-web/button`.
  - Say in install.md to add plain items first and kit items last.
  - Add a check (`halftone-tokens doctor`, or a registry check) that names kit files that have been replaced by stock versions.

### 4. install.md has no path for a React app that isn't Next.js
- What happened: paths B and D both assume Next.js. Vite and React Router SPAs, Remix and React Router framework mode, Astro with React islands, and Workers or Pages apps are all common homes for "dashboards and AI product interfaces". Everything here was worked out by trial and error.
- Suggested fix: a path F, "existing React app (Vite and others)": the components.json to copy, the tokens setup from item 1, the link adapter from item 2, and dark mode with a `.dark` class instead of next-themes.

### 5. shadcn 4's `init` choices aren't covered
- What happened: `shadcn init` now asks for a base (radix, base or aria) and a preset (such as base-nova). The kit is Radix, "new-york". install.md doesn't say which to pick, and picking Base UI would make every kit component incompatible.
- Workaround: wrote components.json by hand, copied from apps/web, with `rsc: false` and the registries entry.
- Suggested fix: give the exact `init` flags, or a components.json to copy, in path D and the new path F.

### 6. No way to start tokens in an existing app
- What happened: `halftone-tokens` has `build`, `check`, `theme` and `figma`, but no `init`. To build tokens, you need a `tokens.json` that exists only inside the monorepo.
- Suggested fix: `npx halftone-tokens init [--theme <ht-code>] --target shadcn-web --out src/tokens.css`. It would write a default tokens.json and tokens.config.json and run the first build.

### 7. The post-install message is noisy and misleading
- What happened: "Needs the kit theme (`@halftone-web/theme`) and a next-themes ThemeProvider (attribute="class") at the root." printed once per item, 17 times in one add. It's also not enough (see item 1), and next-themes isn't required: any `.dark` class on `<html>` works.
- Suggested fix: print it once, point to the full tokens setup, and say "a `.dark` class on `<html>` (next-themes does this in Next)".

### 8. The rules assume a throwaway prototype
- What happened: "Never call real APIs", "mock data lives beside the prototype" and "a prototype lives in its own folder" don't fit using the kit as a real product's front end, which this is. An agent following the rules literally would refuse to wire up the API.
- Suggested fix: a short "Using the kit in a production app" section. The component and token rules stay the same, real data is fine, and routing and folders follow the host framework.

### 9. ListRow always truncates to one line
- What happened: the title and subtitle are always `truncate`. To-dos and feedback notes are often longer than a line, and on a phone most of the text disappears.
- Workaround: `className="[&_.truncate]:overflow-visible [&_.truncate]:whitespace-normal"` on the row.
- Also: the row is `items-center`, so with wrapped text the leading slot (a badge, an icon) floats in the middle of a tall row and takes width on a phone. Wrapped rows want `items-start`.
- Suggested fix: a `wrap` (or `lines={2}`) prop that also top-aligns the leading and trailing slots.

### 10. ListGroup's `last` only reaches direct children
- What happened: ListGroup clones its direct children to set `last`. Wrapping ListRow in your own row component means the prop lands on your component, and the divider shows under the last row unless you forward it.
- Suggested fix: a note in ListGroup's doc comment and in llms.txt ("forward `last` if you wrap ListRow"), or handle the divider with CSS (`last:border-b-0`) instead of a prop.

### 11. The fonts target only knows Expo and Next
- What happened: the `fonts` target supports `platform: 'expo' | 'next'`. A theme with custom fonts has no output for any other web stack.
- Suggested fix: a `web` platform that writes a CSS file with the Google Fonts `@import` (or the `<link>` tags) and the `--kit-font-*` variables.

### 12. Small things
- `halftone-tokens --help` answers "unknown command".
- Two `cn` conventions: kit files import `cn` from the `cn` package, while plain shadcn files import it from `@/lib/utils`. Path D adopters need both. A `lib-utils` item that re-exports from `cn` would tidy this up.

## Building Social and Sites on the kit (same day, later)

The social calendar (a list by day, a month view and a side-panel post editor) and a Sites uptime page were built next, on the same install. New friction:

### 13. No calendar or agenda view
- A content calendar needs a month grid and a list grouped by day. The list was fine with SectionHeader, ListGroup and ListRow. The month grid had to be composed from Card and raw divs, with its own borders, today marker and event chips.
- Suggested fix: a `MonthGrid` (or `Agenda`) kit component: day cells, an event chip slot and month navigation. It would also cover bookings and schedules.

### 14. Sheet doesn't work as an edit panel out of the box
- `SheetContent` caps at `sm:max-w-sm`, which is too narrow for a form. Its body doesn't scroll, and `SheetFooter` isn't sticky, so on a phone the Approve and Save buttons scroll out of reach.
- Workaround: `className="w-full overflow-y-auto sm:max-w-xl"` on the content, and `sticky bottom-0 bg-background border-t` on the footer.
- Suggested fix: a `size` prop (sm, md, lg) and a layout with a scrolling body and a pinned footer.

### 15. Alert has only default and destructive
- The theme ships info, warning and success tokens (`bg-info`, `text-warning-foreground`…), but Alert can't use them. A "Buffer isn't connected yet" notice had to use the default look.
- Suggested fix: `info`, `warning` and `success` variants.

### 16. Dates without times
- `DatePicker` picks a date only. Scheduling a post needs a date and a time, so the editor fell back to native `type="date"` and `type="time"` inputs (styled by Input, which works, but it's two different pickers).
- Suggested fix: a `DateTimePicker`, or a time-slot list fed by suggested times (a brand's best posting times).

### 17. No way to show a data-driven colour
- Each brand has a colour. The token rules (rightly) ban raw hex in className, and StatusDot only has fixed tones, so the lists can't show which brand a row belongs to by colour.
- Suggested fix: a `ColorSwatch` (or a `tone` that accepts a value from data) as the one sanctioned place for a data colour.

### 18. No file picker or upload component
- An Inbox page for photos and videos needed a hidden `<input type="file">`, a Button to open it, a file count and per-file progress. Progress exists; the rest was assembled by hand.
- Suggested fix: a `FilePicker` (or `Dropzone`) kit component: a button and drop area, accept and multiple, a list of picked files with size, and room for per-file progress or errors.

## What worked well
- Once tokens.css was in place, every component looked right first time, in light and dark, at 375px and at desktop width.
- `AppShell` gave a proper sidebar and a mobile sheet with no extra work.
- The contrast check in `halftone-tokens build` ("contrast AA ✓") is reassuring when re-theming.
- llms.txt and the prop comments in the components (when to use a component, and when not) made picking components quick and kept the screens consistent.
- Kit files ship as owned source, so the Next.js adapters could be added around them without forking anything.

## Ideas
- A "Vite + Cloudflare Workers" starter next to the Next one (`npx giget gh:itsHendri/halftone/apps/vite`): a static SPA plus an API on the Workers free plan is a common shape for internal tools and dashboards.
- `halftone-tokens doctor`: one command that checks the tokens are built, the kit files aren't stock replacements, the aliases resolve, and dark mode is wired.

## Triage (2026-11-08)

Checked against the code: every item holds. One addition to #2: six kit files import `next/link`, not three
(also `footnote`, `promo-card` and `action-grid`), because the registry build treats `next` as part of the platform
and never declares it.

**Fixed in `fix/workspace-install-feedback`**
- #1 (stopgap), #3 (stopgap), #5, #7: install.md path D now gives the components.json to write (shadcn 4.22's
  `init` has no new-york preset, and `--defaults` picks Base UI), the tokens steps (build the whole `tokens.css` with `@halftone-ds/tokens` instead of relying on the theme
  item), dark mode as a `.dark` class, and "plain shadcn items first, kit items last".
- #7: the install note is correct and prints once: it lives on a file-less `kit-setup` item every component depends on.
- #9: `ListRow wrap` in both kits (more lines, top-aligned).
- #10: web ListGroup also drops the last divider in CSS; both kits' docs say to forward `last` when wrapping ListRow.
- #12a: `halftone-tokens --help` (patch changeset, not released).

**Decided (2026-11-08, Hendri)**
- Scope (#4, #8): any React app, prototypes and real products. Vite + React Router is the tested example.
- Links (#2): one swappable link file (`@/lib/link`, plus `@/lib/navigation` for AppShell), shipped as registry items.
- Brand file (#1, #6): `halftone-tokens init`, which does the install.md stopgap in one command, with an optional theme code.
- Button swap (#3): publish our own copies of alert-dialog, dialog and pagination so they depend on the kit's button.

**Built (2026-11-08):** #100 the fix-now items, #101 links, #102 `halftone-tokens init` and web fonts, #103 the
button-safe copies, #104 the any-React-app guide, the real-product rules and CI's `react-app` job. Also found and
fixed on the way: `Logo` pulled in `lib/embed.ts`, whose `process.env` read broke outside Next.js.

**The options as they were put (kept for the record)**
- #1 for real: how the registry delivers the whole `tokens.css` (the theme item carries it, a file plus one
  `@import`, or `halftone-tokens init`), and whether adding a component may re-apply the theme.
- #2: links outside Next.js: kit-owned `@/lib/link` + `@/lib/navigation` items (recommended), a `linkComponent`
  prop, or just declaring `next`.
- #4 and #8: does Halftone support other React stacks (a path F) and production apps, or stay prototype kits?
- #3 for real: kit versions of the shadcn items that pull in `button`, or a doctor check.

**Later**
- #6 `halftone-tokens init` (after the #1 decision), #11 a `web` fonts platform, #12b a `lib-utils` item,
  the Vite + Workers starter and `halftone-tokens doctor`.

**Not triaged yet (added 2026-11-08)**
- #13 to #18 came from the same install a few hours later but only reached this copy now: a month grid,
  Sheet as an edit panel, Alert info, warning and success variants, a date-and-time picker, a colour from data,
  and a file picker. None of them is in the kit yet.
