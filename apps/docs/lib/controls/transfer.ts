import { getAt, leaves, normalise, setAt, type ControlNode, type Values } from '@/lib/controls/schema';

export const TRANSFER_VERSION = 1;

export type Settings = { $controls: typeof TRANSFER_VERSION; name?: string; values: Values };

export type PasteResult =
  | {
      ok: true;
      values: Values;
      /** Paths whose value the paste set (clamped ones included). */
      applied: string[];
      /** Paths the paste named but couldn't use, with why. */
      skipped: { path: string; reason: string }[];
    }
  | { ok: false; error: string };

/** The settings as pretty JSON, for the clipboard or a file. */
export function serializeSettings(values: Values, name?: string): string {
  const settings: Settings = { $controls: TRANSFER_VERSION, ...(name ? { name } : {}), values };
  return JSON.stringify(settings, null, 2);
}

/** Every dot path in a plain object, down to the first value that isn't a plain object. */
function pathsIn(obj: Values, parent = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = parent ? `${parent}.${k}` : k;
    return v && typeof v === 'object' && !Array.isArray(v) && !('mode' in v) && !('stiffness' in v) && !('visualDuration' in v) ? pathsIn(v as Values, path) : [path];
  });
}

/** Reads pasted settings onto `current`. Nothing changes unless at least one value applies. */
export function parseSettings(text: string, nodes: ControlNode[], current: Values): PasteResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That isn’t JSON. Copy settings from a panel and paste them again.' };
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, error: 'Settings are a JSON object of values.' };
  const wrapped = '$controls' in data;
  if (wrapped && (data as Settings).$controls > TRANSFER_VERSION) return { ok: false, error: 'These settings come from a newer panel.' };
  const incoming = (wrapped ? (data as Settings).values : data) as Values;
  if (!incoming || typeof incoming !== 'object') return { ok: false, error: 'There are no values in these settings.' };

  const controls = new Map(leaves(nodes).map((n) => [n.path, n]));
  let values = current;
  const applied: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const seen = new Set<string>();
  for (const node of controls.values()) {
    const raw = getAt(incoming, node.path);
    if (raw === undefined) continue;
    seen.add(node.path);
    const checked = normalise(node, raw);
    if (checked.ok) {
      values = setAt(values, node.path, checked.value);
      applied.push(node.path);
    } else skipped.push({ path: node.path, reason: checked.reason });
  }
  for (const path of pathsIn(incoming)) {
    if (!seen.has(path) && ![...seen].some((p) => path.startsWith(`${p}.`))) skipped.push({ path, reason: 'no such control' });
  }
  if (!applied.length) return { ok: false, error: skipped.length ? `None of these settings fit this panel (${skipped[0].path}: ${skipped[0].reason}).` : 'There are no values in these settings.' };
  return { ok: true, values, applied, skipped };
}

/** A one-line summary of a paste, for a status line. */
export function describePaste(result: PasteResult): string {
  if (!result.ok) return result.error;
  const n = result.applied.length;
  const base = `Pasted ${n} setting${n === 1 ? '' : 's'}`;
  return result.skipped.length ? `${base}; skipped ${result.skipped.map((s) => `${s.path} (${s.reason})`).join(', ')}.` : `${base}.`;
}

/** Writes text to the clipboard. False where the browser refuses (no permission, not a secure page). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Reads text from the clipboard, or null where the browser refuses (the caller then offers a paste box). */
export async function readText(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}
