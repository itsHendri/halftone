/**
 * The app icon's colours, shared by the studio's preview (components/brand/brand-specimen.tsx) and the PNGs in the
 * download (zip.ts), so what the person sees is what they get.
 */
import type { Theme } from '@halftone-ds/tokens/theme';
import type { BrandImage } from './svg';

/** Black or white, whichever reads on a background (for a one-colour mark on a custom icon colour). */
function onColour(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#09090b' : '#ffffff';
}

/** The icon's background and the colour a one-colour mark takes on it. */
export function iconColours(theme: Theme, background: string) {
  const light = theme.resolved.light;
  if (background === 'brand') return { background: light.primary, mark: light['primary-foreground'] };
  if (background === 'white') return { background: '#ffffff', mark: light.foreground };
  if (background === 'black') return { background: '#000000', mark: '#ffffff' };
  return { background, mark: onColour(background) };
}

/** The square images: the mark, or the logo when there's no mark (and their dark versions). */
export function squareImages(brand: { logo: BrandImage; logoDark?: BrandImage; mark?: BrandImage; markDark?: BrandImage }) {
  return brand.mark ? { mark: brand.mark, markDark: brand.markDark } : { mark: brand.logo, markDark: brand.logoDark };
}
