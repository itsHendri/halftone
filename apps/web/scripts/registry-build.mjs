#!/usr/bin/env node
/**
 * scripts/registry-build.mjs — everything derived from registry/components.ts.
 *
 *   npm run registry:build            write the outputs
 *   npm run registry:build -- --check write nothing; exit 1 if anything is stale (CI)
 *
 * 1. Checks: unique ids, every listed file exists and exports what the entry says, and every
 *    components/ui + components/kit file belongs to an entry (or is a known helper).
 * 2. DESIGN_SYSTEM.md: rewrites the blocks between <!-- GENERATED:<name> --> markers (one table per
 *    category, and the radius scale). Everything outside the markers stays hand-written.
 * 3. llms.txt: the agent-facing index (rules pointer, components, tokens).
 * 4. registry.json: the shadcn registry source (`npm run registry:dist` builds dist/r/web from it).
 *    Dependencies are read from each file's imports: unchanged components/ui files are shadcn/ui's own
 *    items (bare names), forked ones, components/kit, lib and hooks are our own `@halftone-web/*` items.
 * 5. registry/generated/index.json: the same data for the docs site.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { tokenUsage } from '@halftone-ds/tokens/lib/usage';
import ts from 'typescript';

import { CATEGORY_META } from '../registry/categories.ts';
import { COMPONENTS } from '../registry/components.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const read = (p) => readFileSync(join(root, p), 'utf8');

/** Files under components/ui and components/kit that are internals, not registry entries. */
const HELPERS = [];

// ---------- 1. checks ----------------------------------------------------------------------------

const problems = [];
const ids = new Set();
for (const c of COMPONENTS) {
  if (ids.has(c.id)) problems.push(`duplicate id "${c.id}"`);
  ids.add(c.id);
  if (!CATEGORY_META.some((cat) => cat.id === c.category)) problems.push(`${c.id}: unknown category "${c.category}"`);
  for (const file of c.files) {
    if (!existsSync(join(root, file))) {
      problems.push(`${c.id}: file not found: ${file}`);
      continue;
    }
    const src = read(file);
    for (const name of file === c.files[0] ? c.exports : []) {
      const exported =
        new RegExp(`export\\s+(?:default\\s+)?(?:async\\s+)?(?:function|const|let|class)\\s+${name}\\b`).test(src) ||
        new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`).test(src);
      if (!exported) problems.push(`${c.id}: ${file} does not export ${name}`);
    }
  }
}
const listed = new Set([...COMPONENTS.flatMap((c) => c.files), ...HELPERS]);
for (const dir of ['components/ui', 'components/kit']) {
  for (const f of readdirSync(join(root, dir))) {
    if (/\.tsx?$/.test(f) && !listed.has(`${dir}/${f}`)) problems.push(`unregistered: ${dir}/${f} — add it to registry/components.ts`);
  }
}
if (problems.length) {
  console.error(`registry:build FAILED\n${problems.map((p) => `  ${p}`).join('\n')}`);
  process.exit(1);
}

// ---------- helpers ------------------------------------------------------------------------------

/** "Toast / `useToast`": components plain, hooks and helpers in code style. */
const displayName = (c) => c.exports.map((e) => (/^[A-Z]/.test(e) ? e : `\`${e}\``)).join(' / ');
const byCategory = (id) => COMPONENTS.filter((c) => c.category === id);
const cell = (s) => (s ?? '').replace(/\|/g, '\\|');
const firstSentence = (s) => (s ? s.split(/(?<=\.)\s/)[0] : '');

function replaceBlock(text, name, body, file) {
  const open = `<!-- GENERATED:${name} -->`;
  const close = `<!-- /GENERATED:${name} -->`;
  const start = text.indexOf(open);
  const end = text.indexOf(close);
  if (start === -1 || end === -1 || end < start || text.indexOf(open, start + 1) !== -1) {
    console.error(`registry:build: missing or duplicated marker ${open} in ${file}`);
    process.exit(1);
  }
  return text.slice(0, start + open.length) + '\n' + body + '\n' + text.slice(end);
}

// ---------- 2. DESIGN_SYSTEM.md ------------------------------------------------------------------

let designSystem = read('DESIGN_SYSTEM.md');
for (const cat of CATEGORY_META) {
  const rows = byCategory(cat.id).map((c) => `| ${displayName(c)} | \`${c.files[0]}\` |${c.notes ? ` ${cell(c.notes)} ` : ' '}|`);
  const table = ['| Component | Path | Notes |', '|---|---|---|', ...rows].join('\n');
  designSystem = replaceBlock(designSystem, `registry:${cat.id}`, table, 'DESIGN_SYSTEM.md');
}

const tokens = JSON.parse(read('tokens/tokens.json'));
const RADIUS_USE = { md: 'inputs, buttons', lg: 'cards, dialogs', xl: 'panels, tables', '2xl': 'hero surfaces', full: 'avatars, pills' };
// The theme's radius: rounded-* are multiples of its base (rounded-lg).
const prim = Object.fromEntries(
  Object.entries(tokens.primitive.radius)
    .filter(([, t]) => t && typeof t === 'object' && '$value' in t)
    .map(([k, t]) => [k, t.$value])
);
const resolveRadius = (v) => (typeof v === 'string' && v.startsWith('{primitive.radius.') ? prim[v.slice(18, -1)] : Number(v));
const base = resolveRadius(tokens.semantic.radius.base.$value);
const radiusSteps = [
  ...Object.keys(prim)
    .filter((k) => k !== 'full')
    .map((k) => [k, Math.round(((base * prim[k]) / prim.lg) * 10) / 10]),
  // rounded-control (pill buttons) is the mobile kit's; web buttons follow the scale.
  ['full', null],
];
const radiusLine = radiusSteps.map(([k, v]) => `\`rounded-${k}\`${v === null ? '' : ` ${v}`}${RADIUS_USE[k] ? ` (${RADIUS_USE[k]})` : ''}`).join(' · ');
designSystem = replaceBlock(designSystem, 'tokens:radius', radiusLine + '.', 'DESIGN_SYSTEM.md');

// ---------- 3. llms.txt --------------------------------------------------------------------------

const app = { name: 'Halftone (web)' };
const llmsTokens = existsSync(join(root, 'tokens/generated/llms-tokens.md'))
  ? read('tokens/generated/llms-tokens.md').replace(/^<!--.*-->\n/, '')
  : '';
const llms = `# ${app.name}

> A brand-agnostic Next.js prototype kit (App Router, Tailwind 4, shadcn/ui) for dashboards, marketing pages and
> AI product interfaces. Pages are composed ONLY from the components listed below; nothing else exists.

Generated by \`npm run registry:build\` from registry/components.ts — do not edit by hand.

## Read first

- [AGENTS.md](AGENTS.md): stack, commands, how to build a prototype, gotchas
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md): tokens, the component registry, patterns, anti-patterns, the hallucination guard
- [DESIGN.md](DESIGN.md): the design tokens in the DESIGN.md format

## Rules

- Use only the components below, by their exact names. Missing something: stop and say so (the \`add-component\` skill adds it properly).
- Style with semantic Tailwind classes only. No hex, no Tailwind palette colours, no inline colour styles.
- \`npm run lint\` enforces these rules (\`halftone/*\`): fix every error before calling a page done.
- Icons from lucide-react. Charts take colours from \`var(--chart-1)\`…\`--chart-5\`.
- Check every page in light and dark, at 375px and 1280px wide.

## Components
${CATEGORY_META.map(
  (cat) =>
    `\n### ${cat.label}\n\n` +
    byCategory(cat.id)
      .map((c) => {
        const parts = [c.notes || firstSentence(c.caption), c.api && `\`${c.api}\``].filter(Boolean);
        return `- [${displayName(c)}](${c.files[0]})${parts.length ? `: ${parts.join(' — ')}` : ''}`;
      })
      .join('\n')
).join('\n')}

${llmsTokens}`;

// ---------- 4. registry.json (shadcn) --------------------------------------------------------------

const NS = '@halftone-web';
const forks = JSON.parse(read('registry/shadcn-forks.json')).components;
const pkg = JSON.parse(read('package.json'));
const versions = { ...pkg.dependencies, ...pkg.devDependencies };
/** Provided by every Next app; never listed as an item dependency. */
const PLATFORM = new Set(['react', 'react-dom', 'next']);

const isUpstream = (name) => forks[name]?.upstream && !forks[name].forked;
/** components/ui/sonner.tsx → sonner: upstream items are named after the file, not the registry id. */
const uiName = (file) => file.replace(/^components\/ui\//, '').replace(/\.tsx?$/, '');
/** The registry item that ships a file: the first entry listing it (sheet.tsx → sheet). */
const owner = new Map();
for (const c of COMPONENTS) for (const f of c.files) if (!owner.has(f)) owner.set(f, c.id);

/** Every module a file imports, requires or references in a type position, comments ignored. */
function importsOf(file) {
  const src = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const specs = new Set();
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) specs.add(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && node.expression.getText(src) === 'require' && ts.isStringLiteral(node.arguments[0] ?? {})) specs.add(node.arguments[0].text);
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) specs.add(node.argument.literal.text);
    ts.forEachChild(node, visit);
  };
  visit(src);
  return [...specs];
}

function existing(base) {
  return ['.tsx', '.ts'].map((ext) => base + ext).find((f) => existsSync(join(root, f)));
}

/** Map one import to an npm dependency or a registry dependency. */
function resolveImport(spec, from) {
  if (spec.startsWith('@/components/ui/')) {
    const name = spec.slice('@/components/ui/'.length);
    // A bare name resolves to shadcn/ui's own registry.
    return { registry: isUpstream(name) ? name : `${NS}/${name}` };
  }
  if (spec.startsWith('@/components/kit/')) {
    const file = existing(spec.slice(2));
    if (!file || !owner.has(file)) throw new Error(`${from}: ${spec} is not a registered kit file`);
    return { registry: `${NS}/${owner.get(file)}` };
  }
  if (spec.startsWith('@/lib/')) return { registry: `${NS}/lib-${spec.slice('@/lib/'.length)}` };
  if (spec.startsWith('@/hooks/')) return { registry: `${NS}/hook-${spec.slice('@/hooks/'.length)}` };
  if (spec.startsWith('@/') || spec.startsWith('.')) throw new Error(`${from}: cannot publish an import of ${spec}`);
  const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
  if (PLATFORM.has(name)) return {};
  return { dependency: versions[name] ? `${name}@${versions[name]}` : name };
}

function depsOf(files, self) {
  const dependencies = new Set();
  const registryDependencies = new Set();
  for (const file of files) {
    for (const spec of importsOf(file)) {
      const r = resolveImport(spec, file);
      if (r.dependency) dependencies.add(r.dependency);
      if (r.registry && r.registry !== `${NS}/${self}`) registryDependencies.add(r.registry);
    }
  }
  return { dependencies: [...dependencies].sort(), registryDependencies: [...registryDependencies].sort() };
}

const INSTALL_NOTE =
  'Needs the kit theme (`@halftone-web/theme`) and a next-themes ThemeProvider (attribute="class") at the root.';

const items = [];
const theme = JSON.parse(read('tokens/generated/theme.registry.json')).web;
items.push({
  name: 'theme',
  type: 'registry:theme',
  title: 'Kit theme',
  description: 'The kit tokens as Tailwind 4 CSS variables (oklch, light + dark) and the radius scale. Generated from tokens/tokens.json.',
  cssVars: theme.cssVars,
});

const libFiles = readdirSync(join(root, 'lib')).filter((f) => /\.tsx?$/.test(f)).sort();
for (const f of libFiles) {
  const name = `lib-${f.replace(/\.tsx?$/, '')}`;
  items.push({
    name,
    type: 'registry:lib',
    title: `lib/${f}`,
    ...depsOf([`lib/${f}`], name),
    files: [{ path: `lib/${f}`, type: 'registry:lib', target: `lib/${f}` }],
  });
}

const hookFiles = readdirSync(join(root, 'hooks')).filter((f) => /\.tsx?$/.test(f)).sort();
for (const f of hookFiles) {
  const name = `hook-${f.replace(/\.tsx?$/, '')}`;
  items.push({
    name,
    type: 'registry:hook',
    title: `hooks/${f}`,
    ...depsOf([`hooks/${f}`], name),
    files: [{ path: `hooks/${f}`, type: 'registry:hook', target: `hooks/${f}` }],
  });
}

const published = new Set();
for (const c of COMPONENTS) {
  const file = c.files[0];
  if (c.publish === false || owner.get(file) !== c.id || published.has(file)) continue;
  const isUi = file.startsWith('components/ui/');
  if (isUi && isUpstream(uiName(file))) continue; // consumers get it from shadcn/ui directly
  published.add(file);
  const type = isUi ? 'registry:ui' : 'registry:component';
  items.push({
    name: c.id,
    type,
    title: c.title,
    description: c.notes || firstSentence(c.caption),
    ...depsOf(c.files, c.id),
    files: c.files.map((path) => ({ path, type, target: path })),
    categories: [c.category],
    docs: INSTALL_NOTE,
    meta: { exports: c.exports, api: c.api },
  });
}

/** How a consumer gets each component: one of our items, shadcn's own (bare name), or not at all. */
function installOf(c) {
  const file = c.files[0];
  if (c.publish === false) return null;
  if (file.startsWith('components/ui/') && isUpstream(uiName(file))) return uiName(file);
  return `${NS}/${owner.get(file)}`;
}

const homepage = (pkg.repository?.url ?? '').replace(/^git\+/, '').replace(/\.git$/, '');
const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'kit-web',
  homepage,
  items,
};

// ---------- 5. registry/generated/index.json -----------------------------------------------------

const index = {
  $comment: 'GENERATED by `npm run registry:build` from registry/components.ts — do not edit by hand.',
  name: app.name,
  categories: CATEGORY_META,
  components: COMPONENTS.map((c) => ({ ...c, install: installOf(c) })),
};

// ---------- 6. registry/generated/token-usage.json -----------------------------------------------
// Which components draw which tokens (class strings, var(--x), Text variants): the docs Studio's "Show usage".

const usage = {
  $comment: 'GENERATED by `npm run registry:build` from the registry files and tokens/tokens.json — do not edit by hand.',
  usage: tokenUsage({ root, components: COMPONENTS, tokens: JSON.parse(read('tokens/tokens.json')) }),
};

// ---------- write / check ------------------------------------------------------------------------

const outputs = [
  ['DESIGN_SYSTEM.md', designSystem],
  ['llms.txt', llms],
  ['registry.json', JSON.stringify(registry, null, 2) + '\n'],
  ['registry/generated/index.json', JSON.stringify(index, null, 2) + '\n'],
  ['registry/generated/token-usage.json', JSON.stringify(usage, null, 2) + '\n'],
];
const stale = outputs.filter(([p, contents]) => !existsSync(join(root, p)) || read(p) !== contents);
if (check) {
  if (stale.length) {
    console.error(`registry:build --check: out of date — run \`npm run registry:build\`:\n${stale.map(([p]) => `  ${p}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`registry:build --check: ${COMPONENTS.length} components, ${outputs.length} outputs up to date`);
} else {
  for (const [p, contents] of stale) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), contents);
  }
  console.log(`registry:build → ${COMPONENTS.length} components · ${stale.map(([p]) => p).join(', ') || 'nothing changed'}`);
}
