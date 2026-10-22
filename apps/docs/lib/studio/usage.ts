/**
 * Which kit components draw a token: the item menu's "Show usage" (apps/docs/design/studio-wireframes.md, wireframe
 * 8). Each kit's `registry:build` scans its registry files and writes registry/generated/token-usage.json
 * (@halftone-ds/tokens lib/usage.mjs); this joins the two kits onto the catalogue's entries.
 *
 * Keys: color.<name>, radius.<sm…2xl|full|control>, shadow.<1|2|3>, type.<style>, font.<role>, border.width,
 * component.<button|chip|badge|input>.
 */
import mobile from '../../../mobile/registry/generated/token-usage.json';
import web from '../../../web/registry/generated/token-usage.json';
import { CATALOGUE, type Entry, type Side } from '@/lib/catalogue';
import { TEXT_LABELS, type TextStyleName } from '@/lib/studio/foundations';

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

/** The Components tab's `?uses=` filter: entry id → the kits whose version draws the token. */
export const entriesUsing = (keys: string) => new Map(usageOf(keys).map((u) => [u.entry.id, u.sides]));

const sentence = (s: string) => {
  const t = s.replace(/-/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/**
 * What a `?uses=` filter is called, as the item menu named it: "Primary", "rounded-md", "Shadow 2", "Heading 2",
 * "Body font", "Input border". Read from the keys, so a reloaded or shared link says the same.
 */
export function usesLabel(keys: string) {
  const list = keys.split(',');
  if (list.includes('border.width')) {
    const role = list.find((k) => k.startsWith('color.'))?.slice(6);
    return role === 'input' ? 'Input border' : 'Default border';
  }
  return list
    .map((key) => {
      const [kind, ...rest] = key.split('.');
      const name = rest.join('.');
      if (kind === 'color') return sentence(name);
      if (kind === 'radius') return `rounded-${name}`;
      if (kind === 'shadow') return `Shadow ${name}`;
      if (kind === 'type') return TEXT_LABELS[name as TextStyleName] ?? sentence(name);
      if (kind === 'font') return `${sentence(name)} font`;
      if (kind === 'component') return sentence(name);
      return key;
    })
    .join(', ');
}
