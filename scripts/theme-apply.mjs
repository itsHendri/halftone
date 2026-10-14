#!/usr/bin/env node
/**
 * Apply a theme to every kit in the monorepo: `npm run theme:apply -- <code|preset> [--force] [--dry-run]`.
 *
 *   1. halftone-tokens theme apply in apps/mobile (the source tokens.json), which rebuilds the mobile tokens
 *   2. tokens:sync: copy it to apps/web and rebuild there
 *   3. rebuild the docs site's tokens (it reads apps/mobile/tokens/tokens.json directly)
 *
 * Outside the monorepo, an app runs `npx halftone-tokens theme apply <code>` itself.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const run = (cmd, argv) => {
  const r = spawnSync(cmd, argv, { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run('npm', ['exec', '-w', 'apps/mobile', '--', 'halftone-tokens', 'theme', 'apply', ...args]);
if (args.includes('--dry-run')) process.exit(0);
run('npm', ['run', 'tokens:sync']);
run('npm', ['exec', '-w', 'apps/docs', '--', 'halftone-tokens', 'build']);
console.log('\nTheme applied to mobile, web and docs. Review with `git diff`, then run `npm run check`.');
