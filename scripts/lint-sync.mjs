#!/usr/bin/env node
/**
 * One set of guardrails across the kits: the halftone/* lint rules and the lint-on-edit hook live in
 * apps/mobile; apps/web keeps copies so it stays self-contained when copied out of the monorepo. The two kits
 * differ only in the options their eslint config passes.
 *
 *   npm run lint:sync            copy them to apps/web
 *   npm run lint:sync -- --check exit 1 if any copy differs (CI)
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['eslint/halftone.mjs', 'eslint/halftone.test.mjs', '.claude/hooks/lint-edited.mjs'];
const FROM = 'apps/mobile';
const TO = ['apps/web'];
const check = process.argv.includes('--check');

const stale = TO.flatMap((app) =>
  FILES.filter((f) => !existsSync(join(root, app, f)) || readFileSync(join(root, app, f), 'utf8') !== readFileSync(join(root, FROM, f), 'utf8')).map(
    (f) => [app, f]
  )
);
if (check) {
  if (stale.length) {
    console.error(`lint:sync --check: out of step with ${FROM}:\n${stale.map(([a, f]) => `  ${a}/${f}`).join('\n')}\nRun \`npm run lint:sync\`.`);
    process.exit(1);
  }
  console.log(`lint:sync --check: ${FILES.length * TO.length} copies match ${FROM}`);
} else {
  for (const [app, f] of stale) {
    mkdirSync(dirname(join(root, app, f)), { recursive: true });
    copyFileSync(join(root, FROM, f), join(root, app, f));
  }
  console.log(`lint:sync → ${stale.length ? stale.map(([a, f]) => `${a}/${f}`).join(', ') : 'already in step'}`);
}
