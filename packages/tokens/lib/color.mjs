/**
 * Colour maths for the token build. Hex in, every format the targets need out:
 *   hexToHslTriplet  NativeWind 4 / shadcn v3 CSS variables (`221.2 83.2% 53.3%`)
 *   hexToOklch       Tailwind 4 / shadcn web CSS variables (`oklch(0.546 0.2152 262.88)`)
 *   contrast         WCAG 2.1 ratio, for the gate in contrast.mjs
 *   deltaEOK         OKLab distance, for the colour-vision check in cvd.mjs
 */

function parseHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error(`Expected a 6-digit hex colour, got "${hex}"`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (rgb) => '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');

export function hexToHslTriplet(hex) {
  const [r, g, b] = parseHex(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const round = (x) => Math.round(x * 10) / 10;
  return `${round(h * 360)} ${round(s * 100)}% ${round(l * 100)}%`;
}

// ---------- OKLCH (Björn Ottosson's OKLab, sRGB D65) -----------------------------

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** Hex → linear-light sRGB [r, g, b], 0–1. */
export const hexToLinearRgb = (hex) => parseHex(hex).map((c) => toLinear(c / 255));

/** Linear-light sRGB → 8-bit hex (clamped). */
export const linearRgbToHex = (rgb) => toHex(rgb.map((c) => Math.round(Math.min(1, Math.max(0, fromLinear(c))) * 255)));

/** Hex → OKLab [L 0–1, a, b], unrounded. */
export function hexToOklab(hex) {
  const [r, g, b] = hexToLinearRgb(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** ΔE in OKLab: the straight-line distance, L on its 0–1 scale (about 0.02 is a just-noticeable difference). */
export function deltaEOK(a, b) {
  const [p, q] = [hexToOklab(a), hexToOklab(b)];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

/** Hex → [L 0–1, C, H degrees], unrounded. */
export function hexToOklchParts(hex) {
  const [L, A, B] = hexToOklab(hex);
  const C = Math.hypot(A, B);
  const H = C < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return [L, C < 1e-4 ? 0 : C, H];
}

function oklchToLinearRgb([L, C, H]) {
  const hr = (H * Math.PI) / 180;
  const A = C * Math.cos(hr);
  const B = C * Math.sin(hr);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** [L, C, H] → 8-bit sRGB hex (clamped). */
export function oklchPartsToHex(parts) {
  return linearRgbToHex(oklchToLinearRgb(parts));
}

/** Whether [L, C, H] lies inside sRGB (no channel clipped). */
export function inGamut(parts, epsilon = 1e-4) {
  return oklchToLinearRgb(parts).every((c) => c >= -epsilon && c <= 1 + epsilon);
}

const fixed = (x, d) => Number(x.toFixed(d));

/**
 * Hex → `oklch(L C H)` rounded for CSS: 4 decimals for L and C, 2 for H, more only when a saturated
 * colour needs it to come back as the same 8-bit value. Throws if no precision does, so the web theme
 * can never drift from the native one.
 */
export function hexToOklch(hex) {
  const [L, C, H] = hexToOklchParts(hex);
  const target = toHex(parseHex(hex));
  for (const d of [4, 5, 6]) {
    const parts = [fixed(L, d), fixed(C, d), fixed(H, d - 2)];
    if (oklchPartsToHex(parts) === target) return `oklch(${parts.join(' ')})`;
  }
  throw new Error(`oklch round-trip drifted for ${hex}`);
}

// ---------- WCAG ----------------------------------------------------------------

export function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Composite `hex` at `alpha` over `base`, the way a /NN tint renders. */
export function blend(hex, base, alpha) {
  const [f, b] = [parseHex(hex), parseHex(base)];
  return toHex(f.map((c, i) => Math.round(alpha * c + (1 - alpha) * b[i])));
}
