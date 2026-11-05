import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { StudioShell } from '@/components/theme/studio/shell';
import { StudioItem, StudioSystems } from '@/components/theme/studio/sidebar';
import { baseOptions, notebookContainerProps } from '@/lib/layout.shared';
import { studioTree } from '@/lib/studio/tree';

/**
 * Studio in the site's one shell (design/navigation-wireframes.md › Round two): the same top bar and notebook
 * sidebar as Docs and Components. The sidebar's banner is the system switcher; its groups are Foundations,
 * Components and Accessibility.
 */
export default function Layout({ children }: LayoutProps<'/studio'>) {
  const base = baseOptions('docs');
  return (
    <StudioShell>
      <DocsLayout
        tree={studioTree}
        {...base}
        nav={{ ...base.nav, mode: 'top' }}
        containerProps={notebookContainerProps}
        sidebar={{ banner: <StudioSystems />, components: { Item: StudioItem } }}>
        {children}
      </DocsLayout>
    </StudioShell>
  );
}
