import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/notebook/page';
import { icons } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createElement } from 'react';
import { InlineMd } from '@/components/inline-md';
import { KitBadges } from '@/components/kit-availability';
import { CATALOGUE, entriesIn, entryUrl, GROUPS, sidesAttr } from '@/lib/catalogue';
import { kits } from '@/lib/kit';

export const metadata: Metadata = {
  title: 'Components',
  description: 'Every component in the native and web kits, in one catalogue.',
};

const count = (side: 'native' | 'web') => CATALOGUE.filter((e) => e.sides.includes(side)).length;

/** The catalogue: every component once, grouped, with the kits that have it. The filter in the sidebar narrows it. */
export default function ComponentsIndex() {
  return (
    <DocsPage full className="*:mx-auto *:w-full">
      <DocsTitle>Components</DocsTitle>
      <DocsDescription className="mb-0">
        {CATALOGUE.length} components. {count('native')} in the native kit ({kits.mobile.stack}) and {count('web')} in the web kit (
        {kits.web.stack}); the badges say which. Each one is live on its page and follows the theme.
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
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {entries.map((e) => {
                    const c = (e.native ?? e.web)!;
                    return (
                      <li key={e.id} className="contents">
                        <Link
                          href={entryUrl(e.id)}
                          className="border-border bg-card hover:bg-accent focus-visible:ring-ring flex flex-col gap-1.5 rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2">
                          <span data-sides={sidesAttr(e)} className="flex items-center justify-between gap-3">
                            <span className="font-medium">{e.title}</span>
                            <KitBadges sides={e.sides} />
                          </span>
                          {c.notes ? (
                            <span className="text-fd-muted-foreground line-clamp-2 text-sm">
                              <InlineMd text={c.notes} />
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </DocsBody>
    </DocsPage>
  );
}
