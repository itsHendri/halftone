/**
 * Source scan: a tone's text on that tone's own tint, beyond what the palette allows.
 *
 * The contrast gate proves the palette's pairings; it cannot see how components combine classes.
 * `bg-success/15 text-success` looks deliberate and fails AA (4.09:1 with the default palette), so this
 * reads every class string in the configured folders and flags that combination wherever the tint is
 * stronger than `textOnTintLimits` allows. Only unprefixed classes count (`hover:bg-…` is another state).
 *
 * An element that holds only an icon may keep its tone (icons need 3:1, which the gate checks): put
 * `halftone-tokens-ignore tint-text` in a comment on that line or the line above.
 *
 * Limits: a class string has to contain both classes. Text inside a tinted parent (React Native's
 * View > Text) is not seen; DESIGN.md states the rule for those.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const TONES = ['primary', 'success', 'warning', 'info', 'destructive'];
const EXTENSIONS = /\.(m?[jt]sx?)$/;
const SKIP = new Set(['node_modules', '.next', '.expo', 'dist', 'out', 'generated', 'ios', 'android']);
const PRAGMA = 'halftone-tokens-ignore tint-text';

function files(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(files(full));
    else if (EXTENSIONS.test(name)) out.push(full);
  }
  return out;
}

/** Returns one line per offending class string: `components/x.tsx:12  text-success on bg-success/15 (allowed: up to /5)`. */
export function scanTintText(root, paths, limits) {
  const problems = [];
  for (const path of paths) {
    let list;
    try {
      list = files(join(root, path));
    } catch {
      continue; // a configured folder that does not exist (yet) is not an error
    }
    for (const file of list) {
      const source = readFileSync(file, 'utf8');
      const lines = source.split('\n');
      for (const m of source.matchAll(/(["'`])((?:(?!\1)[^\\\n]|\\.)*)\1/g)) {
        const classes = m[2].split(/\s+/).filter((c) => c && !c.includes(':'));
        const texts = new Set(classes.map((c) => /^text-([a-z]+)$/.exec(c)?.[1]).filter((t) => TONES.includes(t)));
        if (!texts.size) continue;
        for (const c of classes) {
          const tint = /^bg-([a-z]+)\/(\d+)$/.exec(c);
          if (!tint || !texts.has(tint[1])) continue;
          const [, tone, pct] = tint;
          const alpha = Number(pct) / 100;
          if (alpha <= limits[tone]) continue;
          const lineNo = source.slice(0, m.index).split('\n').length;
          if (`${lines[lineNo - 1]}\n${lines[lineNo - 2] ?? ''}`.includes(PRAGMA)) continue;
          const allowed = limits[tone] ? `up to /${Math.round(limits[tone] * 100)}` : 'never';
          problems.push(`  ${relative(root, file)}:${lineNo}  text-${tone} on bg-${tone}/${pct} (allowed: ${allowed})`);
        }
      }
    }
  }
  return problems;
}
