# Halftone (native) — agent guide

A brand-agnostic Expo starter for mobile prototypes. Designers hand it a brief (or a meeting
transcript) and get a working, themed prototype built only from the components in this repo.

**Read `DESIGN_SYSTEM.md` before writing any UI.** It has the token rules, the component registry
and the hallucination guard. This file covers engineering, workflows and gotchas.

## Stack

- Expo SDK 57 · Expo Router (file routes in `app/`) · React Native 0.86 · React 19 · TypeScript strict
- NativeWind 4 + Tailwind 3 — **className-only styling**. No `StyleSheet.create` for colours, no inline hex.
- react-native-reusables in `components/ui` (shadcn for RN, owned source) · our components in `components/kit`
- Tokens: `tokens/tokens.json` → `npm run tokens:build` → `global.css`, `lib/theme.ts`, `tokens/generated/`
- Theme: `KitThemeProvider` (`lib/theme-context.tsx`) — system/light/dark, persisted. `useKitTheme()` gives `scheme`.
- Icons: lucide via `<Icon as={…} />`. Haptics via `haptic()` in `lib/haptics.ts`. Toasts via `useToast()`.

## Layout of the repo

```
app/_layout.tsx         providers (theme, toast, portal, nav theme) + root Stack
app/(kit)/              the kit shell: Home · Components · Foundations · Settings
app/shop/, app/habits/, app/northwind/   three sample apps (named segments, not groups); the web kit has each
                        too. `npm run eject-samples` removes them (or `-- shop` just one; `-- --status` lists them).
components/ui/          reusables — install more with the add-component skill
components/kit/         ported/custom components
registry/               components.ts: what the kit ships (metadata) → DESIGN_SYSTEM.md tables, llms.txt, registry
components/devkit/      the Components page: demos keyed by registry id (sections/<category>.tsx, sections/kit-<category>.tsx)
components/shop/, components/habits/, components/northwind/  sample data + stores. Go with `npm run eject-samples`.
lib/                    theme.ts (generated), theme-context, embed (docs iframe mode), haptics, utils(cn)
tokens/                 tokens.json (edit), tokens.config.json (outputs), generated/ — built by `halftone-tokens` (@halftone-ds/tokens)
DESIGN.md, llms.txt     GENERATED agent-facing summaries (tokens:build, registry:build)
.claude/skills/         add-component, apply-theme, qc-pass, transcript-to-prototype
.claude/launch.json     preview configs: kit-web (port 8090) and kit-ios (port 8091)
.mcp.json               the Expo MCP server (expo-mcp, against kit-ios on 8091) for Claude Code started here
```

## Commands

Inside the Halftone monorepo, install once at the repo root (`npm install`; the lockfile lives there) and
run these from `apps/mobile`, or from the root with `-w apps/mobile`. Copied out on its own, this app is a
normal npm project.

```bash
npm run dev            # expo start -c --go (Expo Go: scan the QR with the phone camera)
npm run dev:client     # expo start -c (development build)
npm run ios            # expo start --ios --go (simulator)
npm run web            # expo start --web
npm run typecheck && npm run lint -- --max-warnings 0   # CI runs these plus tokens:build and export:web
npm run tokens:build   # after editing tokens/tokens.json (names any pairing below WCAG AA; --strict fails on it)
npm run registry:build # after editing registry/components.ts or a component's classes: DESIGN_SYSTEM.md tables, llms.txt, index, token-usage.json
npm run tokens:check && npm run registry:build -- --check   # what CI checks (plus the halftone-tokens tests in the monorepo)
npm run setup          # first run: name, slug, scheme, APP_ID, eas init, samples, theme (asks; `-- --help` for flags)
npm run eject-samples  # delete the shop, habits and Northwind samples, their stores and every reference
npm run eject-samples -- shop   # just the ones named; `-- --status` shows what is left (CI ejects each one and runs the gates)
npm run qc:look -- /acme   # with kit-web running: axe WCAG 2.1 AA, overflow, console, screenshots (qc-pass step 3)
npm run share -- "msg" # EAS Update to the main channel, prints the links
npm run export:web && eas deploy   # hosted web preview URL
npx expo run:ios       # build + install the dev client on the simulator (needs LANG=en_US.UTF-8, see gotchas)
```

## Building a prototype (the rules)

1. A prototype lives in `app/` under its own **named** segment, e.g. `app/acme/…`, with its own Tabs/Stack.
   Not a route group: `app/(acme)/(tabs)/index.tsx` resolves to `/` and fights `app/(kit)/index.tsx`
   for the root, so scanning the QR drops you into the prototype instead of the kit. A named segment
   gives it `/acme` and leaves `/` to the kit. When the prototype IS the product, point the root
   `Stack` at it and make it the initial route.
2. Screens compose ONLY registry components. Screen skeleton, multi-step flow and success patterns
   are in `DESIGN_SYSTEM.md › Patterns`. The sample apps (`app/shop`, `app/habits`, `app/northwind`) are the worked examples; `KitChip` in their root layouts is the way back to the kit.
3. Mock data lives beside the prototype (`components/<slug>/data.ts`). Never call real APIs.
4. New component needed? Use the `add-component` skill — it must land in the registry and the docs.
5. Before saying "done": run the `qc-pass` skill (typecheck, lint, `npm run qc:look` on the web build, simulator
   look in both themes).
6. **Guardrails are lint errors** (`eslint/halftone.mjs`, `halftone/*` rules): raw colours, imports outside the
   registry, other UI libraries and react-native `Text`/`TextInput`/`Pressable` in screens. In Claude Code a
   hook (`.claude/settings.json`) lints each file you edit and hands the errors back. A real exception takes
   `// eslint-disable-next-line <rule> -- <reason>`; the reason is required. The hook runs once the folder is
   trusted, from a session started here or at the monorepo root.

## Workflows

- **Preview:** `kit-web` (http://localhost:8090) and `kit-ios` (Expo Go on the booted simulator, port 8091)
  launch configs. Deep link a section: `xcrun simctl openurl booted "exp://localhost:8091/--/components?open=inputs"`
  (Expo Go) or `halftone://components?open=inputs` (dev client).
- **Deep links into the Components page:** `?open=<category>` expands a category; `?section=<id>` (a registry id)
  expands its category, scrolls to it and tints it for 2s.
- **Embedding (the docs site's phone frames):** the web export, loaded with `?embed=1`, drops the kit chrome
  (tab bar, header, KitChip) for the whole session; `/components?section=<id>&embed=1` renders just that
  demo. `?theme=light|dark` starts in that theme without persisting it. The host keeps the theme in step by
  posting `{ type: 'kit:theme', value }`; the kit answers `{ type: 'kit:ready' }`. Same origin only, plus
  `EXPO_PUBLIC_EMBED_ORIGINS` (comma-separated) for a docs dev server on another port. See `lib/embed.ts`.
- **Dev client:** `LANG=en_US.UTF-8 npx expo run:ios --no-bundler` builds `Halftone` for the simulator; then
  `xcrun simctl openurl booted "exp+halftone://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8091"`.
  For phones: `eas build --profile development` (needs Apple credentials, interactive).
- **First-run setup:** `npm run setup` names the app (`name`/`slug`/`scheme` in `app.json`, `name` in
  `package.json`, `APP_ID` in `.env.local`), and offers `eas init`, `eject-samples` and `theme apply`. It plans
  everything, prints the plan and asks before writing; `--dry-run` stops at the plan. For an agent or CI, answer
  with flags and `--yes` (`npm run setup -- --help`), e.g. `--yes --name "Acme" --eject all --theme <code>`;
  `--eas-init` only when the person asked for an EAS project (it creates one on their account). It never replaces
  a value already in `.env.local` without a yes or `--overwrite`. Inside the monorepo it refuses `--theme`
  (themes go through the root's `npm run theme:apply`).
- **Account config:** `app.config.ts` reads `APP_ID`, `EAS_OWNER`, `EAS_PROJECT_ID` and `KIT_WEB_BASE_URL` from
  `.env.local` (gitignored, see `.env.example`) or the environment, so the repo carries no account. EAS cloud
  builds and workflows need the same names as EAS environment variables. `eas init` on its own writes `owner` and
  `extra.eas.projectId` into `app.json`, which is committed: run it through `npm run setup -- --eas-init`, which
  puts both into `.env.local` and takes them back out of `app.json`. Never commit an `owner` or `extra.eas` there.
- **Share:** `npm run share -- "what changed"` publishes to the `main` channel. Recipients need the dev build
  installed, or Expo Go signed into the owning account/org (Expo Go on iOS requires login since SDK 57).
- **Web link for clients:** `npm run export:web && eas deploy` → immutable preview URL. `web.output` is `single`
  so deep links resolve.
- **Re-brand:** make or pick a system in Studio on the docs site (`/studio`, or the theme pill on any docs page)
  and apply it with the `apply-theme` skill: `npx halftone-tokens theme apply <theme-code|preset|file.halftone.json>`
  (in the monorepo, `npm run theme:apply -- <code|file>` at the root). **Use system** gives the code, or the
  system's `.halftone.json` once it has edits a code can't carry. It rewrites only the theme's paths in
  `tokens/tokens.json` (colours, radius, fonts, depth, density, border, icon stroke, typeset, plus a system's hand
  edits), fixes contrast itself and records the recipe or system (`halftone-tokens theme show`). Editing tokens.json by hand
  still works: `tokens:build` names any pairing below 4.5:1 with its ratio (treat that as a bug unless the person
  chose the colour knowingly; `--strict` makes it an error). The names come from `npm run setup` (above), which
  also takes the theme (`--theme <code>`). The logo, app icon and splash come from Studio too (**Use system ›
  Brand assets**, a zip): the `apply-theme` skill's "Brand assets" steps unzip it; don't hand-edit `assets/images/*`.

## Agent tooling

- **Expo skills + MCP for Claude Code:** `claude plugin install expo@claude-plugins-official` (run once, interactive).
  Remote MCP alternative: `claude mcp add --transport http expo https://mcp.expo.dev/mcp`.
- **Local screenshots, taps and the route map:** `.mcp.json` runs `expo-mcp` (a dev dependency) against the
  `kit-ios` dev server on port 8091, so Claude Code started in this folder has it after you approve the
  project's MCP server once. Another port: change `--dev-server-url` there.
- **Automated look:** `npm run qc:look` (Playwright + axe-core, dev dependencies) opens screens of the web build
  at 390px in light and dark and fails on WCAG 2.1 AA violations, sideways scroll or console errors;
  `--label`/`--compare` give before/after screenshot diffs. Chromium once: `npx playwright install chromium`.
- **Simulator driving without Expo:** the iOS Simulator tools in Claude Code (screenshot, tap, inspect) are
  enough for `qc-pass`; `xcrun simctl openurl booted <deep link>` jumps to a screen.
- Optional, experimental: `npx @expo/agent-cli@latest agents:setup` (status / dev / smoke commands).

## Gotchas (learned the hard way)

- CocoaPods needs a UTF-8 locale: prefix `npx expo run:ios` with `LANG=en_US.UTF-8` in non-interactive shells.
- `eas update` needs `--environment production` and either `--channel` or `--branch`, not both.
- NativeWind colour classes DO follow the theme here because colours are CSS variables; the ban on `bg-*`
  classes in older projects came from hex values in `tailwind.config.js`. Never put hex there.
- On native, a `Label` needs its own `onPress` to toggle the Checkbox/Switch it labels.
- Menus/selects/sheets need safe-area `insets` passed to their content on native.
- ESLint runs the React Compiler rules: no `ref.current` reads in render, no `useRef(new Animated.Value())`
  (use `useState(() => new Animated.Value())`), no setState synchronously in effects.
- Expo Go on the simulator does not run the native modules a dev build adds; treat it as the fast path,
  the dev client as the truth.
- When upgrading the SDK: delete the lockfile (the root one in the monorepo), `npm install expo@latest`, `npx expo install --fix`,
  then `npx expo-doctor`.
- Device capabilities degrade rather than fail — see `lib/native.ts`. Reality: the iOS Simulator has no
  camera; **Face ID does not work in Expo Go** (its Info.plist has no `NSFaceIDUsageDescription`), so use
  the dev client; remote push left Expo Go in SDK 53; the web notification scheduler is a stub.
- `expo-notifications` warns and registers a push-token side effect on *import* under Expo Go — it is
  lazily `require`d inside `lib/native.ts` and `components/kit/notify.tsx`. Keep it that way.
- `ios/` is a build artifact (gitignored). After changing `app.json` plugins or permission strings, run
  `LANG=en_US.UTF-8 npx expo prebuild -p ios --clean` — the diff will not show Info.plist.
- The kit's animations use React Native `Animated`, which ignores reanimated's `ReduceMotion.System`
  that `components/ui` relies on. Anything that moves must call `useMotion()` from
  `lib/reduced-motion.ts` — `sheet`, `toast`, `notify`, `segmented-control` and `swipe-to-confirm`
  all do; copy one of them.
- With `web.output: "single"` the web page is `public/index.html`. Don't add an `app/+html.tsx`: it only
  applies to static rendering and would be ignored. The inline script in `public/index.html` sets the
  `dark` class before the bundle loads (no light flash); its rules mirror `lib/theme-context.tsx` and
  `lib/embed.ts`, so change all three together.
- NativeWind classNames are **dropped on `Animated.View` on web**. Put the surface (`bg-*`, radius) on a
  plain `View` inside it, as `sheet.tsx` and `toast.tsx` do, or the panel renders transparent in the
  web preview. `sheet.tsx`, `segmented-control.tsx`, `swipe-to-confirm.tsx` and `notify.tsx` all
  follow this shape — copy it for any new animated surface.
