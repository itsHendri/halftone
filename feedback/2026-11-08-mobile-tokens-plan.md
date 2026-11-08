# Plan: the whole brand file for an existing Expo app

2026-11-08. Found while fixing the mobile install note (#105): the mobile kit has the same gap the web kit had
before `halftone-tokens init` (feedback item #1).

## In plain words

When someone adds Halftone's phone parts to an Expo app they already have (install.md path C), the installer
brings the brand's **colours and corner rounding** and nothing else. The parts also use the kit's **heights,
spacing, text sizes, text styles and shadows**. Those live in two files our own kit builds for itself, and nobody
else gets them. So the parts arrive undersized and unstyled, like the web parts did in Hendri's Vite app.

The fix mirrors the web one: **`npx halftone-tokens init` learns Expo**. In an Expo app it sets up the brand
file, builds everything the parts need, and hooks it into the app's two style files. Re-branding then works the
same way as in our kit (`theme apply <code>`).

There are three Expo-specific wrinkles, and the plan deals with each:

1. **An Expo app's main stylesheet is the brand file.** On the web, `init` adds one line to the app's stylesheet.
   In an Expo app (NativeWind), `global.css` *is* where the brand lives, and our build writes the whole file. So
   either `init` takes over `global.css` (keeping a backup), or our build learns to write a separate file that
   `global.css` imports. Which one works on a phone, not just in the browser preview, needs a quick test first
   (step 1 below). I'll pick the safer one that works.
2. **The style settings also live in a JavaScript file** (`tailwind.config.js`) that we can't safely rewrite. So
   the build writes a small ready-made **preset** file, and the app's config needs **one added line** to use it.
   `init` adds that line itself when the config has the standard shape, and otherwise prints the exact line.
3. **Two generated files arrive with the parts and can go stale.** `lib/theme.ts` (colours for the few places
   styles can't reach) and `lib/fonts.ts` (the theme's fonts) come in from the registry as Halftone's default
   brand. After any `shadcn add`, `npx halftone-tokens build` puts the app's own brand back. The setup note (which
   now prints once) says so, and `init` builds them for the first time.

## Steps

1. **Test on a real device first.** In a throwaway Expo + react-native-reusables app on the iOS simulator (and the
   web preview), check whether NativeWind 4 picks up variables from a CSS file that `global.css` imports.
   - Works → the `nativewind3` target gets a `partial` option that writes `tokens.css` only. `global.css` keeps the
     app's own lines plus one import, which is the same shape as the web.
   - Doesn't → `init` writes `global.css` itself, after saving the old one as `global.css.bak` and listing any
     rules in it that weren't the theme.
2. **`tailwind.preset.js`.** The `nativewind3` target also writes `tokens/generated/tailwind.preset.js`: every
   extension our own `tailwind.config.js` spreads in by hand (colours, radius, border width, shadows, heights,
   spacing, text sizes, line heights, tracking, weights, max widths, hairline). The app adds
   `require('./tokens/generated/tailwind.preset')` to `presets`. Our own kit switches to the preset too, so it's
   tested every day and the two can't drift.
3. **`init` for Expo.**
   - It recognises an Expo app (`expo` and `nativewind` in package.json; `--platform expo|web` overrides).
   - It writes `tokens/` with the targets an Expo app needs: `nativewind3`, `ts-theme` → `lib/theme.ts`, and
     `fonts` (`platform: 'expo'`) → `lib/fonts.ts`.
   - It applies `--theme`, builds, wires `global.css` (per step 1) and the preset line, and prints:
     - the `npx expo install` command for the theme's font packages (`theme apply` already knows these);
     - `useFonts(FONT_ASSETS)` and `KitThemeProvider` at the root;
     - "run `npx halftone-tokens build` after each `shadcn add`".
   - It refuses to replace existing tokens without `--force`, the same as on the web.
4. **The install guide, path C:** install the tokens package, then `init`, then `KitThemeProvider` and fonts at
   the root, then add parts. The once-printed note becomes accurate: the theme item alone is colours and radius;
   the full brand comes from `init`; and run `halftone-tokens build` after adding parts.
5. **A check like the Vite one:** `tests/expo-app`, a minimal Expo + react-native-reusables app.
   - It runs `init --theme editorial` and `shadcn add` for every phone part.
   - Then `tsc` and `expo export --platform web`, opened in Playwright to check that a button has the kit's height,
     text has the theme's font, and dark mode switches.
   - It becomes a CI job next to `react-app`.
   - The simulator look from step 1 is done by hand once; CI can't run the simulator.

## How it ships

- `init` for Expo and the preset are `@halftone-ds/tokens` changes, a minor changeset. **If this is built before the
  release #102 waits for, one release carries both `init`s.** Otherwise it's a second release.
- One PR (or two: the target changes, then `init` + guide + check), on top of #105, merged in order like the rest.

## Not in this plan

- Expo apps without NativeWind (plain StyleSheet): the kit's parts are NativeWind classes, so they need NativeWind.
- A doctor command that spots stale `lib/theme.ts` after an add: the note and `build` cover it for now.
