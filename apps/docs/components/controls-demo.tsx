'use client';
/**
 * Docs › Controls: the web kit's ControlPanel as a card designer's inspector, beside the card it edits. The Controls in
 * components/controls are installed from the registry (`npm run docs:sync`), so the page shows what an install gets.
 */
import * as React from 'react';
import { ControlPanel, useControls } from '@/components/controls/control-panel';
import { bezierToCss, type Bezier } from '@/lib/controls/bezier';
import type { ControlConfig } from '@/lib/controls/schema';

const CONFIG: ControlConfig = {
  radius: { type: 'number', default: 12, min: 0, max: 32, step: 1, unit: 'px' },
  padding: { type: 'number', default: 20, min: 8, max: 40, step: 2, unit: 'px' },
  bordered: true,
  align: { type: 'select', options: ['start', 'center', 'end'] },
  entrance: {
    type: 'section',
    controls: {
      distance: { type: 'number', default: 16, min: 0, max: 64, step: 1, unit: 'px' },
      duration: { type: 'number', default: 300, min: 100, max: 1000, step: 10, unit: 'ms' },
      easing: { type: 'easing', default: [0.2, 0, 0, 1] },
    },
  },
};

const PRESETS = [
  { name: 'Quiet', values: { radius: 6, padding: 16, bordered: true } },
  { name: 'Soft', values: { radius: 24, padding: 28, bordered: false } },
];

type Values = { radius: number; padding: number; bordered: boolean; align: 'start' | 'center' | 'end'; entrance: { distance: number; duration: number; easing: Bezier } };

export function ControlsDemo() {
  const c = useControls(CONFIG);
  const v = c.values as Values;
  const card = React.useRef<HTMLDivElement>(null);
  const replay = React.useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    card.current?.animate([{ opacity: 0, transform: `translateY(${v.entrance.distance}px)` }, { opacity: 1, transform: 'none' }], {
      duration: v.entrance.duration,
      easing: bezierToCss(v.entrance.easing),
    });
  }, [v.entrance.distance, v.entrance.duration, v.entrance.easing]);
  React.useEffect(replay, [replay]);

  return (
    <div className="not-prose kit-scope my-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="bg-muted-subtle border-border flex min-h-72 items-center justify-center rounded-xl border p-6 md:sticky md:top-24 md:self-start">
        <div
          ref={card}
          className={`bg-card text-card-foreground flex w-full max-w-64 flex-col gap-2 shadow-sm ${v.bordered ? 'border-border border' : ''}`}
          style={{ borderRadius: v.radius, padding: v.padding, textAlign: v.align === 'center' ? 'center' : v.align === 'end' ? 'right' : 'left' }}>
          <p className="text-sm font-semibold">Invoice sent</p>
          <p className="text-muted-foreground text-sm">Lumen Labs has it. You’ll hear when they pay.</p>
          <button type="button" onClick={replay} className="text-foreground mt-1 self-stretch text-sm font-medium underline underline-offset-2">
            Play the entrance
          </button>
        </div>
      </div>
      <ControlPanel title="Card" nodes={c.nodes} values={c.values} onChange={c.setValues} presets={PRESETS} />
    </div>
  );
}
