import type * as PageTree from 'fumadocs-core/page-tree';
import { icons } from 'lucide-react';
import { createElement } from 'react';
import { FailingBadge } from '@/components/theme/studio/sidebar';
import { FOUNDATION_SECTIONS, sectionAnchor } from './sections';

/**
 * The Studio sidebar (design/navigation-wireframes.md › Round two): its old Foundations / Components /
 * Accessibility tabs as groups. Foundations' rows are anchors on /studio; the other two are pages.
 */
const group = (name: string, icon: keyof typeof icons): PageTree.Separator => ({ type: 'separator', name, icon: createElement(icons[icon]) });

export const studioTree: PageTree.Root = {
  name: 'Studio',
  children: [
    group('Foundations', 'Palette'),
    ...FOUNDATION_SECTIONS.map((s): PageTree.Item => ({ type: 'page', name: s.label, url: `/studio#${sectionAnchor(s.id)}` })),
    group('Components', 'LayoutGrid'),
    { type: 'page', name: 'All components', url: '/studio/components' },
    group('Accessibility', 'Contrast'),
    {
      type: 'page',
      name: (
        <span className="flex w-full items-center gap-2">
          Contrast
          <FailingBadge />
        </span>
      ),
      url: '/studio/accessibility',
    },
  ],
};
