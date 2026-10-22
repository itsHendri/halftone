# Halftone (web)

The web half of Halftone: a brand-agnostic, themeable **Next.js** starter for dashboards, marketing pages
and AI product interfaces, on the same design tokens as the mobile kit. Every component the kit ships is
previewed live at `/components`, and lint keeps pages to those parts. Feed it a brief or a client transcript
and get a first prototype in your theme, light and dark.

- **Next.js 16** (App Router) · React 19 · TypeScript · Tailwind 4
- **shadcn/ui** (owned source) plus kit components for app shells, KPIs, tables, heroes, pricing, and AI
  chat with streaming, tool calls and approvals
- **Design tokens** in one JSON file → CSS variables + TypeScript, light and dark, WCAG AA checked
- **Components** and **Foundations** pages, searchable
- **Three sample apps** for one made-up product: a SaaS dashboard (`/dashboard`), a landing page
  (`/landing`) and an AI assistant (`/assistant`), each built only from the registry

## Quick start

```bash
npm install
npm run dev        # http://localhost:3100
```

## Start a real project

1. `npm run setup`. It asks for the project's name (the page title in `app/layout.tsx`, and `name` in
   `package.json`), and offers to remove the samples and apply a theme. It prints the plan and writes nothing
   until you say yes; `--dry-run` stops at the plan. Every question has a flag (`npm run setup -- --help`):
   `npm run setup -- --yes --name "Acme Portal" --eject all --theme calm`. The samples can also go one at a
   time later: `npm run eject-samples -- shop habits` (`-- --status` shows what is left).
2. Brand: the theme comes from Studio (halftonedesignsystem.com/studio): pass its code or `.halftone.json` to
   setup, or later to `npx halftone-tokens theme apply`. Editing `tokens/tokens.json` by hand works too; run
   `npm run tokens:build` after.
3. Logo and favicons: add your logo in Studio (halftonedesignsystem.com/studio), download
   **Use system › Brand assets › Web kit** and unzip it here (the `apply-theme` skill's "Brand assets" steps).
4. Build your prototype in its own folder, `app/<slug>/` (see `AGENTS.md › Building a prototype`), or hand
   a brief to the `transcript-to-prototype` skill.

## Docs

- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — tokens, registry, patterns, anti-patterns. Read before writing UI.
- [`AGENTS.md`](./AGENTS.md) — engineering conventions, workflows, gotchas (also what Claude Code reads).
- [`DESIGN.md`](./DESIGN.md) and [`llms.txt`](./llms.txt) — generated summaries for agents.
- [`registry/components.ts`](./registry/components.ts) — what the kit ships; feeds the Components page, the
  registry tables, `llms.txt` and `registry.json` (a shadcn registry: `npm run registry:dist`).
- `.claude/skills/` — `add-component`, `qc-pass`, `transcript-to-prototype`.

MIT licensed.
