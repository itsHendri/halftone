/**
 * What /api answers. The Worker (worker/) and the app (src/) both import these types, so the two can't drift: change
 * a shape here and `npm run typecheck` names every place on either side that has to follow.
 */

/** GET /api/health: answers whenever the Worker runs; `ready` is whether what it depends on answers too. */
export type Health = { ready: boolean };

export type ProjectStatus = 'Active' | 'Paused' | 'Done';

export type Project = {
  id: string;
  name: string;
  owner: string;
  status: ProjectStatus;
  openTasks: number;
  /** ISO date. */
  updated: string;
};

/** GET /api/stats: the overview's tiles and its chart. */
export type Stats = {
  tiles: { label: string; value: string; delta?: number; deltaLabel?: string; invert?: boolean }[];
  activity: { day: string; opened: number; closed: number }[];
};
