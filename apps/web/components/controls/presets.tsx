'use client';
import { cn } from 'cn';
import { CheckIcon } from 'lucide-react';
import type { Values } from '@/lib/controls/schema';

export type Preset = { name: string; values: Values };

/** Whether `values` holds everything the preset sets (it may set only some of the controls). */
export function matchesPreset(values: Values, preset: Values): boolean {
  return Object.entries(preset).every(([k, v]) => {
    const have = values[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && have && typeof have === 'object' && !Array.isArray(have)) return matchesPreset(have as Values, v as Values);
    return JSON.stringify(have) === JSON.stringify(v);
  });
}

/**
 * Named sets of values a panel can jump to. The one the panel matches now is pressed and carries a check, so it reads
 * without colour. A preset may set only some controls; the rest keep their values.
 */
export function Presets({ presets, values, onApply, label = 'Presets', className }: { presets: readonly Preset[]; values: Values; onApply: (preset: Preset) => void; label?: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap gap-1.5', className)}>
      {presets.map((p) => {
        const on = matchesPreset(values, p.values);
        return (
          <button
            key={p.name}
            type="button"
            aria-pressed={on}
            onClick={() => onApply(p)}
            className={cn(
              'focus-visible:ring-ring/50 inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs font-medium outline-none focus-visible:ring-[3px]',
              on ? 'border-foreground bg-secondary text-foreground' : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            )}>
            {on ? <CheckIcon aria-hidden className="size-3.5" /> : null}
            {p.name}
          </button>
        );
      })}
    </div>
  );
}
