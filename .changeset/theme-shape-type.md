---
"@halftone/tokens": minor
---

Theme fonts, depth, borders and icon stroke. Themes now write `semantic.radius.control`, `semantic.border.width`, `semantic.icon.stroke`, `semantic.shadow.{1,2,3}` (DTCG shadows, light and dark) and `primitive.font.family.{heading,body}`. A new `fonts` target writes the code that loads them (`platform: 'expo'`: per-weight `@expo-google-fonts` imports and `FONT_FAMILY`; `platform: 'next'`: `next/font/google` with `--kit-font-heading` / `--kit-font-body`), and `theme apply` installs the Expo font packages. `nativewind3` and `shadcn-web` map the theme's depth onto Tailwind's own `shadow-*` scale, its border width onto `border`, and add `rounded-control`. The `rounded-*` scale is now a multiple of `--radius` (not an offset), so radius `none` squares everything; at the default base the values are unchanged. The Figma target adds the theme's radius, border, stroke and font variables.
