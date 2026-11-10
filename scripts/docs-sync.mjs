#!/usr/bin/env node
/**
 * The docs site's Studio is built from the web kit's Controls. It gets them the way anyone would: `shadcn add` from the
 * web kit's registry, built from this commit, so the Studio runs on exactly what the registry hands out and resolves
 * every import against its own folders.
 *
 *   npm run registry:dist -w apps/web && npm run docs:sync              install the Controls into apps/docs
 *   npm run registry:dist -w apps/web && npm run docs:sync -- --check   exit 1 if apps/docs differs (CI)
 *
 * Installs every registry item in the `controls` category, and what they depend on. Owned here: the files shadcn writes
 * (components/controls, lib/controls, hooks) and the dependencies it adds. Change a Control in apps/web, never in
 * apps/docs. A file in those folders that the registry no longer gives is stale: removed, or with --check, an error.
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { declaredRanges, dist, filesUnder, requireDist, root, serveRegistry, sh, within } from './registry-install.mjs';

const docs = join(root, 'apps/docs');
const SHADCN = 'shadcn@4.22.1';
const check = process.argv.includes('--check');
/** Folders in apps/docs that belong to the registry entirely. */
const KIT_DIRS = ['components/controls', 'lib/controls', 'hooks'];

requireDist('docs-sync');
const items = JSON.parse(readFileSync(join(dist, 'registry.json'), 'utf8'))
  .items.filter((i) => i.categories?.includes('controls'))
  .map((i) => `@halftone-web/${i.name}`);
const { server, url } = await serveRegistry();

const temp = mkdtempSync(join(tmpdir(), 'halftone-docs-sync-'));
let failed = false;
try {
  // A bare Next-shaped app: the docs site's aliases (`@/*` at the root), React Server Components on (so shadcn keeps
  // 'use client'), and only the packages the Controls could need, so the install stays quick.
  const pkg = JSON.parse(readFileSync(join(docs, 'package.json'), 'utf8'));
  const pick = (from, names) => Object.fromEntries(names.filter((n) => from?.[n]).map((n) => [n, from[n]]));
  writeFileSync(
    join(temp, 'package.json'),
    JSON.stringify({ name: 'docs-sync', private: true, type: 'module', dependencies: pick(pkg.dependencies, ['react', 'react-dom', 'lucide-react']), devDependencies: pick(pkg.devDependencies, ['typescript', 'tailwindcss']) }, null, 2)
  );
  writeFileSync(join(temp, 'tsconfig.json'), JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./*'] }, jsx: 'react-jsx' } }, null, 2));
  mkdirSync(join(temp, 'app'));
  writeFileSync(join(temp, 'app/global.css'), "@import 'tailwindcss';\n");
  writeFileSync(
    join(temp, 'components.json'),
    JSON.stringify(
      {
        $schema: 'https://ui.shadcn.com/schema.json',
        style: 'new-york',
        rsc: true,
        tsx: true,
        tailwind: { config: '', css: 'app/global.css', baseColor: 'neutral', cssVariables: true, prefix: '' },
        iconLibrary: 'lucide',
        aliases: { components: '@/components', utils: '@/lib/utils', ui: '@/components/ui', lib: '@/lib', hooks: '@/hooks' },
        registries: { '@halftone-web': url },
      },
      null,
      2
    )
  );

  console.log(`docs-sync: shadcn add ${items.length} Controls from this commit's registry…`);
  await sh('npx', ['-y', SHADCN, 'add', ...items, '--overwrite', '--yes'], temp);

  const written = KIT_DIRS.flatMap((d) => filesUnder(temp, d));
  const outside = ['components', 'lib'].flatMap((d) => filesUnder(temp, d)).filter((f) => !KIT_DIRS.some((k) => f.startsWith(`${k}/`)));
  if (outside.length) throw new Error(`docs-sync: the registry wrote files outside ${KIT_DIRS.join(', ')}:\n  ${outside.join('\n  ')}\nA Control now needs a kit part the docs site doesn't own: add its folder to KIT_DIRS.`);
  const writtenSet = new Set(written);
  const changed = written.filter((f) => !existsSync(join(docs, f)) || readFileSync(join(docs, f), 'utf8') !== readFileSync(join(temp, f), 'utf8'));
  const stale = KIT_DIRS.flatMap((d) => filesUnder(docs, d)).filter((f) => !writtenSet.has(f));

  const after = JSON.parse(readFileSync(join(temp, 'package.json'), 'utf8'));
  const declared = declaredRanges();
  const deps = Object.entries(after.dependencies)
    .map(([name, installed]) => [name, declared.get(name) ?? installed])
    .filter(([name, range]) => !within(pkg.dependencies[name], range) && pkg.dependencies[name] !== range);

  if (check) {
    const problems = [
      ...changed.map((f) => `  ${f}: ${existsSync(join(docs, f)) ? 'differs from' : 'missing, but'} the registry's`),
      ...stale.map((f) => `  ${f}: the registry no longer gives it`),
      ...deps.map(([n, r]) => `  package.json: ${n} must be within ${r} (has ${pkg.dependencies[n] ?? 'none'})`),
    ];
    if (problems.length) {
      console.error(`docs-sync --check: apps/docs's Controls are out of step with the web kit's registry:\n${problems.join('\n')}\nRun \`npm run registry:dist -w apps/web && npm run docs:sync\`.`);
      failed = true;
    } else console.log(`docs-sync --check: ${written.length} Controls files and their dependencies match the registry.`);
  } else {
    for (const f of changed) {
      mkdirSync(dirname(join(docs, f)), { recursive: true });
      cpSync(join(temp, f), join(docs, f));
    }
    for (const f of stale) rmSync(join(docs, f));
    if (deps.length) {
      pkg.dependencies = Object.fromEntries(Object.entries({ ...pkg.dependencies, ...Object.fromEntries(deps) }).sort(([a], [b]) => a.localeCompare(b)));
      writeFileSync(join(docs, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
    }
    console.log(
      `docs-sync: ${changed.length} file(s) written, ${stale.length} removed, ${deps.length} dependenc${deps.length === 1 ? 'y' : 'ies'} set` +
        (deps.length ? '. Then: npm install at the root.' : '.')
    );
    for (const f of [...changed, ...stale]) console.log(`  ${relative(root, join(docs, f))}`);
  }
} catch (e) {
  console.error(e.message);
  failed = true;
} finally {
  server.close();
  rmSync(temp, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
