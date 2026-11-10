'use client';
import { cn } from 'cn';
import { RotateCcwIcon } from 'lucide-react';
import * as React from 'react';

/**
 * The mark a control shows while its value is off its default. Its presence is the signal, never its colour: it sits
 * beside the label only while the value differs, the label turns from muted to full strength, and a Reset button
 * appears. Screen readers hear "changed".
 */
export function OffDefaultMark({ className }: { className?: string }) {
  return <span aria-hidden className={cn('bg-primary inline-block size-1.5 shrink-0 rounded-full', className)} />;
}

/** Sets a control back to its default. Named for what it resets, and to what. */
export function ResetButton({ label, onReset, className }: { label: string; onReset: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onReset}
      aria-label={label}
      title={label}
      className={cn(
        'text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 inline-flex size-6 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-[3px]',
        className
      )}>
      <RotateCcwIcon className="size-3.5" aria-hidden />
    </button>
  );
}

type RowProps = {
  label: React.ReactNode;
  /** The control's id, so a click on the label focuses it. */
  htmlFor?: string;
  /** Off its default: shows the mark and, with `onReset`, the Reset button. */
  edited?: boolean;
  onReset?: () => void;
  /** "Reset blur to 8": what the Reset button says. Defaults to "Reset <label>". */
  resetLabel?: string;
  /** Beside the label, at the end of the row: a value, a switch. */
  trailing?: React.ReactNode;
  /** One line under the control. */
  hint?: React.ReactNode;
  /** Props for the label itself (NumberField makes it the scrub handle). */
  labelProps?: React.HTMLAttributes<HTMLElement> & { 'data-dragging'?: boolean };
  className?: string;
  children?: React.ReactNode;
};

/**
 * A control's label row: the label, the off-default mark, Reset, and anything trailing; the control itself goes
 * underneath (`children`). Every control in a ControlPanel sits in one, so they all read and reset the same way.
 */
export function ControlRow({ label, htmlFor, edited = false, onReset, resetLabel, trailing, hint, labelProps, className, children }: RowProps) {
  const text = typeof label === 'string' ? label : undefined;
  const Label = htmlFor ? 'label' : 'span';
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className="flex min-h-7 min-w-0 items-center gap-2">
        <Label
          {...labelProps}
          {...(htmlFor ? { htmlFor } : {})}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-1.5 text-xs font-medium',
            edited ? 'text-foreground' : 'text-muted-foreground',
            labelProps?.className
          )}>
          {edited ? <OffDefaultMark /> : null}
          {/* Wraps rather than truncates: a cut-off label hides what the control is. */}
          <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
          {edited ? <span className="sr-only">, changed</span> : null}
        </Label>
        {edited && onReset ? <ResetButton label={resetLabel ?? `Reset ${text?.toLowerCase() ?? 'this setting'}`} onReset={onReset} /> : null}
        {trailing}
      </div>
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}
