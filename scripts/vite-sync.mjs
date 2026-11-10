#!/usr/bin/env node
/**
 * apps/vite (the Vite + Workers starter) carries the web kit's components so it runs the moment it's copied out. They
 * are not hand-copied: this installs them the way anyone would (`shadcn add` from the web kit's registry, built from
 * this commit) and copies the result in, so the starter's files are exactly what the registry hands out.
 *
 *   npm run registry:dist -w apps/web && npm run vite:sync              install COMPONENTS into apps/vite
 *   npm run registry:dist -w apps/web && npm run vite:sync -- --check   exit 1 if apps/vite differs (CI)
 *
 * Owned here: every file shadcn writes under src/ (components/ui, components/kit, hooks, lib), and the dependencies
 * it adds. Not owned: the starter's own files, and anything tokens.config.json builds (`tokens:build` writes those).
 * A kit file in apps/vite that the registry no longer gives is stale: removed, or with --check, an error.
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { declaredRanges, filesUnder, requireDist, root, serveRegistry, sh, within } from './registry-install.mjs';

/** The kit components the starter's pages use. Add one here (and to a page), then `npm run vite:sync`. */
export const COMPONENTS = [
  'alert',
  'app-shell',
  'badge',
  'button',
  'chart',
  'data-table',
  'empty-state',
  'list-group',
  'list-row',
  'page-header',
  'segmented-control',
  'spinner',
  'stat-tile',
  'switch',
];

const starter = join(root, 'apps/vite');
const SHADCN = 'shadcn@4.22.1';
const check = process.argv.includes('--check');
/** Folders under src/ that belong to the kit entirely: a file there the registry didn't write is stale. */
const KIT_DIRS = ['src/components/ui', 'src/components/kit', 'src/components/controls', 'src/hooks'];

requireDist('vite-sync');
const { server, url } = await serveRegistry();

const temp = mkdtempSync(join(tmpdir(), 'halftone-vite-sync-'));
let failed = false;
try {
  // A bare copy of the starter: its config, stylesheet and packages, minus the Workers tooling shadcn doesn't need.
  for (const f of ['components.json', 'tsconfig.json', 'tsconfig.app.json', 'vite.config.ts', 'src/index.css']) {
    mkdirSync(dirname(join(temp, f)), { recursive: true });
    cpSync(join(starter, f), join(temp, f));
  }
  const pkg = JSON.parse(readFileSync(join(starter, 'package.json'), 'utf8'));
  const devDependencies = Object.fromEntries(Object.entries(pkg.devDependencies).filter(([name]) => !/wrangler|@cloudflare\/|eslint|@halftone-ds/.test(name)));
  writeFileSync(join(temp, 'package.json'), JSON.stringify({ name: 'vite-sync', private: true, type: 'module', dependencies: { ...pkg.dependencies }, devDependencies }, null, 2));
  const components = JSON.parse(readFileSync(join(temp, 'components.json'), 'utf8'));
  components.registries['@halftone-web'] = url;
  writeFileSync(join(temp, 'components.json'), JSON.stringify(components, null, 2));

  console.log(`vite-sync: shadcn add ${COMPONENTS.length} kit components from this commit's registry…`);
  await sh('npx', ['-y', SHADCN, 'add', ...COMPONENTS.map((c) => `@halftone-web/${c}`), '--overwrite', '--yes'], temp);

  // What the registry wrote, minus what the starter's own token build owns.
  const config = JSON.parse(readFileSync(join(starter, 'tokens/tokens.config.json'), 'utf8'));
  const built = new Set(Object.values(config.targets).map((t) => t.out).filter(Boolean));
  const written = filesUnder(temp, 'src').filter((f) => f !== 'src/index.css' && !built.has(f));
  const writtenSet = new Set(written);

  const changed = written.filter((f) => !existsSync(join(starter, f)) || readFileSync(join(starter, f), 'utf8') !== readFileSync(join(temp, f), 'utf8'));
  const stale = KIT_DIRS.flatMap((d) => filesUnder(starter, d)).filter((f) => !writtenSet.has(f));

  // Dependencies shadcn added to the bare copy. The starter must list each within the range the registry declares (npm
  // records the newest match, ^1.70.0 for ^1.52.0, so the bare copy's own range would change with every release).
  const after = JSON.parse(readFileSync(join(temp, 'package.json'), 'utf8'));
  const declared = declaredRanges();
  const deps = Object.entries(after.dependencies)
    .filter(([name]) => !(name in (pkg.devDependencies ?? {})))
    .map(([name, installed]) => [name, declared.get(name) ?? installed])
    .filter(([name, range]) => !within(pkg.dependencies[name], range));

  if (check) {
    const problems = [
      ...changed.map((f) => `  ${f}: ${existsSync(join(starter, f)) ? 'differs from' : 'missing, but'} the registry's`),
      ...stale.map((f) => `  ${f}: the registry no longer gives it`),
      ...deps.map(([n, r]) => `  package.json: ${n} must be within ${r} (has ${pkg.dependencies[n] ?? 'none'})`),
    ];
    if (problems.length) {
      console.error(`vite-sync --check: apps/vite is out of step with the web kit's registry:\n${problems.join('\n')}\nRun \`npm run registry:dist -w apps/web && npm run vite:sync\`.`);
      failed = true;
    } else console.log(`vite-sync --check: ${written.length} kit files and their dependencies match the registry.`);
  } else {
    for (const f of changed) {
      mkdirSync(dirname(join(starter, f)), { recursive: true });
      cpSync(join(temp, f), join(starter, f));
    }
    for (const f of stale) rmSync(join(starter, f));
    if (deps.length) {
      pkg.dependencies = Object.fromEntries(Object.entries({ ...pkg.dependencies, ...Object.fromEntries(deps) }).sort(([a], [b]) => a.localeCompare(b)));
      writeFileSync(join(starter, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
    }
    console.log(
      `vite-sync: ${changed.length} file(s) written, ${stale.length} removed, ${deps.length} dependenc${deps.length === 1 ? 'y' : 'ies'} set` +
        (changed.length + stale.length + deps.length ? `. Then: npm install at the root, and npm run tokens:build -w apps/vite.` : ' (already in step).')
    );
    for (const f of [...changed, ...stale]) console.log(`  ${relative(root, join(starter, f))}`);
  }
} catch (e) {
  console.error(e.message);
  failed = true;
} finally {
  server.close();
  rmSync(temp, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
