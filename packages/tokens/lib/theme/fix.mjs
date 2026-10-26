/**
 * Contrast auto-fix. A theme from the picker must never fail the build, so instead of rejecting a brand
 * colour that doesn't read, the fixer keeps its hue and nudges its lightness the least it can, per mode:
 *
 *   1. a label on its fill (`primary-foreground on primary`): flip the label between neutral.0 and
 *      neutral.950; if neither reads, move the fill away from the better one
 *   2. a tone as ink or an icon on its tint (`text-primary on muted`): move the tone away from the page
 *      (darker in light mode, lighter in dark), then re-check its label
 *   3. body or muted text on a surface: move the text away from the surface
 *   4. anything on a derived role (a tint, `muted-subtle`, a pressed fill): move that role away from the ink on it,
 *      never the ink, which every other surface shares
 *
 * It checks the STRICT set (tones on muted/accent too). A moved token becomes a literal hex for that
 * mode, and every move is reported as { token, mode, from, to } so the picker can show it.
 *
 * A system's hand-made choices are never moved; each is a { light: Set, dark: Set } of token names:
 *   locked   a role mapped by hand: the fixer changes nothing about it (no label flip, no nudge)
 *   pinned   a role on an edited step: as a label it may still flip between the neutrals, but its colour is
 *            never nudged off the step
 * The fixer still flips a generated label on a fixed fill, and moves generated ink off a fixed surface. It never
 * moves a fill to suit a hand-picked label (that would move every surface the fill is). A pairing it leaves
 * failing is reported in `warnings` as { mode, label, fg, bg, ratio, threshold, locked }.
 */
import { contrast, hexToOklchParts } from '../color.mjs';
import { contrastPairs } from '../contrast.mjs';
import { toGamutHex } from './ramp.mjs';
import { BRAND_LINKED, FOREGROUND_CHOICES, isDerived } from './semantic.mjs';

const MAX_PASSES = 24;
const STEP = 0.004;

const failing = (pairs) => pairs.filter((r) => r.ratio < r.threshold);

/** Move `hex` in lightness (dir -1 darker, +1 lighter) until ok(candidate); null if it never is. */
function nudge(hex, dir, ok) {
  const [L, C, H] = hexToOklchParts(hex);
  for (let i = 1; i * STEP <= 1; i++) {
    const next = Math.min(1, Math.max(0, L + dir * i * STEP));
    const candidate = toGamutHex([next, C, H]);
    if (ok(candidate)) return candidate;
    if (next === 0 || next === 1) break;
  }
  return null;
}

/**
 * semantic: { name: { light, dark } } of references or hex; lookup: (value) → hex.
 * Returns { semantic, adjustments } — a new map, the input is not touched.
 */
export function fixContrast(semantic, lookup, { locked, pinned } = {}) {
  const out = Object.fromEntries(Object.entries(semantic).map(([k, v]) => [k, { ...v }]));
  const adjustments = [];
  const warnings = [];

  for (const mode of ['light', 'dark']) {
    const original = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, lookup(v[mode])]));
    const away = mode === 'light' ? -1 : 1; // the direction that moves ink away from the page
    const hexNow = () => Object.fromEntries(Object.entries(out).map(([k, v]) => [k, lookup(v[mode])]));
    const set = (name, value) => {
      out[name][mode] = value;
    };
    const lockedHere = locked?.[mode] ?? new Set();
    const pinnedHere = pinned?.[mode] ?? new Set();
    const isLocked = (name) => lockedHere.has(name);
    // Its colour stays: locked, or on an edited step.
    const isFixed = (name) => lockedHere.has(name) || pinnedHere.has(name);
    // Pairings left as they are: only a locked colour could fix them.
    const accepted = new Set();
    const accept = (f) => accepted.add(f.label);
    // Without locks, a pairing nothing fixes is a bug (it throws, as it always has); with them, a warning.
    const cannot = (f) => {
      if (!lockedHere.size && !pinnedHere.size) throw new Error(`fixContrast: cannot fix ${f.label} (${mode})`);
      accept(f);
    };

    for (let pass = 0; pass < MAX_PASSES; ) {
      const hex = hexNow();
      const [f] = failing(contrastPairs(hex, mode, { strict: true })).filter((p) => !accepted.has(p.label));
      if (!f) break;

      if (f.fgName === `${f.bgName}-foreground`) {
        // 1. A label on its own fill.
        const [best] = FOREGROUND_CHOICES.map((ref) => ({ ref, ratio: contrast(lookup(ref), hex[f.bgName]) })).sort((a, b) => b.ratio - a.ratio);
        if (!isLocked(f.fgName) && best.ratio >= f.threshold && out[f.fgName][mode] !== best.ref) {
          set(f.fgName, best.ref);
          pass++;
          continue;
        }
        if (isFixed(f.bgName) || isLocked(f.fgName)) {
          accept(f);
          continue;
        }
        const label = lookup(best.ref);
        // A light label (it reads on black) needs a darker fill; a dark label a lighter one.
        const dir = contrast(label, '#000000') > contrast(label, '#ffffff') ? -1 : 1;
        const moved = nudge(hex[f.bgName], dir, (c) => contrast(label, c) >= f.threshold);
        if (!moved) {
          cannot(f);
          continue;
        }
        set(f.fgName, best.ref);
        moveFill(f.bgName, moved);
        pass++;
        continue;
      }

      // 4. A derived role moves away from its ink until every pairing on it passes.
      if (isDerived(f.bgName)) {
        const bg = f.bgName;
        if (isFixed(bg)) {
          accept(f);
          continue;
        }
        const onIt = (candidate) =>
          failing(contrastPairs({ ...hex, [bg]: candidate }, mode, { strict: true })).filter((p) => p.bgName === bg && !accepted.has(p.label)).length === 0;
        // A light ink (it reads on black) needs a darker role; a dark ink a lighter one.
        const dir = contrast(hex[f.fgName], '#000000') > contrast(hex[f.fgName], '#ffffff') ? -1 : 1;
        const moved = nudge(hex[bg], dir, onIt);
        if (!moved) {
          cannot(f);
          continue;
        }
        set(bg, moved);
        pass++;
        continue;
      }

      // 2 and 3: move the ink until every pairing it takes part in as ink passes (4 moves the derived roles).
      const ink = f.fgName;
      if (isFixed(ink)) {
        accept(f);
        continue;
      }
      const asInk = (candidate) =>
        failing(contrastPairs({ ...hex, [ink]: candidate }, mode, { strict: true, fg: ink })).filter((p) => !accepted.has(p.label) && !isDerived(p.bgName)).length === 0;
      const moved = nudge(hex[ink], away, asInk);
      if (!moved) {
        cannot(f);
        continue;
      }
      moveFill(ink, moved);
      pass++;
    }

    const all = failing(contrastPairs(hexNow(), mode, { strict: true }));
    const left = all.filter((p) => !accepted.has(p.label));
    if (left.length) throw new Error(`fixContrast: ${left[0].label} still fails in ${mode} after ${MAX_PASSES} passes`);
    // The strict set can name a pairing twice (muted-foreground on muted): warn once.
    for (const p of all.filter((p, i) => all.findIndex((q) => q.label === p.label) === i)) {
      warnings.push({
        mode,
        label: p.label,
        fg: p.fgName,
        bg: p.bgName,
        ratio: Number(p.ratio.toFixed(2)),
        threshold: p.threshold,
        locked: [p.fgName, p.bgName].filter(isFixed),
      });
    }

    for (const [name, before] of Object.entries(original)) {
      const after = lookup(out[name][mode]);
      if (after !== before && out[name][mode].startsWith('#')) adjustments.push({ token: name, mode, from: before, to: after });
    }

    function moveFill(name, hex) {
      const was = lookup(out[name][mode]);
      set(name, hex);
      if (name === 'primary') {
        for (const linked of BRAND_LINKED) if (!isFixed(linked) && lookup(out[linked][mode]) === was) set(linked, hex);
      }
    }
  }
  return { semantic: out, adjustments, warnings };
}
