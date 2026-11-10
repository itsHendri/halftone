'use client';
import { cn } from 'cn';
import * as React from 'react';
import { NumberField } from '@/components/controls/number-field';
import { clamp, modifierOf, roundTo, stepFor } from '@/lib/controls/scrub';

/**
 * A point in two dimensions (an offset, a light's direction, a gradient's centre): drag it on the pad, or focus the
 * point and use the arrows (Shift for fine, Alt for coarse), or type x and y. Up is up: y grows towards the top.
 */
export function Vec2Pad({
  label,
  value,
  onChange,
  min = -1,
  max = 1,
  step = 0.01,
  className,
}: {
  label: string;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  const padRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [x, y] = value;
  const span = max - min || 1;
  const fit = (n: number) => clamp(roundTo(n, stepFor({ step }, 'fine')), min, max);
  const set = (nx: number, ny: number) => {
    const next: [number, number] = [fit(nx), fit(ny)];
    if (next[0] !== x || next[1] !== y) onChange(next);
  };
  const fromPointer = (e: React.PointerEvent) => {
    const r = padRef.current!.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    set(min + Math.round((fx * span) / step) * step, max - Math.round((fy * span) / step) * step);
  };
  const left = ((x - min) / span) * 100;
  const top = ((max - y) / span) * 100;
  const zeroX = min < 0 && max > 0 ? (-min / span) * 100 : null;
  const zeroY = min < 0 && max > 0 ? (max / span) * 100 : null;

  return (
    <div role="group" aria-label={label} className={cn('flex min-w-0 flex-col gap-2', className)}>
      <div
        ref={padRef}
        className="bg-muted-subtle border-border relative aspect-square w-full max-w-40 cursor-crosshair touch-none self-center rounded-md border select-none"
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          fromPointer(e);
          (e.currentTarget.querySelector('[role="slider"]') as HTMLElement | null)?.focus();
        }}
        onPointerMove={(e) => dragging && fromPointer(e)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}>
        {zeroX !== null ? <span aria-hidden className="bg-border absolute inset-y-0 w-px" style={{ left: `${zeroX}%` }} /> : null}
        {zeroY !== null ? <span aria-hidden className="bg-border absolute inset-x-0 h-px" style={{ top: `${zeroY}%` }} /> : null}
        <span
          tabIndex={0}
          role="slider"
          aria-label={`${label}, point`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={x}
          aria-valuetext={`x ${x}, y ${y}`}
          onKeyDown={(e) => {
            const s = stepFor({ step }, modifierOf(e));
            const moves: Record<string, [number, number]> = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] };
            const m = moves[e.key];
            if (!m) return;
            e.preventDefault();
            set(x + m[0], y + m[1]);
          }}
          className="bg-foreground ring-card focus-visible:outline-ring absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm ring-2 outline-offset-2 focus-visible:outline-2"
          style={{ left: `${left}%`, top: `${top}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="x" value={x} min={min} max={max} step={step} track={false} stepper={false} onChange={(v) => set(v, y)} />
        <NumberField label="y" value={y} min={min} max={max} step={step} track={false} stepper={false} onChange={(v) => set(x, v)} />
      </div>
    </div>
  );
}
