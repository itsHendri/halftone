---
name: add-component
description: Add a component to the prototype kit the right way — either install a react-native-reusables component or build/port one into components/kit — and register it on the Components page and in DESIGN_SYSTEM.md in the same change. Use when asked to "add a component", "we need a <thing>", "port <Component> from another kit", or when a screen needs something the registry lacks.
---

# Add a component

The kit's rule: **nothing exists until it is in the registry, with a demo on the Components page, and in DESIGN_SYSTEM.md.**
A component that is only a file is invisible to designers and to the transcript-to-prototype
skill, which builds from the registry alone.

## 0. Check it does not already exist

Search `registry/components.ts` (titles, exports, aliases) and DESIGN_SYSTEM.md. Extend
an existing component (a new variant/prop) before creating a sibling. Only extract a new
component when the pattern appears 3+ times with the same intent.

## 1. Get the source

Pick one:

- **react-native-reusables has it** (check https://reactnativereusables.com/docs/components):
  `npx @react-native-reusables/cli@latest add <name> -y` → lands in `components/ui/<name>.tsx`.
  If it adds packages, run `npx expo install --fix` afterwards.
- **Port from a reference** (another kit, a client's codebase, a screenshot): create
  `components/kit/<name>.tsx`.
  Rewrite, don't copy: className-only styling with semantic classes, `cva` for variants,
  compose from `components/ui` primitives where possible, forward `className`, use the kit
  `Text`/`Icon`. No `useThemeColors`, no inline colour objects, no `@expo/vector-icons`.
- **New**: same rules as a port.

Styling rules (enforced by `qc-pass`):
- Colours only via semantic classes (`bg-card`, `text-muted-foreground`, `border-border`, `bg-success`…).
  Hex is allowed only through `usePalette().*` from `lib/palette-context.tsx` for SVG/native props.
- Spacing on the 4-pt grid (`p-1` … `p-16`), radius `rounded-sm|md|lg|xl|2xl|full`.
- Children of Button/Badge are `<Text>`/`<Icon>`, never bare strings.
- Every interactive element ≥ 44×44 tap target and has an accessible label.

## 2. Register it

1. Add an entry to `registry/components.ts`, in display order within its category: `id` (the file
   name), `title`, `exports` (the real exported names, component first), `category` (`actions`,
   `inputs`, `navigation`, `data`, `feedback`, `layout`, `overlays`, `media`, `native`), `files`,
   `notes` (the one-liner for the registry table), `aliases` (how a designer would search for it),
   a one-line `api`, and a `caption` (when to use it / the one rule people get wrong).
2. Add a self-contained demo showing every variant and state to the `DEMOS` record in the matching
   `components/devkit/sections/` file, keyed by the same `id`: `<category>.tsx` for `components/ui`
   (reusables), `kit-<category>.tsx` for `components/kit`. Keep the demo's own state inside it.
3. `npm run registry:build`. It checks the file exists and exports what you listed, then regenerates
   the registry tables in `DESIGN_SYSTEM.md`, `llms.txt` and `registry/generated/index.json`. Never
   edit those tables by hand.

## 3. Verify

The kit's own sources are outside the guardrail rules' scope, so check the new file for raw colours by hand:
`npx eslint --rule '{"halftone/no-raw-colour":"error"}' components/kit/<file>.tsx` must print nothing. Then
run the `qc-pass` skill (typecheck, lint, and a look at the new section on the iOS
simulator in both themes). Fix anything it flags before calling the component done.

## 4. Commit

One commit per component: `feat(kit): add <Name>` with the entry, demo, regenerated files and any deps.
