---
name: qc-pass
description: Quality gate for the web prototype kit — typecheck, lint (with the halftone/* guardrail rules), token and registry checks, then a real look at the affected pages in the browser at 375px and 1280px in light and dark. Use after adding or changing components, pages or tokens, and before committing or sharing. Never report "done" without running this.
---

# QC pass (web)

Run everything; do not stop at the first failure. Report each check as pass/fail with the exact output
for failures.

## 1. Static checks

```bash
npm run typecheck
npm run lint
npm run tokens:check                  # generated token files match tokens.json; any contrast WARNING fails qc-pass
npm run registry:build -- --check     # every ui/kit file registered, exports real, generated docs current
```

## 2. Guardrails (lint)

`npm run lint` in step 1 runs the design system's rules (`eslint/halftone.mjs`) on every page and component
outside `components/ui` and `components/kit`, as errors:

- `halftone/no-raw-colour`: Tailwind palette classes (`bg-red-500`, `text-white`; the `bg-black/50` scrim is
  allowed), colour arbitrary values (`text-[#fff]`), and colour literals in style objects or colour props.
- `halftone/registry-imports`: `@/components/ui|kit` imports must be files the registry lists.
- `halftone/no-foreign-ui`: no other UI or icon libraries (MUI, Chakra, Mantine, antd, react-icons, …).
- `halftone/no-raw-primitives`: `recharts` only alongside `ChartContainer` from `@/components/ui/chart`.

In the report, list every `halftone/` disable comment in the changed files with its reason (`-- reason` is
required). Kit files importing each other through `./` is caught by `registry:build -- --check` in step 1.

## 3. In the browser

Start the dev server (`npm run dev`, or the `web-dev` launch config). For each affected page or component
(`/components?section=<id>` for a component):

1. Look at 1280px and at 375px. Nothing overflows horizontally; sidebars become sheets; tables scroll in
   their card.
2. Flip the theme (header toggle) and look again.
3. Use it: open overlays, submit forms, sort tables, send a chat message. The console has no errors or
   hydration warnings.
4. Keyboard: Tab reaches every control in order and the focus ring is visible.

## 4. Report

List: checks run, results, screenshots taken, anything deferred (and why).
