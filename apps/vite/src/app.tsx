import { FolderKanbanIcon, LayoutDashboardIcon, SettingsIcon } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { AppShell } from '@/components/kit/app-shell';
import { Spinner } from '@/components/kit/spinner';

// Each page loads when it's first opened, so the chart library only comes with the overview.
const Overview = lazy(() => import('./pages/overview').then((m) => ({ default: m.Overview })));
const Projects = lazy(() => import('./pages/projects').then((m) => ({ default: m.Projects })));
const Settings = lazy(() => import('./pages/settings').then((m) => ({ default: m.Settings })));
const NotFound = lazy(() => import('./pages/not-found').then((m) => ({ default: m.NotFound })));

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboardIcon },
  { href: '/projects', label: 'Projects', icon: FolderKanbanIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

/** The app's frame and its routes. Add a page: a file in pages/, a lazy import and a <Route> here, an entry in NAV. */
export function App() {
  return (
    <AppShell brand={<span className="type-large">Acme</span>} nav={NAV}>
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Spinner aria-label="Loading the page" />
          </div>
        }>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
