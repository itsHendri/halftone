import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HabitView } from '@/components/habits/habit-view';

export const metadata: Metadata = { title: 'Habit · Habits' };

/** `/habits/habit?id=water`: a query, not a segment, so habits added in the session open in the static export. */
export default function HabitPage() {
  return (
    <Suspense>
      <HabitView />
    </Suspense>
  );
}
