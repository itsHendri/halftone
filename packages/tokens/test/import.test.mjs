// npm test -w packages/tokens: `halftone-tokens import`, a brand's own tokens.json into a HalftoneSystem.
// Every fixture is made up. Their shapes follow real brand files (named modes, the brand's own role names, 2025.10
// colour objects, tokens the kits don't draw), but no real brand's tokens belong in this public repo.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { applySystem } from '../lib/theme/index.mjs';
import { fontFamiliesToCheck, normalizeSystem, systemCode, systemFromTokens, systemOverrides, validateSystem } from '../lib/system/index.mjs';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = JSON.parse(readFileSync(join(pkg, 'test/fixtures/halftone-tokens.json'), 'utf8'));
const cli = join(pkg, 'cli.mjs');
const c = (hex) => ({ $value: hex });
const srgb = (hex) => ({ $value: { colorSpace: 'srgb', components: [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255), hex } });

/** Three named sets of colours (none called light or dark), a custom display font, and tokens with no UI slot. */
const HARBOUR = {
  $description: 'Harbour, a made-up brand',
  palette: {
    $type: 'color',
    sand: c('#f4efe6'),
    'sand-dim': c('#e9e1d3'),
    ink: c('#0b3d6e'),
    'ink-deep': c('#082c50'),
    char: c('#161616'),
    'char-raised': c('#222222'),
    rope: c('#b5651d'),
  },
  theme: {
    sand: { $type: 'color', background: c('{palette.sand}'), card: c('{palette.sand-dim}'), foreground: c('{palette.ink}'), brand: c('{palette.ink}'), 'brand-foreground': c('{palette.sand}') },
    ink: { $type: 'color', background: c('{palette.ink}'), card: c('{palette.ink-deep}'), foreground: c('{palette.sand}'), brand: c('{palette.sand}'), 'brand-foreground': c('{palette.ink}') },
    char: { $type: 'color', background: c('{palette.char}'), card: c('{palette.char-raised}'), foreground: c('{palette.sand}'), brand: c('{palette.sand}'), 'brand-foreground': c('{palette.char}') },
  },
  font: { $type: 'fontFamily', display: c(['Harbour Serif', 'Georgia', 'serif']), sans: c(['Lato', 'system-ui', 'sans-serif']), mono: c(['ui-monospace', 'monospace']) },
  space: { $type: 'dimension', '1': c({ value: 0.25, unit: 'rem' }), '2': c({ value: 0.5, unit: 'rem' }) },
  radius: { $type: 'dimension', sm: c({ value: 1, unit: 'px' }), md: c({ value: 2, unit: 'px' }), lg: c({ value: 3, unit: 'px' }) },
  'line-weight': { $type: 'dimension', $value: { value: 3, unit: 'px' } },
  motion: { duration: { $type: 'duration', $value: { value: 500, unit: 'ms' } } },
};

/** Light and dark with the brand's own role names, numbered ramps, 2025.10 colour objects and a see-through scrim. */
const LEDGER = {
  palette: {
    $type: 'color',
    green: { '50': srgb('#eafff6'), '100': srgb('#cdfee8'), '500': srgb('#01c38d'), '600': srgb('#00a377'), '700': srgb('#008262') },
    neutral: { '0': srgb('#ffffff'), '50': srgb('#f4f5f7'), '100': srgb('#edeff1'), '500': srgb('#5f697a'), '800': srgb('#232936'), '900': srgb('#1a1a23') },
    red: { '500': c('#ff274b'), '700': c('#b7283b') },
  },
  theme: {
    light: {
      $type: 'color',
      background: c('{palette.neutral.0}'),
      'background-secondary': c('{palette.neutral.50}'),
      foreground: c('{palette.neutral.900}'),
      'foreground-secondary': c('{palette.neutral.500}'),
      brand: c('{palette.green.500}'),
      'on-brand': c('{palette.neutral.900}'),
      error: c('{palette.red.700}'),
      link: c('{palette.green.700}'),
      scrim: c('#00000066'),
    },
    dark: {
      $type: 'color',
      background: c('{palette.neutral.900}'),
      'background-secondary': c('{palette.neutral.800}'),
      foreground: c('{palette.neutral.0}'),
      'foreground-secondary': c('{palette.neutral.100}'),
      brand: c('{palette.green.500}'),
      'on-brand': c('{palette.neutral.900}'),
      error: c('{palette.red.500}'),
      link: c('{palette.green.500}'),
    },
  },
};

test('named modes: the lightest page is light, the darkest dark, and a third set becomes extras', () => {
  const { system, notes } = systemFromTokens(HARBOUR, { name: 'Harbour', google: ['Lato'] });
  assert.equal(system.roles.background.light, '#f4efe6');
  assert.equal(system.roles.background.dark, '#161616');
  assert.equal(system.roles.card.light, '#e9e1d3');
  assert.equal(system.roles.primary.light, '#0b3d6e', 'brand maps to primary when the file has no primary');
  assert.equal(system.roles['primary-foreground'].light, '#f4efe6');
  assert.equal(system.recipe.brand, '#0b3d6e', 'the brand ramp is seeded from primary');
  const extras = system.extras.color.map((e) => e.name);
  for (const name of ['ink-background', 'ink-card', 'ink-foreground', 'rope']) assert.ok(extras.includes(name), `${name} is an extra`);
  assert.ok(notes.some((n) => n.includes('Light theme: "sand"')));
  assert.ok(notes.some((n) => n.includes('Dark theme: "char"')));
  assert.ok(notes.some((n) => n.includes('"theme.ink" is neither')));
});

test('fonts: a Google family is set, a custom one stays in tokens with a note, the platform font is left alone', () => {
  const { system, notes } = systemFromTokens(HARBOUR, { name: 'Harbour', google: ['Lato'] });
  assert.equal(system.fonts.body, 'Lato');
  assert.equal(system.fonts.heading, 'Lato', 'headings fall back to the body font');
  assert.deepEqual(Object.keys(system.tokens.font), ['$type', 'display']);
  assert.ok(notes.some((n) => n.includes('"Harbour Serif"') && n.includes('stays in tokens')));
  const offline = systemFromTokens(HARBOUR, { name: 'Harbour' });
  assert.deepEqual(offline.system.fonts, {}, 'without knowing Lato is on Google Fonts, nothing is set');
  assert.deepEqual(fontFamiliesToCheck(HARBOUR), ['Harbour Serif', 'Lato']);
});

test('what no slot holds stays under tokens, aliases resolved', () => {
  const { system } = systemFromTokens(HARBOUR, { name: 'Harbour', google: ['Lato'] });
  assert.deepEqual(Object.keys(system.tokens).filter((k) => !k.startsWith('$')), ['font', 'space', 'line-weight', 'motion']);
  assert.deepEqual(system.tokens['line-weight'].$value, { value: 3, unit: 'px' });
  assert.equal(JSON.stringify(system.tokens).includes('{palette.'), false);
  assert.deepEqual(system.radius, { sm: 1, md: 2, lg: 3 });
  assert.deepEqual(systemOverrides(system).filter((p) => p.startsWith('tokens.')), ['tokens.$description', 'tokens.font', 'tokens.space', 'tokens.line-weight', 'tokens.motion']);
  assert.equal(systemCode(system), null, 'a code cannot carry the leftover tokens');
});

test("the brand's own names map to roles, ramps keep their numbered steps, see-through colours are mixed", () => {
  const { system, notes } = systemFromTokens(LEDGER, { name: 'Ledger' });
  assert.equal(system.roles.muted.light, '#f4f5f7', 'background-secondary is the muted surface');
  assert.equal(system.roles['muted-foreground'].dark, '#edeff1');
  assert.equal(system.roles.destructive.light, '#b7283b');
  assert.equal(system.recipe.brand, '#01c38d');
  assert.deepEqual(Object.keys(system.colors.brand.steps), ['50', '100', '500', '600', '700']);
  assert.equal(system.colors.neutral.steps['0'], '#ffffff');
  assert.equal(system.colors.danger.seed, '#b7283b');
  const link = system.extras.color.find((e) => e.name === 'link');
  assert.deepEqual(link.value, { light: '#008262', dark: '#01c38d' });
  const scrim = system.extras.color.find((e) => e.name === 'scrim');
  assert.match(scrim.value, /^#[0-9a-f]{6}$/);
  assert.ok(notes.some((n) => n.includes('"background-secondary" → muted')));
  assert.ok(notes.some((n) => n.includes('40% opaque')));
  assert.equal(system.tokens, undefined, 'nothing left over');
});

test('primary wins over brand and accent', () => {
  const { system } = systemFromTokens({ theme: { light: { $type: 'color', background: c('#ffffff'), foreground: c('#111111'), primary: c('#2244aa'), brand: c('#aa2244'), accent: c('#22aa44') } } });
  assert.equal(system.roles.primary.light, '#2244aa');
  assert.equal(system.recipe.brand, '#2244aa');
  assert.ok(system.extras.color.some((e) => e.value === '#aa2244'));
});

test('a "muted" that reads as text on the page is muted text, not the muted surface', () => {
  const { system, notes } = systemFromTokens({ theme: { light: { $type: 'color', background: c('#ffffff'), foreground: c('#111111'), muted: c('#6b6b6b') } } });
  assert.equal(system.roles['muted-foreground'].light, '#6b6b6b');
  assert.equal(system.roles.muted, undefined);
  assert.ok(notes.some((n) => n.includes('quiet text')));
});

test('no dark set: the dark theme is generated, and the brand colour stays exactly in light', () => {
  const { system, notes } = systemFromTokens({ theme: { day: { $type: 'color', background: c('#fbf7f0'), foreground: c('#2a2a2a'), primary: c('#c4482c') } } });
  assert.equal(system.roles.primary.dark, undefined);
  assert.ok(notes.some((n) => n.includes('dark theme is generated')));
  const { tokens } = applySystem(base, system);
  assert.equal(tokens.semantic.color.primary.$value.light, '#c4482c');
  assert.equal(tokens.semantic.color.background.$value.light, '#fbf7f0');
  assert.ok(tokens.semantic.color.primary.$value.dark, 'dark is drawn from the ramps');
});

test("Halftone's own shape ({ light, dark } values) and shadows named light and dark read as one", () => {
  const { system } = systemFromTokens({
    semantic: {
      $type: 'color',
      background: { $value: { light: '#ffffff', dark: '#101014' } },
      foreground: { $value: { light: '#101014', dark: '#fafafa' } },
      primary: { $value: { light: '#4f46e5', dark: '#818cf8' } },
    },
    shadow: {
      $type: 'shadow',
      light: { $value: { color: '#26303f33', offsetX: '0px', offsetY: '8px', blur: '24px', spread: '0px' } },
      dark: { $value: { color: '#00000073', offsetX: '0px', offsetY: '8px', blur: '24px', spread: '0px' } },
    },
  });
  assert.equal(system.roles.background.dark, '#101014');
  assert.equal(system.roles.primary.light, '#4f46e5');
  assert.deepEqual(Object.keys(system.shadow), ['1']);
  assert.equal(system.shadow['1'].light[0].alpha, 0.2);
  assert.equal(system.shadow['1'].dark[0].color, '#000000');
});

test('an imported system is a valid document: it round-trips and applies', () => {
  for (const fixture of [HARBOUR, LEDGER]) {
    const { system } = systemFromTokens(fixture, { name: 'X', google: ['Lato'] });
    assert.ok(validateSystem(system).ok);
    assert.deepEqual(normalizeSystem(JSON.parse(JSON.stringify(system))), system);
    const { tokens } = applySystem(base, system);
    assert.deepEqual(tokens.$extensions['com.halftonedesignsystem.theme'].system.tokens, system.tokens, 'the record keeps the leftovers');
  }
});

test('tokens: an object, at most 256 KB, and absent when empty', () => {
  assert.equal(validateSystem({ tokens: 'space' }).ok, false);
  assert.equal(validateSystem({ tokens: { big: { $value: 'x'.repeat(300 * 1024) } } }).ok, false);
  assert.equal(normalizeSystem({ tokens: {} }).tokens, undefined);
});

test('halftone-tokens import writes the system, lists what it guessed, and never overwrites without --force', () => {
  const dir = mkdtempSync(join(tmpdir(), 'halftone-import-'));
  try {
    const file = join(dir, 'harbour.tokens.json');
    writeFileSync(file, JSON.stringify(HARBOUR));
    const args = ['import', file, '--root', dir, '--offline', '--google', 'Lato'];
    const first = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /harbour\.halftone\.json/);
    assert.match(first.stdout, /Light theme: "sand"/);
    const out = join(dir, 'harbour.halftone.json');
    assert.ok(existsSync(out));
    assert.ok(validateSystem(JSON.parse(readFileSync(out, 'utf8'))).ok);
    const again = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
    assert.equal(again.status, 2);
    assert.match(again.stderr, /--force/);
    const json = spawnSync(process.execPath, [cli, ...args, '--force', '--json'], { encoding: 'utf8' });
    assert.equal(json.status, 0, json.stderr);
    const parsed = JSON.parse(json.stdout);
    assert.ok(Array.isArray(parsed.notes) && Array.isArray(parsed.warnings));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
