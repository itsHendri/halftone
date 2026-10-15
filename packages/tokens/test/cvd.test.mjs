// npm test -w packages/tokens — the colour-vision simulation and the tone-distinctness warning.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { deltaEOK, hexToOklab } from '../lib/color.mjs';
import { CVD_TYPES, cvdWarnings, describeCvdWarnings, DISTINCT_PAIRS, MIN_DELTA_E, pairDistances, simulateCvd } from '../lib/cvd.mjs';
import * as theme from '../lib/theme/index.mjs';
import { generateTheme } from '../lib/theme/index.mjs';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = JSON.parse(readFileSync(join(pkg, 'test/fixtures/halftone-tokens.json'), 'utf8'));

// The kit's danger-600 and success-600: the red/green pair the check exists for.
const RED = '#dc2626';
const GREEN = '#16a34a';

test('deltaEOK is OKLab distance', () => {
  assert.equal(deltaEOK('#336699', '#336699'), 0);
  assert.ok(Math.abs(deltaEOK('#000000', '#ffffff') - 1) < 1e-6, 'black to white is the whole L axis');
  assert.ok(Math.abs(hexToOklab('#ffffff')[0] - 1) < 1e-6);
});

test('simulateCvd leaves greys alone (every row of each matrix sums to 1)', () => {
  for (const type of CVD_TYPES) {
    for (const grey of ['#000000', '#ffffff', '#808080', '#18181b', '#f4f4f5']) {
      assert.ok(deltaEOK(simulateCvd(grey, type), grey) < 0.005, `${grey} under ${type}`);
    }
  }
});

test('simulateCvd: none is the identity, an unknown vision throws', () => {
  assert.equal(simulateCvd('#DC2626', 'none'), RED);
  assert.equal(simulateCvd(RED, undefined), RED);
  assert.throws(() => simulateCvd(RED, 'achromatopsia'), /unknown vision/);
});

test('simulateCvd output is stable (Machado 2009, severity 1.0, linear sRGB)', () => {
  assert.deepEqual(
    CVD_TYPES.map((t) => [simulateCvd(RED, t), simulateCvd(GREEN, t)]),
    [
      ['#635923', '#a49442'],
      ['#8f801b', '#958951'],
      ['#f3002a', '#00a08f'],
    ]
  );
});

test('red and green lose their hue difference for protan and deutan, not for tritan', () => {
  // The chromatic part of ΔE (a and b, not L): what is left is lightness, which is why the check uses all three.
  const chroma = (x, y) => {
    const [p, q] = [hexToOklab(x), hexToOklab(y)];
    return Math.hypot(p[1] - q[1], p[2] - q[2]);
  };
  const normal = chroma(RED, GREEN);
  assert.ok(normal > 0.3, `normal sight ${normal}`);
  for (const type of ['protanopia', 'deuteranopia']) {
    const d = chroma(simulateCvd(RED, type), simulateCvd(GREEN, type));
    assert.ok(d < normal / 5, `${type}: ${d}`);
  }
  const tritan = chroma(simulateCvd(RED, 'tritanopia'), simulateCvd(GREEN, 'tritanopia'));
  assert.ok(tritan > 0.3, `tritanopia: ${tritan}`);
});

test('a simulated colour is still a colour: every output is 8-bit hex', () => {
  for (const type of CVD_TYPES) for (const hex of ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff']) assert.match(simulateCvd(hex, type), /^#[0-9a-f]{6}$/);
});

test('pairDistances skips pairs the palette does not have', () => {
  const ds = pairDistances({ success: GREEN, destructive: RED }, 'deuteranopia');
  assert.deepEqual(
    ds.map((d) => [d.a, d.b, d.vision]),
    [['success', 'destructive', 'deuteranopia']]
  );
  assert.equal(ds[0].fg, simulateCvd(GREEN, 'deuteranopia'));
});

test('cvdWarnings: a green brand puts chart-1 on top of chart-2 under every vision', () => {
  const t = generateTheme({ brand: '#16a34a' }, base);
  const chart = cvdWarnings(t.resolved).filter((w) => w.a === 'chart-1' && w.b === 'chart-2');
  assert.equal(chart.length, 8, 'two modes × normal sight and three dichromacies');
  assert.ok(chart.every((w) => w.deltaE === 0));
});

test('cvdWarnings: the default and a red brand keep the charts apart; the status ramps warn where they do', () => {
  const key = (w) => `${w.mode} ${w.a}/${w.b} ${w.vision}`;
  const expected = [
    'light warning/destructive deuteranopia',
    'light info/success tritanopia',
    'dark success/destructive deuteranopia',
    'dark info/success tritanopia',
    'light warning/destructive protanopia',
  ];
  for (const brand of [theme.DEFAULT_RECIPE.brand, '#dc2626', '#e11d48']) {
    const warnings = cvdWarnings(generateTheme({ brand }, base).resolved);
    assert.deepEqual(warnings.map(key), expected, brand);
  }
});

test('cvdWarnings sorts worst first and takes a threshold and pairs', () => {
  const resolved = { light: { success: GREEN, destructive: RED, 'chart-1': '#3b82f6', 'chart-2': '#3b82f6' } };
  const ws = cvdWarnings(resolved);
  assert.ok(ws.every((w, i) => i === 0 || ws[i - 1].deltaE <= w.deltaE));
  assert.ok(ws.every((w) => w.deltaE < MIN_DELTA_E));
  assert.deepEqual(cvdWarnings(resolved, { threshold: 0 }), []);
  assert.deepEqual(cvdWarnings(resolved, { pairs: [['success', 'destructive']], threshold: 1 }).length, 4);
  assert.match(describeCvdWarnings(ws)[0], /^ {2}light chart-1 \/ chart-2 +none +ΔE 0\.000/);
});

test('the theme entry exports the check for the docs studio', () => {
  for (const name of ['CVD_TYPES', 'DISTINCT_PAIRS', 'MIN_DELTA_E', 'simulateCvd', 'pairDistances', 'cvdWarnings', 'describeCvdWarnings']) assert.ok(name in theme, name);
  assert.ok(DISTINCT_PAIRS.some(([a, b]) => a === 'success' && b === 'destructive'));
});
