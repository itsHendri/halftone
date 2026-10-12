'use client';
import { useSyncExternalStore } from 'react';
import { type Habit, INITIAL_HABITS } from './data';

/**
 * The habits for the session: a module-level store, so changes survive navigating between pages and reset on
 * reload, which is what a prototype wants. Never call real APIs.
 */
let state = INITIAL_HABITS;
const listeners = new Set<() => void>();
const set = (next: Habit[]) => {
  state = next;
  listeners.forEach((l) => l());
};
const update = (id: string, fn: (h: Habit) => Habit) => set(state.map((h) => (h.id === id ? fn(h) : h)));

export const habits = {
  setToday: (id: string, today: number) => update(id, (h) => ({ ...h, today: Math.max(0, Math.min(h.goal, today)) })),
  toggleDone: (id: string) => update(id, (h) => ({ ...h, today: h.today >= h.goal ? 0 : h.goal })),
  setReminder: (id: string, reminder: boolean) => update(id, (h) => ({ ...h, reminder })),
  setGoal: (id: string, goal: number) => update(id, (h) => ({ ...h, goal, today: Math.min(h.today, goal) })),
  add(name: string, goal: number, unit: string) {
    set([...state, { id: `h${state.length + 1}-${name.toLowerCase().replace(/\W+/g, '-')}`, name, goal, unit, today: 0, streak: 0, tone: 'primary', reminder: false }]);
  },
  remove(id: string) {
    const before = state;
    set(state.filter((h) => h.id !== id));
    /** Undo: puts the habit back where it was. */
    return () => set(before);
  },
};

export function useHabits(): Habit[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => INITIAL_HABITS
  );
}
