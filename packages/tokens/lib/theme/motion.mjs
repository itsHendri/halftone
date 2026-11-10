/**
 * Motion: the durations, easings and springs a theme sets, and the Speed knob that scales them. Pure ESM.
 *
 *   durations  fast | base | slow, ms                       primitive.duration.*   (number)
 *   easings    standard | emphasized | exit, cubic-bezier   primitive.easing.*     (cubicBezier)
 *   springs    snappy | gentle, { stiffness, damping, mass } primitive.spring.*.*  (numbers: DTCG has no spring type)
 *
 * The recipe's `speed` scales every duration and every spring's time (a spring's stiffness by 1 / f², its damping by
 * 1 / f, so it keeps its bounce). A system's motion edits are set values on top, not scaled.
 */

/** Speed: how much longer (> 1) or shorter (< 1) everything takes than the kits' own timings. */
export const SPEED = { normal: 1, snappy: 0.75, relaxed: 1.25, slow: 1.5 };

export const DURATION_NAMES = ['fast', 'base', 'slow'];
export const EASING_NAMES = ['standard', 'emphasized', 'exit'];
export const SPRING_NAMES = ['snappy', 'gentle'];
export const SPRING_KEYS = ['stiffness', 'damping', 'mass'];

/** The kits' timings at Speed normal: what tokens.json has always had, plus the two springs. */
export const MOTION_DEFAULTS = Object.freeze({
  durations: Object.freeze({ fast: 150, base: 200, slow: 300 }),
  easings: Object.freeze({ standard: [0.2, 0, 0, 1], emphasized: [0.3, 0, 0, 1], exit: [0.4, 0, 1, 1] }),
  springs: Object.freeze({
    // A press, a toggle, a chip: quick, barely past the mark.
    snappy: Object.freeze({ stiffness: 400, damping: 36, mass: 1 }),
    // A sheet, a card settling in: slower, with a little give.
    gentle: Object.freeze({ stiffness: 120, damping: 18, mass: 1 }),
  }),
});

/** What each value is for: tokens.json's $description and the guides. */
export const MOTION_USE = {
  durations: { fast: 'hover and small feedback', base: 'most transitions', slow: 'sheets and large surfaces' },
  easings: { standard: 'most movement', emphasized: 'entering, drawing the eye', exit: 'leaving the screen' },
  springs: { snappy: 'presses, toggles, small moves', gentle: 'sheets, cards settling in' },
};

const round = (n, places = 2) => Number(n.toFixed(places));

/** A spring that plays `factor` times as long, with the same bounce. */
export function scaleSpring({ stiffness, damping, mass }, factor) {
  return { stiffness: round(stiffness / factor ** 2), damping: round(damping / factor), mass };
}

/**
 * The motion a recipe's speed and a system's edits make: { durations, easings, springs }. `edits` is a system's
 * `motion` ({ durations?, easings?, springs? }), set values that Speed doesn't scale.
 */
export function motionFor(speed = 'normal', edits = {}) {
  const f = SPEED[speed] ?? 1;
  const d = MOTION_DEFAULTS;
  return {
    durations: Object.fromEntries(DURATION_NAMES.map((n) => [n, edits.durations?.[n] ?? Math.round(d.durations[n] * f)])),
    easings: Object.fromEntries(EASING_NAMES.map((n) => [n, (edits.easings?.[n] ?? d.easings[n]).slice()])),
    springs: Object.fromEntries(SPRING_NAMES.map((n) => [n, edits.springs?.[n] ? { ...edits.springs[n] } : f === 1 ? { ...d.springs[n] } : scaleSpring(d.springs[n], f)])),
  };
}

/** Where a spring released from 0 at rest is after `t` seconds, heading for 1 (the damped oscillator, exactly). */
export function springAt({ stiffness, damping, mass }, t) {
  if (t <= 0) return 0;
  const m = Math.max(mass, 0.001);
  const k = Math.max(stiffness, 1e-9);
  const w0 = Math.sqrt(k / m);
  const zeta = damping / (2 * Math.sqrt(k * m));
  if (zeta < 1 - 1e-9) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  if (zeta <= 1 + 1e-9) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const s = Math.sqrt(zeta * zeta - 1);
  const r1 = -w0 * (zeta - s);
  const r2 = -w0 * (zeta + s);
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

/** Seconds until the spring stays within 0.001 of rest (capped at 10 for one that never settles). */
export function settleTime(spring, { restDelta = 0.001, max = 10 } = {}) {
  const dt = 1 / 240;
  let last = 0;
  for (let t = 0; t <= max; t += dt) if (Math.abs(springAt(spring, t) - 1) > restDelta) last = t;
  return round(Math.min(max, last + dt), 3);
}

/**
 * A spring as CSS: a `linear()` easing and its duration in ms, so a plain transition plays it (the web kit's
 * --spring-<name> and --spring-<name>-duration).
 */
export function springCss(spring, points = 32) {
  const span = Math.max(settleTime(spring), 0.05);
  const values = Array.from({ length: points + 1 }, (_, i) => round(springAt(spring, (i / points) * span), 4));
  // At rest it is within 0.001 of the end: land exactly on it, so the transition doesn't jump when it finishes.
  values[points] = 1;
  return { easing: `linear(${values.join(', ')})`, duration: Math.round(span * 1000) };
}

/** `cubic-bezier(0.2, 0, 0, 1)` */
export const bezierCss = (curve) => `cubic-bezier(${curve.join(', ')})`;
