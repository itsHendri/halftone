import type * as PageTree from 'fumadocs-core/page-tree';
import { icons } from 'lucide-react';
import { createElement } from 'react';
import { entriesIn, entryUrl, GROUPS } from './catalogue';

/**
 * The /components sidebar (apps/docs/design/navigation-wireframes.md › Round two): Overview, then each group as a
 * bold title with an icon (like the Docs sidebar) and its components as plain rows. Which kits have a component is
 * said on its card and its page, not here.
 */
export const componentsTree: PageTree.Root = {
  name: 'Components',
  children: [
    { type: 'page', name: 'Overview', url: '/components' },
    ...GROUPS.flatMap((g): PageTree.Node[] => {
      const entries = entriesIn(g.id);
      if (!entries.length) return [];
      return [
        { type: 'separator', icon: createElement(icons[g.icon as keyof typeof icons] ?? icons.Box), name: g.label },
        ...entries.map((e): PageTree.Item => ({ type: 'page', url: entryUrl(e.id), name: e.title })),
      ];
    }),
  ],
};
