/**
 * Colour-vision check. The contrast gate proves every tone reads against its surface; it says nothing
 * about whether two tones can be told apart by someone who cannot see red from green. This simulates the
 * three dichromacies and measures what is left of the difference between tones that carry meaning:
 *
 *   simulateCvd(hex, type)  what a protanope, deuteranope or tritanope sees: Machado, Oliveira & Fernandes
 *                           2009 at severity 1.0, applied in linear-light sRGB. One model for all three
 *                           (Viénot 1999 covers only protan and deutan; for reds, greens and ambers the two
 *                           land within about 0.03 ΔE of each other, Machado moves saturated blues more)
 *   cvdWarnings(resolved)   pairs that fall below MIN_DELTA_E under any vision, per mode
 *
 * A warning, never a failure: a red/green pair can still be told apart by its icon, label or position,
 * and the kit always gives a status one of those. The check says when colour alone stops doing the work.
 * Pure ESM, no Node APIs: the docs studio runs it in the browser.
 */
import { deltaEOK, hexToLinearRgb, linearRgbToHex } from './color.mjs';

export const CVD_TYPES = ['protanopia', 'deuteranopia', 'tritanopia'];

/** Machado et al. 2009, severity 1.0, rows → linear R, G, B. */
const MATRICES = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

/** `hex` as a dichromat sees it. `type` 'none' (or anything falsy) returns it unchanged. */
export function simulateCvd(hex, type) {
  if (!type || type === 'none') return hex.toLowerCase();
  const m = MATRICES[type];
  if (!m) throw new Error(`simulateCvd: unknown vision "${type}", expected one of ${CVD_TYPES.join(', ')}`);
  const rgb = hexToLinearRgb(hex);
  return linearRgbToHex(m.map((row) => row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2]));
}

/**
 * The smallest OKLab distance two tones that mean different things may keep. About 0.02 is one
 * just-noticeable difference for large patches side by side; a status dot or a 2px chart line is small and
 * seldom right next to its partner, so this asks for a couple and a half of them.
 */
export const MIN_DELTA_E = 0.05;

/** The status tones are each other's alternatives; a chart's adjacent series sit side by side. */
export const DISTINCT_PAIRS = [
  ['success', 'destructive'],
  ['success', 'warning'],
  ['warning', 'destructive'],
  ['info', 'success'],
  ['info', 'warning'],
  ['info', 'destructive'],
  ['chart-1', 'chart-2'],
  ['chart-2', 'chart-3'],
  ['chart-3', 'chart-4'],
  ['chart-4', 'chart-5'],
];

/** The pairs as one vision sees them in one mode: `hex` is { name: '#rrggbb' }. */
export function pairDistances(hex, type, pairs = DISTINCT_PAIRS) {
  return pairs
    .filter(([a, b]) => hex[a] && hex[b])
    .map(([a, b]) => {
      const [sa, sb] = [simulateCvd(hex[a], type), simulateCvd(hex[b], type)];
      return { a, b, vision: type || 'none', fg: sa, bg: sb, deltaE: deltaEOK(sa, sb) };
    });
}

/**
 * Every pair, mode and vision (normal sight included) below `threshold`: `resolved` is
 * { light: { name: hex }, dark: { … } }, the shape `generateTheme` returns as `theme.resolved`.
 * A pair that collides under several visions is reported once per vision, worst first.
 */
export function cvdWarnings(resolved, { pairs = DISTINCT_PAIRS, threshold = MIN_DELTA_E } = {}) {
  const out = [];
  for (const mode of ['light', 'dark']) {
    if (!resolved[mode]) continue;
    for (const type of ['none', ...CVD_TYPES]) {
      for (const d of pairDistances(resolved[mode], type, pairs)) if (d.deltaE < threshold) out.push({ mode, ...d });
    }
  }
  return out.sort((x, y) => x.deltaE - y.deltaE);
}

/** The warnings as report lines, like contrastFailures'. */
export const describeCvdWarnings = (warnings) =>
  warnings.map((w) => `  ${w.mode.padEnd(5)} ${`${w.a} / ${w.b}`.padEnd(24)} ${w.vision.padEnd(12)} ΔE ${w.deltaE.toFixed(3)}  (${w.fg} vs ${w.bg})`);
