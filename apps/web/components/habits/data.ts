/**
 * Mock habits for the habit-tracker sample: the same habits and history as the native kit's
 * (apps/mobile/components/habits/store.ts), so the two read as one product. Server-safe: no hooks here.
 */
export type HabitTone = 'primary' | 'success' | 'warning' | 'info';
export type Habit = { id: string; name: string; goal: number; unit: string; today: number; streak: number; tone: HabitTone; reminder: boolean };

export const INITIAL_HABITS: Habit[] = [
  { id: 'water', name: 'Drink water', goal: 8, unit: 'glasses', today: 5, streak: 12, tone: 'info', reminder: true },
  { id: 'walk', name: 'Walk 30 minutes', goal: 1, unit: 'walk', today: 1, streak: 4, tone: 'success', reminder: false },
  { id: 'read', name: 'Read 20 pages', goal: 20, unit: 'pages', today: 8, streak: 21, tone: 'primary', reminder: true },
  { id: 'stretch', name: 'Stretch', goal: 1, unit: 'session', today: 0, streak: 0, tone: 'warning', reminder: false },
  { id: 'journal', name: 'Journal', goal: 1, unit: 'entry', today: 1, streak: 9, tone: 'primary', reminder: true },
];

export const isDone = (h: Habit) => h.today >= h.goal;
export const progressLine = (h: Habit) => (h.goal > 1 ? `${h.today} / ${h.goal} ${h.unit}` : h.streak ? `${h.streak}-day streak` : 'Start your streak');

/** Completed count per weekday, for the insights chart. */
export const WEEK = [
  { day: 'Mon', done: 4 },
  { day: 'Tue', done: 5 },
  { day: 'Wed', done: 3 },
  { day: 'Thu', done: 5 },
  { day: 'Fri', done: 2 },
  { day: 'Sat', done: 4 },
  { day: 'Sun', done: 3 },
];
export const COMPLETION_30D = [40, 60, 60, 80, 100, 80, 60, 80, 100, 100, 60, 80, 80, 100, 60, 40, 80, 100, 100, 80, 60, 80, 100, 80, 100, 60, 80, 100, 80, 60].map((rate, i) => ({ day: i + 1, rate }));
export const BY_CATEGORY = [
  { category: 'health', label: 'Health', value: 46 },
  { category: 'mind', label: 'Mind', value: 30 },
  { category: 'movement', label: 'Movement', value: 24 },
];
/** Days in the current month with every habit done (for the calendar). */
export const COMPLETED_DAYS = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 20];
