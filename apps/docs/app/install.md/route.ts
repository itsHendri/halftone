import { kit } from '@/lib/kit';
import { site } from '@/lib/llms';

export const revalidate = false;

const repoPath = kit.repo.replace('https://github.com/', '');

/** The page an agent reads when a person pastes the install prompt. Terse, imperative, complete. */
export function GET() {
  const md = `# Install ${kit.name}

${kit.name} is two kits on one brand: an Expo kit for the phone and a web kit, sharing one set of design tokens.
Use them for prototypes or for real products. Build only from the components they ship; \`npm run lint\` rejects
raw colours, imports outside the registry and other UI libraries. The two kits:

- **Mobile** (\`apps/mobile\`): Expo, React Native, NativeWind, react-native-reusables. Phone apps.
- **Web** (\`apps/web\`): a Next.js starter on Tailwind 4 and shadcn/ui, whose components also install into any
  React app (path D). Dashboards, marketing pages, AI product interfaces.

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

**C. Add kit components to an existing Expo app** on NativeWind 4 with react-native-reusables:

1. Add the registry to \`components.json\`:
   \`"registries": { "${kit.registry.native}": "${site('/r/native/{name}.json')}" }\`
2. The tokens: the kit's colours, sizes, type styles, spacing, shadows and fonts.

   \`\`\`bash
   npm install -D @halftone-ds/tokens
   npx halftone-tokens init            # or: npx halftone-tokens init --theme <code from Studio>
   \`\`\`

   \`init\` writes \`tokens/\`, builds \`tokens/generated/tokens.css\` (imported first by \`global.css\`) and a Tailwind
   preset (added to \`tailwind.config.js\` next to \`nativewind/preset\`), and \`lib/theme.ts\` and \`lib/fonts.ts\`. It
   installs a theme's font packages and lists any \`:root\` / \`.dark:root\` rules in \`global.css\` and any \`colors\`
   or \`borderRadius\` in \`tailwind.config.js\` that would win over the kit's: delete them.
3. \`npx shadcn@latest add ${kit.registry.native}/lib-theme-context\`, wrap the root layout in \`<KitThemeProvider>\`,
   and load the theme's fonts there with \`useFonts(FONT_ASSETS)\` from \`@/lib/fonts\` (expo-font).
4. Add components: \`npx shadcn@latest add ${kit.registry.native}/list-row\`. When shadcn asks to overwrite a
   react-native-reusables file (\`text.tsx\`, \`button.tsx\`, …), answer yes or pass \`--overwrite\`: kit components
   expect the kit's refined versions.
5. After every add: \`npx expo install --fix\` (Expo packages to the project's SDK) and \`npx halftone-tokens build\`
   (the registry brings \`lib/theme.ts\` and \`lib/fonts.ts\` with Halftone's default brand; the build puts yours back).
6. Check: \`npx halftone-tokens doctor\` names anything missing (tokens, \`global.css\`, the preset,
   \`KitThemeProvider\`, fonts, a stock file over a kit one) and the command that fixes it.

**D. Add kit components to an existing React app** on Tailwind 4: Next.js, Vite, React Router, or any other.
The steps are the same everywhere; where they differ, the note says so. This also covers a real product, not
just a prototype.

1. \`components.json\`: the kit is built on **Radix** with the **new-york** style. Write the file yourself rather
   than running \`shadcn init\`: its presets are not new-york, and \`--defaults\` picks Base UI, which kit components
   do not work on. An app that already has a \`components.json\` on Radix and new-york only needs the
   \`registries\` entry. Set \`"css"\` to the app's main stylesheet, and \`"rsc": true\` only in a Next.js App Router
   app. The \`@/\` aliases must resolve in \`tsconfig.json\` (\`"paths": { "@/*": ["./src/*"] }\` in a Vite app,
   plus the same alias in \`vite.config.ts\`).

   \`\`\`json
   {
     "$schema": "https://ui.shadcn.com/schema.json",
     "style": "new-york",
     "rsc": false,
     "tsx": true,
     "tailwind": { "config": "", "css": "src/index.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
     "iconLibrary": "lucide",
     "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
     "registries": { "${kit.registry.web}": "${site('/r/web/{name}.json')}" }
   }
   \`\`\`
2. The tokens: the kit's colours, sizes, type styles, spacing, shadows and fonts.

   \`\`\`bash
   npm install tw-animate-css
   npm install -D @halftone-ds/tokens
   npx halftone-tokens init            # or: npx halftone-tokens init --theme <code from Studio>
   \`\`\`

   \`init\` writes \`tokens/\`, builds \`tokens.css\` and \`fonts.css\` next to the app's stylesheet and imports them. It
   lists any \`:root\`, \`.dark\`, \`@theme\`, \`@layer base\` or \`body\` rules left in that stylesheet (from
   \`shadcn init\`, \`create-next-app\` or a Vite template): delete them, because a copy there wins over the kit's.
   Re-brand later with \`npx halftone-tokens theme apply <code>\`. (\`${kit.registry.web}/theme\` is colours and
   radius only, for a plain shadcn app that wants the brand without kit components.)
3. Dark mode is a \`.dark\` class on \`<html>\`: next-themes with \`attribute="class"\`, or any code that sets it.
4. Add every component the kit lists from the kit: \`npx shadcn@latest add ${kit.registry.web}/data-table
   ${kit.registry.web}/dialog\`. The kit publishes its own copy of shadcn parts that use a kit file (dialog,
   alert-dialog, pagination, command), so they bring the kit's button, not shadcn's. Parts the kit doesn't list are
   plain shadcn items (\`npx shadcn@latest add accordion\`); add those before kit items, because one that depends on
   \`button\` (carousel, sidebar, …) brings stock \`button.tsx\` and replaces the kit's without a warning. If that
   happened, run \`npx shadcn@latest add ${kit.registry.web}/button --overwrite\`. When shadcn asks to overwrite
   \`button.tsx\`, \`badge.tsx\` or \`slider.tsx\` with the kit's, answer yes: the kit's versions fix colour contrast
   that kit components rely on.
5. Links: kit components link through \`@/lib/link\` (it arrives with them). Tell it once, at the app's root, which
   link and current-path hook your router has. Without it, kit links are plain \`<a>\` tags that reload the page.
   Set it in your own code, never by editing \`lib/link.tsx\`: \`shadcn add --overwrite\` copies kit files again.

   React Router (Vite, or framework mode), around the app inside the router:

   \`\`\`tsx
   import { Link, useLocation } from 'react-router';
   import { KitLinkProvider, type KitLinkProps } from '@/lib/link';

   const RouterLink = ({ href, ...props }: KitLinkProps) => <Link to={href} {...props} />;
   const usePathname = () => useLocation().pathname;

   <KitLinkProvider link={RouterLink} usePathname={usePathname}>{app}</KitLinkProvider>
   \`\`\`

   Next.js, in a client component around the app (a component can't be passed from a server layout):

   \`\`\`tsx
   'use client';
   import NextLink from 'next/link';
   import { usePathname } from 'next/navigation';
   import { KitLinkProvider } from '@/lib/link';

   export function Providers({ children }: { children: React.ReactNode }) {
     return <KitLinkProvider link={NextLink} usePathname={usePathname}>{children}</KitLinkProvider>;
   }
   \`\`\`

   Another router: pass its link component (taking \`href\`) and a hook that returns the current path.
6. One \`cn\`: kit and shadcn files import it from the \`cn\` package. If the app's \`lib/utils.ts\` has its own
   (clsx + tailwind-merge, from an older \`shadcn init\`), make it \`export { cn } from 'cn';\` (shadcn's own
   \`utils\` does that now) and keep any other helpers in the file.
7. Check: \`npx halftone-tokens doctor\` names anything missing (tokens, stylesheet imports, aliases, dark mode,
   \`KitLinkProvider\`, a stock shadcn file over a kit one, a second \`cn\`) and the command that fixes it.

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
- In a prototype, mock data lives beside it (mobile: \`components/<slug>/data.ts\`; web: \`app/<slug>/data.ts\`)
  and it never calls real APIs: a prototype has to run anywhere, for anyone, without accounts or keys.
- In a real product, real data and APIs are fine, and folders and routing follow the host app. Everything else
  here still applies: the same components, the same tokens, the same checks.
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
