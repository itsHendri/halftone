# tests/expo-app

The native kit installed in a plain Expo + NativeWind app, the way an app outside the kit gets it (install.md path
C): `halftone-tokens init`, `shadcn add` from the registry, `npx expo install --fix`, `halftone-tokens build`, and
`KitThemeProvider` with the theme's fonts at the root (`app/_layout.tsx`). Only the app's own files live here; the
kit's files arrive when the check runs.

```bash
npm run registry:dist -w apps/mobile    # build the registry the check installs from
npm run check:expo-app                  # at the repo root: copies this app to a temp folder and checks it there
```

It is not an npm workspace: it installs on its own, as a real app would. The check exports it for the web and
opens it in Chromium; CI can't run a simulator, so the native look is checked by hand (qc-pass).
