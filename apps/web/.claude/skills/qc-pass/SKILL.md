---
name: qc-pass
description: Quality gate for the web prototype kit — typecheck, lint, token and registry checks, colour and import guards, then a real look at the affected pages in the browser at 375px and 1280px in light and dark. Use after adding or changing components, pages or tokens, and before committing or sharing. Never report "done" without running this.
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

## 2. Guards (must print nothing)

```bash
# no hard-coded colours (the modal scrim bg-black/50 and chart.tsx's attribute selectors are the exceptions)
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(|(text|bg|border|fill|stroke)-(white|black|(slate|gray|zinc|neutral|red|orange|amber|yellow|green|emerald|teal|sky|blue|indigo|violet|purple|pink|rose)-[0-9]{2,3})" app components --include="*.tsx" --include="*.ts" | grep -v "bg-black/50" | grep -v "components/ui/chart.tsx"
# no other UI libraries
grep -rlnE "@mui/|@chakra-ui/|@mantine/|antd" app components || true
# kit files import each other through the alias
grep -rn "from '\./" components/kit || true
```

## 3. In the browser

Start the dev server (`npm run dev`, or the `web-dev` launch config). For each affected page or component
(`/components?section=<id>` for a component):

1. Look at 1280px and at 375px. Nothing overflows horizontally; sidebars become sheets; tables scroll in
   their card.
2. Flip the theme (header toggle) and look again.
3. Use it: open overlays, submit forms, sort tables, send a chat message. The console has no errors or
   hydration warnings.
4. Keyboard: Tab reaches every control in order and the focus ring is visible.

## 4. Report

List: checks run, results, screenshots taken, anything deferred (and why).
