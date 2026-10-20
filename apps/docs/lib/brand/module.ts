/**
 * lib/brand.ts as the brand download writes it. Pure, so `node --test` checks it against the kits' own copies
 * (module.test.ts): unzipping a brand changes only the data.
 */
import type { BrandImage } from './svg.ts';

/** lib/brand.ts as the kits read it: the same text as the kits' own copy, with the brand as its data. */
export function brandModule(brand: { name: string; logo?: BrandImage; logoDark?: BrandImage; mark?: BrandImage; markDark?: BrandImage }) {
  const data = JSON.stringify({ name: brand.name, logo: brand.logo, logoDark: brand.logoDark, mark: brand.mark, markDark: brand.markDark }, null, 2);
  return `/**
 * Your brand, as <Logo> shows it (components/kit/logo.tsx). Replace this file by unzipping the brand
 * download from Studio (halftonedesignsystem.com/studio › Use system › Brand assets): it carries
 * your logo inline, so it renders the same on a phone, in a static export and in the frames on the docs site.
 *
 * No logo (the default): <Logo> draws a placeholder square and the name, as the kit always has.
 */
export type BrandImage = {
  /** The logo as SVG text, or */
  svg?: string;
  /** as a PNG data URL (data:image/png;base64,…). */
  png?: string;
  /** Every colour in the SVG is currentColor: the logo takes the theme's text colour in light and dark. */
  mono?: boolean;
  /** Width / height. */
  aspect: number;
};

export type Brand = {
  name: string;
  /** The full logo (often a wordmark), and its dark-theme version when it isn't mono. */
  logo?: BrandImage;
  logoDark?: BrandImage;
  /** The square mark (app icon, small places); falls back to the logo. */
  mark?: BrandImage;
  markDark?: BrandImage;
};

export const BRAND: Brand = ${data};
`;
}
