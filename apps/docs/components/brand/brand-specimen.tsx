'use client';
import type * as React from 'react';
import { BrandImageView } from '@/components/brand/brand-image';
import { iconColours, squareImages } from '@/lib/brand/icon';
import type { BrandImage } from '@/lib/brand/svg';
import { kitBrand, useBrand } from '@/lib/theme/brand';
import { useLiveTheme } from '@/lib/theme/store';

/** An image fitted into a square box (as the icon PNGs fit it), in a colour for one-colour images. */
function Fitted({ image, box, color, label }: { image: BrandImage; box: number; color: string; label: string }) {
  const height = image.aspect >= 1 ? box / image.aspect : box;
  return (
    <span style={{ color }} className="inline-flex">
      <BrandImageView image={image} height={Math.round(height)} label={label} />
    </span>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground text-xs">{children}</span>;
}

/**
 * The Overview's Logo panel: the logo on light and dark, the app icon as iOS and Android draw it, the splash
 * screens and the favicon, drawn with the same colours and proportions as the PNGs in the download.
 */
export function BrandSpecimen() {
  const state = useBrand();
  const { theme } = useLiveTheme();
  const brand = kitBrand(state);
  if (!brand) {
    return (
      <p className="text-muted-foreground text-sm leading-6">
        No logo yet. Add one under <span className="text-foreground font-medium">Logo</span>: it shows here, in both kits’ previews, and in the
        app icon, splash screen and favicon you can download.
      </p>
    );
  }
  const { light, dark } = theme.resolved;
  const icon = iconColours(theme, state.iconBackground);
  const { mark, markDark } = squareImages(brand);
  const logoOn = (scheme: 'light' | 'dark') => (scheme === 'dark' && brand.logoDark ? brand.logoDark : brand.logo);
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2">
        {(['light', 'dark'] as const).map((scheme) => {
          const c = scheme === 'light' ? light : dark;
          return (
            <div key={scheme} className="border-border flex h-24 items-center justify-center rounded-lg border px-4" style={{ background: c.background, color: c.foreground }}>
              <BrandImageView image={logoOn(scheme)} height={32} label={`${brand.name} logo, ${scheme}`} className="max-w-full" />
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-5">
        <div className="flex flex-col items-center gap-1.5">
          <span className="flex size-16 items-center justify-center rounded-[22%] shadow-sm" style={{ background: icon.background }}>
            <Fitted image={mark} box={38} color={icon.mark} label={`${brand.name} app icon, iOS`} />
          </span>
          <Caption>iOS</Caption>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          {/* Android masks the adaptive icon to a shape; the circle shows its middle two-thirds. */}
          <span className="flex size-16 items-center justify-center rounded-full shadow-sm" style={{ background: icon.background }}>
            <Fitted image={mark} box={40} color={icon.mark} label={`${brand.name} app icon, Android`} />
          </span>
          <Caption>Android</Caption>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="flex size-8 items-center justify-center rounded-md" style={{ background: icon.background }}>
            <Fitted image={mark} box={20} color={icon.mark} label={`${brand.name} favicon`} />
          </span>
          <Caption>Favicon</Caption>
        </div>
        {(['light', 'dark'] as const).map((scheme) => {
          const c = scheme === 'light' ? light : dark;
          return (
            <div key={scheme} className="flex flex-col items-center gap-1.5">
              {/* The splash: the mark 200 pt wide on a 390 pt screen. */}
              <span className="border-border flex h-[148px] w-[72px] items-center justify-center rounded-xl border" style={{ background: c.background }}>
                <Fitted image={scheme === 'dark' ? (markDark ?? mark) : mark} box={37} color={c.foreground} label={`${brand.name} splash screen, ${scheme}`} />
              </span>
              <Caption>Splash, {scheme}</Caption>
            </div>
          );
        })}
      </div>
    </div>
  );
}
