import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/notebook/page';
import { icons } from 'lucide-react';
import type { Metadata } from 'next';
import { createElement } from 'react';
import { GroupTiles } from '@/components/kit-tiles';
import { CATALOGUE, entriesIn, GROUPS } from '@/lib/catalogue';
import { kits } from '@/lib/kit';

export const metadata: Metadata = {
  title: 'Components',
  description: 'Every component in the native and web kits, in one catalogue.',
};

const count = (side: 'native' | 'web') => CATALOGUE.filter((e) => e.sides.includes(side)).length;

/**
 * The catalogue's overview (apps/docs/design/navigation-wireframes.md › Round two): every component once, grouped,
 * as cards like untitledui.com's: a live canvas, the name, and which kits have it. The sidebar is the list.
 */
export default function ComponentsIndex() {
  return (
    <DocsPage full className="*:mx-auto *:w-full">
      <DocsTitle>Components</DocsTitle>
      <DocsDescription className="mb-0">
        {CATALOGUE.length} components: {count('native')} in the native kit ({kits.mobile.stack}) and {count('web')} in the web kit (
        {kits.web.stack}). Every card is the real component, live and following the theme.
      </DocsDescription>
      <DocsBody>
        <div className="not-prose flex flex-col gap-14">
          {GROUPS.map((g) => {
            const entries = entriesIn(g.id);
            if (!entries.length) return null;
            return (
              <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-24">
                <h2 id={`${g.id}-title`} className="flex items-center gap-2 text-lg font-semibold">
                  {createElement(icons[g.icon as keyof typeof icons] ?? icons.Box, { className: 'text-fd-muted-foreground size-5', 'aria-hidden': true })}
                  {g.label}
                </h2>
                <p className="text-fd-muted-foreground mb-5 text-sm">{g.blurb}</p>
                <GroupTiles entries={entries} label={g.label} />
              </section>
            );
          })}
        </div>
      </DocsBody>
    </DocsPage>
  );
}
