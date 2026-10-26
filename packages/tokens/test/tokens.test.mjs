// npm test -w packages/tokens — the token build's guarantees, independent of any app's brand.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { contrast, hexToOklch, hexToOklchParts, oklchPartsToHex } from '../lib/color.mjs';
import { checkContrast, contrastFailures, textOnSubtle, textOnTintLimits } from '../lib/contrast.mjs';
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

test('the source scan flags tone text on a -subtle tint the palette cannot carry', () => {
  const root = mkdtempSync(join(tmpdir(), 'halftone-tokens-scan-'));
  temps.push(root);
  mkdirSync(join(root, 'components'), { recursive: true });
  writeFileSync(
    join(root, 'components', 'tints.tsx'),
    [
      `export const A = () => <span className="bg-destructive-subtle text-destructive">Overdue</span>;`,
      `export const B = () => <span className="bg-success-subtle text-success">Paid</span>;`,
      `export const C = () => <span className="bg-destructive-subtle text-foreground">Overdue</span>;`,
    ].join('\n')
  );
  const subtle = textOnSubtle([
    { name: 'destructive', light: '#dc2626', dark: '#ef4444' },
    { name: 'destructive-subtle', light: '#fee2e2', dark: '#450a0a' },
    { name: 'success', light: '#15803d', dark: '#4ade80' },
    { name: 'success-subtle', light: '#dcfce7', dark: '#052e16' },
  ]);
  assert.deepEqual(subtle, { success: true, destructive: false });
  const problems = scanTintText(root, ['components'], {}, subtle);
  assert.deepEqual(problems, ['  components/tints.tsx:1  text-destructive on bg-destructive-subtle (allowed: text-foreground on it)']);
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
  // The pale label fails on the primary and on its pressed fill.
  assert.match(design, /2 pairing\(s\) in this palette fall below WCAG AA/);
  assert.match(build.stderr, /primary-foreground on primary-pressed/);
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

// ---- theme commands: shadcn codes, decode, resolve, shadcn ------------------------------------------------

test('theme decode explains a shadcn preset code and the Halftone theme it maps to', () => {
  const root = appRoot();
  const r = runCli(['theme', 'decode', 'b5owWMfJ8l', '--json', '--root', root]);
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.kind, 'shadcn');
  assert.equal(out.shadcn.theme, 'mauve');
  assert.match(out.code, /^ht[12]-/);
  assert.ok(out.notes.some((n) => /Oxanium/.test(n)));
});

test('theme apply takes a shadcn code and lists what it approximated', () => {
  const root = appRoot();
  const r = runCli(['theme', 'apply', 'b5owWMfJ8l', '--dry-run', '--root', root]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /From shadcn preset b5owWMfJ8l/);
  assert.match(r.stdout, /--dry-run: nothing written/);
});

test('a preset name that looks like a shadcn code stays the Halftone preset', () => {
  const root = appRoot();
  const r = runCli(['theme', 'decode', 'bold', '--json', '--root', root]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).preset, 'bold');
  const enc = runCli(['theme', 'encode', 'bold', '--root', root]);
  assert.equal(enc.status, 0, enc.stderr);
  assert.equal(enc.stderr, '');
});

test('theme resolve prints the recorded code, and fails once tokens.json is edited by hand', () => {
  const unrecorded = JSON.parse(readFileSync(fixture, 'utf8'));
  delete unrecorded.$extensions;
  const root = appRoot(unrecorded);
  const none = runCli(['theme', 'resolve', '--root', root]);
  assert.equal(none.status, 1);
  assert.match(none.stderr, /no theme recorded/);
  const applied = runCli(['theme', 'apply', 'editorial', '--force', '--root', root], { env: { ...process.env, HALFTONE_STRICT: '' } });
  assert.equal(applied.status, 0, applied.stderr);
  const r = runCli(['theme', 'resolve', '--root', root]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout.trim(), /^ht[123]-[0-9A-Z]+$/);
  const tokens = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'));
  tokens.semantic.color.primary.$value.light = '#000000';
  writeFileSync(join(root, 'tokens/tokens.json'), JSON.stringify(tokens));
  const drifted = runCli(['theme', 'resolve', '--root', root]);
  assert.equal(drifted.status, 1);
  assert.match(drifted.stderr, /edited by hand/);
});

test('theme shadcn writes a registry:theme item for a preset', () => {
  const root = appRoot();
  const r = runCli(['theme', 'shadcn', 'editorial', '--out', 'halftone-theme.json', '--fonts-url', 'https://example.com/r', '--root', root]);
  assert.equal(r.status, 0, r.stderr);
  const item = JSON.parse(readFileSync(join(root, 'halftone-theme.json'), 'utf8'));
  assert.equal(item.type, 'registry:theme');
  assert.equal(item.name, 'halftone-editorial');
  assert.ok(item.registryDependencies.every((d) => d.startsWith('https://example.com/r/font/')));
  assert.match(item.cssVars.light.primary, /^oklch\(/);
});

test('token usage: which components draw which tokens, from their class strings', async () => {
  const { usageIn, tokenUsage } = await import('../lib/usage.mjs');
  const colours = new Set(['primary', 'primary-foreground', 'muted-foreground', 'border', 'input', 'trendy-green']);
  const keys = usageIn(
    `const a = cn('bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm border', 'dark:text-muted-foreground/80 rounded-t-lg shadow-lg');
     <Text variant="h2" className="type-h3 font-heading" />; const c = palette.mutedForeground; style={{ color: 'var(--trendy-green)' }};
     cn('bg-red-500 text-white border-input');`,
    colours
  );
  assert.deepEqual([...keys].sort(), [
    'border.width',
    'color.input',
    'color.muted-foreground',
    'color.primary',
    'color.primary-foreground',
    'color.trendy-green',
    'font.heading',
    'radius.lg',
    'radius.md',
    'shadow.1',
    'shadow.3',
    'type.h2',
    'type.h3',
  ]);
  const root = mkdtempSync(join(tmpdir(), 'halftone-usage-'));
  try {
    mkdirSync(join(root, 'components'));
    writeFileSync(join(root, 'components/button.tsx'), `cn('bg-primary rounded-md')`);
    writeFileSync(join(root, 'components/badge.tsx'), `cn('bg-primary/15 text-primary')`);
    const usage = tokenUsage({
      root,
      components: [
        { id: 'button', files: ['components/button.tsx'] },
        { id: 'badge', files: ['components/badge.tsx', 'components/missing.tsx'] },
      ],
      tokens: { semantic: { color: { primary: {} } }, extra: { color: { sunset: { 500: { $value: '#f70' } } } } },
    });
    assert.deepEqual(usage, { 'color.primary': ['badge', 'button'], 'radius.md': ['button'] });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
