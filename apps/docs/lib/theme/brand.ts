'use client';
/**
 * The active system's brand: a name, a logo (and its dark version), a mark for the app icon, and the icon's
 * background. Part of the system document (`brand`, lib/studio/systems.ts), so it is saved, switched and undone with
 * it. A theme code never carries it, and neither does a shared link: it travels as files instead (Use system › Brand
 * assets, lib/brand/zip.ts). The embedded kits get it live (`kit:brand`, lib/frames.ts) and, on a new page, from
 * sessionStorage (EMBED_BRAND_KEY, written by components/theme/theme-runtime.tsx).
 */
import type { SystemBrand } from '@halftone-ds/tokens/system';
import * as React from 'react';
import { editSystem, subscribeSystems, systemsState, STARTER } from '@/lib/studio/systems';
import type { BrandImage } from '@/lib/brand/svg';

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

/**
 * What the kits get (lib/brand.ts's Brand): null until there's a logo. With no brand name it's the system's name,
 * as the Studio's placeholder shows it.
 */
export function kitBrand(s: BrandState = systemsState().doc.brand as BrandState, systemName = systemsState().doc.name) {
  if (!s.logo) return null;
  const name = s.name.trim() || systemName.trim() || 'Your brand';
  return { name, logo: s.logo, logoDark: s.logoDark, mark: s.mark, markDark: s.markDark };
}

/** Change the active system's brand (undoable; `coalesce` folds typing a name into one step). */
export function setBrand(patch: Partial<BrandState>, { coalesce }: { coalesce?: string } = {}) {
  editSystem((doc) => {
    let brand = { ...doc.brand, ...patch } as SystemBrand;
    // Without a logo there's nothing to have a dark version of.
    if (!brand.logo) brand = { ...brand, logoDark: undefined };
    if (!brand.mark) brand = { ...brand, markDark: undefined };
    return { ...doc, brand };
  }, { coalesce });
}

const brandOf = () => systemsState().doc.brand as BrandState;
export const useBrand = () => React.useSyncExternalStore(subscribeSystems, brandOf, () => STARTER.brand as BrandState);
