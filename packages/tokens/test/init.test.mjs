// npm test -w packages/tokens — `halftone-tokens init` and the plain-web fonts output.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { overridingRules, TEMPLATE, wireStylesheet } from '../lib/init.mjs';

const cli = join(dirname(fileURLToPath(import.meta.url)), '..', 'cli.mjs');
const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

/** A throwaway app folder with one stylesheet. */
function app(css = 'src/index.css', contents = "@import 'tailwindcss';\n") {
  const root = mkdtempSync(join(tmpdir(), 'ht-init-'));
  if (css) {
    mkdirSync(join(root, dirname(css)), { recursive: true });
    writeFileSync(join(root, css), contents);
  }
  return root;
}

test('wireStylesheet: tokens.css after tailwindcss and tw-animate-css, fonts.css first, nothing twice', () => {
  const { css, added } = wireStylesheet("@import 'tailwindcss';\n@import 'tw-animate-css';\n\n.x { color: red; }\n", { tokens: './tokens.css', fonts: './fonts.css' });
  assert.deepEqual(css.split('\n').slice(0, 4), ["@import './fonts.css';", "@import 'tailwindcss';", "@import 'tw-animate-css';", "@import './tokens.css';"]);
  assert.deepEqual(added, ['./tokens.css', './fonts.css']);
  assert.deepEqual(wireStylesheet(css, { tokens: './tokens.css', fonts: './fonts.css' }).added, []);
});

test('overridingRules names the rules tokens.css also defines', () => {
  const css = '@import "tailwindcss";\n:root {\n}\n.dark {\n}\n@theme inline {\n}\nbody { margin: 0 }\n.card { }\n';
  assert.deepEqual(
    overridingRules(css).map((o) => `${o.line} ${o.name}`),
    ['2 :root', '4 .dark', '6 @theme', '8 body']
  );
});

test('init in a Vite app: tokens beside src/index.css, stylesheet wired, overrides named', () => {
  const root = app('src/index.css', '@import "tailwindcss";\n:root {\n  --background: #fff;\n}\n');
  try {
    const r = run(['init', '--root', root]);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'), readFileSync(TEMPLATE, 'utf8'));
    const config = JSON.parse(readFileSync(join(root, 'tokens/tokens.config.json'), 'utf8'));
    assert.deepEqual(config.targets, { 'shadcn-web': { out: 'src/tokens.css' }, fonts: { platform: 'web', out: 'src/fonts.css' } });
    assert.match(readFileSync(join(root, 'src/tokens.css'), 'utf8'), /--button-h-md/);
    const css = readFileSync(join(root, 'src/index.css'), 'utf8');
    assert.match(css, /^@import '\.\/fonts\.css';\n@import "tailwindcss";\n@import '\.\/tokens\.css';/);
    assert.match(r.stdout, /line 4: :root/);
    assert.match(r.stdout, /tw-animate-css/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('init in a Next.js app finds app/globals.css; --theme applies a theme and loads its fonts', () => {
  const root = app('app/globals.css', "@import 'tailwindcss';\n@import 'tw-animate-css';\n");
  try {
    const r = run(['init', '--root', root, '--theme', 'editorial']);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(root, 'app/tokens.css')));
    const fonts = readFileSync(join(root, 'app/fonts.css'), 'utf8');
    assert.match(fonts, /@import url\('https:\/\/fonts\.googleapis\.com\/css2\?[^']*family=Fraunces/);
    assert.match(fonts, /--kit-font-heading: 'Fraunces', serif;/);
    assert.doesNotMatch(r.stdout, /tw-animate-css/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('init refuses to replace existing tokens without --force, and says what to do without a stylesheet', () => {
  const root = app();
  try {
    assert.equal(run(['init', '--root', root]).status, 0);
    const again = run(['init', '--root', root]);
    assert.equal(again.status, 2);
    assert.match(again.stderr, /already set up .*--force/);
    assert.equal(run(['init', '--root', root, '--force']).status, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  const bare = app(null);
  try {
    const r = run(['init', '--root', bare]);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /no stylesheet found .*--css/);
  } finally {
    rmSync(bare, { recursive: true, force: true });
  }
});

test('init --css takes any stylesheet path', () => {
  const root = app('client/styles/main.css');
  try {
    const r = run(['init', '--root', root, '--css', 'client/styles/main.css']);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(root, 'client/styles/tokens.css')));
    assert.match(readFileSync(join(root, 'client/styles/main.css'), 'utf8'), /@import '\.\/tokens\.css';/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the fonts target refuses an unknown platform', () => {
  const root = app();
  try {
    mkdirSync(join(root, 'tokens'));
    writeFileSync(join(root, 'tokens/tokens.json'), readFileSync(TEMPLATE, 'utf8'));
    writeFileSync(join(root, 'tokens/tokens.config.json'), JSON.stringify({ targets: { fonts: { platform: 'svelte', out: 'x' } } }));
    const r = run(['build', '--root', root]);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /unknown platform "svelte"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
