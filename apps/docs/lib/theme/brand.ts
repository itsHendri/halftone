'use client';
/**
 * The studio's brand: a name, a logo (and its dark version), a mark for the app icon, and the icon's background.
 * A sibling of the theme store (lib/theme/store.ts), not part of the recipe: a theme code is a fixed few
 * characters, so the brand travels as files instead (Use theme › Brand assets, lib/brand/zip.ts). Kept in this
 * browser, and sent to the embedded kits live (`kit:brand`, lib/frames.ts).
 */
import * as React from 'react';
import type { BrandImage } from '@/lib/brand/svg';
import { BRAND_KEY, EMBED_BRAND_KEY } from './keys';

/** The app icon's background: the brand colour, white, black, or any hex. */
export type IconBackground = 'brand' | 'white' | 'black' | `#${string}`;

export type BrandState = {
  name: string;
  logo?: BrandImage;
  logoDark?: BrandImage;
  mark?: BrandImage;
  markDark?: BrandImage;
  iconBackground: IconBackground;
};
export type BrandSlot = 'logo' | 'logoDark' | 'mark' | 'markDark';

const EMPTY: BrandState = { name: '', iconBackground: 'brand' };
let state: BrandState = EMPTY;
const listeners = new Set<() => void>();

/** What the kits get (lib/brand.ts's Brand): null until there's a logo. */
export function kitBrand(s: BrandState = state) {
  if (!s.logo) return null;
  return { name: s.name.trim() || 'Your brand', logo: s.logo, logoDark: s.logoDark, mark: s.mark, markDark: s.markDark };
}

function persist() {
  try {
    if (state.logo || state.name) localStorage.setItem(BRAND_KEY, JSON.stringify(state));
    else localStorage.removeItem(BRAND_KEY);
  } catch {
    throw new Error("This browser's storage is full, so the logo can't be kept. Try a smaller image, or an SVG.");
  }
  try {
    const kit = kitBrand();
    if (kit) sessionStorage.setItem(EMBED_BRAND_KEY, JSON.stringify(kit));
    else sessionStorage.removeItem(EMBED_BRAND_KEY);
  } catch {}
}

let started = false;
function start() {
  if (started || typeof window === 'undefined') return;
  started = true;
  try {
    const saved = JSON.parse(localStorage.getItem(BRAND_KEY) ?? 'null') as Partial<BrandState> | null;
    if (saved && typeof saved === 'object') state = { ...EMPTY, ...saved };
  } catch {}
  // A new tab: the kit frames paint the saved logo from their first frame.
  try {
    const kit = kitBrand();
    if (kit) sessionStorage.setItem(EMBED_BRAND_KEY, JSON.stringify(kit));
  } catch {}
}

/** Change the brand. Throws when storage refuses it (too large), leaving the brand as it was. */
export function setBrand(patch: Partial<BrandState>) {
  const before = state;
  state = { ...state, ...patch };
  // Without a logo there's nothing to have a dark version of.
  if (!state.logo) state = { ...state, logoDark: undefined };
  if (!state.mark) state = { ...state, markDark: undefined };
  try {
    persist();
  } catch (error) {
    state = before;
    throw error;
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  start();
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const useBrand = () => React.useSyncExternalStore(subscribe, () => (start(), state), () => EMPTY);
