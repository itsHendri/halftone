// npm test -w packages/tokens — APCA (advisory) and the contrast report the docs studio renders.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { apcaContrast } from '../lib/apca.mjs';
import { contrastPairs, contrastReport } from '../lib/contrast.mjs';
import { apcaContrast as fromTheme, contrastReport as reportFromTheme, generateTheme } from '../lib/theme/index.mjs';

const kit = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/halftone-tokens.json'), 'utf8'));

test('APCA matches the apca-w3 0.0.98G-4g reference values', () => {
  // [text, background, Lc] from the apca-w3 README and test suite.
  const cases = [
    ['#888888', '#ffffff', 63.056469930209424],
    ['#ffffff', '#888888', -68.54146436644962],
    ['#000000', '#aaaaaa', 58.146262578561334],
    ['#aaaaaa', '#000000', -56.24113336839742],
    ['#112233', '#ddeeff', 91.66830811481631],
    ['#ddeeff', '#112233', -93.06770049484275],
    ['#112233', '#444444', 8.32326136957393],
    ['#444444', '#112233', -7.526878460278154],
  ];
  for (const [text, bg, lc] of cases) assert.ok(Math.abs(apcaContrast(text, bg) - lc) < 1e-9, `${text} on ${bg}: ${apcaContrast(text, bg)} ≠ ${lc}`);
});

test('APCA is signed by polarity, zero for identical colours, and clips near-zero contrast', () => {
  assert.ok(apcaContrast('#000000', '#ffffff') > 105);
  assert.ok(apcaContrast('#ffffff', '#000000') < -107);
  assert.equal(apcaContrast('#7f7f7f', '#7f7f7f'), 0);
  assert.equal(apcaContrast('#f4f4f4', '#ffffff'), 0);
  assert.throws(() => apcaContrast('red', '#ffffff'), /6-digit hex/);
});

test('the theme entry exports the same functions', () => {
  assert.equal(fromTheme, apcaContrast);
  assert.equal(reportFromTheme, contrastReport);
});

test('contrastReport covers the strict pairs in both modes, with pass from WCAG alone', () => {
  const theme = generateTheme({ brand: '#e11d48' }, kit);
  const rows = contrastReport(theme.resolved);
  const strict = (mode) => contrastPairs(theme.resolved[mode], mode, { strict: true });
  assert.equal(rows.length, strict('light').length + strict('dark').length);
  assert.ok(rows.some((r) => r.label === 'text-primary on muted'), 'strict adds tones on muted');
  assert.ok(rows.some((r) => r.threshold === 3), 'icons on tints are checked at 3:1');
  for (const r of rows) {
    assert.equal(r.pass, r.ratio >= r.threshold);
    assert.equal(r.apca, apcaContrast(r.fg, r.bg));
  }
  // A generated theme is auto-fixed, so every row passes.
  assert.deepEqual(rows.filter((r) => !r.pass), []);
});

test('APCA never decides pass or fail', () => {
  // The classic disagreement on a mid blue: black text passes WCAG (5.7:1) at only Lc 40, white text
  // fails it (3.7:1) at Lc -69. The report follows WCAG both times.
  const rows = contrastReport({
    light: { primary: '#3b82f6', 'primary-foreground': '#000000' },
    dark: { primary: '#3b82f6', 'primary-foreground': '#ffffff' },
  });
  const [light, dark] = ['light', 'dark'].map((m) => rows.find((r) => r.mode === m && r.label === 'primary-foreground on primary'));
  assert.ok(light.pass && Math.abs(light.apca) < 45, `light: ${light.ratio} / Lc ${light.apca}`);
  assert.ok(!dark.pass && Math.abs(dark.apca) > 60, `dark: ${dark.ratio} / Lc ${dark.apca}`);
});
