'use client';
import { cn } from 'cn';
import { PlayIcon } from 'lucide-react';
import * as React from 'react';
import { ControlSelect } from '@/components/controls/select';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { bezierPath, bezierToCss, clampBezier, EASING_PRESETS, parseBezier, type Bezier } from '@/lib/controls/bezier';
import { modifierOf, roundTo } from '@/lib/controls/scrub';

/** The plot is PLOT units square; the box leaves PAD above and below for a curve that overshoots. */
const PLOT = 160;
const PAD_X = 12;
const PAD_Y = 40;
const W = PLOT + PAD_X * 2;
const H = PLOT + PAD_Y * 2;
const Y_MIN = -PAD_Y / PLOT;
const Y_MAX = 1 + PAD_Y / PLOT;

const toX = (x: number) => PAD_X + x * PLOT;
const toY = (y: number) => PAD_Y + (1 - y) * PLOT;
const fix = (n: number) => roundTo(n, 0.001);

type Handle = 0 | 1;

/**
 * A cubic-bezier easing, edited by hand: drag the two handles (or focus one and use the arrows: Left/Right move it
 * across, Up/Down move it up; Shift for fine, Alt for coarse), pick a preset, or paste any CSS curve into the field. The
 * preview plays the curve on a moving dot; with reduced motion it stays still.
 */
export function CurveEditor({
  label,
  value,
  onChange,
  duration = 600,
  className,
}: {
  label: string;
  value: Bezier;
  onChange: (value: Bezier) => void;
  /** How long the preview runs, in ms. */
  duration?: number;
  className?: string;
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [drag, setDrag] = React.useState<Handle | null>(null);
  const [draft, setDraft] = React.useState<string | null>(null);
  const css = bezierToCss(value);
  const preset = Object.entries(EASING_PRESETS).find(([, c]) => c.every((n, i) => n === value[i]))?.[0] ?? 'custom';
  const invalid = draft !== null && parseBezier(draft) === null;

  const setHandle = (h: Handle, x: number, y: number) => {
    const next = value.slice() as Bezier;
    next[h * 2] = fix(Math.min(1, Math.max(0, x)));
    next[h * 2 + 1] = fix(y);
    onChange(clampBezier(next));
  };

  const fromPointer = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    const sy = ((e.clientY - rect.top) / rect.height) * H;
    return { x: (sx - PAD_X) / PLOT, y: Math.min(Y_MAX, Math.max(Y_MIN, 1 - (sy - PAD_Y) / PLOT)) };
  };

  const onKey = (h: Handle) => (e: React.KeyboardEvent) => {
    const step = { fine: 0.001, normal: 0.01, coarse: 0.1 }[modifierOf(e)];
    const [x, y] = [value[h * 2], value[h * 2 + 1]];
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    setHandle(h, x + m[0], y + m[1]);
  };

  const handles: [Handle, number, number][] = [
    [0, value[0], value[1]],
    [1, value[2], value[3]],
  ];

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="group"
        aria-label={`${label}: ${css}`}
        className="bg-muted-subtle border-border w-full max-w-56 touch-none self-center rounded-md border select-none"
        onPointerMove={(e) => {
          if (drag === null) return;
          const p = fromPointer(e);
          setHandle(drag, p.x, p.y);
        }}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}>
        <rect x={toX(0)} y={toY(1)} width={PLOT} height={PLOT} className="fill-card stroke-border" strokeWidth={1} />
        <line x1={toX(0)} y1={toY(0)} x2={toX(1)} y2={toY(1)} className="stroke-border" strokeDasharray="3 3" />
        {handles.map(([h, x, y]) => (
          <line key={`arm-${h}`} x1={toX(h)} y1={toY(h)} x2={toX(x)} y2={toY(y)} className="stroke-muted-foreground" strokeWidth={1} />
        ))}
        <path d={bezierPath(value, PLOT, PLOT)} transform={`translate(${PAD_X} ${PAD_Y})`} className="stroke-foreground" strokeWidth={2} fill="none" />
        {handles.map(([h, x, y]) => (
          <circle
            key={`handle-${h}`}
            cx={toX(x)}
            cy={toY(y)}
            r={7}
            tabIndex={0}
            role="slider"
            aria-label={`${label}, ${h === 0 ? 'first' : 'second'} handle`}
            aria-valuemin={Y_MIN}
            aria-valuemax={Y_MAX}
            aria-valuenow={y}
            aria-valuetext={`x ${x}, y ${y}`}
            onPointerDown={(e) => {
              e.preventDefault();
              (e.currentTarget as SVGCircleElement).ownerSVGElement?.setPointerCapture(e.pointerId);
              (e.currentTarget as SVGElement).focus();
              setDrag(h);
            }}
            onKeyDown={onKey(h)}
            className="fill-card stroke-foreground focus-visible:stroke-ring cursor-grab outline-none focus-visible:[stroke-width:4]"
            strokeWidth={2}
          />
        ))}
      </svg>
      <div className="flex min-w-0 items-center gap-1.5">
        <ControlSelect
          label={`${label} preset`}
          value={preset}
          options={[...Object.keys(EASING_PRESETS).map((k) => ({ value: k, label: k })), ...(preset === 'custom' ? [{ value: 'custom', label: 'Custom' }] : [])]}
          onChange={(k) => k in EASING_PRESETS && onChange(EASING_PRESETS[k].slice() as Bezier)}
          className="w-28 shrink-0"
        />
        <input
          value={draft ?? value.join(', ')}
          aria-label={`${label}, as cubic-bezier numbers`}
          aria-invalid={invalid || undefined}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => {
            setDraft(e.target.value);
            const curve = parseBezier(e.target.value);
            if (curve) onChange(clampBezier(curve));
          }}
          onBlur={() => setDraft(null)}
          className="border-border bg-background focus-visible:ring-ring/50 aria-invalid:border-destructive h-7 w-full min-w-0 rounded-md border px-2 font-mono text-xs tabular-nums outline-none focus-visible:ring-[3px]"
        />
      </div>
      <MotionPreview easing={css} duration={duration} label={label} />
    </div>
  );
}

/**
 * A dot that runs the track with the given easing: on every change, and on Play. With reduced motion it doesn't move,
 * and says so.
 */
export function MotionPreview({ easing, duration, label, className }: { easing: string; duration: number; label: string; className?: string }) {
  const reduced = useReducedMotion();
  const runner = React.useRef<HTMLDivElement>(null);
  const play = React.useCallback(() => {
    if (reduced) return;
    runner.current?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], { duration, easing, fill: 'forwards' });
  }, [reduced, duration, easing]);
  React.useEffect(play, [play]);
  if (reduced) return <p className={cn('text-muted-foreground text-xs', className)}>The preview is still: your system asks for less motion.</p>;
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="bg-muted relative h-5 min-w-0 flex-1 overflow-hidden rounded-full">
        <div ref={runner} className="absolute inset-y-0 left-0 w-[calc(100%-1.25rem)]">
          <span className="bg-foreground absolute top-0.5 left-0.5 size-4 rounded-full" />
        </div>
      </div>
      <button
        type="button"
        onClick={play}
        aria-label={`Play ${label.toLowerCase()}`}
        className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 inline-flex size-6 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-[3px]">
        <PlayIcon className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
