#!/usr/bin/env node
/**
 * One brand across the kits: apps/mobile/tokens/tokens.json is the source; every other app keeps a copy so
 * it stays self-contained when copied out of the monorepo, and @halftone-ds/tokens ships one as the brand
 * `halftone-tokens init` starts an app with.
 *
 *   npm run tokens:sync            copy it to the other apps and rebuild their tokens
 *   npm run tokens:sync -- --check exit 1 if any copy differs (CI)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'apps/mobile/tokens/tokens.json';
const COPIES = ['apps/web/tokens/tokens.json', 'packages/tokens/templates/tokens.json'];
const check = process.argv.includes('--check');

const source = readFileSync(join(root, SOURCE), 'utf8');
const stale = COPIES.filter((c) => readFileSync(join(root, c), 'utf8') !== source);
if (check) {
  if (stale.length) {
    console.error(`tokens:sync --check: out of step with ${SOURCE}:\n${stale.map((c) => `  ${c}`).join('\n')}\nRun \`npm run tokens:sync\`.`);
    process.exit(1);
  }
  console.log(`tokens:sync --check: ${COPIES.length} copies match ${SOURCE}`);
} else {
  for (const c of stale) {
    writeFileSync(join(root, c), source);
    // An app rebuilds its outputs; the package's template is just the file.
    if (c.startsWith('apps/')) execFileSync('npm', ['run', 'tokens:build', '-w', c.split('/tokens/')[0]], { cwd: root, stdio: 'inherit' });
  }
  console.log(`tokens:sync → ${stale.length ? stale.join(', ') : 'already in step'}`);
}
