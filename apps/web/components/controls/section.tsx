'use client';
import { cn } from 'cn';
import { ChevronRightIcon } from 'lucide-react';
import * as React from 'react';
import { OffDefaultMark } from '@/components/controls/control-row';

/**
 * A fold in a control panel: a heading that opens and closes its controls. Closed, it still says how many of them are
 * off their default, in words beside the mark.
 */
export function ControlSection({
  title,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  edited = 0,
  actions,
  className,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** How many controls inside are off their default. */
  edited?: number;
  /** Buttons at the end of the heading (a section's own reset). */
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const [own, setOwn] = React.useState(defaultOpen);
  const open = openProp ?? own;
  const bodyId = React.useId();
  const toggle = () => {
    setOwn(!open);
    onOpenChange?.(!open);
  };
  return (
    <section className={cn('flex min-w-0 flex-col', className)}>
      <div className="flex min-h-8 items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={toggle}
          className="text-foreground hover:bg-accent focus-visible:ring-ring/50 -mx-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 py-1 text-left text-xs font-semibold outline-none focus-visible:ring-[3px]">
          <ChevronRightIcon aria-hidden className={cn('text-muted-foreground size-3.5 shrink-0 motion-safe:transition-transform motion-safe:duration-150', open && 'rotate-90')} />
          <span className="truncate">{title}</span>
          {edited ? (
            <span className="text-muted-foreground ml-auto flex shrink-0 items-center gap-1.5 font-medium">
              <OffDefaultMark />
              {edited} changed
            </span>
          ) : null}
        </button>
        {actions}
      </div>
      <div id={bodyId} hidden={!open} className="flex flex-col gap-3 pt-2 pb-1">
        {children}
      </div>
    </section>
  );
}
