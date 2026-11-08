import type { Project, Stats } from '../shared/api';

/**
 * Sample data, so the app works the moment it's copied. For a real product, replace these with a database (D1:
 * `wrangler d1 create`, then a binding in wrangler.jsonc) or calls to your own API, and keep the shapes in
 * shared/api.ts. For a prototype, keep it: a prototype never calls a real API.
 */
export const PROJECTS: Project[] = [
  { id: 'p-101', name: 'Customer portal', owner: 'Ada Marsh', status: 'Active', openTasks: 12, updated: '2026-11-06' },
  { id: 'p-102', name: 'Billing migration', owner: 'Tomás Reyes', status: 'Active', openTasks: 7, updated: '2026-11-05' },
  { id: 'p-103', name: 'Field app pilot', owner: 'Priya Nair', status: 'Paused', openTasks: 3, updated: '2026-10-28' },
  { id: 'p-104', name: 'Onboarding emails', owner: 'Ada Marsh', status: 'Done', openTasks: 0, updated: '2026-10-21' },
  { id: 'p-105', name: 'Partner API', owner: 'Jonas Berg', status: 'Active', openTasks: 18, updated: '2026-11-07' },
  { id: 'p-106', name: 'Reporting refresh', owner: 'Priya Nair', status: 'Done', openTasks: 0, updated: '2026-10-14' },
];

export const STATS: Stats = {
  tiles: [
    { label: 'Active projects', value: String(PROJECTS.filter((p) => p.status === 'Active').length), delta: 50, deltaLabel: 'vs last month' },
    { label: 'Open tasks', value: String(PROJECTS.reduce((n, p) => n + p.openTasks, 0)), delta: -12, deltaLabel: 'vs last week', invert: true },
    { label: 'Done on time', value: '92%', delta: 4, deltaLabel: 'vs last quarter' },
    { label: 'Average cycle', value: '3.4 days', delta: -9, deltaLabel: 'vs last month', invert: true },
  ],
  activity: [
    { day: 'Mon', opened: 9, closed: 6 },
    { day: 'Tue', opened: 7, closed: 8 },
    { day: 'Wed', opened: 11, closed: 9 },
    { day: 'Thu', opened: 6, closed: 10 },
    { day: 'Fri', opened: 8, closed: 12 },
  ],
};
