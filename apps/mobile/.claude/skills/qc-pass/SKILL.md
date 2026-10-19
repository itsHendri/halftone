---
name: qc-pass
description: Quality gate for the prototype kit — typecheck, lint, token/hex/icon guards, then a real look at the affected screens on the iOS simulator (and web) in light and dark. Use after adding or changing components, screens, tokens, or before committing/publishing. Never report "done" without running this.
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

## 2. Guards (must print nothing)

```bash
# no hard-coded colours in components or screens
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" app components --include="*.tsx" --include="*.ts" | grep -v "lib/theme"
# no other icon libraries (lucide icon refs are fine anywhere; they render through <Icon as>)
grep -rln "@expo/vector-icons\|react-native-vector-icons" app components || true
# react-native Text must not be used directly (use components/ui/text)
grep -rnE "import \{[^}]*\bText\b[^}]*\} from 'react-native'" app components/kit
```

Registration is checked by `registry:build -- --check` in step 1 (helpers it skips are listed in
`HELPERS` in `scripts/registry-build.mjs`).

## 3. On-device look

Start the servers with the `kit-ios` (Expo Go on the booted simulator) and `kit-web` launch
configs. For each affected section:

1. Open it: `xcrun simctl openurl booted "exp://localhost:8091/--/components?open=<category>"`.
2. Screenshot in the current scheme, flip the theme (header button), screenshot again.
3. Tap the interactive parts: open overlays, toggle switches, type in inputs, long-press
   context menus. Confirm sheets clear the home indicator and nothing is clipped.
4. On web (`http://localhost:8090/components?open=<category>`) confirm the same section renders
   and the console has no errors.

Expo Go note: haptics and blur render on the simulator; a physical device is only needed for
feel, not layout.

## 4. Report

List: checks run, results, screenshots taken, anything deferred (and why) added to BACKLOG.md.
