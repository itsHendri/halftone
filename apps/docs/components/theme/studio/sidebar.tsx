'use client';
import type * as PageTree from 'fumadocs-core/page-tree';
import { SidebarItem } from 'fumadocs-ui/components/sidebar/base';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { SystemsMenu } from '@/components/theme/studio/systems-menu';
import { useStudioDialogs } from '@/components/theme/studio/shell';
import { failingCount } from '@/lib/studio/accessibility';
import { useCurrentSection } from '@/lib/studio/current-section';
import { useLiveTheme } from '@/lib/theme/store';

/**
 * The Studio's sidebar pieces (design/navigation-wireframes.md › Round two): the same notebook sidebar as Docs and
 * Components, with the system switcher in its banner slot and Foundations' rows following the section being read.
 */

/** The banner slot: the system switcher (its dialogs live in the Studio shell). */
export function StudioSystems() {
  const { open } = useStudioDialogs();
  return (
    <div className="flex">
      <SystemsMenu onDialog={open} />
    </div>
  );
}

/** Accessibility's count of pairings below AA, on its sidebar row. */
export function FailingBadge() {
  const { theme } = useLiveTheme();
  const n = failingCount(theme);
  if (!n) return null;
  return (
    <span className="bg-destructive text-destructive-foreground ms-auto rounded-full px-1.5 text-xs tabular-nums">
      {n}
      <span className="sr-only"> {n === 1 ? 'pairing' : 'pairings'} below AA</span>
    </span>
  );
}

// The notebook layout's item look (fumadocs-ui layouts/notebook/slots/sidebar.js, `itemVariants` link), which it
// doesn't export; check it on an upgrade. The site's active colour comes from app/global.css.
const itemClass =
  // eslint-disable-next-line halftone/no-alpha-colour -- Fumadocs' own sidebar item classes, so Studio's rows match the Docs and Components rows it renders with them
  'relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere [&_svg]:size-4 [&_svg]:shrink-0 transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 hover:transition-none data-[active=true]:bg-fd-primary/10 data-[active=true]:text-fd-primary data-[active=true]:hover:transition-colors';

/**
 * A Studio sidebar row. Foundations' rows are anchors on /studio (`/studio#foundations-colours`): active for the
 * section being read. The others are pages, active on their path.
 */
export function StudioItem({ item }: { item: PageTree.Item }) {
  const pathname = (usePathname() ?? '/').replace(/\/$/, '') || '/';
  const section = useCurrentSection();
  const [path, hash] = item.url.split('#');
  const active = hash ? pathname === path && hash === `foundations-${section}` : pathname === path.replace(/\/$/, '');
  return (
    <SidebarItem href={item.url} active={active} aria-current={active ? (hash ? 'location' : 'page') : undefined} className={itemClass} style={{ paddingInlineStart: 'calc(2 * var(--spacing))' }}>
      {item.name}
    </SidebarItem>
  );
}
