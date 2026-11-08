// npm test -w packages/tokens — `halftone-tokens init` and the plain-web fonts output.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { detectPlatform, overridingExtends, overridingRules, TEMPLATE, wirePreset, wireStylesheet } from '../lib/init.mjs';

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

/** A throwaway Expo app with NativeWind, set up the way react-native-reusables does it. */
function expoApp({ config = "module.exports = {\n  darkMode: 'class',\n  presets: [require('nativewind/preset')],\n  theme: { extend: { colors: { background: 'hsl(var(--background))' } } },\n};\n", paths = './*' } = {}) {
  const root = app('global.css', '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer base {\n  :root {\n    --background: 0 0% 100%;\n  }\n  .dark:root {\n    --background: 0 0% 4%;\n  }\n}\n');
  writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: { expo: '~57.0.0', 'expo-router': '~6.0.0', nativewind: '^4.2.0' } }));
  writeFileSync(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { paths: { '@/*': [paths] } } }));
  if (config) writeFileSync(join(root, 'tailwind.config.js'), config);
  return root;
}

test('detectPlatform: Expo with NativeWind is the native kit; anything else is web', () => {
  assert.equal(detectPlatform({ dependencies: { expo: '1', nativewind: '4' } }), 'expo');
  assert.equal(detectPlatform({ dependencies: { expo: '1' } }), 'web');
  assert.equal(detectPlatform({ dependencies: { next: '16' } }), 'web');
  assert.equal(detectPlatform(undefined), 'web');
});

test('wirePreset adds the preset next to nativewind/preset, once; another shape is left alone', () => {
  const config = "module.exports = { presets: [require('nativewind/preset')], theme: {} };";
  const wired = wirePreset(config, './tokens/generated/tailwind.preset');
  assert.match(wired, /presets: \[require\('nativewind\/preset'\), require\('\.\/tokens\/generated\/tailwind\.preset'\)\]/);
  assert.equal(wirePreset(wired, './tokens/generated/tailwind.preset'), wired);
  assert.equal(wirePreset('module.exports = { presets: [base, require("nativewind/preset")] };', './x'), null);
  assert.deepEqual(overridingExtends("theme: { extend: { colors: {}, borderRadius: {}, keyframes: {} } }"), ['colors', 'borderRadius']);
  // A height inside keyframes is an animation, not the theme's heights.
  assert.deepEqual(overridingExtends("theme: { extend: { keyframes: { up: { from: { height: '0' } } }, 'spacing': { 1: '4px' } } }"), ['spacing']);
});

test('init in an Expo app: tokens.css imported first, the preset wired, lib/ where @/ points, overrides named', () => {
  const root = expoApp();
  try {
    const r = run(['init', '--root', root]);
    assert.equal(r.status, 0, r.stderr);
    const config = JSON.parse(readFileSync(join(root, 'tokens/tokens.config.json'), 'utf8'));
    assert.deepEqual(config.targets, {
      nativewind3: { css: 'tokens/generated/tokens.css', partial: true, preset: 'tokens/generated/tailwind.preset.js' },
      'ts-theme': { out: 'lib/theme.ts', navTheme: 'expo-router/react-navigation' },
      fonts: { platform: 'expo', out: 'lib/fonts.ts' },
    });
    const tokensCss = readFileSync(join(root, 'tokens/generated/tokens.css'), 'utf8');
    assert.doesNotMatch(tokensCss, /^@tailwind/m);
    assert.match(tokensCss, /--button-h-md:/);
    const preset = readFileSync(join(root, 'tokens/generated/tailwind.preset.js'), 'utf8');
    assert.match(preset, /require\('nativewind\/theme'\)/);
    assert.match(preset, /"button-md": "var\(--button-h-md\)"/);
    assert.ok(existsSync(join(root, 'lib/theme.ts')) && existsSync(join(root, 'lib/fonts.ts')));
    assert.match(readFileSync(join(root, 'global.css'), 'utf8'), /^@import '\.\/tokens\/generated\/tokens\.css';\n@tailwind base;/);
    assert.match(readFileSync(join(root, 'tailwind.config.js'), 'utf8'), /require\('\.\/tokens\/generated\/tailwind\.preset'\)/);
    assert.match(r.stdout, /line 7: :root/);
    assert.match(r.stdout, /line 10: \.dark:root/);
    assert.match(r.stdout, /extends colors itself/);
    assert.match(r.stdout, /run `npx halftone-tokens build`/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('init in an Expo app with src/ and an unusual tailwind config prints the preset line', () => {
  const root = expoApp({ config: 'module.exports = require("./base.config");\n', paths: './src/*' });
  try {
    const r = run(['init', '--root', root, '--theme', 'editorial', '--no-install']);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(root, 'src/lib/theme.ts')));
    assert.match(readFileSync(join(root, 'src/lib/fonts.ts'), 'utf8'), /@expo-google-fonts\/fraunces/);
    assert.match(r.stdout, /npx expo install @expo-google-fonts\/fraunces/);
    assert.match(r.stdout, /Add the kit's preset to tailwind\.config\.js/);
    assert.equal(readFileSync(join(root, 'tailwind.config.js'), 'utf8'), 'module.exports = require("./base.config");\n');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('--platform web in an Expo app takes the web path; an unknown platform is refused', () => {
  const root = expoApp();
  try {
    writeFileSync(join(root, 'src.css'), "@import 'tailwindcss';\n");
    const r = run(['init', '--root', root, '--platform', 'web', '--css', 'src.css']);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(root, 'tokens.css')));
    const bad = run(['init', '--root', root, '--platform', 'svelte', '--force']);
    assert.equal(bad.status, 2);
    assert.match(bad.stderr, /--platform is web or expo/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
