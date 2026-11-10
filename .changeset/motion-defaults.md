---
'@halftone-ds/tokens': patch
---

shadcn-web: a transition or an enter/exit animation without a duration class now takes the theme's motion. Tailwind's default transition duration and easing point at `--duration-fast` and `--ease-standard`, every element's `--tw-duration` defaults to `--duration-fast` (tw-animate-css's popovers, menus and tooltips read it), and the `duration-*` and `spring-*` classes set `--tw-duration` (a spring `--tw-ease` too), as Tailwind's own duration classes do.
