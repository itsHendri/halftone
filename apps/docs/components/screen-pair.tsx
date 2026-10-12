'use client';
import * as React from 'react';
import { BrowserFrame } from '@/components/browser-frame';
import { PhoneFrame } from '@/components/phone-frame';
import { phoneFrameHeight } from '@/lib/device';

export type PairScreen = {
  label: string;
  /** The native kit's route. */
  native: string;
  /** The web kit's route. */
  web: string;
  note: string;
};

const PHONE_WIDTH = 270;

/**
 * One sample product on both devices: the native kit in a phone, the web kit in a browser as tall as the phone,
 * and a picker that moves both to the same screen. Each frame remounts on a new path (its src is built once).
 */
export function ScreenPair({ product, screens }: { product: string; screens: PairScreen[] }) {
  const [index, setIndex] = React.useState(0);
  const screen = screens[index];
  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label={`${product} screens`} className="flex flex-wrap gap-2">
        {screens.map((s, i) => (
          <button
            key={s.label}
            type="button"
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
            className={`focus-visible:ring-ring rounded-full border px-3.5 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${
              i === index ? 'bg-foreground border-foreground text-background' : 'border-border hover:bg-accent'
            }`}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
        <figure className="flex shrink-0 flex-col items-center gap-2">
          <PhoneFrame key={screen.native} path={screen.native} title={`${product}, ${screen.label}, native, live`} width={PHONE_WIDTH} />
          <figcaption className="text-muted-foreground text-xs font-medium">Native</figcaption>
        </figure>
        <figure className="flex w-full min-w-0 flex-col items-center gap-2 lg:flex-1">
          <BrowserFrame key={screen.web} path={screen.web} title={`${product}, ${screen.label}, web, live`} height={phoneFrameHeight(PHONE_WIDTH)} />
          <figcaption className="text-muted-foreground text-xs font-medium">Web</figcaption>
        </figure>
      </div>
      <p aria-live="polite" className="text-muted-foreground text-sm">
        {screen.note}
      </p>
    </div>
  );
}
