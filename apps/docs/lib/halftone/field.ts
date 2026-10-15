'use client';
/**
 * What the halftone canvases share: the site's colours right now, and the click ripples. Settings come from
 * the lab (apps/docs/design/halftone-lab/DECISIONS.md).
 */
import { ambientResolved } from '@/lib/theme/ambient';
import { currentRecipe, themeFor } from '@/lib/theme/store';

/** The site's colours as hex, in the current mode: the drifting theme while ambient, else the picked one. */
export function siteColours() {
  const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  return (ambientResolved() ?? themeFor(currentRecipe()).resolved)[mode];
}

/** A click ripple, in page coordinates (so it stays put while the page scrolls). */
export type Ripple = { x: number; y: number; t0: number };
export const ripples: Ripple[] = [];
export const RIPPLE_MS = 1000;
const BAND = 46;

/** The ripple's ring radius at `now`: fast out, easing off. */
export const ringRadius = (r: Ripple, now: number) => 40 + 300 * (1 - (1 - Math.min(1, (now - r.t0) / RIPPLE_MS)) ** 3);

/** How strongly a ripple pushes the point (x, y) outward right now, and in which direction; null if not. */
export function ripplePush(r: Ripple, now: number, x: number, y: number) {
  const p = (now - r.t0) / RIPPLE_MS;
  if (p >= 1) return null;
  const d = Math.hypot(x - r.x, y - r.y);
  const k = 1 - Math.abs(d - ringRadius(r, now)) / BAND;
  return k > 0 ? { k: k * (1 - p), ux: (x - r.x) / (d || 1), uy: (y - r.y) / (d || 1) } : null;
}

export const RIPPLE_REACH = 40 + 300 + BAND;
