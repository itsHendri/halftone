# Halftone Design System

Prototype kits for mobile and web that coding agents build from. Hand an agent a brief or a meeting
transcript and get a working, themed prototype composed only from the components in the kit: no invented
components, no stray colours, light and dark from day one.

**Docs, live components and the install guide:** https://halftonedesignsystem.com

| | |
|---|---|
| [`apps/mobile`](./apps/mobile) | **Native kit**: Expo + React Native, NativeWind, react-native-reusables. 101 components, three sample apps (Shop, Habits, Northwind), a live Components page. |
| [`apps/web`](./apps/web) | **Web kit**: Next.js + shadcn/ui on the same tokens. 96 components for dashboards, marketing pages and AI product UI, five sample apps (Northwind as a dashboard, a landing page and an assistant; Shop; Habits), a live Components page. |
| [`apps/docs`](./apps/docs) | **Docs site**: how it works, setup, every component live in a phone or browser frame. Static, on Cloudflare. |

One token file drives every kit. `tokens.json` (W3C design-token format) builds the CSS variables and
TypeScript theme each app reads, and the build checks every colour pairing against WCAG AA: it names any that
falls short, and `--strict` (how Halftone's own kits build) makes that an error.

## Three ways in

1. **Start a prototype from a kit.** Copy just the app you need:
   ```bash
   npx giget@latest gh:itsHendri/halftone/apps/mobile my-prototype   # or apps/web
   cd my-prototype && npm install && npm run ios                       # web: npm run dev
   ```
   Or clone this whole repo for a client project that needs mobile and web on one brand.
2. **Add kit components to an existing Expo app** that uses react-native-reusables, through the shadcn
   registry: `npx shadcn add @halftone-native/<component>` (see the [install guide](https://halftonedesignsystem.com/docs/install/)).
3. **Let your agent do it.** Point Claude Code or Cursor at the kit; it reads `AGENTS.md`,
   `DESIGN_SYSTEM.md` and `llms.txt` and builds only from what is registered.

## Working in this repo

```bash
npm install            # once, at the root (npm workspaces)
npm run ios            # mobile kit on the iOS Simulator; also: npm run web, npm run dev
npm run check          # typecheck, lint, token and registry checks
npm run web:dev        # the web kit at http://localhost:3100
npm run docs:dev       # the docs site at http://localhost:3000 (docs:build, docs:preview)
npm run tokens:sync    # after editing the brand in apps/mobile/tokens/tokens.json
```

Each app is self-contained and documented in its own README and `AGENTS.md`. Start with
[apps/mobile/README.md](./apps/mobile/README.md).

## Licence

MIT. See [LICENSE](./LICENSE).
