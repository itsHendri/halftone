'use client';
/**
 * The ambient theme. Until a visitor picks anything (lib/theme/store.ts `ambient`), the brand hue drifts
 * violet → orange → pink → blue over a minute, and the site's colours follow it
 * (apps/docs/design/halftone-lab/DECISIONS.md). It runs outside the store, so the studio panels and the
 * contrast table never re-render per frame:
 *   - every frame (at most ~30 a second) the hue is rounded to a degree; a new degree generates a theme
 *     (contrast fixer on, ~2 ms, cached) and writes its colours into <style id="halftone-ambient">
 *   - every few seconds the embedded kits get the same theme (useAmbientStep → lib/frames.ts)
 *   - the phase comes from the clock, so a page load or another tab carries on where the drift is
 *   - it can be paused (WCAG 2.2.2), stays on one hue a day under reduced motion, and holds still on the
 *     studio (holdAmbient), where the controls show the theme being edited
 */
import { BRAND_RAMPS, generateTheme, type Theme } from '@halftone-ds/tokens/theme';
import * as React from 'react';
import { onFrame, onReducedMotionChange, prefersReducedMotion } from '@/lib/halftone/loop';
import { AMBIENT_CSS_KEY, AMBIENT_ID, AMBIENT_PAUSE_KEY, EMBED_KEY } from './keys';
import { kitPayloads, siteCss } from './payload';
import { base, committed, isAmbient, subscribeTheme } from './store';

/** The route (hues in OKLCH degrees), a full cycle, and how often the kit frames catch up. */
const STOPS = [292, 40, 355, 262];
const CYCLE = 60_000;
const STEP = 4_000;
/** The seed's lightness and chroma: a 600-ish fill, so the ramp's anchor and the semantic map hold still. */
const SEED_L = 0.58;
const SEED_C = 0.19;

const mod1 = (x: number) => ((x % 1) + 1) % 1;
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerpHue = (a: number, b: number, t: number) => (a + ((((b - a + 540) % 360) - 180) * t) + 360) % 360;

/** The hue at a point in the cycle (0–1): eased from stop to stop. */
export function hueAt(phase: number) {
  const x = mod1(phase) * STOPS.length;
  const i = Math.floor(x) % STOPS.length;
  return lerpHue(STOPS[i], STOPS[(i + 1) % STOPS.length], smooth(x - Math.floor(x)));
}

/** OKLCH → sRGB hex, lowering chroma until the colour is in gamut. */
function oklchHex(L: number, C: number, h: number) {
  const rgb = (c: number) => {
    const a = c * Math.cos((h * Math.PI) / 180);
    const b = c * Math.sin((h * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
  };
  const inGamut = (c: number) => rgb(c).every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  let lo = 0;
  let hi = C;
  if (!inGamut(C)) {
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(mid)) lo = mid;
      else hi = mid;
    }
  } else lo = C;
  const encode = (v: number) => {
    const x = Math.min(1, Math.max(0, v));
    const s = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.round(s * 255).toString(16).padStart(2, '0');
  };
  return `#${rgb(lo).map(encode).join('')}`;
}

const CURATED = new Set(Object.values(BRAND_RAMPS).map((r) => r['600'].toLowerCase()));
/** The brand seed for a hue. A curated 600 would swap in its curated ramp (a jump), so step around it. */
export function brandAt(hue: number) {
  const hex = oklchHex(SEED_L, SEED_C, hue);
  return CURATED.has(hex) ? oklchHex(SEED_L, SEED_C, hue + 0.3) : hex;
}

type Entry = { hue: number; brand: string; theme: Theme; css: string };
const cache = new Map<number, Entry>();
function entryFor(hue: number): Entry {
  let entry = cache.get(hue);
  if (entry) {
    cache.delete(hue);
  } else {
    const brand = brandAt(hue);
    const theme = generateTheme({ ...committed, brand }, base);
    entry = { hue, brand, theme, css: siteCss(theme) };
  }
  cache.set(hue, entry);
  if (cache.size > 120) cache.delete(cache.keys().next().value as number);
  return entry;
}

// ---- state ------------------------------------------------------------------------------------------

let current: Entry | null = null;
let step: Theme | null = null;
let stepAt = 0;
let paintAt = 0;
let savedAt = 0;
let reduced = false;
/** The phase the drift is paused at, or null; and where the clock-driven phase starts. */
let pausedAt: number | null = null;
let offset = 0;
const holds = new Set<string>();

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
};

/** One hue a day when motion is reduced. */
const dailyPhase = () => {
  const now = new Date();
  return mod1(Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 864e5) * 0.618);
};
const phaseNow = () => (reduced ? dailyPhase() : (pausedAt ?? mod1((Date.now() - offset) / CYCLE)));
const active = () => isAmbient() && holds.size === 0;
const moving = () => active() && !reduced && pausedAt === null;

// ---- React ------------------------------------------------------------------------------------------

type Snapshot = { active: boolean; paused: boolean; reduced: boolean };
let snapshot: Snapshot = { active: false, paused: false, reduced: false };
const SERVER: Snapshot = { active: true, paused: false, reduced: false };
const listeners = new Set<() => void>();
function publish() {
  const next = { active: active(), paused: pausedAt !== null, reduced };
  if (next.active === snapshot.active && next.paused === snapshot.paused && next.reduced === snapshot.reduced) return;
  snapshot = next;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
/** Whether the drift is on, paused, or held still by reduced motion: for the theme bar. */
export const useAmbient = () => React.useSyncExternalStore(subscribe, () => snapshot, () => SERVER);

const stepListeners = new Set<() => void>();
/** The theme the kit frames should show while ambient (it changes every few seconds), else null. */
export const useAmbientStep = () =>
  React.useSyncExternalStore(
    (l) => {
      stepListeners.add(l);
      return () => stepListeners.delete(l);
    },
    () => step,
    () => null
  );

/** The site's colours right now while ambient (hex, per mode), for the halftone canvases. */
export const ambientResolved = () => (active() ? (current?.theme.resolved ?? null) : null);
/** The brand on screen, to keep when the visitor takes this colour. */
export const ambientBrand = () => current?.brand ?? null;

// ---- engine -----------------------------------------------------------------------------------------

function paint(now: number) {
  const hue = Math.round(hueAt(phaseNow())) % 360;
  if (hue !== current?.hue) {
    current = entryFor(hue);
    let style = document.getElementById(AMBIENT_ID);
    if (!style) {
      style = Object.assign(document.createElement('style'), { id: AMBIENT_ID });
      document.head.appendChild(style);
    }
    style.textContent = current.css;
  }
  // The next page load paints from here (app/layout.tsx), so it opens near this hue.
  if (now - savedAt > 2000) {
    savedAt = now;
    write(AMBIENT_CSS_KEY, current.css);
  }
  if (now >= stepAt && step !== current.theme) {
    stepAt = now + STEP;
    step = current.theme;
    try {
      sessionStorage.setItem(EMBED_KEY, JSON.stringify(kitPayloads(step, true)));
    } catch {}
    stepListeners.forEach((l) => l());
  }
}

let stopFrames: (() => void) | null = null;
function frame(now: number) {
  if (!moving()) return sync();
  if (now - paintAt < 33) return;
  paintAt = now;
  paint(now);
}

/** Start, stop or freeze the drift to match the store, the pause and the holds. */
function sync() {
  publish();
  if (!active()) {
    stopFrames?.();
    stopFrames = null;
    document.getElementById(AMBIENT_ID)?.remove();
    current = null;
    if (step) {
      step = null;
      stepListeners.forEach((l) => l());
    }
    if (!isAmbient()) write(AMBIENT_CSS_KEY, null);
    return;
  }
  if (moving()) {
    stopFrames ??= onFrame(frame);
    return;
  }
  // Still (paused or reduced motion): paint once, frames included.
  stopFrames?.();
  stopFrames = null;
  stepAt = 0;
  paint(performance.now());
}

let started = false;
/** Called once by ThemeRuntime, after the store has read the URL and storage. */
export function startAmbient() {
  if (started) return;
  started = true;
  reduced = prefersReducedMotion();
  const paused = Number.parseFloat(read(AMBIENT_PAUSE_KEY) ?? '');
  pausedAt = Number.isFinite(paused) ? mod1(paused) : null;
  offset = Number.parseFloat(read(`${AMBIENT_PAUSE_KEY}.offset`) ?? '') || 0;
  subscribeTheme(sync);
  onReducedMotionChange(() => {
    reduced = prefersReducedMotion();
    sync();
  });
  sync();
}

export function pauseAmbient() {
  if (pausedAt !== null) return;
  pausedAt = phaseNow();
  write(AMBIENT_PAUSE_KEY, String(pausedAt));
  sync();
}

export function playAmbient() {
  if (pausedAt === null) return;
  // Carry on from the paused hue.
  offset = Date.now() - pausedAt * CYCLE;
  pausedAt = null;
  write(AMBIENT_PAUSE_KEY, null);
  write(`${AMBIENT_PAUSE_KEY}.offset`, String(offset));
  sync();
}

/** Hold the drift off (the studio shows the theme being edited). Returns the release. */
export function holdAmbient(key: string) {
  holds.add(key);
  if (started) sync();
  return () => {
    holds.delete(key);
    if (started) sync();
  };
}
