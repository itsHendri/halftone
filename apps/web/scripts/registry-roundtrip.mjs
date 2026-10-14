#!/usr/bin/env node
/**
 * scripts/registry-roundtrip.mjs — proves the published registry reinstalls this kit byte for byte.
 *
 *   npm run registry:dist && npm run registry:roundtrip
 *
 * Serves dist/r/web on a local port, copies the app to a temp dir pointed at it, and dry-runs
 * `shadcn add` for every component and lib item. Every file must come back identical, apart from the
 * GENERATED header comment shadcn strips from the top of a file. Dry run: nothing is written or
 * installed, and the copy is deleted afterwards.
 */
import { execFile } from 'node:child_process';
import { cpSync, createReadStream, existsSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist/r/web');
const SHADCN = 'shadcn@4.21.3';
if (!existsSync(join(dist, 'registry.json'))) {
  console.error('registry:roundtrip: run `npm run registry:dist` first.');
  process.exit(1);
}

const server = createServer((req, res) => {
  const file = join(dist, decodeURIComponent(req.url.split('?')[0]));
  if (file.startsWith(dist) && existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200, { 'content-type': 'application/json' });
    createReadStream(file).pipe(res);
  } else {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const SKIP = new Set(['node_modules', '.git', 'dist', '.next', 'out']);
const copy = mkdtempSync(join(tmpdir(), 'kit-roundtrip-'));
let failed = false;
try {
  cpSync(root, copy, { recursive: true, filter: (src) => !SKIP.has(src.slice(root.length + 1).split('/')[0]) });
  // In the monorepo the packages are hoisted to the root; resolve wherever they actually live.
  const modules = dirname(dirname(createRequire(join(root, 'package.json')).resolve('next/package.json')));
  symlinkSync(modules, join(copy, 'node_modules'));
  const config = JSON.parse(readFileSync(join(copy, 'components.json'), 'utf8'));
  config.registries = { '@halftone-web': `http://127.0.0.1:${port}/{name}.json` };
  writeFileSync(join(copy, 'components.json'), JSON.stringify(config, null, 2));

  const { items } = JSON.parse(readFileSync(join(dist, 'registry.json'), 'utf8'));
  const names = items.filter((i) => i.type !== 'registry:theme').map((i) => `@halftone-web/${i.name}`);
  // Async on purpose: the registry server above runs in this process, so a sync exec would deadlock.
  const run = async (args) => {
    const child = promisify(execFile)('npx', ['-y', SHADCN, 'add', ...names, '--dry-run', ...args], { cwd: copy, maxBuffer: 1 << 26 });
    child.child.stdin.end(); // shadcn waits on an open stdin
    return (await child).stdout;
  };

  const summary = await run([]);
  const overwrites = [...summary.matchAll(/~ (\S+)\s+overwrite/g)].map((m) => m[1]);
  const added = [...summary.matchAll(/\+ (\S+)\s+create/g)].map((m) => m[1]);
  if (added.length) {
    failed = true;
    console.error(`registry:roundtrip: items would create files the kit does not have:\n  ${added.join('\n  ')}`);
  }
  for (const file of overwrites) {
    const diff = await run(['--diff', file]);
    // shadcn strips a file's leading comment block on install; any other difference is a real change.
    const local = readFileSync(join(copy, file), 'utf8').split('\n');
    const firstCode = local.findIndex((l) => l.trim() && !/^\s*(\/\/|\/\*|\*)/.test(l));
    // Compared as collapsed text: shadcn's diff output can join two source lines into one.
    const squash = (t) => t.replace(/\s+/g, ' ').trim();
    const leading = squash(local.slice(0, firstCode === -1 ? 0 : firstCode).join(' '));
    const changed = diff
      .split('\n')
      .map((l) => l.replace(/^[│\s]*/, ''))
      .filter((l) => /^[-+](?![-+])/.test(l))
      .filter((l) => !(l.startsWith('-') && leading.includes(squash(l.slice(1)))));
    if (changed.length) {
      failed = true;
      console.error(`registry:roundtrip: ${file} differs after install:\n${changed.map((l) => `  ${l}`).join('\n')}`);
    }
  }
  if (!failed) {
    const files = summary.match(/Files \((\d+)\)/)?.[1] ?? '?';
    console.log(`registry:roundtrip: ${names.length} items, ${files} files reinstall identically (${overwrites.length} differ only by their leading comment, which shadcn strips)`);
  }
} finally {
  server.close();
  rmSync(copy, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
