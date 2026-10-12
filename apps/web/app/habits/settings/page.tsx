import type { Metadata } from 'next';
import { SettingsView } from '@/components/habits/settings-view';

export const metadata: Metadata = { title: 'Settings · Habits' };

export default function SettingsPage() {
  return <SettingsView />;
}
