'use client';
import { bezierCss, DURATION_NAMES, EASING_NAMES, MOTION_USE, SPEED, SPRING_NAMES, springCss, type CubicBezier, type Speed, type SpringName } from '@halftone-ds/tokens/theme';
import { RotateCcwIcon } from 'lucide-react';
import * as React from 'react';
import { ControlRow } from '@/components/controls/control-row';
import { CurveEditor } from '@/components/controls/curve-editor';
import { NumberField } from '@/components/controls/number-field';
import { SpringEditor } from '@/components/controls/spring-editor';
import { ORDER } from '@/components/theme/studio/parts';
import { FoundationSection, KnobLock } from '@/components/theme/studio/section';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { convertSpring, toPhysics, type Spring, type SpringMode } from '@/lib/controls/spring';
import { isSet, motionEdits, motionOf, resetMotion, setDuration, setEasing, setSpring } from '@/lib/studio/motion';
import { setRecipe, useLiveTheme } from '@/lib/theme/store';

/**
 * Foundations › Motion: the theme's durations, easings and springs, both kits alike. Speed is the base knob (a
 * recipe axis, in the theme code, with its lock for shuffle): it scales every duration and spring you haven't set.
 * Each value can be set on its own, with the kit's NumberField, CurveEditor and SpringEditor; the preview plays them.
 */

const SPEED_LABEL: Record<Speed, string> = { snappy: 'Snappy', normal: 'Normal', relaxed: 'Relaxed', slow: 'Slow' };
const NAME: Record<string, string> = { fast: 'Fast', base: 'Base', slow: 'Slow', standard: 'Standard', emphasized: 'Emphasized', exit: 'Exit', snappy: 'Snappy', gentle: 'Gentle' };
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function SpeedKnob() {
  const { recipe } = useLiveTheme();
  const id = React.useId();
  return (
    <div className="flex items-center gap-1">
      <label htmlFor={id} className="text-muted-foreground text-xs">
        Speed
      </label>
      <select
        id={id}
        value={recipe.speed}
        onChange={(e) => setRecipe({ speed: e.target.value as Speed })}
        className="border-border bg-background focus-visible:ring-ring h-7 rounded-full border px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
        {ORDER.speed.map((v) => (
          <option key={v} value={v}>
            {SPEED_LABEL[v]}
            {SPEED[v] === 1 ? '' : ` ×${SPEED[v]}`}
          </option>
        ))}
      </select>
      <KnobLock keys={['speed']} label="speed" />
    </div>
  );
}

function Group({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-muted-foreground text-xs">{note}</p>
      </div>
      {children}
    </div>
  );
}

/** A spring, edited in time or physics terms (the mode is the editor's; the document keeps stiffness, damping, mass). */
function SpringField({ name }: { name: SpringName }) {
  const { system: doc } = useLiveTheme();
  const { drawn, generated } = motionOf(doc);
  const [mode, setMode] = React.useState<SpringMode>('time');
  const physics: Spring = { mode: 'physics', ...drawn.springs[name] };
  const value = convertSpring(physics, mode);
  const set = isSet(doc, 'springs', name);
  return (
    <ControlRow label={NAME[name]} edited={set} onReset={() => setSpring(name, null)} resetLabel={`Reset the ${name} spring to what the speed draws`} hint={sentence(MOTION_USE.springs[name])}>
      <SpringEditor
        label={`${NAME[name]} spring`}
        value={value}
        onChange={(next) => {
          if (next.mode !== mode) {
            setMode(next.mode);
            return;
          }
          let p = toPhysics(next);
          // Only the bounce moved: keep the stiffness and mass as they are (the time conversion rounds), and set the
          // damping for that bounce.
          if (next.mode === 'time' && value.mode === 'time' && next.visualDuration === value.visualDuration) {
            const { stiffness, mass } = drawn.springs[name];
            p = { stiffness, mass, damping: 2 * Math.min(1, Math.max(0.05, 1 - next.bounce)) * Math.sqrt(stiffness * mass) };
          }
          const g = generated.springs[name];
          // Back at what the speed draws is no edit.
          if (Math.abs(p.stiffness - g.stiffness) < 0.01 && Math.abs(p.damping - g.damping) < 0.01 && Math.abs(p.mass - g.mass) < 0.01) setSpring(name, null);
          else setSpring(name, p);
        }}
      />
    </ControlRow>
  );
}

/** A chip that crosses with the base duration and the standard easing (exit on the way back), and a press on a spring. */
function Preview() {
  const { theme } = useLiveTheme();
  const reduced = useReducedMotion();
  const m = theme.motion;
  const [across, setAcross] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const snappy = springCss(m.springs.snappy);
  const gentle = springCss(m.springs.gentle);
  const still = reduced ? 'none' : undefined;
  return (
    <div className="border-border bg-muted-subtle flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-semibold">Preview</h3>
        <p className="text-muted-foreground min-w-0 flex-1 text-xs">
          {reduced ? 'Your system asks for less motion, so the preview jumps instead of moving.' : 'Plays the values above as the kits will.'}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="bg-muted relative h-10 overflow-hidden rounded-full">
          <div
            className="absolute inset-y-1 left-1 w-[calc(100%-0.5rem)]"
            style={{
              transform: across ? 'translateX(calc(100% - 5rem))' : 'none',
              transition: still ?? `transform ${m.durations.base}ms ${bezierCss(across ? m.easings.standard : m.easings.exit)}`,
            }}>
            <span className="bg-card text-foreground inline-flex h-8 w-20 items-center justify-center rounded-full text-xs font-medium shadow-sm">Chip</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAcross((a) => !a)}
          className="border-border bg-background hover:bg-accent focus-visible:ring-ring self-start rounded-md border px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
          {across ? 'Move it back' : 'Move the chip'} · base {m.durations.base}ms
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setPressed(true)}
          onKeyUp={() => setPressed(false)}
          className="bg-primary text-primary-foreground focus-visible:ring-ring rounded-full px-5 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            transform: pressed ? 'scale(0.94)' : 'none',
            transition: still ?? `transform ${(pressed ? snappy : gentle).duration}ms ${(pressed ? snappy : gentle).easing}`,
          }}>
          Press and hold
        </button>
        <p className="text-muted-foreground text-xs">Snappy going down, gentle coming back.</p>
      </div>
    </div>
  );
}

export function MotionSection() {
  const { system: doc } = useLiveTheme();
  const { drawn, generated } = motionOf(doc);
  const edits = motionEdits(doc);
  return (
    <FoundationSection
      id="motion"
      title="Motion"
      count={DURATION_NAMES.length + EASING_NAMES.length + SPRING_NAMES.length}
      knob={<SpeedKnob />}
      add={
        edits ? (
          <button
            type="button"
            onClick={resetMotion}
            className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
            <RotateCcwIcon className="size-3.5" aria-hidden />
            Reset {edits} set {edits === 1 ? 'value' : 'values'}
          </button>
        ) : null
      }>
      <p className="text-muted-foreground text-sm">
        Speed scales every duration and spring you haven&rsquo;t set. Both kits draw these: the web as <code className="text-xs">duration-*</code>,{' '}
        <code className="text-xs">ease-*</code> and <code className="text-xs">spring-*</code> classes, the phone through <code className="text-xs">MOTION</code> in
        lib/theme.ts. Nothing moves when the system asks for less motion.
      </p>
      <Group title="Durations" note="Longer for larger surfaces: a hover is fast, a sheet slow.">
        <div className="grid gap-4 sm:grid-cols-3">
          {DURATION_NAMES.map((name) => (
            <NumberField
              key={name}
              label={NAME[name]}
              unit="ms"
              min={0}
              max={1000}
              step={10}
              value={drawn.durations[name]}
              edited={isSet(doc, 'durations', name)}
              onReset={() => setDuration(name, null)}
              onChange={(v) => setDuration(name, v === generated.durations[name] ? null : v)}
              hint={sentence(MOTION_USE.durations[name])}
            />
          ))}
        </div>
      </Group>
      <Group title="Easings" note="How a timed move speeds up and slows down. Drag the handles, pick a preset or paste CSS.">
        <div className="grid gap-4 md:grid-cols-3">
          {EASING_NAMES.map((name) => (
            <ControlRow
              key={name}
              label={NAME[name]}
              edited={isSet(doc, 'easings', name)}
              onReset={() => setEasing(name, null)}
              resetLabel={`Reset the ${name} easing`}
              hint={sentence(MOTION_USE.easings[name])}>
              <CurveEditor
                label={`${NAME[name]} easing`}
                value={drawn.easings[name] as CubicBezier}
                duration={drawn.durations.base * 2}
                onChange={(curve) => setEasing(name, curve.every((n, i) => n === generated.easings[name][i]) ? null : curve)}
              />
            </ControlRow>
          ))}
        </div>
      </Group>
      <Group title="Springs" note="For motion that should feel physical. Tune by time (duration and bounce) or physics; the kits get stiffness, damping and mass.">
        <div className="grid gap-4 md:grid-cols-2">
          {SPRING_NAMES.map((name) => (
            <SpringField key={name} name={name} />
          ))}
        </div>
      </Group>
      <Preview />
    </FoundationSection>
  );
}
