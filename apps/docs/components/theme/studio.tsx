'use client';
import * as React from 'react';
import { Canvas, VIEWS, ViewSwitcher, type View } from '@/components/theme/studio/canvas';
import { ALL_FONTS, PRESET_FONTS } from '@/components/theme/studio/parts';
import { InvertedSchemeStyle, Rail } from '@/components/theme/studio/rail';
import { redo, undo } from '@/lib/theme/store';

/**
 * The theme studio (/themes), laid out like ui.shadcn.com/create: a floating control rail in the opposite
 * scheme on the left, the preview filling the rest, and a 01–05 switcher between previews: an overview this
 * site renders (instant), the native kit, the web kit, the typeset beside components, and every contrast pairing. The view is kept
 * in `?view=`. Below lg the rail is a panel over the preview, opened from the switcher's Theme button.
 */
export function ThemeStudio() {
  const [view, setView] = React.useState<View>('overview');
  // Below lg the rail is a panel over the preview, opened from the switcher.
  const [controls, setControls] = React.useState(false);

  // ?view= in, and out on every change (the page is static: read it on the client).
  React.useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    if (VIEWS.some((x) => x.id === v)) setView(v as View);
  }, []);
  const changeView = (v: View) => {
    setView(v);
    const url = new URL(window.location.href);
    if (v === 'overview') url.searchParams.delete('view');
    else url.searchParams.set('view', v);
    window.history.replaceState(window.history.state, '', url);
  };

  // Undo / redo from the keyboard (not while typing in a field).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div data-studio className="bg-muted/40 relative flex w-full flex-1 flex-col lg:block lg:h-[calc(100dvh-3.5rem)] lg:flex-none lg:overflow-hidden">
      {/* The font pickers show every font in its face, and the preset cards theirs. */}
      {ALL_FONTS ? <link rel="stylesheet" href={ALL_FONTS} /> : null}
      {PRESET_FONTS ? <link rel="stylesheet" href={PRESET_FONTS} /> : null}
      <InvertedSchemeStyle />
      <h1 className="sr-only">Theme studio</h1>

      {/* Focusable: it scrolls on its own from lg up, so the keyboard needs to reach it. */}
      <div tabIndex={0} role="region" aria-label="Preview" className="focus-visible:ring-ring order-1 min-w-0 px-4 pb-24 pt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset sm:px-6 lg:h-full lg:overflow-y-auto lg:pl-[19rem] lg:pr-6">
        <Canvas view={view} />
      </div>

      <Rail
        id="studio-controls"
        className={`max-lg:fixed max-lg:inset-x-3 max-lg:bottom-20 max-lg:top-16 max-lg:z-40 lg:absolute lg:inset-y-4 lg:left-4 lg:w-64 ${controls ? '' : 'max-lg:hidden'}`}
      />

      <div className="fixed bottom-4 right-4 z-30 flex gap-2 max-lg:left-4 max-lg:justify-center">
        <ViewSwitcher view={view} onChange={changeView} controls={controls} onControls={() => setControls((c) => !c)} />
      </div>
    </div>
  );
}
