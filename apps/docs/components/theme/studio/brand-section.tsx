'use client';
import { ImageUpIcon, Trash2Icon } from 'lucide-react';
import * as React from 'react';
import { BrandImageView } from '@/components/brand/brand-image';
import { HexField } from '@/components/theme/studio/fields';
import { Field, inputClass, ItemPopover, smallButton } from '@/components/theme/studio/item-popover';
import { FoundationSection, Segmented } from '@/components/theme/studio/section';
import { headingFamily } from '@/components/theme/studio/systems-menu';
import { iconColours, squareImages } from '@/lib/brand/icon';
import type { BrandImage } from '@/lib/brand/svg';
import { readBrandFile } from '@/lib/brand/upload';
import { setBrand, type BrandSlot, type BrandState, type IconBackground } from '@/lib/theme/brand';
import { useLiveTheme } from '@/lib/theme/store';

/**
 * Foundations › Brand (wireframe 1): five slots that always show. Until a logo is uploaded each one shows the
 * placeholder, the system's name in its heading font (its first letter as the mark, the app icon on the brand
 * colour), so previews and the kits always have a logo. Upload, replace and remove happen in the slot's popover.
 */

type Slot = { id: BrandSlot | 'icon'; label: string; tag: string; dark?: boolean; needs?: BrandSlot; square?: boolean };
const SLOTS: Slot[] = [
  { id: 'logo', label: 'Logo', tag: 'logo' },
  { id: 'logoDark', label: 'Logo dark', tag: 'logo-dark', dark: true, needs: 'logo' },
  { id: 'mark', label: 'Mark', tag: 'mark', square: true },
  { id: 'markDark', label: 'Mark dark', tag: 'mark-dark', dark: true, needs: 'mark', square: true },
  { id: 'icon', label: 'App icon', tag: 'app-icon', square: true },
];

/** The name the placeholder sets: the brand's name, or the system's. */
const brandName = (brand: BrandState, systemName: string) => brand.name.trim() || systemName;

/** What a slot draws: its own image, the one it falls back to (a dark slot shows the light one), or null. */
function slotImage(brand: BrandState, slot: Slot): BrandImage | null {
  if (slot.id === 'icon') return null;
  if (slot.id === 'logoDark') return brand.logoDark ?? brand.logo ?? null;
  if (slot.id === 'markDark') return brand.markDark ?? brand.mark ?? null;
  return brand[slot.id] ?? null;
}

/** A slot as drawn on the page and in its popover's preview. */
function SlotArt({ slot, size }: { slot: Slot; size: 'tile' | 'preview' }) {
  const { system, theme } = useLiveTheme();
  const brand = system.brand as BrandState;
  const name = brandName(brand, system.name);
  const font = { fontFamily: headingFamily(system) };
  const c = theme.resolved[slot.dark ? 'dark' : 'light'];
  const h = size === 'tile' ? 'h-20' : 'h-28';
  if (slot.id === 'icon') {
    const icon = iconColours(theme, brand.iconBackground);
    const art = brand.logo ? squareImages({ ...brand, logo: brand.logo }).mark : null;
    const box = size === 'tile' ? 56 : 80;
    return (
      <div className={`flex ${h} items-center justify-center`}>
        <span className="flex items-center justify-center rounded-[22%] shadow-sm" style={{ width: box, height: box, background: icon.background, color: icon.mark }}>
          {art ? (
            <BrandImageView image={art} height={Math.round((art.aspect >= 1 ? box * 0.6 / art.aspect : box * 0.6))} label="" />
          ) : (
            <span className="text-2xl" style={font}>
              {name.slice(0, 1)}
            </span>
          )}
        </span>
      </div>
    );
  }
  const image = slotImage(brand, slot);
  return (
    <div className={`border-border flex ${h} items-center justify-center overflow-hidden rounded-lg border px-3`} style={{ background: c.background, color: c.foreground }}>
      {image ? (
        <BrandImageView image={image} height={slot.square ? (size === 'tile' ? 40 : 56) : size === 'tile' ? 28 : 40} label="" className="max-w-full" />
      ) : (
        <span className={`truncate ${size === 'tile' ? 'text-2xl' : 'text-3xl'}`} style={font}>
          {slot.square ? name.slice(0, 1) : name}
        </span>
      )}
    </div>
  );
}

/** An SVG or PNG for a slot: pick a file or drop one (lib/brand/upload.ts checks and shrinks it). */
function Upload({ slot, replace }: { slot: BrandSlot; replace: boolean }) {
  const [error, setError] = React.useState<string | null>(null);
  const [over, setOver] = React.useState(false);
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
    <div className="flex flex-col gap-1.5">
      <label
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
        className={`focus-within:ring-ring flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm font-medium focus-within:ring-2 ${
          over ? 'border-primary bg-accent' : 'border-border hover:bg-accent'
        }`}>
        <ImageUpIcon className="size-4" aria-hidden />
        {replace ? 'Replace' : 'Upload'} SVG or PNG
        <input
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
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">An SVG is best: a one-colour SVG follows light and dark.</p>
      )}
    </div>
  );
}

const BACKGROUNDS: { value: 'brand' | 'white' | 'black' | 'custom'; label: string }[] = [
  { value: 'brand', label: 'Brand' },
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'custom', label: 'Custom' },
];

function IconBackgroundField() {
  const { system, theme } = useLiveTheme();
  const bg = (system.brand as BrandState).iconBackground;
  const kind = bg === 'brand' || bg === 'white' || bg === 'black' ? bg : 'custom';
  return (
    <>
      <Field label="Background">
        <Segmented
          label="Icon background"
          value={kind}
          options={BACKGROUNDS}
          onChange={(v) => setBrand({ iconBackground: v === 'custom' ? (theme.resolved.light.primary as IconBackground) : v })}
        />
      </Field>
      {kind === 'custom' ? (
        <Field label="Colour">
          <HexField label="Icon background" value={bg} onChange={(hex) => setBrand({ iconBackground: hex as IconBackground }, { coalesce: 'brand.icon' })} />
        </Field>
      ) : null}
    </>
  );
}

function SlotPopover({ slot }: { slot: Slot }) {
  const { system } = useLiveTheme();
  const brand = system.brand as BrandState;
  const id = `brand.${slot.tag}`;
  const own = slot.id === 'icon' ? null : (brand[slot.id] ?? null);
  const blocked = slot.needs && !brand[slot.needs];
  const nameId = React.useId();
  const status =
    slot.id === 'icon'
      ? 'The mark on the icon colour; the logo without a mark; the placeholder without either.'
      : own
        ? `${own.svg ? 'SVG' : 'PNG'}${own.mono ? ' · one colour, follows light and dark' : ''}`
        : slot.dark && !blocked
          ? `Shows the ${slot.needs} until you upload a dark version.`
          : 'Placeholder · the system name in its heading font';
  return (
    <ItemPopover
      id={id}
      title={slot.label}
      slot={slot.tag}
      trigger={
        <button
          type="button"
          aria-label={`${slot.label}: ${own ? 'uploaded' : slot.id === 'icon' ? 'app icon' : slotImage(brand, slot) ? `same as ${slot.needs}` : 'placeholder'}. Edit`}
          className="hover:bg-accent/60 focus-visible:ring-ring flex min-w-0 flex-col gap-1.5 rounded-lg p-1 text-left focus-visible:outline-none focus-visible:ring-2">
          <SlotArt slot={slot} size="tile" />
          <span className="text-muted-foreground px-0.5 text-xs">
            {slot.label}
            {own || slot.id === 'icon' ? null : <span> · {slotImage(brand, slot) ? `as ${slot.needs}` : 'placeholder'}</span>}
          </span>
        </button>
      }
      preview={<SlotArt slot={slot} size="preview" />}
      status={{ note: status }}>
      {slot.id === 'logo' ? (
        <Field label="Name" htmlFor={nameId}>
          <input
            id={nameId}
            value={brand.name}
            placeholder={system.name}
            maxLength={80}
            onChange={(e) => setBrand({ name: e.target.value }, { coalesce: 'brand.name' })}
            className={`${inputClass} w-full`}
          />
        </Field>
      ) : null}
      {slot.id === 'icon' ? (
        <IconBackgroundField />
      ) : blocked ? (
        <p className="text-muted-foreground text-sm">Upload a {slot.needs} first. A dark version is optional.</p>
      ) : (
        <>
          <Upload slot={slot.id} replace={!!own} />
          {own ? (
            <button type="button" className={`${smallButton} self-start`} onClick={() => setBrand({ [slot.id]: undefined })}>
              <Trash2Icon className="size-3.5" aria-hidden />
              Remove {slot.label.toLowerCase()}
            </button>
          ) : null}
        </>
      )}
    </ItemPopover>
  );
}

export function BrandSection() {
  return (
    <FoundationSection id="brand" title="Brand" count={SLOTS.length}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[2fr_2fr_1fr_1fr_1fr]">
        {SLOTS.map((slot) => (
          <SlotPopover key={slot.id} slot={slot} />
        ))}
      </div>
    </FoundationSection>
  );
}
