'use client';
import * as React from 'react';
import { BrandSpecimen } from '@/components/brand/brand-specimen';
import { GroupTiles } from '@/components/kit-tiles';
import { ContrastTable } from '@/components/theme/studio/contrast-table';
import { headingFamily } from '@/components/theme/studio/systems-menu';
import { ColourVision } from '@/components/theme/studio/vision';
import { FontFaces, IconGrid, PaletteSpecimen, ProseSample, ShapeSpecimen, TypeScale } from '@/components/theme/specimen';
import { ImageUpIcon, Trash2Icon } from 'lucide-react';
import { readBrandFile } from '@/lib/brand/upload';
import { entriesIn, GROUPS } from '@/lib/catalogue';
import { kitBrand, setBrand, type BrandSlot } from '@/lib/theme/brand';
import { useLiveTheme } from '@/lib/theme/store';

/** The Studio's tabs (design/studio-wireframes.md). Accessibility is the old Contrast view, renamed. */
export const TABS = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'components', label: 'Components' },
  { id: 'accessibility', label: 'Accessibility' },
] as const;
export type Tab = (typeof TABS)[number]['id'];

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  const id = React.useId();
  return (
    <section aria-labelledby={id} className="border-border bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        {note ? <p className="text-muted-foreground text-xs">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Until a logo is uploaded: the system's name in its heading font, its first letter as the mark, the icon on brand. */
function LogoPlaceholder() {
  const { system } = useLiveTheme();
  const name = system.brand.name.trim() || system.name;
  const font = { fontFamily: headingFamily(system) };
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_2fr_1fr_1fr_1fr]">
      {[
        { label: 'Logo', text: name, dark: false },
        { label: 'Logo dark', text: name, dark: true },
        { label: 'Mark', text: name.slice(0, 1), dark: false },
        { label: 'Mark dark', text: name.slice(0, 1), dark: true },
      ].map((slot) => (
        <figure key={slot.label} className="flex min-w-0 flex-col gap-1.5">
          <div
            className={`${slot.dark ? 'dark' : ''} bg-background text-foreground border-border flex h-20 items-center justify-center overflow-hidden rounded-lg border px-3 text-2xl`}
            style={font}>
            <span className="truncate">{slot.text}</span>
          </div>
          <figcaption className="text-muted-foreground text-xs">{slot.label}</figcaption>
        </figure>
      ))}
      <figure className="flex flex-col gap-1.5">
        <div className="flex h-20 items-center justify-center">
          <span className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-[22%] text-2xl" style={font}>
            {name.slice(0, 1)}
          </span>
        </div>
        <figcaption className="text-muted-foreground text-xs">App icon</figcaption>
      </figure>
    </div>
  );
}

const SLOTS: { slot: BrandSlot; label: string; needs?: BrandSlot }[] = [
  { slot: 'logo', label: 'Logo' },
  { slot: 'logoDark', label: 'Logo dark', needs: 'logo' },
  { slot: 'mark', label: 'Mark' },
  { slot: 'markDark', label: 'Mark dark', needs: 'mark' },
];

/** Upload, replace or remove the system's logo and mark (SVG or PNG, lib/brand/upload.ts). Undoable like any edit. */
function BrandUploads() {
  const { system } = useLiveTheme();
  const [error, setError] = React.useState<string | null>(null);
  const take = async (slot: BrandSlot, file: File | undefined) => {
    if (!file) return;
    try {
      setBrand({ [slot]: await readBrandFile(file) });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That file could not be read.');
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {SLOTS.filter((s) => !s.needs || system.brand[s.needs]).map(({ slot, label }) =>
          system.brand[slot] ? (
            <button
              key={slot}
              type="button"
              onClick={() => setBrand({ [slot]: undefined })}
              className="border-border hover:bg-accent focus-visible:ring-ring inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
              <Trash2Icon className="size-3.5" aria-hidden />
              Remove {label.toLowerCase()}
            </button>
          ) : (
            <label
              key={slot}
              className="border-border hover:bg-accent focus-within:ring-ring inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-dashed px-3 text-xs font-medium focus-within:ring-2">
              <ImageUpIcon className="size-3.5" aria-hidden />
              Upload {label.toLowerCase()}
              <input
                type="file"
                accept="image/svg+xml,image/png,.svg,.png"
                className="sr-only"
                onChange={(e) => {
                  void take(slot, e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
          )
        )}
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">An SVG is best: a one-colour logo follows light and dark. A PNG works too.</p>
      )}
    </div>
  );
}

/**
 * Foundations, read top to bottom in the order the sections will take (design/studio-wireframes.md). For now each
 * section is the live specimen of what it sets; editing in place comes with the section editors.
 */
function Foundations() {
  const { system, recipe } = useLiveTheme();
  return (
    <div className="kit-scope mx-auto flex max-w-5xl flex-col gap-4">
      <Section title="Brand">
        {kitBrand(system.brand) ? <BrandSpecimen /> : <LogoPlaceholder />}
        <BrandUploads />
      </Section>
      <Section title="Colours">
        <PaletteSpecimen />
      </Section>
      <Section title="Typography">
        <FontFaces />
        <TypeScale />
        <ProseSample />
      </Section>
      <Section title="Corners and shadows">
        <ShapeSpecimen />
      </Section>
      <Section title="Controls">
        <div className="flex flex-wrap gap-2">
          {/* The theme's button style (solid, soft, outline, raised), as both kits draw it. */}
          <span className="bg-button text-button-foreground border-button-edge inline-flex h-9 items-center rounded-md border-(length:--button-border-w) border-b-(length:--button-edge-w) px-4 text-sm font-medium shadow-sm">
            Primary
          </span>
          <span className="bg-secondary text-secondary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium">Secondary</span>
          <span className="border-border inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium">Outline</span>
          <span
            className={`bg-button text-button-foreground border-button-edge inline-flex h-9 items-center border-(length:--button-border-w) border-b-(length:--button-edge-w) px-5 text-sm font-medium ${recipe.controls === 'pill' ? 'rounded-full' : 'rounded-md'}`}>
            Mobile button
          </span>
        </div>
        {/* The theme's field style (outline, filled, underline). */}
        <div className="bg-field border-field-edge text-muted-foreground flex h-9 max-w-sm items-center rounded-t-field rounded-b-field-b border-(length:--field-border-w) border-b-(length:--field-edge-w) px-field-x text-sm shadow-(--field-shadow)">
          name@studio.com
        </div>
        <IconGrid />
      </Section>
    </div>
  );
}

/** Every catalogue tile, live on the active system. Read-only: a tile's title opens its docs page. */
function Components() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      {GROUPS.map((g) => {
        const entries = entriesIn(g.id);
        if (!entries.length) return null;
        return (
          <section key={g.id} aria-labelledby={`studio-group-${g.id}`} className="flex flex-col gap-3">
            <h2 id={`studio-group-${g.id}`} className="text-base font-semibold">
              {g.label}
            </h2>
            <GroupTiles entries={entries} label={g.label} />
          </section>
        );
      })}
    </div>
  );
}

/** Every pairing the build's contrast gate checks, light and dark, then the colour-vision previews. */
function Accessibility() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <Section title="Contrast">
        <ContrastTable />
      </Section>
      <Section title="Colour vision">
        <ColourVision />
      </Section>
    </div>
  );
}

export function Canvas({ tab }: { tab: Tab }) {
  return tab === 'foundations' ? <Foundations /> : tab === 'components' ? <Components /> : <Accessibility />;
}
