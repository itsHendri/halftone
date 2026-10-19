#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook: after an agent edits a screen or component in this kit, lint that file and
 * hand any error back to the agent (exit 2), so it fixes a raw colour or an unregistered component while
 * it is still writing. Wired in .claude/settings.json (and the monorepo root's). Lints only files under
 * app/ and components/ of this kit; never blocks on its own failure (a missing eslint, a crash: exit 0).
 *
 * SOURCE: apps/mobile/.claude/hooks/lint-edited.mjs; apps/web has a copy (`npm run lint:sync` at the monorepo root).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}
const file = input.tool_input?.file_path;
if (typeof file !== 'string' || !existsSync(file)) process.exit(0);
const rel = relative(app, resolve(file)).split(sep).join('/');
if (rel.startsWith('..') || !/^(app|components)\//.test(rel) || !/\.[cm]?[jt]sx?$/.test(rel)) process.exit(0);

let bin;
try {
  const pkgPath = createRequire(join(app, 'package.json')).resolve('eslint/package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  bin = join(dirname(pkgPath), typeof pkg.bin === 'string' ? pkg.bin : pkg.bin.eslint);
} catch {
  process.exit(0);
}

const lint = spawnSync(process.execPath, [bin, '--quiet', '--no-warn-ignored', rel], { cwd: app, encoding: 'utf8', timeout: 55_000 });
if (lint.status === 1) {
  process.stderr.write(
    `Lint errors in ${rel}. Fix them before going on: the halftone/* rules are the design system ` +
      `(DESIGN_SYSTEM.md); a real exception gets \`// eslint-disable-next-line <rule> -- <reason>\`.\n${lint.stdout}`
  );
  process.exit(2);
}
process.exit(0);
