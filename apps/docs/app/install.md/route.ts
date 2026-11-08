import { kit } from '@/lib/kit';
import { site } from '@/lib/llms';

export const revalidate = false;

const repoPath = kit.repo.replace('https://github.com/', '');

/** The page an agent reads when a person pastes the install prompt. Terse, imperative, complete. */
export function GET() {
  const md = `# Install ${kit.name}

${kit.name} is two prototype kits on one brand: an Expo kit for the phone and a Next.js kit for the web,
sharing one set of design tokens. Build only from the components they ship; \`npm run lint\` rejects raw
colours, imports outside the registry and other UI libraries. The two kits:

- **Mobile** (\`apps/mobile\`): Expo, React Native, NativeWind, react-native-reusables. Phone prototypes.
- **Web** (\`apps/web\`): Next.js, Tailwind 4, shadcn/ui. Dashboards, marketing pages, AI product interfaces.

If the person did not say which, ask: "a phone app, a web app, or both?"

If the person gave you a transcript, notes or a **BRIEF.md**, set the kit up first, then run the kit's
\`transcript-to-prototype\` skill on it: plan first, and wait for approval before writing code.

## 1. Pick the path

Both kits need Node.js 22.18 or later and are developed on the version in their \`.nvmrc\` (24): run \`nvm use\` (or
your version manager's equivalent) in the project before \`npm install\`.


**A. New mobile prototype**

\`\`\`bash
npx giget@latest gh:${repoPath}/apps/mobile <project-name>
cd <project-name> && npm install
npm run ios        # or: npm run web
\`\`\`

**B. New web prototype**

\`\`\`bash
npx giget@latest gh:${repoPath}/apps/web <project-name>
cd <project-name> && npm install
npm run dev        # http://localhost:3100
\`\`\`

**C. Add kit components to an existing Expo app** that already uses react-native-reusables:

1. Add the registry to \`components.json\`:
   \`"registries": { "${kit.registry.native}": "${site('/r/native/{name}.json')}" }\`
2. \`npx shadcn@latest add ${kit.registry.native}/theme ${kit.registry.native}/lib-theme-context\`, wrap the root
   layout in \`<KitThemeProvider>\`, then add components: \`npx shadcn@latest add ${kit.registry.native}/list-row\`.
3. When shadcn asks to overwrite a react-native-reusables file (\`text.tsx\`, \`button.tsx\`, …), answer yes or
   pass \`--overwrite\`: kit components expect the kit's refined versions.
4. \`npx expo install --fix\` so Expo packages match the project's SDK.

**D. Add kit components to an existing Next.js app** that already uses shadcn/ui (Tailwind 4):

1. \`components.json\`: the kit is built on **Radix** with the **new-york** style. Write the file yourself rather
   than running \`shadcn init\`: its presets are not new-york, and \`--defaults\` picks Base UI, which kit components
   do not work on. Set \`"rsc": false\` if the app has no React Server Components. An app that already has a
   \`components.json\` on Radix and new-york only needs the \`registries\` entry.

   \`\`\`json
   {
     "$schema": "https://ui.shadcn.com/schema.json",
     "style": "new-york",
     "rsc": true,
     "tsx": true,
     "tailwind": { "config": "", "css": "app/globals.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
     "iconLibrary": "lucide",
     "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
     "registries": { "${kit.registry.web}": "${site('/r/web/{name}.json')}" }
   }
   \`\`\`
2. The tokens. Kit components need the kit's whole generated \`tokens.css\` (colours, sizes, type styles, spacing,
   shadows), not just colours. Build it with \`@halftone-ds/tokens\`:

   \`\`\`bash
   npm install -D @halftone-ds/tokens
   npm install tw-animate-css
   mkdir -p tokens
   curl -fsSL -o tokens/tokens.json https://raw.githubusercontent.com/${repoPath}/main/apps/web/tokens/tokens.json
   echo '{ "source": "tokens/tokens.json", "targets": { "shadcn-web": { "out": "app/tokens.css" } } }' > tokens/tokens.config.json
   npx halftone-tokens build
   \`\`\`

   Then make the top of \`app/globals.css\` \`@import 'tailwindcss'; @import 'tw-animate-css'; @import './tokens.css';\`
   and delete the \`:root\`, \`.dark\`, \`@theme\`, \`@layer base\` and \`body\` rules that \`shadcn init\` or
   \`create-next-app\` wrote: \`tokens.css\` has all of them, and a copy left in \`globals.css\` wins over it. In a new
   app those three lines are the whole file. Re-brand later with
   \`npx halftone-tokens theme apply <code>\`. (\`${kit.registry.web}/theme\` is colours and radius only, for a
   plain shadcn app that wants the brand without kit components.)
3. Dark mode is a \`.dark\` class on \`<html>\`: next-themes with \`attribute="class"\`, or any code that sets it.
4. Add plain shadcn items first and kit items last: \`npx shadcn@latest add dialog\`, then
   \`npx shadcn@latest add ${kit.registry.web}/data-table\`. A plain item that depends on \`button\` (alert-dialog,
   calendar, pagination, …) brings stock \`button.tsx\` with it and replaces the kit's without a warning. If that
   happened, run \`npx shadcn@latest add ${kit.registry.web}/button --overwrite\`.
5. When shadcn asks to overwrite \`button.tsx\`, \`badge.tsx\` or \`slider.tsx\` with the kit's, answer yes: the kit's
   versions fix colour contrast that kit components rely on.
6. Kit components link with \`next/link\` (and \`AppShell\` reads \`next/navigation\`), so this path is for Next.js apps.

**E. Mobile and web on one brand**: \`git clone ${kit.repo}.git\`, \`npm install\` at the root, and work in
\`apps/mobile\` and \`apps/web\`. \`apps/mobile/tokens/tokens.json\` is the one brand file; \`npm run tokens:sync\`
copies it to the web kit.

## 2. Read before writing UI

In the kit you are working in:

- \`AGENTS.md\`: stack, commands, how a prototype is laid out (its own folder under \`app/\`), gotchas.
- \`DESIGN_SYSTEM.md\`: tokens, the component registry, patterns, anti-patterns, the hallucination guard.
- \`llms.txt\` in the project, or ${site('/llms.txt')}: every component with its API.
- The sample apps are the worked examples, the same products in both kits. Native: \`app/shop\`, \`app/habits\`,
  \`app/northwind\`. Web: \`app/shop\`, \`app/habits\`, and Northwind as \`app/dashboard\`, \`app/landing\`, \`app/assistant\`. Remove them with \`npm run eject-samples\` once you have copied their shape.

## 3. Rules (both kits)

- Build screens only from registry components, by their exact names. If something is missing, stop, say
  so in one line, and add it with the \`add-component\` skill. Never invent a component.
- Style with semantic classes only (\`bg-card\`, \`text-muted-foreground\`, \`bg-primary-subtle\`). No hex, no
  Tailwind palette colours, no inline colour styles.
- One primary action per screen. Content is flat; shadows only on what you can press or what floats.
- Mock data lives beside the prototype (mobile: \`components/<slug>/data.ts\`; web: \`app/<slug>/data.ts\`). Never
  call real APIs.
- Check every screen in light and dark. Run the \`qc-pass\` skill before saying "done".

**Mobile only:** text through \`<Text variant>\`, icons through \`<Icon as={…} />\` (lucide). Buttons hold
\`<Text>\`/\`<Icon>\`. Prefer a kit pattern over a new flow: screen skeleton, multi-step flow as one route,
\`SuccessScreen\`, \`StickyBottomBar\`.

**Web only:** a prototype's \`layout.tsx\` holds its frame (\`AppShell\` for an app, a plain header and footer
for a marketing page). Lucide icons from \`lucide-react\`, links as \`<Button asChild><Link/></Button>\`. Design
at 375px and 1280px. In an AI interface, ask with an \`ApprovalCard\` before anything irreversible.

## 4. Re-brand

Edit \`tokens/tokens.json\` (brand ramp, semantic colours, radius) and run \`npm run tokens:build\`. It names
any pairing where a fill and its text, or muted text on a surface, falls below 4.5:1: treat that as a bug unless
the person chose the colour knowingly. Or apply a theme code (\`npx halftone-tokens theme apply <code>\`), which
fixes contrast itself.
`;
  return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
