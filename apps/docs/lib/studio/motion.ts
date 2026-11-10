'use client';
/**
 * Foundations › Motion: what the section reads and writes. The recipe's speed scales every duration and spring; a
 * value set here is the system's own (`motion` in the document) and Speed leaves it alone. Every edit goes through
 * `edit` (lib/studio/foundations.ts), so it applies live, saves and can be undone.
 */
import { motionFor, type CubicBezier, type DurationName, type EasingName, type Motion, type SpringName, type SpringPhysics } from '@halftone-ds/tokens/theme';
import type { HalftoneSystem } from '@halftone-ds/tokens/system';
import { edit } from '@/lib/studio/foundations';

type Group = 'durations' | 'easings' | 'springs';

/** The motion as drawn, and what the speed alone would draw (what Reset goes back to). */
export function motionOf(doc: HalftoneSystem): { drawn: Motion; generated: Motion } {
  return { drawn: motionFor(doc.recipe.speed, doc.motion), generated: motionFor(doc.recipe.speed) };
}

/** Whether a value is the system's own. */
export const isSet = (doc: HalftoneSystem, group: Group, name: string) => (doc.motion[group] as Record<string, unknown> | undefined)?.[name] !== undefined;

/** How many motion values the system sets. */
export const motionEdits = (doc: HalftoneSystem) => Object.values(doc.motion).reduce((n, g) => n + Object.keys(g ?? {}).length, 0);

function setValue(group: Group, name: string, value: unknown | null, coalesce?: string) {
  edit((doc) => {
    const entries = { ...(doc.motion[group] ?? {}) } as Record<string, unknown>;
    if (value === null) delete entries[name];
    else entries[name] = value;
    const motion = { ...doc.motion, [group]: entries };
    if (!Object.keys(entries).length) delete (motion as Record<string, unknown>)[group];
    doc.motion = motion;
    return doc;
  }, coalesce);
}

const round = (n: number, places = 2) => Number(n.toFixed(places));

export const setDuration = (name: DurationName, ms: number | null) => setValue('durations', name, ms === null ? null : Math.round(ms), ms === null ? undefined : `motion.durations.${name}`);
export const setEasing = (name: EasingName, curve: CubicBezier | null) => setValue('easings', name, curve, curve === null ? undefined : `motion.easings.${name}`);
export const setSpring = (name: SpringName, spring: SpringPhysics | null) =>
  setValue(
    'springs',
    name,
    spring === null ? null : { stiffness: round(spring.stiffness), damping: round(spring.damping), mass: round(spring.mass) },
    spring === null ? undefined : `motion.springs.${name}`
  );

/** Back to what the speed draws: every set duration, easing and spring goes. */
export function resetMotion() {
  edit((doc) => {
    doc.motion = {};
    return doc;
  });
}
