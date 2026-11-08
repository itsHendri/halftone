// npm test -w packages/tokens — `halftone-tokens doctor`. The registry comparison runs for real in CI's react-app job.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { aliasDir, normalizeSource, parseJsonc } from '../lib/doctor.mjs';

const cli = join(dirname(fileURLToPath(import.meta.url)), '..', 'cli.mjs');
const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
const doctor = (root) => {
  const r = run(['doctor', '--root', root, '--offline', '--json']);
  return { status: r.status, ...JSON.parse(r.stdout) };
};
const messages = (report, level) => report.results.filter((r) => r.level === level).map((r) => r.message).join('\n');

/** A Vite app shaped like install.md path D: package.json, tsconfig with @/*, vite alias, components.json, stylesheet. */
function viteApp() {
  const root = mkdtempSync(join(tmpdir(), 'ht-doctor-'));
  const write = (path, contents) => {
    mkdirSync(join(root, dirname(path)), { recursive: true });
    writeFileSync(join(root, path), contents);
  };
  write('package.json', JSON.stringify({ name: 'app', dependencies: { react: '19.2.3' } }));
  // A Vite template's tsconfig: comments, trailing commas, and "@/*", which isn't a comment.
  write('tsconfig.json', '{\n  // paths\n  "compilerOptions": { /* Bundler mode */ "paths": { "@/*": ["./src/*"], }, },\n}\n');
  write('vite.config.ts', "export default { resolve: { alias: { '@': '/src' } } };\n");
  write('components.json', JSON.stringify({ style: 'new-york', tailwind: { css: 'src/index.css' }, aliases: { ui: '@/components/ui', lib: '@/lib', utils: '@/lib/utils' }, registries: { '@halftone-web': 'http://127.0.0.1:9/{name}.json' } }));
  write('src/index.css', "@import 'tailwindcss';\n@import 'tw-animate-css';\n");
  write('src/main.tsx', "document.documentElement.classList.toggle('dark', true);\n");
  return { root, write };
}

test('parseJsonc reads tsconfig comments and trailing commas, and keeps "@/*"', () => {
  assert.deepEqual(parseJsonc('{ // x\n "paths": { "@/*": ["./src/*"], /* y */ }, }'), { paths: { '@/*': ['./src/*'] } });
});

test('aliasDir maps an alias through tsconfig paths', () => {
  assert.equal(aliasDir({ '@/*': ['./src/*'] }, '@/components/ui'), 'src/components/ui');
  assert.equal(aliasDir({ '@/*': ['./*'] }, '@/lib'), 'lib');
  assert.equal(aliasDir({ '~/*': ['./app/*'] }, '@/lib'), null);
});

test('normalizeSource ignores what shadcn add rewrites: imports, "use client", whitespace', () => {
  const kit = '"use client"\n\nimport * as React from "react"\nimport { cn } from "cn"\nimport {\n  Button,\n} from "@/registry/new-york-v4/ui/button"\n\nexport function A() {\n  return <Button className={cn("x")} />\n}\n';
  const installed = 'import * as React from "react"\nimport { cn } from "cn"\nimport { Button } from "@/components/ui/button"\n\nexport function A() { return <Button className={cn("x")} /> }\n';
  assert.equal(normalizeSource(kit), normalizeSource(installed));
  assert.notEqual(normalizeSource(installed), normalizeSource(installed.replace('"x"', '"y"')));
});

test('doctor: a Vite app before init names the missing tokens; after init it passes', () => {
  const { root } = viteApp();
  try {
    let report = doctor(root);
    assert.equal(report.status, 1);
    assert.match(messages(report, 'problem'), /tokens aren’t set up/);

    assert.equal(run(['init', '--root', root]).status, 0);
    report = doctor(root);
    assert.equal(report.status, 0, messages(report, 'problem'));
    assert.match(messages(report, 'ok'), /src\/index\.css imports \.\/tokens\.css/);
    assert.match(messages(report, 'ok'), /up to date/);
    assert.equal(messages(report, 'warning'), '');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('doctor names a stale build, a lost import, a Base UI style, an override, a second cn and missing dark mode', () => {
  const { root, write } = viteApp();
  try {
    assert.equal(run(['init', '--root', root]).status, 0);
    const tokens = join(root, 'tokens/tokens.json');
    writeFileSync(tokens, readFileSync(tokens, 'utf8').replace('"radius"', '"radius" ')); // same tokens…
    writeFileSync(join(root, 'src/tokens.css'), '/* hand-edited */\n'); // …but the output no longer matches
    write('src/index.css', "@import './fonts.css';\n@import 'tailwindcss';\n:root { --background: red; }\n");
    write('components.json', JSON.stringify({ style: 'base-nova', tailwind: { css: 'src/index.css' } }));
    write('src/lib/utils.ts', 'import { clsx } from "clsx"\nimport { twMerge } from "tailwind-merge"\nexport function cn(...i) { return twMerge(clsx(i)) }\n');
    write('src/main.tsx', 'export {};\n');

    const report = doctor(root);
    assert.equal(report.status, 1);
    const problems = messages(report, 'problem');
    assert.match(problems, /out of date: src\/tokens\.css/);
    assert.match(problems, /doesn't import \.\/tokens\.css/);
    assert.match(problems, /style "base-nova"/);
    const warnings = messages(report, 'warning');
    assert.match(warnings, /line 3 :root/);
    assert.match(warnings, /src\/lib\/utils\.ts has its own cn/);
    assert.match(warnings, /tw-animate-css/);
    assert.match(warnings, /sets the \.dark class/);
    const fix = report.results.find((r) => /own cn/.test(r.message)).fix;
    assert.match(fix, /export \{ cn \} from 'cn'/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('doctor: aliases that do not resolve are a problem; a re-exported cn is fine', () => {
  const { root, write } = viteApp();
  try {
    assert.equal(run(['init', '--root', root]).status, 0);
    write('tsconfig.json', '{ "compilerOptions": {} }');
    write('src/lib/utils.ts', "export { cn } from 'cn';\nexport const other = 1;\n");
    const report = doctor(root);
    assert.match(messages(report, 'problem'), /doesn't map "@\/components\/ui"/);
    assert.doesNotMatch(messages(report, 'warning'), /own cn/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('doctor in an Expo app checks global.css, the preset and KitThemeProvider', () => {
  const root = mkdtempSync(join(tmpdir(), 'ht-doctor-expo-'));
  const write = (path, contents) => {
    mkdirSync(join(root, dirname(path)), { recursive: true });
    writeFileSync(join(root, path), contents);
  };
  try {
    write('package.json', JSON.stringify({ dependencies: { expo: '~57.0.0', nativewind: '^4.2.0', 'expo-router': '~6.0.0' } }));
    write('tsconfig.json', JSON.stringify({ compilerOptions: { paths: { '@/*': ['./*'] } } }));
    write('global.css', '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
    write('tailwind.config.js', "module.exports = { presets: [require('nativewind/preset')], theme: { extend: {} } };\n");
    assert.equal(run(['init', '--root', root, '--no-install']).status, 0);
    let report = doctor(root);
    assert.equal(report.status, 0, messages(report, 'problem'));
    assert.match(messages(report, 'ok'), /global\.css imports \.\/tokens\/generated\/tokens\.css first/);
    assert.match(messages(report, 'warning'), /KitThemeProvider/);

    write('tailwind.config.js', "module.exports = { presets: [require('nativewind/preset')] };\n");
    write('app/_layout.tsx', "import { KitThemeProvider } from '@/lib/theme-context';\nimport { FONT_ASSETS } from '@/lib/fonts';\n");
    report = doctor(root);
    assert.match(messages(report, 'problem'), /doesn't use the kit's preset/);
    assert.doesNotMatch(messages(report, 'warning'), /KitThemeProvider/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
