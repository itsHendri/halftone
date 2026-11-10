/**
 * Springs, in the two ways people tune them:
 * - **time**: how long it looks (`visualDuration`, seconds) and how much it bounces (`bounce`, 0–0.95), Motion's way;
 * - **physics**: `stiffness`, `damping` and `mass`, as Motion, React Spring and Reanimated take them.
 *
 * Either converts to the other, and either samples to a curve for a preview or a CSS `linear()` easing. Headless: no
 * React, no DOM.
 */

export type SpringPhysics = { stiffness: number; damping: number; mass: number };
export type SpringTime = { visualDuration: number; bounce: number };
export type Spring = ({ mode: 'time' } & SpringTime) | ({ mode: 'physics' } & SpringPhysics);
export type SpringMode = Spring['mode'];

/** A quick, barely bouncing spring: the starting point for a new one. */
export const DEFAULT_SPRING: Spring = { mode: 'time', visualDuration: 0.3, bounce: 0.15 };

/** The ranges the editor offers; values outside them still evaluate. */
export const SPRING_RANGES = {
  visualDuration: { min: 0.05, max: 2, step: 0.01 },
  bounce: { min: 0, max: 0.95, step: 0.01 },
  stiffness: { min: 1, max: 1000, step: 1 },
  damping: { min: 0, max: 100, step: 0.5 },
  mass: { min: 0.1, max: 10, step: 0.1 },
} as const;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number, decimals: number) => Number(n.toFixed(decimals));

/**
 * Time to physics, as Motion converts `{ visualDuration, bounce }`: the period is 1.2 × the visual duration, the mass
 * is 1, and bounce 0 is critically damped.
 */
export function timeToPhysics({ visualDuration, bounce }: SpringTime): SpringPhysics {
  const root = (2 * Math.PI) / (Math.max(visualDuration, 0.001) * 1.2);
  const stiffness = root * root;
  const damping = 2 * clamp(1 - bounce, 0.05, 1) * Math.sqrt(stiffness);
  return { stiffness: round(stiffness, 3), damping: round(damping, 3), mass: 1 };
}

/** Physics to time: the inverse of `timeToPhysics`, with the mass folded in. An overdamped spring reads as bounce 0. */
export function physicsToTime({ stiffness, damping, mass }: SpringPhysics): SpringTime {
  const k = stiffness / Math.max(mass, 0.001);
  const c = damping / Math.max(mass, 0.001);
  const root = Math.sqrt(Math.max(k, 1e-6));
  const visualDuration = (2 * Math.PI) / (root * 1.2);
  const bounce = clamp(1 - c / (2 * root), 0, 0.95);
  return { visualDuration: round(visualDuration, 3), bounce: round(bounce, 3) };
}

export function toPhysics(spring: Spring): SpringPhysics {
  return spring.mode === 'physics' ? { stiffness: spring.stiffness, damping: spring.damping, mass: spring.mass } : timeToPhysics(spring);
}

export function toTime(spring: Spring): SpringTime {
  return spring.mode === 'time' ? { visualDuration: spring.visualDuration, bounce: spring.bounce } : physicsToTime(spring);
}

/** The same spring, written in the other mode (what the editor's mode switch does). */
export function convertSpring(spring: Spring, mode: SpringMode): Spring {
  if (spring.mode === mode) return spring;
  return mode === 'time' ? { mode, ...toTime(spring) } : { mode, ...toPhysics(spring) };
}

/**
 * Where a spring released from 0 at rest is after `t` seconds, heading for 1: the damped harmonic oscillator, solved
 * exactly for each damping regime.
 */
export function springAt({ stiffness, damping, mass }: SpringPhysics, t: number): number {
  if (t <= 0) return 0;
  const m = Math.max(mass, 0.001);
  const w0 = Math.sqrt(Math.max(stiffness, 1e-9) / m);
  const zeta = damping / (2 * Math.sqrt(Math.max(stiffness, 1e-9) * m));
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

/**
 * Seconds until the spring stays within `restDelta` of 1 (Motion's default rest distance is 0.001 for a 0–1 move).
 * Capped at `max` for a spring with no damping, which never rests.
 */
export function settleTime(spring: Spring | SpringPhysics, { restDelta = 0.001, max = 10 }: { restDelta?: number; max?: number } = {}): number {
  const p = 'mode' in spring ? toPhysics(spring) : spring;
  const dt = 1 / 240;
  let last = 0;
  for (let t = 0; t <= max; t += dt) if (Math.abs(springAt(p, t) - 1) > restDelta) last = t;
  return round(Math.min(max, last + dt), 3);
}

/** `points` + 1 samples from release to rest (or over `duration` seconds), for a preview line. */
export function sampleSpring(spring: Spring, { points = 60, duration }: { points?: number; duration?: number } = {}): { t: number; value: number }[] {
  const p = toPhysics(spring);
  const span = duration ?? Math.max(settleTime(p), 0.05);
  return Array.from({ length: points + 1 }, (_, i) => {
    const t = (i / points) * span;
    return { t: round(t, 4), value: springAt(p, t) };
  });
}

/**
 * The spring as CSS: a `linear()` easing and the duration (ms) to run it for, so a plain transition or the Web
 * Animations API can play it without a spring engine.
 */
export function springToCss(spring: Spring, points = 40): { easing: string; duration: number } {
  const samples = sampleSpring(spring, { points });
  const span = samples[samples.length - 1].t;
  // At rest it is within 0.001 of the end: land exactly on it, so the transition doesn't jump when it finishes.
  const stops = samples.map((s, i) => (i === samples.length - 1 ? 1 : round(s.value, 4)));
  return {
    easing: `linear(${stops.join(', ')})`,
    duration: Math.round(span * 1000),
  };
}

/** Reads a spring from pasted settings: either mode's fields, with or without `mode`. Null when it isn't one. */
export function parseSpring(input: unknown): Spring | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  const num = (k: string) => (typeof o[k] === 'number' && Number.isFinite(o[k]) ? (o[k] as number) : undefined);
  const [stiffness, damping, mass, visualDuration, bounce] = ['stiffness', 'damping', 'mass', 'visualDuration', 'bounce'].map(num);
  if (o.mode !== 'time' && stiffness !== undefined && damping !== undefined) {
    return { mode: 'physics', stiffness: Math.max(stiffness, 0.001), damping: Math.max(damping, 0), mass: Math.max(mass ?? 1, 0.001) };
  }
  if (o.mode !== 'physics' && visualDuration !== undefined) {
    return { mode: 'time', visualDuration: Math.max(visualDuration, 0.001), bounce: clamp(bounce ?? 0, 0, 0.95) };
  }
  return null;
}
