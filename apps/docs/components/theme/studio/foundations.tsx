'use client';
import { BrandSection } from '@/components/theme/studio/brand-section';
import { ColoursSection } from '@/components/theme/studio/colours-section';
import { FoundationSection, SectionIndex } from '@/components/theme/studio/section';
import { FontFaces, IconGrid, ProseSample, ShapeSpecimen, TypeScale } from '@/components/theme/specimen';
import { useLiveTheme } from '@/lib/theme/store';

/** The live controls: the button and field styles as both kits draw them, and the icons at the theme's stroke. */
function ControlsSpecimen() {
  const { recipe } = useLiveTheme();
  return (
    <>
      <div className="flex flex-wrap gap-2">
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
      <div className="bg-field border-field-edge text-muted-foreground flex h-9 max-w-sm items-center rounded-t-field rounded-b-field-b border-(length:--field-border-w) border-b-(length:--field-edge-w) px-field-x text-sm shadow-(--field-shadow)">
        name@studio.com
      </div>
      <IconGrid />
    </>
  );
}

/**
 * Foundations (wireframe 1): one scroll, a sticky section index, every item edited in a popover where it sits.
 * Brand and Colours are edited in place; Typography, Corners, Shadows, Borders and Controls show their live specimens
 * until their editors land (Studio phase 4b).
 */
export function Foundations() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:grid lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-start lg:gap-6">
      <SectionIndex />
      <div className="kit-scope flex min-w-0 flex-col gap-4">
        <BrandSection />
        <ColoursSection />
        <FoundationSection id="typography" title="Typography">
          <FontFaces />
          <TypeScale />
          <ProseSample />
        </FoundationSection>
        <FoundationSection id="corners" title="Corners">
          <ShapeSpecimen />
        </FoundationSection>
        <FoundationSection id="shadows" title="Shadows">
          <p className="text-muted-foreground text-sm">Depth shows with Corners until the shadow editor lands.</p>
        </FoundationSection>
        <FoundationSection id="borders" title="Borders">
          <div className="flex gap-3">
            <span className="border-border bg-background flex h-12 flex-1 items-center rounded-md border px-3 text-sm">Default</span>
            <span className="border-input bg-background flex h-12 flex-1 items-center rounded-md border px-3 text-sm">Input</span>
          </div>
        </FoundationSection>
        <FoundationSection id="controls" title="Controls">
          <ControlsSpecimen />
        </FoundationSection>
      </div>
    </div>
  );
}
