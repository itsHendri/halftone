# Halftone (Vite + Workers) — agent guide

A starter for a web app on Vite, React Router and Cloudflare Workers, built from Halftone's web kit. The app is a
static single-page app; a Worker in the same project answers `/api`. It's a common shape for internal tools and
dashboards, and it fits Workers' free plan. Use it for a prototype or a real product.

**Read `DESIGN_SYSTEM.md` before writing any UI.** It has the rules, and the components this app has.

## Stack

- Vite 8 · React 19 · React Router 7 (declarative routes in `src/app.tsx`) · TypeScript strict · Tailwind 4
- Halftone's web kit: shadcn/ui-based components in `src/components/ui` and `src/components/kit`, installed from
  the kit's registry (`@halftone-web`). lucide-react icons. Recharts through `components/ui/chart`.
- **className-only styling** with the semantic token classes. No inline colours, no hex.
- Tokens: `tokens/tokens.json` → `npm run tokens:build` (@halftone-ds/tokens) → `src/tokens.css`, `src/fonts.css`,
  `src/lib/theme.ts`, `DESIGN.md`.
- Cloudflare Workers through `@cloudflare/vite-plugin`: `npm run dev` and `npm run preview` run `worker/index.ts`
  in the real Workers runtime, so `/api` behaves locally as it will deployed.

## Layout

```
index.html              sets the .dark class before the first paint (same rules as src/lib/color-scheme.ts)
src/main.tsx            the router, and KitLinkProvider: kit links go through React Router's Link
src/app.tsx             AppShell (the frame) and the routes; each page loads lazily
src/pages/              one file per page: overview, projects, settings, not-found
src/lib/api.ts          useApi<T>(path): GET an /api path, with loading, error and retry
src/lib/color-scheme.ts light, dark or system: stored, applied as .dark on <html>
src/components/         the app's own components (load-state.tsx); ui/ and kit/ are the kit's
shared/api.ts           the API's types, imported by the Worker and the app, so they can't drift
worker/index.ts         the Worker: /api/health, /api/stats, /api/projects; everything else is the built app
worker/data.ts          sample data: replace with D1 or your own API in a real product
wrangler.jsonc          the Worker's config: static assets with a SPA fallback, /api/* to the Worker first
```

## Commands

```bash
npm run dev          # http://localhost:5173, the Worker included
npm run build        # dist/client (the app) and dist/halftone_vite (the Worker)
npm run preview      # the built app and Worker, locally
npm run deploy       # build, then wrangler deploy (asks you to log in to Cloudflare the first time)
npm run typecheck && npm run lint
npm run tokens:build # after editing tokens/tokens.json
npm run theme -- apply <code>   # a theme from Studio (halftonedesignsystem.com/studio)
npm run doctor       # checks the kit's setup and says how to fix anything missing
```

## Building

1. A page is a file in `src/pages/`, a lazy import and a `<Route>` in `src/app.tsx`, and an entry in `NAV`.
2. Pages compose only the kit's components. Another one: `npx shadcn@latest add @halftone-web/<name>` (every
   component, with its API: halftonedesignsystem.com/llms.txt). Then `npm run doctor`. Never write a component the
   kit already has, and never install another UI library.
3. Data comes from the Worker. Add an endpoint in `worker/index.ts`, its types in `shared/api.ts`, and read it with
   `useApi`. **A prototype** keeps sample data in `worker/data.ts` and never calls a real API: it has to run
   anywhere, for anyone, without accounts or keys. **A real product** replaces it with a database (D1:
   `npx wrangler d1 create <name>`, then the binding in `wrangler.jsonc` and its type in `Env`) or calls to its
   own services.
4. Every page works at 375px and 1280px, in light and dark.
5. **Guardrails are lint errors** (`eslint/halftone.mjs`): raw colours, see-through colours, components that aren't
   installed, other UI libraries, Recharts outside `ChartContainer`. In Claude Code a hook (`.claude/settings.json`)
   lints each file you edit and hands the errors back. A real exception takes
   `// eslint-disable-next-line <rule> -- <reason>`; the reason is required.
6. Before saying "done": `npm run typecheck && npm run lint && npm run doctor`, then look at each page you changed
   in both themes at 375px.

## Gotchas

- Secrets: never in `wrangler.jsonc` or the code. Locally in `.dev.vars` (git ignores it); deployed with
  `npx wrangler secret put <NAME>`.
- `SegmentedControl` shares its width equally between its segments, so give it one (`w-60`, `w-full sm:w-80`):
  with `w-fit` the labels get cut short.
- `/api/health` answers 200 whenever the Worker runs, with `{"ready": true}` only when what it depends on answers.
  Once there's a database, check it there, with a 2-second limit.
- The kit's files in `src/components/ui`, `src/components/kit` and `src/lib/link.tsx` come from the registry.
  Change them if you need to, but `npx shadcn add … --overwrite` puts the kit's version back.
  `src/lib/theme.ts`, `src/tokens.css` and `src/fonts.css` are built by `npm run tokens:build`: never edit them.
- Inside the Halftone monorepo this app is `apps/vite`. Its kit files come from `npm run vite:sync` at the root (CI
  checks that they match the registry), and its `tokens/tokens.json` from `npm run tokens:sync`.
