---
name: add-component
description: Add a component to the web prototype kit the right way — install a shadcn/ui component or build one into components/kit — and register it on the Components page and in DESIGN_SYSTEM.md in the same change. Use when asked to "add a component", "we need a <thing>", or when a page needs something the registry lacks.
---

# Add a component (web)

The kit's rule: **nothing exists until it is in `registry/components.ts`, with a demo on the Components page.** A
component that is only a file is invisible to designers and to the transcript-to-prototype skill.

## 0. Check it does not already exist

Search `registry/components.ts` (titles, exports, aliases) and DESIGN_SYSTEM.md. Extend an existing
component (a variant or prop) before creating a sibling.

## 1. Get the source

- **shadcn/ui has it**: `npx shadcn@latest add <name>` (lands in `components/ui/<name>.tsx`). Then:
  - `git diff app/globals.css`: revert anything it appended; colours come only from `app/tokens.css`.
  - Grep the new files for `text-white`, `bg-white`, `bg-black` (scrims excepted), palette colours and hex,
    and replace them with tokens (`text-destructive-foreground`, `bg-card`…).
  - `npm run registry:drift` so the registry knows whether the file now differs from shadcn's.
- **New, in `components/kit/<name>.tsx`**: compose from `components/ui`, className-only styling with
  semantic classes, `cva` for variants, forward `className`, `cn` from `cn`. Import other kit files as
  `@/components/kit/<file>`, never `./<file>`. Anything that animates in JS uses `useReducedMotion()`.

## 2. Register it

1. Add an entry to `registry/components.ts`, in display order within its category: `id` (the file name),
   `title`, `exports` (real exported names, component first), `category`, `files`, `notes` (one line for the
   table), `aliases`, a one-line `api`, and a `caption` (when to use it, the rule people get wrong).
2. Add a self-contained demo to `DEMOS` in `components/devkit/demos.tsx`, keyed by the same `id`, showing
   every variant and state with realistic copy.
3. `npm run registry:build`: checks the file exists and exports what you listed, then regenerates the
   DESIGN_SYSTEM.md tables, `llms.txt`, `registry.json` and `registry/generated/index.json`.

## 3. Verify

Run the `qc-pass` skill. Look at `/components?section=<id>` in light and dark, at 375px and 1280px.

## 4. Commit

One commit per component: `feat(kit): add <Name>` with the entry, demo, generated files and any deps.
