import type { Health } from '../shared/api';
import { PROJECTS, STATS } from './data';

/** What the Worker can reach (wrangler.jsonc). Add a D1, KV or R2 binding there and its type here. */
interface Env {
  ASSETS: Fetcher;
}

const json = (body: unknown, init?: ResponseInit) => Response.json(body, init);

/**
 * The app's API. wrangler.jsonc sends /api/* here and serves everything else from the built app, so this only ever
 * sees API requests (plus the asset fallback below, for safety).
 */
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method !== 'GET' && pathname.startsWith('/api/')) return json({ error: 'Method not allowed' }, { status: 405 });

    switch (pathname) {
      // Up whenever the Worker runs. With a database, `ready` is whether it answers (give it a 2-second limit).
      case '/api/health':
        return json({ ready: true } satisfies Health, { headers: { 'Cache-Control': 'no-store' } });
      case '/api/stats':
        return json(STATS);
      case '/api/projects':
        return json(PROJECTS);
    }
    if (pathname.startsWith('/api/')) return json({ error: 'Not found' }, { status: 404 });
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
