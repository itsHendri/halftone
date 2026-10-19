/**
 * Your brand, as <Logo> shows it (components/kit/logo.tsx). Replace this file by unzipping the brand
 * download from the theme studio (halftonedesignsystem.com/themes › Use theme › Brand assets): it carries
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

export const BRAND: Brand = { name: 'Halftone' };
