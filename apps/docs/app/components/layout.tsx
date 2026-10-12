import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { KitFilter } from '@/components/kit-availability';
import { componentsTree } from '@/lib/components-tree';
import { baseOptions, notebookContainerProps } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/components'>) {
  const base = baseOptions('docs');
  return (
    // The notebook layout under the shared top bar (nav mode 'top'); the catalogue is the sidebar, the
    // All | Native | Web filter above it.
    <DocsLayout tree={componentsTree} {...base} nav={{ ...base.nav, mode: 'top' }}
      containerProps={notebookContainerProps}
      sidebar={{ banner: <KitFilter /> }}
    >
      {children}
    </DocsLayout>
  );
}
