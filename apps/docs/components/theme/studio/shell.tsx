'use client';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { ALL_FONTS, PRESET_FONTS } from '@/components/theme/studio/parts';
import { SystemDialogs } from '@/components/theme/studio/system-dialogs';
import type { StudioDialog } from '@/components/theme/studio/systems-menu';
import { Toaster } from '@/components/theme/studio/toast';
import { holdAmbient } from '@/lib/theme/ambient';
import { redo, undo } from '@/lib/theme/store';

/**
 * What every Studio page shares (design/navigation-wireframes.md › Round two), around the notebook layout so the
 * sidebar's system switcher reaches it too: the system dialogs, the toaster, undo/redo from the keyboard, the fonts
 * the switcher and preset cards draw in, and the ambient drift held still. `data-studio` (display: contents) marks
 * the Studio for the site's CSS and carries `--studio-bar`, the toolbar's height.
 *
 * It also sends old links on: `/studio/?tab=components|accessibility` and `/studio/?view=contrast` (an old
 * /themes link) to their pages, and the item menu's "See them in Components" (`studio:tab`) to Components.
 */

const DialogContext = React.createContext<{ open: (d: StudioDialog) => void }>({ open: () => {} });
export const useStudioDialogs = () => React.use(DialogContext);

/** `/studio/components`, keeping the Components page's own query (group, kit, uses). */
const componentsUrl = (params: URLSearchParams) => {
  params.delete('tab');
  const q = params.toString();
  return `/studio/components${q ? `?${q}` : ''}`;
};

export function StudioShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [dialog, setDialog] = React.useState<StudioDialog>(null);
  const value = React.useMemo(() => ({ open: setDialog }), []);

  // The Studio shows the system being edited, so the ambient drift holds still here.
  React.useEffect(() => holdAmbient('studio'), []);

  // Old ?tab= and ?view= links (the Studio was one page with tabs).
  React.useEffect(() => {
    if (window.location.pathname.replace(/\/$/, '') !== '/studio') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') ?? (params.get('view') === 'contrast' ? 'accessibility' : null);
    if (tab === 'components') router.replace(componentsUrl(params));
    else if (tab === 'accessibility') router.replace('/studio/accessibility');
  }, [router]);

  // Show usage › "See them in Components": exactly the components that draw a token (`?uses=`), every group.
  React.useEffect(() => {
    const onTab = (e: Event) => {
      const { uses } = (e as CustomEvent<{ tab: string; uses?: string }>).detail;
      const params = new URLSearchParams(uses ? { uses } : {});
      router.push(componentsUrl(params));
    };
    window.addEventListener('studio:tab', onTab);
    return () => window.removeEventListener('studio:tab', onTab);
  }, [router]);

  // Undo / redo from the keyboard (not while typing in a field).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable], dialog')) return;
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <DialogContext value={value}>
      <div data-studio className="contents">
        {/* The switcher shows each system's name in its own heading font, and the preset cards theirs. */}
        {ALL_FONTS ? <link rel="stylesheet" href={ALL_FONTS} /> : null}
        {PRESET_FONTS ? <link rel="stylesheet" href={PRESET_FONTS} /> : null}
        {children}
        <SystemDialogs dialog={dialog} onClose={() => setDialog(null)} />
        <Toaster />
      </div>
    </DialogContext>
  );
}
