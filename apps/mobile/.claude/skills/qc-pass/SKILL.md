---
name: qc-pass
description: Quality gate for the prototype kit — typecheck, lint (with the halftone/* guardrail rules), the token and registry checks, an automated look at the web build (axe WCAG 2.1 AA, overflow, console, screenshots, before/after diffs), then a real look at the affected screens on the iOS simulator in light and dark. Use after adding or changing components, screens, tokens, or before committing/publishing. Never report "done" without running this.
---

# QC pass

Run everything; do not stop at the first failure. Report each check as pass/fail with the
exact output for failures.

## 1. Static checks

```bash
npm run typecheck
npm run lint -- --max-warnings 0
npm run tokens:check        # generated token files match tokens/tokens.json; any contrast WARNING fails qc-pass
npm run registry:build -- --check   # every ui/kit file registered, exports real, generated docs current
```

## 2. Guardrails (lint)

`npm run lint` in step 1 runs the design system's rules (`eslint/halftone.mjs`) on every screen and
component outside `components/ui` and `components/kit`, as errors:

- `halftone/no-raw-colour`: Tailwind palette classes (`bg-red-500`, `text-white`), colour arbitrary values
  (`text-[#fff]`), and colour literals in style objects or colour props. Use semantic classes, or
  `usePalette()` for SVG fills and native props.
- `halftone/no-alpha-colour` (everywhere, `components/ui` and `components/kit` too): a `bg-`, `text-` or `border-`
  colour at an opacity (`bg-primary/15`, `text-foreground/60`). Use the tint roles (`bg-primary-subtle`,
  `border-warning-border`, `bg-muted-subtle`) or a pressed fill (`bg-primary-pressed`); only the scrim and a
  frosted bar (`bg-background/90` with `backdrop-blur`) may be see-through.
- `halftone/registry-imports`: `@/components/ui|kit` imports must be files the registry lists.
- `halftone/no-foreign-ui`: no other UI or icon libraries (`@expo/vector-icons`, react-native-paper, …).
- `halftone/no-raw-primitives`: no `Text`, `TextInput` or `Pressable` from react-native in screens.

In the report, list every `halftone/` disable comment in the changed files with its reason (`-- reason` is
required; `disable-needs-reason` enforces it). Registration is checked by `registry:build -- --check` in
step 1 (helpers it skips are listed in `HELPERS` in `scripts/registry-build.mjs`).

## 3. Automated look (web build)

Start the web build (`kit-web` launch config, or `npm run web -- --port 8090`), then:

```bash
npm run qc:look -- /components?section=<id> /acme   # the affected screens; no paths = the kit's tabs and every prototype
```

Each screen is opened at 390px in light and dark. It **passes** only when:

- axe-core finds no WCAG 2.1 A or AA violation (contrast, names, roles, labels);
- nothing scrolls sideways;
- the console has no errors and the page threw nothing;
- the theme it rendered is the one asked for.

A failure prints the rule, the element and axe's reason; fix it in the screen or the component, not by
excluding it. React Native for Web renders `aria-*` props, not `accessibilityState`/`accessibilityValue`, so
the kit's components set both; a missing name on web usually means a missing `accessibilityLabel`.

**Before and after.** For a change to something that already exists, take screenshots before you edit and
after, then compare:

```bash
npm run qc:look -- --label before /components?section=sheet    # before editing
npm run qc:look -- --label after /components?section=sheet     # after
npm run qc:look -- --compare before after                      # what changed, by pixel, with diff images
```

Look at every changed pair and its diff image (`.qc/diff-before-after/`, changed pixels in magenta). A change
nobody asked for is a regression. Screenshots live in `.qc/` (gitignored).

## 4. On-device look

Start the `kit-ios` launch config (Expo Go on the booted simulator). For each affected section:

1. Open it: `xcrun simctl openurl booted "exp://localhost:8091/--/components?open=<category>"`.
2. Screenshot in the current scheme, flip the theme (header button), screenshot again.
3. Tap the interactive parts: open overlays, toggle switches, type in inputs, long-press
   context menus. Confirm sheets clear the home indicator and nothing is clipped.

Expo Go note: haptics and blur render on the simulator; a physical device is only needed for
feel, not layout.

## 5. Report

**Done means:** every step 1 command passes, `qc:look` passes for the affected screens, and the simulator
look found nothing clipped or broken in either theme.

List: checks run, results, the `qc:look` summary line (and the `--compare` lines for a change), screenshots
taken, anything deferred (and why) added to BACKLOG.md.
