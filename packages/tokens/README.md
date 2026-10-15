# @halftone-ds/tokens

The token build behind [Halftone](https://github.com/itsHendri/halftone). One `tokens.json` in the
[W3C design-token format](https://www.designtokens.org/tr/2025.10/format/) becomes everything an app reads,
and the build refuses any palette that falls below WCAG AA.

```bash
npm install -D @halftone-ds/tokens
npx halftone-tokens build      # write every output in tokens/tokens.config.json
npx halftone-tokens check      # write nothing; exit 1 if an output is stale (CI)
npx halftone-tokens figma      # mirror the tokens into Figma Variables
```

## Inputs

- `tokens/tokens.json`: `primitive` ramps and scales, and `semantic.color.<name>` with a `{ light, dark }`
  value per colour, using the shadcn names (`background`, `primary`, `primary-foreground`, `muted`, …) plus
  `success`, `warning` and `info`. `semantic.radius.base` sets `--radius`.
- `tokens/tokens.config.json`: which targets to write, and where (paths relative to the app root):

```json
{
  "source": "tokens/tokens.json",
  "scan": ["app", "components"],
  "targets": {
    "nativewind3": { "css": "global.css", "tailwind": "tokens/generated/tailwind.theme.js" },
    "ts-theme": { "out": "lib/theme.ts", "navTheme": "expo-router/react-navigation" },
    "shadcn-web": { "out": "app/tokens.css" },
    "design-md": { "out": "DESIGN.md", "name": "My Kit" }
  }
}
```

`scan` (optional) lists source folders for the text-on-tint check below.

## Targets

| Target | Writes |
|---|---|
| `nativewind3` | NativeWind 4 / Tailwind 3 CSS variables (HSL, `:root` + `.dark:root`) and the Tailwind colour + radius map |
| `shadcn-web` | Tailwind 4 / shadcn v4 CSS: oklch variables in `:root` + `.dark`, `@theme inline`, base layer |
| `ts-theme` | `THEME` (hex per scheme), `TOKENS` (space, radius, type, motion) and an optional React Navigation theme |
| `registry-theme` | the theme as shadcn registry `cssVars`, native and web |
| `design-md` | a [DESIGN.md](https://github.com/google-labs-code/design.md) (spec alpha) |
| `llms` | a tokens section for `llms.txt` |
| `figma` | the input `halftone-tokens figma` pushes to Figma Variables |

## Guarantees

- **Contrast gate.** Every `X` / `X-foreground` pairing, body and muted text on every surface, each status
  colour used as text, and each status icon on its own tint must clear WCAG AA in both themes, or the build
  fails, names the pairing, prints the ratio, and writes nothing.
- **APCA, for reading only.** `apcaContrast(text, background)` (from `@halftone-ds/tokens/theme` or
  `@halftone-ds/tokens/lib/apca`) gives the APCA Lc of a pair, and `contrastReport(theme.resolved)` lists every
  pairing the gate checks, in both themes, with its WCAG ratio, `pass`, and Lc. Lc is advisory: WCAG AA stays
  the gate, and nothing fails on APCA.
- **Colour vision, as a warning.** `cvdWarnings(theme.resolved)` (from `@halftone-ds/tokens/theme` or
  `@halftone-ds/tokens/lib/cvd`) simulates protanopia, deuteranopia and tritanopia (Machado 2009,
  `simulateCvd`) and lists the status pairs (success / destructive and the rest) and adjacent chart colours
  that end up closer than OKLab ΔE 0.05 under any of them, or under normal sight. `theme apply` prints them.
  Nothing fails on it: the kit pairs every status with an icon or a label, and the warning says where colour
  alone stops doing the work.
- **Text on tints.** A status colour as text on its own tint (`text-success` on `bg-success/15`) loses
  contrast fast: 4.09:1 with a typical green. The build works out, per colour, the strongest tint that
  still clears AA in both themes, and writes it into `DESIGN.md` and the `llms` section
  (`primary up to /5, …, destructive never`). With `scan` set, `build` and `check` also read every class
  string in those folders and fail on a tone's text over a tint stronger than that, naming the file and line.
  An element that holds only an icon (3:1) is exempt with a `halftone-tokens-ignore tint-text` comment. A class
  string has to contain both classes, so React Native's `View` > `Text` nesting is out of its reach;
  `DESIGN.md` states the rule for that case.
- **No drift between platforms.** Every oklch value must render back to the same 8-bit hex as the source,
  so the web theme and the native theme are the same colours.
- **Radius scale.** `rounded-*` classes are offsets from `radius.lg`, so with the default base each class
  equals its primitive and moving `semantic.radius.base` shifts the whole scale.

MIT licence.
