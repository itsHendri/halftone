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

If the person gave you a **BRIEF.md** from the brief wizard (\`${site('/brief/')}\`), its "How to use this brief"
section says which path to take and what to do after: plan first, and wait for approval before writing code.

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

1. Add the registry to \`components.json\`:
   \`"registries": { "${kit.registry.web}": "${site('/r/web/{name}.json')}" }\`
2. \`npx shadcn@latest add ${kit.registry.web}/theme\` for the kit's colours and radius, then components:
   \`npx shadcn@latest add ${kit.registry.web}/data-table\`. Components the kit did not change are plain shadcn
   items (\`npx shadcn@latest add dialog\`).
3. When shadcn asks to overwrite \`button.tsx\`, \`badge.tsx\` or \`slider.tsx\`, answer yes: the kit's versions
   fix colour contrast that kit components rely on.

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
- Style with semantic classes only (\`bg-card\`, \`text-muted-foreground\`, \`bg-primary/15\`). No hex, no
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
