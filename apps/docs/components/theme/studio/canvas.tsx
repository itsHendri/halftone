'use client';
import * as React from 'react';
import { GroupTiles } from '@/components/kit-tiles';
import { ContrastTable } from '@/components/theme/studio/contrast-table';
import { Foundations } from '@/components/theme/studio/foundations';
import { ColourVision } from '@/components/theme/studio/vision';
import { entriesIn, GROUPS } from '@/lib/catalogue';

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
