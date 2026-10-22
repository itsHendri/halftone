'use client';
import { BrandSection } from '@/components/theme/studio/brand-section';
import { ColoursSection } from '@/components/theme/studio/colours-section';
import { SectionIndex } from '@/components/theme/studio/section';
import { ComponentsSection } from '@/components/theme/studio/components-section';
import { BordersSection, CornersSection, ShadowsSection } from '@/components/theme/studio/shape-sections';
import { TypographySection } from '@/components/theme/studio/type-section';

/**
 * Foundations (wireframe 1): one scroll, a sticky section index, every item edited in a popover where it sits, its
 * menu on right-click or ⋯, and "+ New" for an extra in every section that has them. Components (Button, Chip,
 * Badge, Input) come last.
 */
export function Foundations() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:grid lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-start lg:gap-6">
      <SectionIndex />
      <div className="kit-scope flex min-w-0 flex-col gap-4">
        <BrandSection />
        <ColoursSection />
        <TypographySection />
        <CornersSection />
        <ShadowsSection />
        <BordersSection />
        <ComponentsSection />
      </div>
    </div>
  );
}
