# Halftone (web)

A brand-agnostic, themeable **Next.js** starter for web prototypes: dashboards, marketing pages and AI
product interfaces. Every component the kit ships is previewed live at `/components`, so a designer can
browse what exists and an agent can build pages only from those parts. Feed it a brief or a client
transcript and get a first prototype that already looks and feels coherent.

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

1. Rename `name` in `package.json`, and remove the samples: `npm run eject-samples`.
2. Brand: edit `tokens/tokens.json` (brand ramp, semantic colours, radius), run `npm run tokens:build`.
3. Build your prototype in its own folder, `app/<slug>/` (see `AGENTS.md › Building a prototype`), or hand
   a brief to the `transcript-to-prototype` skill.

## Docs

- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — tokens, registry, patterns, anti-patterns. Read before writing UI.
- [`AGENTS.md`](./AGENTS.md) — engineering conventions, workflows, gotchas (also what Claude Code reads).
- [`DESIGN.md`](./DESIGN.md) and [`llms.txt`](./llms.txt) — generated summaries for agents.
- [`registry/components.ts`](./registry/components.ts) — what the kit ships; feeds the Components page, the
  registry tables, `llms.txt` and `registry.json` (a shadcn registry: `npm run registry:dist`).
- `.claude/skills/` — `add-component`, `qc-pass`, `transcript-to-prototype`.

MIT licensed.
