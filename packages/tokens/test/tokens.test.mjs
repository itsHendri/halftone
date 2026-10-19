// npm test -w packages/tokens — the token build's guarantees, independent of any app's brand.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { contrast, hexToOklch, hexToOklchParts, oklchPartsToHex } from '../lib/color.mjs';
import { checkContrast, contrastFailures, textOnTintLimits } from '../lib/contrast.mjs';
import { scanTintText } from '../lib/scan.mjs';
import { group, loadTokens, radiusCalc } from '../lib/resolve.mjs';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(pkg, 'cli.mjs');
const fixture = join(pkg, 'test/fixtures/tokens.json');
const ctx = await loadTokens(fixture);

const temps = [];
after(() => temps.forEach((t) => rmSync(t, { recursive: true, force: true })));

/** A throwaway app root with the fixture tokens and a config that asks for every target. */
function appRoot(tokens = JSON.parse(readFileSync(fixture, 'utf8'))) {
  const root = mkdtempSync(join(tmpdir(), 'halftone-tokens-'));
  temps.push(root);
  cpSync(join(pkg, 'test/fixtures'), join(root, 'tokens'), { recursive: true });
  writeFileSync(join(root, 'tokens/tokens.json'), JSON.stringify(tokens));
  writeFileSync(
    join(root, 'tokens/tokens.config.json'),
    JSON.stringify({
      source: 'tokens/tokens.json',
      targets: {
        nativewind3: { css: 'global.css', tailwind: 'tokens/generated/tailwind.theme.js' },
        'ts-theme': { out: 'lib/theme.ts', navTheme: 'expo-router/react-navigation' },
        figma: { out: 'tokens/generated/figma-theme.mjs' },
        'shadcn-web': { out: 'tokens/generated/web.css' },
        'registry-theme': { out: 'tokens/generated/theme.registry.json' },
        'design-md': { out: 'DESIGN.md' },
        llms: { out: 'tokens/generated/llms-tokens.md' },
      },
    })
  );
  return root;
}

const runCli = (args, opts) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', ...opts });

test('oklch round-trips every token colour to the same 8-bit hex', () => {
  for (const c of ctx.colors) {
    for (const hex of [c.light, c.dark]) {
      const [L, C, H] = hexToOklch(hex).slice(6, -1).split(' ').map(Number);
      assert.equal(oklchPartsToHex([L, C, H]), hex, `${c.name}: ${hex}`);
    }
  }
});

test('oklch round-trips the sRGB corners and a deterministic sweep', () => {
  for (let n = 0; n < 0x1000000; n += 0x10101 * 7 + 13) {
    const hex = '#' + n.toString(16).padStart(6, '0');
    assert.doesNotThrow(() => hexToOklch(hex), hex);
  }
  for (const hex of ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#07f3ea']) {
    assert.equal(oklchPartsToHex(hexToOklchParts(hex)), hex);
  }
});

test('with the default base, every rounded-* class equals its primitive', () => {
  const prim = Object.fromEntries(group(ctx.prim, ['radius']).map((t) => [t.key, t.value]));
  for (const { name, scale } of ctx.radius.steps) {
    assert.ok(Math.abs(ctx.radius.base * scale - prim[name]) < 0.01, `rounded-${name}`);
  }
  assert.equal(radiusCalc(1), 'var(--radius)');
  assert.equal(radiusCalc(0.6), 'calc(var(--radius) * 0.6)');
});

test('the fixture palette passes the contrast gate', () => {
  assert.deepEqual(checkContrast(ctx.colors), []);
});

test('the gate rejects white text on an amber fill and amber ink on white', () => {
  const failures = contrastFailures(
    { background: '#ffffff', card: '#ffffff', foreground: '#09090b', warning: '#f59e0b', 'warning-foreground': '#ffffff' },
    'light'
  );
  assert.ok(failures.some((f) => f.includes('warning-foreground on warning')));
  assert.ok(failures.some((f) => f.includes('text-warning on background')));
  assert.ok(contrast('#000000', '#ffffff') > 20);
});

test('text-on-tint limits: how strong a tone\'s own tint can be under its text', () => {
  const colors = [
    { name: 'background', light: '#ffffff', dark: '#09090b' },
    { name: 'primary', light: '#1d4ed8', dark: '#60a5fa' }, // dark enough to carry text on light tints
    { name: 'destructive', light: '#dc2626', dark: '#ef4444' }, // 4.83:1 on white, 4.47:1 on /5
  ];
  const limits = textOnTintLimits(colors);
  assert.ok(limits.primary >= 0.15, `primary ${limits.primary}`);
  assert.equal(limits.destructive, 0);
});

test('the source scan flags tone text on a tint the palette cannot carry', () => {
  const root = mkdtempSync(join(tmpdir(), 'halftone-tokens-scan-'));
  temps.push(root);
  const write = (name, body) => {
    const file = join(root, 'components', name);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
  };
  write('bad.tsx', `export const A = () => <span className="bg-destructive/15 text-destructive">Overdue</span>;\n`);
  write('fine.tsx', [
    `export const B = () => <span className="bg-destructive/15 text-foreground">Overdue</span>;`,
    `export const C = () => <a className="text-primary hover:bg-primary/20">Link</a>;`,
    `// halftone-tokens-ignore tint-text: icon only`,
    `export const D = () => <span className="bg-success/15 text-success"><Check /></span>;`,
  ].join('\n'));
  const problems = scanTintText(root, ['components'], { primary: 0.05, success: 0.05, warning: 0.05, info: 0.15, destructive: 0 });
  assert.equal(problems.length, 1, problems.join('\n'));
  assert.match(problems[0], /bad\.tsx:1 {2}text-destructive on bg-destructive\/15 \(allowed: never\)/);
});

/** An app whose config scans components/, with one class string the palette can't carry. */
const flaggedScan = () => {
  const root = appRoot();
  const config = JSON.parse(readFileSync(join(root, 'tokens/tokens.config.json'), 'utf8'));
  writeFileSync(join(root, 'tokens/tokens.config.json'), JSON.stringify({ ...config, scan: ['components'] }));
  mkdirSync(join(root, 'components'), { recursive: true });
  writeFileSync(join(root, 'components/badge.tsx'), `export const S = () => <b className="bg-destructive/20 text-destructive">Late</b>;\n`);
  return root;
};

test('the scan warns on a flagged class string by default', () => {
  const build = runCli(['build', '--root', flaggedScan()], withoutStrict());
  assert.equal(build.status, 0, build.stderr);
  assert.match(build.stderr, /WARNING/);
  assert.match(build.stderr, /components\/badge\.tsx:1/);
});

test('the scan fails on a flagged class string with --strict', () => {
  const build = runCli(['build', '--root', flaggedScan(), '--strict'], withoutStrict());
  assert.equal(build.status, 1);
  assert.match(build.stderr, /components\/badge\.tsx:1/);
  assert.match(build.stderr, /This palette allows:/);
});

test('build writes every target, then check passes', () => {
  const root = appRoot();
  const build = runCli(['build', '--root', root]);
  assert.equal(build.status, 0, build.stderr);
  for (const f of ['global.css', 'lib/theme.ts', 'tokens/generated/web.css', 'DESIGN.md', 'tokens/generated/theme.registry.json']) {
    assert.ok(existsSync(join(root, f)), f);
  }
  assert.match(readFileSync(join(root, 'tokens/generated/web.css'), 'utf8'), /@theme inline/);
  const check = runCli(['check', '--root', root]);
  assert.equal(check.status, 0, check.stderr);
});

test('check fails when a generated file is stale', () => {
  const root = appRoot();
  runCli(['build', '--root', root]);
  writeFileSync(join(root, 'global.css'), '/* edited by hand */');
  const check = runCli(['check', '--root', root]);
  assert.equal(check.status, 1);
  assert.match(check.stderr, /global\.css/);
});

/** A palette whose primary-foreground fails on primary in light mode. */
const belowAA = () => {
  const tokens = JSON.parse(readFileSync(fixture, 'utf8'));
  tokens.semantic.color['primary-foreground'].$value.light = '#93c5fd';
  return appRoot(tokens);
};
const withoutStrict = () => {
  const env = { ...process.env };
  delete env.HALFTONE_STRICT;
  return { env };
};

test('build --strict refuses a palette below AA and writes nothing', () => {
  const root = belowAA();
  const build = runCli(['build', '--root', root, '--strict'], withoutStrict());
  assert.equal(build.status, 1);
  assert.match(build.stderr, /FAILED/);
  assert.match(build.stderr, /primary-foreground on primary/);
  assert.ok(!existsSync(join(root, 'global.css')));
});

test('HALFTONE_STRICT=1 refuses a palette below AA, like --strict', () => {
  const root = belowAA();
  const build = runCli(['build', '--root', root], { env: { ...process.env, HALFTONE_STRICT: '1' } });
  assert.equal(build.status, 1);
  assert.ok(!existsSync(join(root, 'global.css')));
});

test('build warns on a palette below AA, writes every target and names the pairings', () => {
  const root = belowAA();
  const build = runCli(['build', '--root', root], withoutStrict());
  assert.equal(build.status, 0, build.stderr);
  assert.match(build.stderr, /WARNING/);
  assert.match(build.stderr, /primary-foreground on primary/);
  assert.match(build.stdout, /1 contrast warning\(s\), run with --strict to fail/);
  assert.ok(existsSync(join(root, 'global.css')));
  const design = readFileSync(join(root, 'DESIGN.md'), 'utf8');
  assert.match(design, /1 pairing\(s\) in this palette fall below WCAG AA/);
  assert.match(design, /primary-foreground on primary/);
});

test('check without --strict passes on a below-AA palette whose outputs are current', () => {
  const root = belowAA();
  runCli(['build', '--root', root], withoutStrict());
  const check = runCli(['check', '--root', root], withoutStrict());
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stderr, /WARNING/);
});

test('an unknown flag is ignored', () => {
  const root = appRoot();
  const build = runCli(['build', '--root', root, '--no-such-flag'], withoutStrict());
  assert.equal(build.status, 0, build.stderr);
});

test('runs through a symlinked bin, the way npm installs it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'halftone-tokens-bin-'));
  temps.push(dir);
  symlinkSync(cli, join(dir, 'halftone-tokens'));
  const version = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')).version;
  assert.equal(execFileSync(process.execPath, [join(dir, 'halftone-tokens'), '--version'], { encoding: 'utf8' }).trim(), version);
});
