---
"@halftone-ds/tokens": minor
---

A system's extras reach every output, and the kits can say which components draw which token.

- Extras (`extra.*` in tokens.json, from a `.halftone.json`) are now emitted by every target, and no kit component reads them:
  - `shadcn-web`: `--<name>` variables in `:root` and `.dark` (a ramp's `--<name>-<step>`), `bg-` / `text-` / `border-<name>` and `rounded-<name>` through `@theme`, and `shadow-`, `border-` and `type-<name>` utilities.
  - `nativewind3`: the variables in `global.css` and the classes in `tailwind.theme.js` (colours, corners, shadows, border widths, text styles).
  - `design-md` and `llms`: an "Extras (this brand's own)" section naming each one, its classes, and that screens may use them.
  - `themeVars` (the live theme) carries them too. `extraList` and `describeExtras` are in `lib/theme/extras.mjs`.
- An extra can't take a name its token or class would collide with: a built-in slot, a Tailwind colour (`red`, `white`), a theme variable (`radius`, `type-…`), or a Tailwind corner, shadow or border class (`none`, `lg`, `dashed`). `extraNameProblem(kind, name, taken)` says why, as `normalizeSystem` does.
- `lib/usage.mjs` `tokenUsage({ root, components, tokens })` maps each token (`color.primary`, `radius.md`, `shadow.2`, `type.h2`, `font.heading`, `border.width`) to the registry components that draw it. The kits' `registry:build` writes it to `registry/generated/token-usage.json`.
- `theme apply` takes an absolute path to a `.halftone.json`.
