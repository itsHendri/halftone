/**
 * Cubic-bezier easing curves: evaluate one (the browser's own maths), sample it for a preview, and read or write it
 * as CSS. Headless: no React, no DOM.
 */

/** `cubic-bezier(x1, y1, x2, y2)`: the two handles. x stays within 0–1; y may overshoot. */
export type Bezier = [number, number, number, number];

/** CSS's named curves, plus the kit's own. */
export const EASING_PRESETS: Record<string, Bezier> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  standard: [0.2, 0, 0, 1],
  emphasized: [0.3, 0, 0, 1],
  exit: [0.3, 0, 1, 1],
  overshoot: [0.34, 1.56, 0.64, 1],
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round = (n: number, decimals = 3) => Number(n.toFixed(decimals));

/** The same curve with x pulled into 0–1 (CSS rejects anything else) and every number to three places. */
export function clampBezier([x1, y1, x2, y2]: Bezier): Bezier {
  return [round(clamp01(x1)), round(y1), round(clamp01(x2)), round(y2)];
}

/**
 * The curve as a function of time: `ease(t)` is the progress at `t` (both 0–1). Solves x(s) = t for the curve's own
 * parameter with Newton's method, falling back to bisection, as WebKit's UnitBezier does.
 */
export function bezierEasing(curve: Bezier): (t: number) => number {
  const [x1, y1, x2, y2] = clampBezier(curve);
  if (x1 === y1 && x2 === y2) return (t) => clamp01(t);
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s;
  const slopeX = (s: number) => (3 * ax * s + 2 * bx) * s + cx;

  const solve = (x: number) => {
    let s = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(s) - x;
      if (Math.abs(err) < 1e-7) return s;
      const d = slopeX(s);
      if (Math.abs(d) < 1e-6) break;
      s -= err / d;
    }
    let lo = 0;
    let hi = 1;
    s = x;
    for (let i = 0; i < 40 && hi - lo > 1e-7; i++) {
      if (sampleX(s) < x) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return s;
  };
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return sampleY(solve(t));
  };
}

/** `points` + 1 evenly spaced samples of progress over time, for a preview line. */
export function sampleBezier(curve: Bezier, points = 48): { t: number; value: number }[] {
  const ease = bezierEasing(curve);
  return Array.from({ length: points + 1 }, (_, i) => {
    const t = i / points;
    return { t, value: ease(t) };
  });
}

/** `cubic-bezier(0.2, 0, 0, 1)`, or the CSS keyword when the curve is one. */
export function bezierToCss(curve: Bezier, { keywords = false }: { keywords?: boolean } = {}): string {
  const c = clampBezier(curve);
  if (keywords) {
    for (const name of ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']) {
      if (EASING_PRESETS[name].every((n, i) => n === c[i])) return name;
    }
  }
  return `cubic-bezier(${c.join(', ')})`;
}

/**
 * Reads a curve from what someone pastes: `cubic-bezier(0.2, 0, 0, 1)`, `0.2, 0, 0, 1`, `[0.2, 0, 0, 1]` or a preset
 * name (`ease-out`, `standard`). Null for anything else, including an x outside 0–1.
 */
export function parseBezier(input: unknown): Bezier | null {
  if (Array.isArray(input)) {
    if (input.length !== 4 || !input.every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
    const [x1, , x2] = input as number[];
    return x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1 ? null : (input.slice() as Bezier);
  }
  if (typeof input !== 'string') return null;
  const text = input.trim().toLowerCase();
  if (text in EASING_PRESETS) return EASING_PRESETS[text].slice() as Bezier;
  const inner = /^cubic-bezier\((.*)\)$/.exec(text)?.[1] ?? text.replace(/^\[|\]$/g, '');
  const parts = inner.split(/[\s,]+/).filter(Boolean).map(Number);
  return parts.length === 4 ? parseBezier(parts) : null;
}

/**
 * An SVG path for the curve in a `width` × `height` box, y up (0 at the bottom). `inset` leaves room around the box
 * for a curve that overshoots.
 */
export function bezierPath([x1, y1, x2, y2]: Bezier, width: number, height: number, inset = 0): string {
  const px = (x: number) => round(inset + x * width, 2);
  const py = (y: number) => round(inset + (1 - y) * height, 2);
  return `M${px(0)},${py(0)} C${px(x1)},${py(y1)} ${px(x2)},${py(y2)} ${px(1)},${py(1)}`;
}
