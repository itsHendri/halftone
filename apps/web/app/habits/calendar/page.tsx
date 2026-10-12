import type { Metadata } from 'next';
import { CalendarView } from '@/components/habits/calendar-view';

export const metadata: Metadata = { title: 'Calendar · Habits' };

export default function CalendarPage() {
  return <CalendarView />;
}
