---
name: qc-pass
description: Quality gate for the web prototype kit — typecheck, lint (with the halftone/* guardrail rules), token and registry checks, an automated look (axe WCAG 2.1 AA, overflow, console, focus rings, screenshots and before/after diffs at 375px and 1280px in light and dark), then a hands-on pass through the affected pages. Use after adding or changing components, pages or tokens, and before committing or sharing. Never report "done" without running this.
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

## 3. Automated look

Start the dev server (`npm run dev`, or the `web-dev` launch config), then:

```bash
npm run qc:look -- /acme /acme/settings    # the affected pages; no paths = the kit home and every prototype
```

Each page is opened at 375px and 1280px in light and dark. It **passes** only when:

- axe-core finds no WCAG 2.1 A or AA violation (contrast, names, roles, labels);
- nothing scrolls sideways at either width;
- the console has no errors or hydration warnings and the page threw nothing;
- the theme it rendered is the one asked for;
- at 1280px, every stop the Tab key reaches shows a focus ring (`focus-visible:ring-*` or an outline).

A failure prints the rule, the element and the reason; fix it in the page or the component, not by excluding
it. For a component, check its demo: `/components?section=<id>`.

**Before and after.** For a change to something that already exists, take screenshots before you edit and
after, then compare:

```bash
npm run qc:look -- --label before /dashboard    # before editing
npm run qc:look -- --label after /dashboard     # after
npm run qc:look -- --compare before after       # what changed, by pixel, with diff images
```

Look at every changed pair and its diff image (`.qc/diff-before-after/`, changed pixels in magenta). A change
nobody asked for is a regression. Screenshots live in `.qc/` (gitignored).

## 4. Hands-on

The automated look cannot judge behaviour. For each affected page, use it: open overlays, submit forms, sort
tables, send a chat message, and check sidebars become sheets and tables scroll in their card at 375px.

## 5. Report

**Done means:** every step 1 command passes, `qc:look` passes for the affected pages, and the hands-on pass
found nothing broken.

List: checks run, results, the `qc:look` summary line (and the `--compare` lines for a change), screenshots
looked at, anything deferred (and why).
