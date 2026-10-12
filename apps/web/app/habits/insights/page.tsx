import type { Metadata } from 'next';
import { InsightsView } from '@/components/habits/insights-view';

export const metadata: Metadata = { title: 'Insights · Habits' };

export default function InsightsPage() {
  return <InsightsView />;
}
