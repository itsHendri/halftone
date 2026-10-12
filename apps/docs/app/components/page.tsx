import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/notebook/page';
import { icons } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createElement } from 'react';
import { KitBadges } from '@/components/kit-availability';
import { GroupTiles } from '@/components/kit-tiles';
import { CATALOGUE, entriesIn, entryUrl, GROUPS, sidesAttr } from '@/lib/catalogue';
import { kits } from '@/lib/kit';

export const metadata: Metadata = {
  title: 'Components',
  description: 'Every component in the native and web kits, in one catalogue.',
};

const count = (side: 'native' | 'web') => CATALOGUE.filter((e) => e.sides.includes(side)).length;

/** The catalogue: every component once, grouped, as live tiles (like kumo-ui.com). The sidebar's filter narrows it. */
export default function ComponentsIndex() {
  return (
    <DocsPage full className="*:mx-auto *:w-full">
      <DocsTitle>Components</DocsTitle>
      <DocsDescription className="mb-0">
        {CATALOGUE.length} components. {count('native')} in the native kit ({kits.mobile.stack}) and {count('web')} in the web kit (
        {kits.web.stack}). Every tile is the real component, live and following the theme; open its page for the
        other kit's version, the API and how to get it.
      </DocsDescription>
      <DocsBody>
        <div className="not-prose flex flex-col gap-12">
          {GROUPS.map((g) => {
            const entries = entriesIn(g.id);
            if (!entries.length) return null;
            const sides = [...new Set(entries.flatMap((e) => e.sides))].join(' ');
            return (
              <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-24" data-group={g.id}>
                <h2 id={`${g.id}-title`} className="flex items-center gap-2 text-lg font-semibold" data-sides={sides}>
                  {createElement(icons[g.icon as keyof typeof icons] ?? icons.Box, { className: 'text-fd-muted-foreground size-5', 'aria-hidden': true })}
                  {g.label}
                  <span className="text-fd-muted-foreground text-sm font-normal">{entries.length}</span>
                </h2>
                <p className="text-fd-muted-foreground mb-4 text-sm">{g.blurb}</p>
                <GroupTiles entries={entries} label={g.label} />
                {/* The same components as links, with the kits that have them: for the keyboard, search engines and
                    anyone who wants the list. The filter hides what it hides in the sidebar. */}
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                  {entries.map((e) => (
                    <li key={e.id}>
                      <Link href={entryUrl(e.id)} className="hover:text-fd-foreground text-fd-muted-foreground inline-flex items-center gap-1.5 underline-offset-4 hover:underline">
                        <span data-sides={sidesAttr(e)} className="inline-flex items-center gap-1.5">
                          {e.title}
                          <KitBadges sides={e.sides} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </DocsBody>
    </DocsPage>
  );
}
