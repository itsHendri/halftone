import type { Metadata } from 'next';
import { HabitsShell } from '@/components/habits/shell';

export const metadata: Metadata = { title: 'Habits' };

/** Sample: a habit tracker (today, insights, calendar, settings), the web half of the native kit's habits. */
export default function HabitsLayout({ children }: LayoutProps<'/habits'>) {
  return <HabitsShell>{children}</HabitsShell>;
}
