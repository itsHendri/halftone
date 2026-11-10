'use client';
import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';

export type SelectOption = { value: string; label: string };

/**
 * A choice from a list too long for ControlSegmented, in a panel row. The browser's own select, so it works with the
 * keyboard, screen readers and a phone's picker without a popover.
 */
export function ControlSelect({ label, value, options, onChange, id, className }: { label: string; value: string; options: readonly SelectOption[]; onChange: (value: string) => void; id?: string; className?: string }) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <select
        id={id}
        value={value}
        aria-label={id ? undefined : label}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-background text-foreground focus-visible:ring-ring/50 h-7 w-full min-w-0 cursor-pointer appearance-none truncate rounded-md border pr-7 pl-2 text-xs outline-none focus-visible:ring-[3px]">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2" />
    </div>
  );
}
