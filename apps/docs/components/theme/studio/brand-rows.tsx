'use client';
import { CheckIcon, ImageUpIcon, Trash2Icon } from 'lucide-react';
import * as React from 'react';
import { BrandImageView } from '@/components/brand/brand-image';
import { readBrandFile } from '@/lib/brand/upload';
import { rovingKeyDown, rovingTabIndex } from '@/lib/roving';
import { setBrand, useBrand, type BrandSlot, type IconBackground } from '@/lib/theme/brand';
import { useLiveTheme } from '@/lib/theme/store';
import { Group, Row } from './rail';

const HINTS = {
  name: "Your product's name: read out wherever the logo appears, and shown where there's no logo.",
  logo: 'An SVG (best: it stays sharp, and a one-colour logo follows light and dark) or a PNG.',
  logoDark: 'For dark backgrounds. A one-colour logo needs none: it takes the theme’s text colour.',
  mark: 'A square symbol for the app icon, favicon and small places. Without one, the logo is fitted into the square.',
  markDark: 'The mark for dark backgrounds (the dark splash screen).',
  icon: 'Behind the mark on the app icon and favicon.',
};

/** Drop or pick an image for one slot; replace or remove it. */
function ImageField({ slot, label }: { slot: BrandSlot; label: string }) {
  const brand = useBrand();
  const image = brand[slot];
  const [error, setError] = React.useState<string | null>(null);
  const [over, setOver] = React.useState(false);
  const id = `brand-${slot}`;
  const take = async (file: File | undefined) => {
    if (!file) return;
    try {
      setBrand({ [slot]: await readBrandFile(file) });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That file could not be read.');
    }
  };
  return (
    <div className="flex flex-col gap-2 p-1.5">
      {image ? (
        <div className="grid grid-cols-2 gap-1.5">
          <div className="kit-light bg-background text-foreground flex h-16 items-center justify-center rounded-md border px-2">
            <BrandImageView image={image} height={28} label={`${label} on light`} />
          </div>
          <div className="kit-dark dark bg-background text-foreground flex h-16 items-center justify-center rounded-md border px-2">
            <BrandImageView image={image} height={28} label={`${label} on dark`} />
          </div>
          <p className="text-muted-foreground col-span-2 text-xs leading-5">
            {image.mono ? 'One colour: it takes the theme’s text colour in light and dark.' : image.png ? 'A PNG, shown as it is.' : 'Coloured: shown as it is.'}
          </p>
        </div>
      ) : null}
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void take(e.dataTransfer.files[0]);
        }}
        className={`border-border hover:bg-accent focus-within:ring-ring flex cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed px-3 py-3 text-center text-xs focus-within:ring-2 ${over ? 'bg-accent' : ''}`}>
        <ImageUpIcon className="text-muted-foreground size-4" aria-hidden />
        <span className="font-medium">{image ? 'Replace' : 'Drop an SVG or PNG, or choose a file'}</span>
        <input
          id={id}
          type="file"
          accept="image/svg+xml,image/png,.svg,.png"
          className="sr-only"
          onChange={(e) => {
            void take(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
      {error ? (
        <p role="alert" className="text-destructive text-xs leading-5">
          {error}
        </p>
      ) : null}
      {image ? (
        <button
          type="button"
          onClick={() => setBrand({ [slot]: undefined })}
          className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring inline-flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
          <Trash2Icon className="size-3.5" aria-hidden />
          Remove
        </button>
      ) : null}
    </div>
  );
}

const BACKGROUNDS: { id: Exclude<IconBackground, `#${string}`>; label: string }[] = [
  { id: 'brand', label: 'Brand colour' },
  { id: 'white', label: 'White' },
  { id: 'black', label: 'Black' },
];

function IconBackgroundField({ close }: { close: () => void }) {
  const brand = useBrand();
  const { recipe } = useLiveTheme();
  const custom = brand.iconBackground.startsWith('#') ? brand.iconBackground : null;
  const checked = BACKGROUNDS.findIndex((b) => b.id === brand.iconBackground);
  const swatch = (id: IconBackground) => (id === 'brand' ? recipe.brand : id === 'white' ? '#ffffff' : id === 'black' ? '#000000' : id);
  return (
    <div className="flex flex-col gap-2 p-1">
      <div role="radiogroup" aria-label="App icon background" className="flex flex-col" onKeyDown={(e) => rovingKeyDown(e)}>
        {BACKGROUNDS.map((b, i) => (
          <button
            key={b.id}
            type="button"
            role="radio"
            aria-checked={brand.iconBackground === b.id}
            tabIndex={rovingTabIndex(i, checked)}
            onClick={() => {
              setBrand({ iconBackground: b.id });
              close();
            }}
            className="hover:bg-accent focus-visible:bg-accent flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm focus-visible:outline-none">
            <span className="ring-border size-4 shrink-0 rounded ring-1" style={{ background: swatch(b.id) }} aria-hidden />
            <span className="flex-1">{b.label}</span>
            {brand.iconBackground === b.id ? <CheckIcon className="size-4" aria-hidden /> : null}
          </button>
        ))}
      </div>
      <label className="text-muted-foreground flex items-center gap-2 px-2 text-xs">
        <span className="border-border relative size-6 shrink-0 cursor-pointer overflow-hidden rounded border" style={{ background: custom ?? '#ffffff' }}>
          <input
            type="color"
            value={custom ?? '#ffffff'}
            onChange={(e) => setBrand({ iconBackground: e.target.value as IconBackground })}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </span>
        Any colour{custom ? `: ${custom.toUpperCase()}` : ''}
      </label>
    </div>
  );
}

/** The studio's Logo group: name, logo (and a dark one), mark, and the app icon's background. */
export function BrandGroup() {
  const brand = useBrand();
  const { recipe } = useLiveTheme();
  const describe = (slot: BrandSlot) => {
    const image = brand[slot];
    if (!image) return slot === 'mark' ? (brand.logo ? 'From the logo' : 'None') : 'Add';
    return image.mono ? 'One colour' : image.png ? 'PNG' : 'Coloured';
  };
  const thumb = (slot: BrandSlot) => {
    const image = brand[slot];
    return image ? <BrandImageView image={image} height={16} label="" className="max-w-16" /> : null;
  };
  const iconBg = brand.iconBackground === 'brand' ? recipe.brand : brand.iconBackground === 'white' ? '#ffffff' : brand.iconBackground === 'black' ? '#000000' : brand.iconBackground;
  return (
    <Group title="Logo">
      <Row label="Name" value={brand.name || 'Not set'} hint={HINTS.name}>
        {() => (
          <div className="p-1.5">
            <label htmlFor="brand-name" className="sr-only">
              Product name
            </label>
            <input
              id="brand-name"
              value={brand.name}
              placeholder="Northwind"
              maxLength={80}
              onChange={(e) => setBrand({ name: e.target.value })}
              className="border-border bg-background focus-visible:ring-ring h-9 w-full rounded-lg border px-3 text-sm focus-visible:outline-none focus-visible:ring-2"
            />
          </div>
        )}
      </Row>
      <Row label="Logo" value={describe('logo')} adornment={thumb('logo')} hint={HINTS.logo} wide>
        {() => <ImageField slot="logo" label="Logo" />}
      </Row>
      {brand.logo && !brand.logo.mono ? (
        <Row label="Dark logo" value={describe('logoDark')} adornment={thumb('logoDark')} hint={HINTS.logoDark} wide>
          {() => <ImageField slot="logoDark" label="Dark logo" />}
        </Row>
      ) : null}
      <Row label="Mark" value={describe('mark')} adornment={thumb('mark')} hint={HINTS.mark} wide>
        {() => <ImageField slot="mark" label="Mark" />}
      </Row>
      {brand.mark && !brand.mark.mono ? (
        <Row label="Dark mark" value={describe('markDark')} adornment={thumb('markDark')} hint={HINTS.markDark} wide>
          {() => <ImageField slot="markDark" label="Dark mark" />}
        </Row>
      ) : null}
      <Row
        label="App icon"
        value={BACKGROUNDS.find((b) => b.id === brand.iconBackground)?.label ?? brand.iconBackground.toUpperCase()}
        adornment={<span className="ring-border size-4 shrink-0 rounded ring-1" style={{ background: iconBg }} aria-hidden />}
        hint={HINTS.icon}>
        {(close) => <IconBackgroundField close={close} />}
      </Row>
    </Group>
  );
}
