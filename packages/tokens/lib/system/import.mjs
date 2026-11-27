/**
 * import — a HalftoneSystem from a brand's own tokens.json (DTCG). Pure ESM with no Node APIs, so the Studio can
 * run it in the browser too.
 *
 *   systemFromTokens(dtcg, { name?, google? })  → { system, notes }
 *     dtcg     a tokens.json object: hex strings or 2025.10 colour objects ({ colorSpace, components, hex }),
 *              {aliases}, $type inherited from groups
 *     google   families known to be on Google Fonts beyond the curated list: an array, a Set or a function. A font
 *              not known to be there stays under `tokens` with a note, so a brand's own font file never becomes
 *              a family the kits try to load
 *     notes    one plain line per guess or loss, written so an agent can ask the person about each one
 *
 * What it maps, in order:
 *   1. Colour modes: groups of role colours (a `background` beside other colours). The lightest background is
 *      light; the darkest is dark when it is dark enough. Any other mode becomes extra colours. With no dark mode,
 *      the theme generates one from the ramps, as it does for every recipe.
 *   2. Roles by name (ROLES below), as hex per mode, so the brand's colours stay exactly as they are: the contrast
 *      fixer never moves a colour mapped by hand, and names a failing pair instead. `primary` wins over `brand`
 *      and `accent`.
 *   3. Ramp seeds: brand from primary; neutral and each status from a numbered palette family that holds the
 *      mode's colour, its steps kept as edited steps.
 *   4. Every other colour in a mode, and every other palette family, as an extra colour.
 *   5. Fonts, corner radii and shadows, by name.
 *   6. Everything else under `tokens`, aliases resolved, unchanged otherwise.
 */
import { blend, contrast, hexToOklchParts, relativeLuminance } from '../color.mjs';
import { FONTS } from '../theme/fonts.mjs';
import { STEPS } from '../theme/palettes.mjs';
import { createSystem, extraNameProblem, RADIUS_STEPS } from './schema.mjs';

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const norm = (key) =>
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const slug = (s) => norm(s).slice(0, 40).replace(/-+$/, '');

/** Each role the kits draw, and the names brands give it (normalised). The first is the role's own name. */
const ROLES = {
  background: ['background', 'bg', 'page', 'canvas', 'surface', 'base', 'background-primary', 'bg-primary', 'background-default', 'surface-app', 'background-app', 'app'],
  foreground: ['foreground', 'fg', 'text', 'ink', 'text-primary', 'foreground-primary', 'on-background', 'body'],
  card: ['card', 'surface-raised', 'raised', 'panel', 'background-card', 'elevated', 'surface-panel', 'surface-card'],
  'card-foreground': ['card-foreground', 'on-card', 'on-surface'],
  muted: ['muted', 'background-secondary', 'bg-secondary', 'surface-secondary', 'background-muted', 'surface-muted', 'subtle'],
  'muted-foreground': ['muted-foreground', 'foreground-secondary', 'text-secondary', 'text-muted', 'fg-muted', 'foreground-muted', 'secondary-text', 'ink-secondary', 'ink-muted'],
  border: ['border', 'stroke', 'line', 'divider', 'outline', 'border-default', 'stroke-default'],
  input: ['input', 'field-border', 'input-border'],
  ring: ['ring', 'focus', 'focus-ring'],
  primary: ['primary'],
  'primary-foreground': ['primary-foreground', 'on-primary'],
  destructive: ['destructive', 'danger', 'error', 'negative', 'critical'],
  'destructive-foreground': ['destructive-foreground', 'on-destructive', 'on-danger', 'on-error'],
  success: ['success', 'positive', 'ok'],
  'success-foreground': ['success-foreground', 'on-success'],
  warning: ['warning', 'caution', 'warn'],
  'warning-foreground': ['warning-foreground', 'on-warning'],
  info: ['info', 'informative', 'notice'],
  'info-foreground': ['info-foreground', 'on-info'],
};
/** Used for primary only when the file has no `primary`: primary wins. */
const PRIMARY_FALLBACK = { primary: ['brand', 'accent', 'brand-primary'], 'primary-foreground': ['brand-foreground', 'on-brand', 'on-accent', 'accent-foreground'] };
const BACKGROUND = new Set(ROLES.background);
/** A status role and the ramp it seeds. */
const STATUS = { destructive: 'danger', success: 'success', warning: 'warning', info: 'info' };
const NEUTRAL_FAMILY = /^(neutral|neutrals|gray|grey|slate|zinc|stone|sand|base|mono)$/;
/** Darker than this, a background is a dark theme's page (navy #054895 is about 0.07, a near-black 0.01). */
const DARK_LUMINANCE = 0.18;
/** A group by one of these names is a mode, background or not. */
const MODE_NAMES = { light: 'light', day: 'light', dark: 'dark', night: 'dark' };
/**
 * Brands use "muted" and "subtle" for a quiet surface and for quiet text alike. Halftone's `muted` is a surface,
 * so a muted colour this far from the page (WCAG ratio) is text: it maps to muted-foreground instead.
 */
const TEXT_CONTRAST = 3;
const RAMP_KEYS = new Set([...STEPS, '0', '1000']);

const FONT_GROUP = /^(font|fonts|font-family|font-families|family|families|typeface|typefaces|typography)$/;
const FONT_ROLE = { heading: ['heading', 'headings', 'display', 'title', 'headline'], body: ['body', 'sans', 'text', 'base', 'ui', 'copy', 'paragraph', 'primary'], mono: ['mono', 'code', 'monospace'] };
/** Families every platform has: nothing to load, so nothing to set. */
const PLATFORM_FONTS = /^(system-ui|-apple-system|blinkmacsystemfont|sans-serif|serif|monospace|cursive|fantasy|ui-sans-serif|ui-serif|ui-monospace|ui-rounded|segoe ui|helvetica|helvetica neue|arial|georgia|times|times new roman|menlo|monaco|consolas|courier|courier new|sf mono|sf pro|sf pro text|sf pro display|iowan old style)$/i;
const RADIUS_GROUP = /^(radius|radii|corner|corners|rounded|rounding|border-radius|borderradius)$/;
const FULL_RADIUS = new Set(['full', 'pill', 'round', 'circle']);

/** Every token: { path: string[], key, type, value, node }. $type is inherited from groups. */
function leavesOf(root) {
  const out = [];
  const walk = (node, path, type) => {
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$') || !isObject(child)) continue;
      const childType = child.$type ?? type;
      if ('$value' in child) out.push({ path: [...path, key], key, type: childType, value: child.$value, node: child });
      else walk(child, [...path, key], childType);
    }
  };
  walk(root, [], root.$type);
  return out;
}

/** A colour as { hex, alpha }, or null. */
function colorOf(value) {
  if (typeof value === 'string') {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value.trim());
    if (!m) return null;
    let h = m[1].toLowerCase();
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return { hex: `#${h.slice(0, 6)}`, alpha: h.length === 8 ? Number((parseInt(h.slice(6), 16) / 255).toFixed(3)) : 1 };
  }
  if (isObject(value)) {
    const alpha = typeof value.alpha === 'number' ? value.alpha : 1;
    if (typeof value.hex === 'string') {
      const c = colorOf(value.hex);
      return c && { hex: c.hex, alpha };
    }
    if ((value.colorSpace === 'srgb' || value.colorSpace === undefined) && Array.isArray(value.components) && value.components.length === 3 && value.components.every((n) => typeof n === 'number')) {
      const hex = '#' + value.components.map((n) => Math.round(Math.min(1, Math.max(0, n)) * 255).toString(16).padStart(2, '0')).join('');
      return { hex, alpha };
    }
  }
  return null;
}

/** px from a dimension: 4, "4px", "0.25rem", { value, unit }. Null when it isn't one. */
function pxOf(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const m = /^(-?[\d.]+)(px|rem|em)?$/.exec(value.trim());
    return m ? Number(m[1]) * (m[2] === 'rem' || m[2] === 'em' ? 16 : 1) : null;
  }
  if (isObject(value) && typeof value.value === 'number') return value.unit === 'rem' || value.unit === 'em' ? value.value * 16 : value.value;
  return null;
}

/** An `is this family on Google Fonts` test: the curated list, plus whatever the caller knows. */
function googleTest(google) {
  const curated = new Set(FONTS.filter((f) => !f.system).map((f) => f.family.toLowerCase()));
  const extra = typeof google === 'function' ? google : (family) => new Set([...(google ?? [])].map((f) => String(f).toLowerCase())).has(family.toLowerCase());
  return (family) => curated.has(family.toLowerCase()) || Boolean(extra(family));
}

/** The tokens, an index by path, and alias resolution: what every step reads. */
function context(input) {
  const leaves = leavesOf(input);
  const byPath = new Map(leaves.map((l) => [l.path.join('.'), l]));
  const resolve = (value, seen = new Set()) => {
    if (typeof value === 'string') {
      const m = /^\{([^}]+)\}$/.exec(value);
      if (!m) return value;
      const target = byPath.get(m[1]);
      if (!target || seen.has(m[1])) return value;
      return resolve(target.value, new Set([...seen, m[1]]));
    }
    if (Array.isArray(value)) return value.map((v) => resolve(v, seen));
    if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, seen)]));
    return value;
  };
  const typeOf = (leaf, hops = 0) => {
    if (leaf.type) return leaf.type;
    const m = typeof leaf.value === 'string' && /^\{([^}]+)\}$/.exec(leaf.value);
    const target = m && byPath.get(m[1]);
    return target && hops < 16 ? typeOf(target, hops + 1) : undefined;
  };
  return { leaves, byPath, resolve, typeOf };
}

/** Each font token with a role: { leaf, role, family }. The family is the first in its stack, without " Variable". */
function fontTokens({ leaves, resolve, typeOf }) {
  const out = [];
  const roles = new Set();
  for (const leaf of leaves) {
    const type = typeOf(leaf);
    const inGroup = leaf.path.slice(0, -1).some((p) => FONT_GROUP.test(norm(p)));
    if (type !== 'fontFamily' && !(inGroup && !type)) continue;
    const value = resolve(leaf.value);
    const list = (Array.isArray(value) ? value : String(value).split(',')).map((f) => String(f).trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    const role = Object.entries(FONT_ROLE).find(([, names]) => names.includes(norm(leaf.key)))?.[0];
    if (!role || roles.has(role) || !list.length) continue;
    roles.add(role);
    out.push({ leaf, role, family: list[0].replace(/ Variable$/i, '') });
  }
  return out;
}

/**
 * The font families a tokens file names that need checking: not the platform's own, not in the curated list.
 * The CLI asks Google Fonts about these and passes the ones it has as `google`.
 */
export function fontFamiliesToCheck(input) {
  if (!isObject(input)) return [];
  const curated = googleTest([]);
  return [...new Set(fontTokens(context(input)).map((f) => f.family))].filter((f) => !PLATFORM_FONTS.test(f) && !curated(f));
}

export function systemFromTokens(input, { name, google } = {}) {
  if (!isObject(input)) throw new Error('systemFromTokens: the tokens must be a JSON object');
  const notes = [];
  const ctx = context(input);
  const { leaves, byPath, resolve, typeOf } = ctx;
  const consumed = new Set();
  const take = (leaf) => {
    // A token that points at another (a role at a palette colour) uses that one up too.
    for (let l = leaf, hops = 0; l && hops < 16; hops++) {
      consumed.add(l.path.join('.'));
      const m = typeof l.value === 'string' && /^\{([^}]+)\}$/.exec(l.value);
      l = m ? byPath.get(m[1]) : null;
    }
  };

  const colorLeaf = (leaf) => {
    const type = typeOf(leaf);
    if (type && type !== 'color') return null;
    return colorOf(resolve(leaf.value));
  };

  // 1. Colour modes. A group is a mode when it holds a background colour beside at least one other colour.
  const groups = new Map();
  for (const leaf of leaves) {
    const c = colorLeaf(leaf);
    if (!c) continue;
    const parent = leaf.path.slice(0, -1).join('.');
    if (!groups.has(parent)) groups.set(parent, { path: leaf.path.slice(0, -1), name: leaf.path.at(-2) ?? 'colors', colors: new Map() });
    groups.get(parent).colors.set(norm(leaf.key), { ...c, leaf });
  }
  const hasBackground = (g) => [...g.colors.keys()].some((k) => BACKGROUND.has(k));
  const modes = [...groups.values()].filter((g) => (g.colors.size >= 2 && hasBackground(g)) || (g.colors.size >= 3 && MODE_NAMES[norm(g.name)]));
  // Halftone's own shape: one token per role, its value { light, dark }.
  const moded = leaves.filter((l) => isObject(resolve(l.value)) && colorOf(resolve(l.value).light) && colorOf(resolve(l.value).dark));
  if (moded.some((l) => BACKGROUND.has(norm(l.key)))) {
    for (const mode of ['light', 'dark']) {
      const colors = new Map(moded.map((l) => [norm(l.key), { ...colorOf(resolve(l.value)[mode]), leaf: l }]));
      modes.push({ path: [], name: mode, colors, shared: true });
    }
  }
  // The page colour: the background, else (a mode known by its name) the lightest or darkest colour in it.
  const bgOf = (mode) => {
    const named = [...mode.colors.entries()].find(([k]) => BACKGROUND.has(k));
    if (named) return named[1].hex;
    const sorted = [...mode.colors.values()].map((c) => c.hex).sort((a, b) => relativeLuminance(b) - relativeLuminance(a));
    return MODE_NAMES[norm(mode.name)] === 'dark' ? sorted.at(-1) : sorted[0];
  };
  let light;
  let dark;
  // Named modes; where several groups share a name (a UI's light beside an icon set's light), the one with a page wins.
  const byName = (which) => {
    const all = modes.filter((m) => MODE_NAMES[norm(m.name)] === which);
    const paged = all.filter(hasBackground);
    return paged.length ? paged : all;
  };
  if (byName('light').length === 1 && byName('dark').length === 1) [light, dark] = [byName('light')[0], byName('dark')[0]];
  else {
    const byLight = [...modes].sort((a, b) => relativeLuminance(bgOf(b)) - relativeLuminance(bgOf(a)));
    light = byLight[0];
    const darkest = byLight.at(-1);
    dark = darkest && darkest !== light && relativeLuminance(bgOf(darkest)) < DARK_LUMINANCE ? darkest : undefined;
  }
  const others = modes.filter((m) => m !== light && m !== dark);
  if (light && light.name !== 'light') notes.push(`Light theme: "${light.name}" (its background ${bgOf(light)} is the lightest).`);
  if (dark && dark.name !== 'dark') notes.push(`Dark theme: "${dark.name}" (its background ${bgOf(dark)} is the darkest).`);
  for (const mode of [light, dark]) if (mode && !hasBackground(mode)) notes.push(`"${mode.name}" names no background, so the page colour is generated. Name one in the Studio if a colour in it is the page.`);
  if (light && !dark) notes.push('No dark set of colours, so the dark theme is generated from the ramps. Check it in the Studio.');
  if (!light) notes.push('No set of role colours (a background beside other colours) was found, so only the palette was used.');

  // 2. Roles, per mode.
  const roles = {};
  const extraColors = [];
  const takenNames = [];
  const extraName = (raw) => {
    const base = slug(raw) || 'colour';
    for (const candidate of [base, `brand-${base}`, ...Array.from({ length: 8 }, (_, i) => `brand-${base}-${i + 2}`)]) {
      const n = candidate.slice(0, 40);
      if (!extraNameProblem('color', n, takenNames)) {
        takenNames.push(n);
        return n;
      }
    }
    return null;
  };
  const opaque = (c, mode, label) => {
    if (c.alpha >= 1) return c.hex;
    const page = mode ? bgOf(mode) : '#ffffff';
    notes.push(`"${label}" is ${Math.round(c.alpha * 100)}% opaque; Halftone draws no colour at partial opacity, so it is mixed onto ${page}.`);
    return blend(c.hex, page, c.alpha);
  };
  const renamed = new Set();
  const mapMode = (mode, which) => {
    const used = new Set();
    const page = hasBackground(mode) ? bgOf(mode) : null;
    // A "muted" that reads as text against the page is muted text, not the muted surface.
    const textual = new Set(ROLES.muted.filter((n) => page && mode.colors.has(n) && contrast(mode.colors.get(n).hex, page) >= TEXT_CONTRAST));
    for (const [role, names] of Object.entries(ROLES)) {
      const candidates = role === 'muted' ? names.filter((n) => !textual.has(n)) : role === 'muted-foreground' ? [...names, ...textual] : names;
      let key = candidates.find((n) => mode.colors.has(n) && !used.has(n));
      if (!key && PRIMARY_FALLBACK[role]) key = PRIMARY_FALLBACK[role].find((n) => mode.colors.has(n) && !used.has(n));
      if (!key) continue;
      used.add(key);
      const c = mode.colors.get(key);
      take(c.leaf);
      (roles[role] ??= {})[which] = opaque(c, mode, c.leaf.path.join('.'));
      if (key !== role && !renamed.has(`${key}>${role}`)) {
        renamed.add(`${key}>${role}`);
        const why = PRIMARY_FALLBACK[role]?.includes(key) ? ' (the file has no "primary")' : textual.has(key) ? ' (it reads as text on the page, so it is quiet text, not a surface)' : '';
        notes.push(`"${key}" → ${role}${why}.`);
      }
    }
    return used;
  };
  const leftoverInModes = new Map();
  for (const [mode, which] of [
    [light, 'light'],
    [dark, 'dark'],
  ]) {
    if (!mode) continue;
    const used = mapMode(mode, which);
    for (const [key, c] of mode.colors) if (!used.has(key)) (leftoverInModes.get(key) ?? leftoverInModes.set(key, {}).get(key))[which] = { c, mode };
  }
  // Colours in a mode that no role took: one extra each, light and dark where both have it.
  for (const [key, entry] of leftoverInModes) {
    const n = extraName(key);
    if (!n) continue;
    const l = entry.light && opaque(entry.light.c, entry.light.mode, key);
    const d = entry.dark && opaque(entry.dark.c, entry.dark.mode, key);
    extraColors.push({ name: n, value: l && d ? { light: l, dark: d } : (l ?? d) });
    for (const e of [entry.light, entry.dark]) if (e) take(e.c.leaf);
  }
  // Any other mode (Lisbon Tag's navy pages): its colours as extras, named after the mode.
  for (const mode of others) {
    const names = [];
    // An icon set's "light" is named with its parent (icon-light), so it doesn't read as the theme's.
    const label = MODE_NAMES[norm(mode.name)] && mode.path.length > 1 ? mode.path.slice(-2).join('-') : mode.name;
    for (const [key, c] of mode.colors) {
      const n = extraName(`${label}-${key}`);
      if (!n) continue;
      extraColors.push({ name: n, value: opaque(c, mode, `${mode.path.join('.')}.${key}`) });
      take(c.leaf);
      names.push(n);
    }
    notes.push(`"${mode.path.join('.') || mode.name}" is neither the light nor the dark theme (Halftone has those two), so its colours are extras: ${names.join(', ')}.`);
  }

  // 3. Ramps. A palette family is a group of numbered colour steps.
  const families = [];
  for (const g of groups.values()) {
    const steps = {};
    for (const [key, c] of g.colors) if (RAMP_KEYS.has(key)) steps[key] = c;
    if (Object.keys(steps).filter((s) => STEPS.includes(s)).length >= 3) families.push({ name: g.name, path: g.path.join('.'), steps });
  }
  const familyOf = (hex) => families.filter((f) => Object.values(f.steps).some((c) => c.hex === hex)).sort((a, b) => Object.keys(b.steps).length - Object.keys(a.steps).length)[0];
  const usedFamilies = new Set();
  const rampFrom = (family, keys) => {
    usedFamilies.add(family);
    for (const c of Object.values(family.steps)) take(c.leaf);
    return Object.fromEntries(Object.entries(family.steps).filter(([s]) => keys.has(s)).map(([s, c]) => [s, c.hex]));
  };
  const nearest = (family, target) => {
    const order = [...STEPS];
    const have = order.filter((s) => s in family.steps);
    return have.sort((a, b) => Math.abs(order.indexOf(a) - order.indexOf(target)) - Math.abs(order.indexOf(b) - order.indexOf(target)))[0];
  };

  const colors = {};
  // Brand: primary in light, else dark; with no modes, a family named for the brand.
  let brandSeed = roles.primary?.light ?? roles.primary?.dark;
  let brandFamily = brandSeed && familyOf(brandSeed);
  if (!brandSeed) {
    brandFamily = families.find((f) => /^(brand|primary|accent)$/.test(norm(f.name)));
    if (brandFamily) brandSeed = brandFamily.steps[nearest(brandFamily, '600')].hex;
  }
  if (brandSeed) {
    colors.brand = { seed: brandSeed };
    if (brandFamily) {
      const step = Object.entries(brandFamily.steps).find(([, c]) => c.hex === brandSeed)?.[0];
      if (STEPS.includes(step)) colors.brand.anchor = step;
      colors.brand.steps = rampFrom(brandFamily, new Set(STEPS));
      notes.push(`Brand ramp: seed ${brandSeed}, with steps ${Object.keys(colors.brand.steps).join(', ')} from "${brandFamily.path}".`);
    } else notes.push(`Brand ramp: generated from ${brandSeed}.`);
  } else notes.push("No brand colour found (no primary, brand or accent), so Halftone's default brand stays.");

  // Neutral: a family named for it, or the one holding the light background or text.
  const neutralFamily =
    families.find((f) => !usedFamilies.has(f) && NEUTRAL_FAMILY.test(norm(f.name))) ??
    [roles.background?.light, roles.foreground?.light, roles.background?.dark].map((h) => h && familyOf(h)).find((f) => f && !usedFamilies.has(f));
  if (neutralFamily) {
    const steps = rampFrom(neutralFamily, RAMP_KEYS);
    const mid = nearest(neutralFamily, '500');
    colors.neutral = { seed: neutralFamily.steps[mid].hex, steps };
    notes.push(`Neutral ramp: steps ${Object.keys(steps).join(', ')} from "${neutralFamily.path}".`);
  } else if (roles.background?.light && hexToOklchParts(roles.background.light)[1] > 0.005) {
    colors.neutral = { seed: roles.background.light };
    notes.push(`Neutral ramp: generated from the light background ${roles.background.light}, so the greys share its tint.`);
  }

  // Status ramps: from the role colour, with its family's steps where it has one.
  for (const [role, ramp] of Object.entries(STATUS)) {
    const seed = roles[role]?.light ?? roles[role]?.dark;
    if (!seed) continue;
    const family = familyOf(seed);
    colors[ramp] = { seed };
    if (family && !usedFamilies.has(family)) colors[ramp].steps = rampFrom(family, new Set(STEPS));
  }

  // 4. Palette colours nothing used: a family as an extra ramp, a single colour as an extra colour.
  for (const family of families) {
    if (usedFamilies.has(family) || Object.values(family.steps).every((c) => consumed.has(c.leaf.path.join('.')))) continue;
    const n = extraName(family.name);
    if (!n) continue;
    const steps = Object.fromEntries(Object.entries(family.steps).filter(([s]) => STEPS.includes(s)).map(([s, c]) => [s, c.hex]));
    const mid = nearest(family, '500');
    extraColors.push({ name: n, seed: family.steps[mid].hex, steps });
    for (const c of Object.values(family.steps)) take(c.leaf);
  }
  for (const leaf of leaves) {
    if (consumed.has(leaf.path.join('.'))) continue;
    const c = colorLeaf(leaf);
    if (!c) continue;
    const n = extraName(leaf.path.length > 1 && !['palette', 'color', 'colors', 'colour', 'colours'].includes(norm(leaf.path.at(-2))) ? `${leaf.path.at(-2)}-${leaf.key}` : leaf.key);
    if (!n) continue;
    extraColors.push({ name: n, value: opaque(c, null, leaf.path.join('.')) });
    take(leaf);
  }
  if (extraColors.length) notes.push(`Extra colours (exported, never drawn by the kits; promote any in the Studio): ${extraColors.map((e) => e.name).join(', ')}.`);

  // 5. Fonts.
  const isGoogle = googleTest(google);
  const fonts = {};
  for (const { leaf, role, family } of fontTokens(ctx)) {
    if (PLATFORM_FONTS.test(family)) {
      take(leaf);
      notes.push(`Font (${role}): "${family}" is the platform's own font, so the theme's default stays.`);
    } else if (isGoogle(family)) {
      fonts[role] = family;
      take(leaf);
    } else notes.push(`Font (${role}): "${family}" isn't on Google Fonts as far as this import knows, so it stays in tokens (a brand's own font file needs uploading). If it is on Google Fonts, name it in google (--google "${family}").`);
  }
  if (fonts.body && !fonts.heading) {
    fonts.heading = fonts.body;
    notes.push(`Headings use ${fonts.body}, the body font, until the file's own heading font is set.`);
  }

  // Radius: named steps directly; other names in size order.
  const radius = {};
  const radiusLeaves = leaves.filter((l) => l.path.slice(0, -1).some((p) => RADIUS_GROUP.test(norm(p))) || RADIUS_GROUP.test(norm(l.path[0])));
  const unnamed = [];
  for (const leaf of radiusLeaves) {
    const px = pxOf(resolve(leaf.value));
    if (px === null) continue;
    const key = norm(leaf.key);
    if (FULL_RADIUS.has(key) || px >= 999) take(leaf);
    else if (RADIUS_STEPS.includes(key)) {
      radius[key] = px;
      take(leaf);
    } else unnamed.push({ leaf, px });
  }
  if (unnamed.length && unnamed.length <= RADIUS_STEPS.length - Object.keys(radius).length) {
    const free = RADIUS_STEPS.filter((s) => !(s in radius));
    unnamed.sort((a, b) => a.px - b.px).forEach(({ leaf, px }, i) => {
      radius[free[i]] = px;
      take(leaf);
    });
    notes.push(`Corners mapped by size: ${unnamed.map(({ leaf }, i) => `${leaf.key} → ${free[i]}`).join(', ')}.`);
  }

  // Shadows: up to three, smallest blur first.
  const shadow = {};
  const layerOf = (v) => {
    if (!isObject(v)) return null;
    const c = colorOf(v.color ?? '#000000');
    const nums = ['offsetX', 'offsetY', 'blur', 'spread'].map((k) => (v[k] === undefined ? 0 : pxOf(v[k])));
    if (!c || nums.some((n) => n === null)) return null;
    const [x, y, blur, spread] = nums;
    return { x, y, blur, spread, color: c.hex, alpha: c.alpha, ...(v.inset ? { inset: true } : {}) };
  };
  const layersOf = (value) => {
    const layers = (Array.isArray(value) ? value : [value]).map(layerOf);
    return layers.length && layers.every(Boolean) ? layers : null;
  };
  const found = [];
  for (const leaf of leaves) {
    if (typeOf(leaf) !== 'shadow') continue;
    const value = resolve(leaf.value);
    // A value of { light, dark } is one shadow in both modes.
    const moded = isObject(value) && 'light' in value && 'dark' in value ? { light: layersOf(value.light), dark: layersOf(value.dark) } : null;
    const layers = moded ? moded.light && moded.dark && moded : layersOf(value);
    if (layers) found.push({ leaf, layers });
  }
  // Siblings named light and dark (`shadow.light`, `shadow.dark`) are one shadow too.
  const shadows = [];
  const byParent = new Map();
  for (const s of found) {
    const parent = s.leaf.path.slice(0, -1).join('.');
    (byParent.get(parent) ?? byParent.set(parent, []).get(parent)).push(s);
  }
  for (const [parent, list] of byParent) {
    const l = list.find((s) => MODE_NAMES[norm(s.leaf.key)] === 'light');
    const d = list.find((s) => MODE_NAMES[norm(s.leaf.key)] === 'dark');
    if (l && d && Array.isArray(l.layers) && Array.isArray(d.layers)) {
      shadows.push({ leaves: [l.leaf, d.leaf], key: parent.split('.').at(-1) || 'shadow', layers: { light: l.layers, dark: d.layers } });
      list.splice(list.indexOf(l), 1);
      list.splice(list.indexOf(d), 1);
    }
    for (const s of list) shadows.push({ leaves: [s.leaf], key: s.leaf.key, layers: s.layers });
  }
  const blurOf = (layers) => Math.max(...(Array.isArray(layers) ? layers : layers.light).map((x) => x.blur));
  if (shadows.length && shadows.length <= 3) {
    shadows.sort((a, b) => blurOf(a.layers) - blurOf(b.layers)).forEach((s, i) => {
      shadow[String(i + 1)] = s.layers;
      s.leaves.forEach(take);
    });
    notes.push(`Shadows by size: ${shadows.map((s, i) => `${s.key} → ${i + 1}`).join(', ')}.`);
  } else if (shadows.length > 3) notes.push(`${shadows.length} shadows; Halftone has three levels, so they stay in tokens. Pick three in the Studio.`);

  // 6. Everything else, aliases resolved.
  const leftover = (node, path) => {
    const out = {};
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) {
        if (key !== '$value') out[key] = child;
        continue;
      }
      if (!isObject(child)) continue;
      const at = [...path, key].join('.');
      if ('$value' in child) {
        if (consumed.has(at)) continue;
        out[key] = { ...child, $value: resolve(child.$value) };
        const type = typeOf(byPath.get(at));
        if (type && !child.$type) out[key].$type = type;
      } else {
        const inner = leftover(child, [...path, key]);
        if (Object.keys(inner).some((k) => !k.startsWith('$'))) out[key] = inner;
      }
    }
    return out;
  };
  const tokens = leftover(input, []);
  const kept = Object.keys(tokens).filter((k) => !k.startsWith('$'));
  if (!kept.length) for (const k of Object.keys(tokens)) delete tokens[k];
  else notes.push(`Kept as they are, under tokens (not drawn by the kits): ${kept.join(', ')}.`);

  const label = typeof name === 'string' && name.trim() ? name.trim() : 'Imported brand';
  const system = createSystem({
    name: label,
    colors,
    roles,
    fonts,
    radius,
    shadow,
    extras: { color: extraColors },
    brand: { name: label },
    ...(kept.length ? { tokens } : {}),
  });
  return { system, notes };
}
