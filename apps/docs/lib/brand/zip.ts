/**
 * The brand download: every file a kit needs, laid out like the kit, zipped. Unzip it at the kit root (or the
 * monorepo root for `repo`).
 *
 *   mobile  assets/images/{icon,adaptive-icon,splash,splash-dark,favicon}.png, assets/brand/brand.json
 *           (app.config.ts reads it: icon background, splash colours), lib/brand.ts
 *   web     app/icon.png, app/apple-icon.png (Next's file conventions), lib/brand.ts
 *   repo    both, under apps/mobile and apps/web
 */
import { zipSync } from 'fflate';
import type { Theme } from '@halftone-ds/tokens/theme';
import { iconColours, squareImages } from './icon';
import { brandModule } from './module';
import { renderPng } from './raster';
import type { BrandImage } from './svg';

export { brandModule, iconColours };
export type BrandFiles = Record<string, Uint8Array>;
type Brand = { name: string; logo: BrandImage; logoDark?: BrandImage; mark?: BrandImage; markDark?: BrandImage };

const text = (s: string) => new TextEncoder().encode(s);

async function mobileFiles(brand: Brand, theme: Theme, iconBackground: string): Promise<BrandFiles> {
  const { mark, markDark } = squareImages(brand);
  const icon = iconColours(theme, iconBackground);
  const { light, dark } = theme.resolved;
  return {
    // iOS: opaque, full bleed (the system rounds it). The mark sits in the middle 60%.
    'assets/images/icon.png': await renderPng(mark, { size: 1024, background: icon.background, scale: 0.6, color: icon.mark }),
    // Android: the system draws the background (brand.json) and masks a shape; the mark stays in the 66% safe zone.
    'assets/images/adaptive-icon.png': await renderPng(mark, { size: 1024, scale: 0.42, color: icon.mark }),
    // Splash: the mark, shown 200 pt wide on the theme's background (app.config.ts).
    'assets/images/splash.png': await renderPng(mark, { size: 1024, scale: 1, color: light.foreground }),
    'assets/images/splash-dark.png': await renderPng(markDark ?? mark, { size: 1024, scale: 1, color: dark.foreground }),
    'assets/images/favicon.png': await renderPng(mark, { size: 48, background: icon.background, scale: 0.7, color: icon.mark }),
    'assets/brand/brand.json': text(
      `${JSON.stringify({ iconBackground: icon.background, splashBackground: light.background, splashBackgroundDark: dark.background }, null, 2)}\n`
    ),
    'lib/brand.ts': text(brandModule(brand)),
  };
}

async function webFiles(brand: Brand, theme: Theme, iconBackground: string): Promise<BrandFiles> {
  const { mark } = squareImages(brand);
  const icon = iconColours(theme, iconBackground);
  return {
    'app/icon.png': await renderPng(mark, { size: 512, background: icon.background, scale: 0.62, color: icon.mark }),
    'app/apple-icon.png': await renderPng(mark, { size: 180, background: icon.background, scale: 0.6, color: icon.mark }),
    'lib/brand.ts': text(brandModule(brand)),
  };
}

const prefix = (files: BrandFiles, dir: string) => Object.fromEntries(Object.entries(files).map(([p, v]) => [`${dir}/${p}`, v]));

/** The files for a kit (or the monorepo), unzipped. */
export async function brandFiles(target: 'mobile' | 'web' | 'repo', brand: Brand, theme: Theme, iconBackground: string): Promise<BrandFiles> {
  if (target === 'mobile') return mobileFiles(brand, theme, iconBackground);
  if (target === 'web') return webFiles(brand, theme, iconBackground);
  return { ...prefix(await mobileFiles(brand, theme, iconBackground), 'apps/mobile'), ...prefix(await webFiles(brand, theme, iconBackground), 'apps/web') };
}

/** The zip itself. */
export async function brandZip(target: 'mobile' | 'web' | 'repo', brand: Brand, theme: Theme, iconBackground: string) {
  return zipSync(await brandFiles(target, brand, theme, iconBackground), { level: 6 });
}
