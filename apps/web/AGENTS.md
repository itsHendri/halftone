# Halftone (web) — agent guide

A brand-agnostic Next.js starter for web prototypes: dashboards, marketing pages and AI product
interfaces. Designers hand it a brief (or a meeting transcript) and get a working, themed prototype built
only from the components in this repo.

**Read `DESIGN_SYSTEM.md` before writing any UI.** It has the token rules, the component registry and the
hallucination guard. This file covers engineering, workflows and gotchas.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind 4 · shadcn/ui (owned source in
  `components/ui`) · lucide-react · next-themes · Recharts (through `components/ui/chart`) · sonner (toasts)
- **className-only styling** with the semantic token classes. No inline colours, no hex.
- Tokens: `tokens/tokens.json` → `npm run tokens:build` (@halftone-ds/tokens) → `app/tokens.css`,
  `lib/theme.ts`, `DESIGN.md`, `tokens/generated/`
- Theme: next-themes (`class` on `<html>`, system by default). `ThemeToggle` in `components/site`.

## Layout

```
app/layout.tsx          providers (theme, tooltips, toasts) + the embed boot script
app/(kit)/              the kit shell: Home (/) · Components (/components) · Foundations
app/<slug>/             a prototype: its own folder with its own layout.tsx (AppShell, a marketing layout…)
app/dashboard/, app/landing/, app/assistant/   Northwind, three ways (worked examples)
app/shop/, app/habits/  the web halves of the native kit's Shop and Habits samples (same data, web layouts).
                        `npm run eject-samples` removes all five, their data in components/<sample>/ and the kit
                        home's links.
app/showcase/           the showcase: registry components in a masonry, and /showcase/typeset (long-form Prose
                        beside components). The docs home page and Studio frame it; not a sample to copy.
components/showcase/    its mock data, cards and typeset fixtures (kept by eject-samples)
components/ui/          shadcn/ui — add more with the add-component skill (`npx shadcn@latest add <name>`)
components/kit/         ours: AppShell, PageHeader, StatTile, DataTable, EmptyState, DatePicker, Hero,
                        FeatureGrid, PricingCard, ChatMessage, ChatComposer, AttachmentChip, ChatThreadList,
                        Sources, FollowUpSuggestions, StreamingText, ThinkingIndicator, ToolCallCard, ApprovalCard; and web versions of
                        the native kit's own (same ids): ListRow, ListGroup, SegmentedControl, FilterChip, Rating,
                        OtpInput, AmountInput, Timeline, ValueHeader, Stepper, PromoCard, Placeholder, Spot…
                        (registry/components.ts has them all)
components/devkit/      the Components page: demos.tsx keyed by registry id
components/site/        the kit shell's own chrome (header, theme toggle, providers) and KitChip, a
                        prototype's way back to the kit
registry/               components.ts: what the kit ships → DESIGN_SYSTEM.md tables, llms.txt, registry.json
hooks/, lib/            use-reduced-motion · embed (docs iframe mode) · theme.ts (generated)
DESIGN.md, llms.txt     GENERATED agent-facing summaries
.claude/skills/         add-component, apply-theme, qc-pass, transcript-to-prototype
```

## Commands

Inside the Halftone monorepo, install once at the repo root and run these from `apps/web` (or with
`-w apps/web`). Copied out on its own, this app is a normal npm project.

```bash
npm run dev               # http://localhost:3100
npm run build && npm start
npm run typecheck && npm run lint
npm run tokens:build      # after editing tokens/tokens.json (names any pairing below WCAG AA; --strict fails)
npm run registry:build    # after editing registry/components.ts
npm run tokens:check && npm run registry:build -- --check   # what CI checks
npm run registry:drift    # after `shadcn add`: which components/ui files differ from shadcn (network)
npm run registry:dist && npm run registry:roundtrip         # build the shadcn registry and prove it reinstalls
npm run eject-samples     # delete the dashboard, landing, assistant, shop and habits samples and every reference
```

## Building a prototype (the rules)

1. A prototype lives in its own folder under `app/`, e.g. `app/acme/`, with its own `layout.tsx`. An app
   prototype puts `AppShell` in that layout; a marketing page uses a plain layout. When the prototype IS the
   product, move it to `/` and delete `app/(kit)`.
2. Pages compose ONLY registry components. Patterns are in `DESIGN_SYSTEM.md › Patterns`; the samples
   (`app/dashboard`, `app/landing`, `app/assistant`, `app/shop`, `app/habits`) are the worked examples. `KitChip` in their top bars is
   the way back to the kit (and the theme toggle); it hides itself in embed mode.
   Interactive pages that pass functions to kit components (DataTable cells, nav icons) are client
   components; keep `metadata` in a server `page.tsx` or `layout.tsx` that renders them.
   A record created in the session (an order, a habit) opens by query (`/shop/order?id=…`), not a dynamic
   segment: the static export only has the pages it built.
3. Mock data lives beside the prototype (`app/<slug>/data.ts` or `components/<slug>/data.ts`). Never call
   real APIs; a route handler returning fixtures is fine when a flow needs one.
4. New component needed? Use the `add-component` skill: it lands in the registry and the docs.
5. Before saying "done": run the `qc-pass` skill (typecheck, lint, a browser look at 375px and
   1280px in light and dark).
6. **Guardrails are lint errors** (`eslint/halftone.mjs`, `halftone/*` rules): raw colours, imports outside the
   registry, other UI libraries and `recharts` without `ChartContainer`. In Claude Code a hook
   (`.claude/settings.json`) lints each file you edit and hands the errors back. A real exception takes
   `// eslint-disable-next-line <rule> -- <reason>`; the reason is required. The hook runs once the folder is
   trusted, from a session started here or at the monorepo root.

## Workflows

- **Preview:** `npm run dev`, or the `web-dev` launch config. Deep link a component:
  `/components?section=<id>`.
- **Embedding (the docs site's browser frames):** `?embed=1` hides everything with the `kit-chrome` class
  for the session (inside a frame); `?theme=light|dark` pins the theme without saving it; `?autosize=1` posts
  `{ type: 'kit:size', height }` for the page's `[data-autosize]` element (the showcase) so the host can size the frame. The host syncs the
  theme with `{ type: 'kit:theme', value }`; the kit answers `{ type: 'kit:ready' }`. Same origin plus
  `NEXT_PUBLIC_EMBED_ORIGINS`. See `lib/embed.ts` and `lib/embed-boot.ts`.
- **Static export:** `KIT_WEB_EXPORT=1 KIT_WEB_BASE_PATH=/w npm run build` writes `out/` under a sub-path
  (how the docs site embeds the kit).
- **Share a link:** deploy to any Next host (Vercel, Cloudflare via OpenNext) or a static export.
- **Re-brand:** make or pick a system in Studio on the docs site (`/studio`, or the theme pill on any docs page)
  and apply it with the `apply-theme` skill: `npx halftone-tokens theme apply <theme-code|preset|file.halftone.json>`
  (in the monorepo, `npm run theme:apply -- <code|file>` at the root, so both kits stay one brand). **Use system**
  gives the code, or the system's `.halftone.json` once it has edits a code can't carry. Editing tokens.json by hand still works (in the monorepo:
  `apps/mobile/tokens/tokens.json`, then `npm run tokens:sync`), then `npm run tokens:build`. The logo and
  favicons come from Studio too (**Use system › Brand assets**, a zip): the `apply-theme` skill's "Brand assets"
  steps unzip it.

## Gotchas

- shadcn 4.21 imports `cn` from the `cn` package, not `@/lib/utils`.
- After `npx shadcn add`, check `app/globals.css` (components can append CSS variables; ours come only from
  tokens.css) and grep the new files for `text-white`, `bg-black`, palette colours and hex: shadcn's
  destructive variants hard-code white text, which fails AA on the dark destructive. Then
  `npm run registry:drift` and `npm run registry:build`.
- `npx shadcn add` stops at "button.tsx already exists, overwrite?" for any component that depends on Button,
  and closing stdin aborts it without writing. Move `components/ui/button.tsx` aside, add, then
  `git checkout -- components/ui/button.tsx` so the kit's fork (contrast-safe destructive) comes back.
- Nothing rendered on the server may format dates with the default locale (`toLocaleDateString()` with no
  locale): the server and the browser disagree and hydration fails. shadcn's Calendar did this in its
  `data-day` attribute; the kit's copy uses a fixed `YYYY-MM-DD`. Pass an explicit locale (`'en-GB'`) for
  display.
- Anything theme-dependent rendered on the server (an aria-label that names the current theme) mismatches on
  hydration: switch it in CSS (`dark:`) or render it after mount.
- Kit files import each other through `@/components/kit/…`, never `./…`: the registry build refuses relative
  imports because a consumer could not resolve them.
- Server components cannot import a module that uses client-only hooks; keep server-safe pieces (like the
  embed boot script) in their own file.
