/**
 * Which kit components draw a token: the item menu's "Show usage" (apps/docs/design/studio-wireframes.md, wireframe
 * 8). Each kit's `registry:build` scans its registry files and writes registry/generated/token-usage.json
 * (@halftone-ds/tokens lib/usage.mjs); this joins the two kits onto the catalogue's entries.
 *
 * Keys: color.<name>, radius.<sm…2xl|full|control>, shadow.<1|2|3>, type.<style>, font.<role>, border.width.
 */
import mobile from '../../../mobile/registry/generated/token-usage.json';
import web from '../../../web/registry/generated/token-usage.json';
import { CATALOGUE, type Entry, type Side } from '@/lib/catalogue';

type Usage = Record<string, string[]>;
const KITS: Record<Side, Usage> = { native: (mobile as { usage: Usage }).usage, web: (web as { usage: Usage }).usage };

/** The catalogue entry a kit's registry id belongs to (an entry may carry another name in the other kit). */
function entryFor(side: Side, id: string): Entry | undefined {
  return CATALOGUE.find((e) => (side === 'native' ? e.native?.id : e.web?.id) === id) ?? CATALOGUE.find((e) => e.id === id);
}

/** Catalogue entries that draw any of these tokens (a list, or comma-separated), in either kit, with the kits that do. */
export function usageOf(keys: string | string[]): { entry: Entry; sides: Side[] }[] {
  const list = Array.isArray(keys) ? keys : keys.split(',');
  const found = new Map<string, { entry: Entry; sides: Side[] }>();
  for (const side of ['native', 'web'] as const) {
    const ids = new Set(list.flatMap((key) => KITS[side][key] ?? []));
    for (const id of ids) {
      const entry = entryFor(side, id);
      if (!entry) continue;
      const row = found.get(entry.id) ?? { entry, sides: [] };
      if (!row.sides.includes(side)) row.sides.push(side);
      found.set(entry.id, row);
    }
  }
  return [...found.values()].sort((a, b) => a.entry.title.localeCompare(b.entry.title));
}

/** Entry ids for the Components tab's `?uses=` filter. */
export const entriesUsing = (keys: string) => new Set(usageOf(keys).map((u) => u.entry.id));
