'use client';
import { cn } from 'cn';
import * as React from 'react';
import { MotionPreview } from '@/components/controls/curve-editor';
import { NumberField } from '@/components/controls/number-field';
import { ControlSegmented } from '@/components/controls/segmented';
import { convertSpring, sampleSpring, settleTime, SPRING_RANGES, springToCss, type Spring, type SpringMode } from '@/lib/controls/spring';

const W = 200;
const H = 96;
/** Room above the target line for the overshoot. */
const TOP = 24;

/**
 * A spring, tuned in either of the two ways people think of one:
 * - **Time:** how long it looks and how much it bounces (Motion's `visualDuration` and `bounce`);
 * - **Physics:** stiffness, damping and mass.
 *
 * The switch converts between them, so the motion stays the same. The graph shows the spring from release to rest
 * (the dashed line is where it's heading), with how long it takes to settle, and the preview plays it.
 */
export function SpringEditor({ label, value, onChange, className }: { label: string; value: Spring; onChange: (value: Spring) => void; className?: string }) {
  const samples = React.useMemo(() => sampleSpring(value, { points: 80 }), [value]);
  const settle = React.useMemo(() => settleTime(value), [value]);
  const css = React.useMemo(() => springToCss(value), [value]);
  const peak = Math.max(1, ...samples.map((s) => s.value));
  const scaleY = (H - TOP) / Math.max(peak, 1.0001);
  const points = samples.map((s, i) => `${((i / (samples.length - 1)) * W).toFixed(1)},${(H - s.value * scaleY).toFixed(1)}`).join(' ');
  const target = H - scaleY;
  // Overshoot as a whole percent; under 1% reads as none.
  const overshoot = Math.round((peak - 1) * 100);
  const set = (patch: Partial<Record<string, number>>) => onChange({ ...value, ...patch } as Spring);

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <ControlSegmented<SpringMode>
        label={`${label}: tune by`}
        value={value.mode}
        options={[
          { value: 'time', label: 'Time', title: 'Duration and bounce' },
          { value: 'physics', label: 'Physics', title: 'Stiffness, damping and mass' },
        ]}
        onChange={(mode) => onChange(convertSpring(value, mode))}
      />
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: settles in ${settle.toFixed(2)} seconds${overshoot >= 1 ? `, overshooting by ${overshoot}%` : ''}`} className="bg-muted-subtle border-border w-full rounded-md border">
        <line x1={0} x2={W} y1={target} y2={target} className="stroke-border" strokeDasharray="3 3" />
        <polyline points={points} fill="none" className="stroke-foreground" strokeWidth={2} strokeLinejoin="round" />
      </svg>
      <p className="text-muted-foreground text-xs tabular-nums">
        Settles in {settle.toFixed(2)} s{overshoot >= 1 ? ` · overshoots ${overshoot}%` : ''}
      </p>
      {value.mode === 'time' ? (
        <>
          <NumberField label="Duration" unit="s" {...SPRING_RANGES.visualDuration} value={value.visualDuration} onChange={(v) => set({ visualDuration: v })} />
          <NumberField label="Bounce" {...SPRING_RANGES.bounce} value={value.bounce} onChange={(v) => set({ bounce: v })} />
        </>
      ) : (
        <>
          <NumberField label="Stiffness" {...SPRING_RANGES.stiffness} value={value.stiffness} onChange={(v) => set({ stiffness: v })} />
          <NumberField label="Damping" {...SPRING_RANGES.damping} value={value.damping} onChange={(v) => set({ damping: v })} />
          <NumberField label="Mass" {...SPRING_RANGES.mass} value={value.mass} onChange={(v) => set({ mass: v })} />
        </>
      )}
      <MotionPreview easing={css.easing} duration={css.duration} label={label} />
    </div>
  );
}
