---
"@halftone/tokens": minor
---

Theme density. Themes write `semantic.density.scale` and `semantic.density.control.{sm,md,lg,x}`. `nativewind3` exposes them as `h-control-sm` / `h-control` / `h-control-lg` (with `min-h-*` and `w-*`) and `px-control-x`; `shadcn-web` scales Tailwind 4's whole `--spacing` scale by `--density` (turn it off with the target option `density: false`).
