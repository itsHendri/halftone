import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { componentsTree } from '@/lib/components-tree';
import { baseOptions, notebookContainerProps } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/components'>) {
  const base = baseOptions('docs');
  return (
    // The notebook layout under the shared top bar (nav mode 'top'); the catalogue is the sidebar.
    <DocsLayout tree={componentsTree} {...base} nav={{ ...base.nav, mode: 'top' }} containerProps={notebookContainerProps}>
      {children}
    </DocsLayout>
  );
}
