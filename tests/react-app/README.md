# tests/react-app

The web kit installed in a plain Vite + React Router app, the way an app outside the kit gets it: `components.json`
written by hand, `halftone-tokens init`, `shadcn add` from the registry, and the router set once with
`KitLinkProvider` (`src/main.tsx`). Only the app's own files live here; the kit's files arrive when the check runs.

```bash
npm run registry:dist -w apps/web     # build the registry the check installs from
node scripts/react-app-check.mjs      # at the repo root: copies this app to a temp folder and checks it there
```

It is not an npm workspace (no lockfile, no hoisting): it installs on its own from the pinned versions in
`package.json`, as a real app would.
