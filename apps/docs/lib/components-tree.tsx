import type * as PageTree from 'fumadocs-core/page-tree';
import { icons } from 'lucide-react';
import { createElement } from 'react';
import { KitBadges } from '@/components/kit-availability';
import { entriesIn, entryUrl, GROUPS, sidesAttr } from './catalogue';

/**
 * The /components sidebar: one catalogue (apps/docs/design/components-wireframes.md). Each group is a bold title
 * with an icon (a separator), its components under it with Native / Web badges. `data-sides` lets the All | Native
 * | Web filter hide entries with CSS (app/global.css); `data-group` hides a group's title with them.
 */
export const componentsTree: PageTree.Root = {
  name: 'Components',
  children: [
    { type: 'page', name: 'All components', url: '/components' },
    ...GROUPS.flatMap((g): PageTree.Node[] => {
      const entries = entriesIn(g.id);
      if (!entries.length) return [];
      const sides = [...new Set(entries.flatMap((e) => e.sides))].join(' ');
      return [
        {
          type: 'separator',
          icon: createElement(icons[g.icon as keyof typeof icons] ?? icons.Box),
          name: (
            <span data-group={g.id} data-sides={sides}>
              {g.label}
            </span>
          ),
        },
        ...entries.map(
          (e): PageTree.Item => ({
            type: 'page',
            url: entryUrl(e.id),
            name: (
              <span data-sides={sidesAttr(e)} className="flex w-full min-w-0 items-center justify-between gap-2">
                <span className="truncate">{e.title}</span>
                <KitBadges sides={e.sides} />
              </span>
            ),
          })
        ),
      ];
    }),
  ],
};
