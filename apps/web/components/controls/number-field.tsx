'use client';
import { cn } from 'cn';
import { MinusIcon, PlusIcon } from 'lucide-react';
import * as React from 'react';
import { ControlRow } from '@/components/controls/control-row';
import { clamp, createScrub, formatNumber, keyAction, modifierOf, nudge, parseNumber, roundTo, startDragLock, stepFor, type Range } from '@/lib/controls/scrub';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Shown after the value: `px`, `ms`, `%`. */
  unit?: string;
  /** The value Reset goes back to. With it, the field marks itself while it's off it. */
  defaultValue?: number;
  /** Off its default, when the caller decides that (a system's own edits) rather than `defaultValue`. */
  edited?: boolean;
  /** Reset; defaults to `onChange(defaultValue)`. */
  onReset?: () => void;
  /** How the value reads ("Full" for a pill's corner). Also its aria-valuetext. */
  format?: (value: number) => string;
  /** A track under the row. On by default when there's a min and a max. */
  track?: boolean;
  /** − and + buttons beside the value. */
  stepper?: boolean;
  hint?: React.ReactNode;
  id?: string;
  className?: string;
};

const fieldClass =
  'border-border bg-background focus-visible:ring-ring/50 h-7 min-w-0 rounded-md border px-1.5 text-right text-xs tabular-nums outline-none focus-visible:ring-[3px] aria-invalid:border-destructive';
const stepClass =
  'text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 inline-flex size-6 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50';

/**
 * A number to tune: type it, step it, drag it, or scrub its label.
 * - **Scrub:** drag the label sideways; the pointer locks, so it keeps going past the screen's edge. A click without a
 *   drag puts you in the field.
 * - **Keys** (in the field or on the track): arrows step, Page Up/Down step by ten, Home/End go to the ends.
 * - **Shift** for fine steps (a tenth), **Alt** for coarse ones (ten), on the scrub and the keys alike.
 * - **Off its default**, a mark shows by the label, the label goes to full strength and a Reset button appears; a
 *   double-click on the label resets too.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  defaultValue,
  edited,
  onReset,
  format,
  track = min !== undefined && max !== undefined,
  stepper = true,
  hint,
  id,
  className,
}: Props) {
  const ownId = React.useId();
  const fieldId = id ?? ownId;
  const range: Range = React.useMemo(() => ({ min, max, step }), [min, max, step]);
  const [draft, setDraft] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const stopDrag = React.useRef<(() => void) | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => () => stopDrag.current?.(), []);

  const show = (n: number) => (format ? format(n) : `${formatNumber(n, stepFor(range, 'fine'))}${unit}`);
  const off = edited ?? (defaultValue !== undefined && value !== defaultValue);
  const reset = onReset ?? (defaultValue !== undefined ? () => onChange(defaultValue) : undefined);
  const set = (n: number) => {
    const next = clamp(roundTo(n, stepFor(range, 'fine')), min, max);
    if (next !== value) onChange(next);
  };
  const parsed = draft === null ? value : parseNumber(draft);
  const invalid = draft !== null && parsed === null;

  const commit = () => {
    if (draft !== null && parsed !== null) set(parsed);
    setDraft(null);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit();
      return;
    }
    if (e.key === 'Escape' && draft !== null) {
      e.preventDefault();
      setDraft(null);
      return;
    }
    const next = keyAction(e.key, parsed ?? value, modifierOf(e), range);
    // Home/End in a text field move the caret unless the range has ends.
    if (next === null) return;
    e.preventDefault();
    setDraft(null);
    set(next);
  };

  const onScrubStart = (e: React.MouseEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const scrub = createScrub(value, range);
    let last = value;
    setDragging(true);
    stopDrag.current = startDragLock(
      e.currentTarget,
      e.clientX,
      (dx, ev) => {
        const next = scrub.move(dx, modifierOf(ev));
        if (next !== last) {
          last = next;
          onChange(next);
        }
      },
      (moved) => {
        stopDrag.current = null;
        setDragging(false);
        if (!moved) inputRef.current?.focus();
      }
    );
  };

  const shown = draft ?? show(value);
  const valueText = show(value);

  return (
    <ControlRow
      label={label}
      edited={off}
      onReset={reset}
      resetLabel={`Reset ${label.toLowerCase()}${defaultValue !== undefined ? ` to ${show(defaultValue)}` : ''}`}
      hint={hint}
      className={className}
      labelProps={{
        onMouseDown: onScrubStart,
        onDoubleClick: reset && off ? reset : undefined,
        title: 'Drag to change · Shift for fine steps, Alt for coarse',
        'data-dragging': dragging || undefined,
        className: cn('cursor-ew-resize touch-none select-none hover:text-foreground', dragging && 'text-foreground'),
      }}
      trailing={
        <div className="flex shrink-0 items-center gap-0.5">
          <input
            ref={inputRef}
            id={fieldId}
            role="spinbutton"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            aria-label={label}
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuetext={valueText}
            aria-invalid={invalid || undefined}
            value={shown}
            onFocus={(e) => {
              setDraft(format ? formatNumber(value, stepFor(range, 'fine')) : show(value));
              const el = e.currentTarget;
              requestAnimationFrame(() => el.select());
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKey}
            className={cn(fieldClass, 'w-16')}
          />
          {stepper ? (
            <>
              <button type="button" tabIndex={-1} aria-label={`Decrease ${label.toLowerCase()}`} disabled={min !== undefined && value <= min} onClick={(e) => set(nudge(value, -1, modifierOf(e), range))} className={stepClass}>
                <MinusIcon className="size-3.5" aria-hidden />
              </button>
              <button type="button" tabIndex={-1} aria-label={`Increase ${label.toLowerCase()}`} disabled={max !== undefined && value >= max} onClick={(e) => set(nudge(value, 1, modifierOf(e), range))} className={stepClass}>
                <PlusIcon className="size-3.5" aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      }>
      {track && min !== undefined && max !== undefined ? (
        <input
          type="range"
          min={min}
          max={max}
          step="any"
          value={value}
          tabIndex={-1}
          aria-hidden
          onChange={(e) => set(min + Math.round((Number(e.target.value) - min) / step) * step)}
          onKeyDown={(e) => {
            const next = keyAction(e.key, value, modifierOf(e), range);
            if (next === null) return;
            e.preventDefault();
            set(next);
          }}
          className="accent-foreground h-5 w-full cursor-pointer"
        />
      ) : null}
    </ControlRow>
  );
}
