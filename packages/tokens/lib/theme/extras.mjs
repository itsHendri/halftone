/**
 * A system's extras (the `extra` token group, generateSystem → theme.extra, applySystem → tokens.json `extra.*`) as
 * lists the targets write from. Extras are the brand's own tokens: every target emits them (CSS variables,
 * Tailwind classes, the agent docs), and no kit component reads them. Pure ESM.
 *
 *   extraList(group) → {
 *     color:  [{ name, light, dark, ramp?, step? }]    a single colour, or each step of a ramp (name 'sunset-500')
 *     text:   [{ name, font: 'heading'|'body'|'mono', weight, size, leading, tracking }]
 *     radius: [{ name, px }]
 *     shadow: [{ name, light: Layer[], dark: Layer[] }] DTCG shadow layers
 *     border: [{ name, width, style? }]
 *   }
 *
 * What each becomes (both kits):
 *   colour   --<name> (a ramp: --<name>-<step>), bg-<name> / text-<name> / border-<name>
 *   text     --type-<name>-{size,leading,weight,tracking} (+ -font on the web), type-<name> (web), text-type-<name>… (mobile)
 *   radius   rounded-<name>
 *   shadow   --shadow-<name>, shadow-<name>
 *   border   --border-<name>-width, border-<name> (web: width and style; mobile: the width)
 */

const isModed = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && 'light' in v && 'dark' in v;
const modes = (v) => (isModed(v) ? { light: v.light, dark: v.dark } : { light: v, dark: v });
const lower = (hex) => (typeof hex === 'string' ? hex.toLowerCase() : hex);
const STEP = /^\d+$/;

/** The font role a text extra's family reference names ('{primitive.font.family.body}' → 'body'). */
const fontRole = (value) => /\{primitive\.font\.family\.(heading|body|mono)\}/.exec(String(value))?.[1] ?? 'body';

export function extraList(group) {
  const out = { color: [], text: [], radius: [], shadow: [], border: [] };
  if (!group || typeof group !== 'object') return out;
  for (const [name, node] of Object.entries(group.color ?? {})) {
    if (!node || typeof node !== 'object') continue;
    if ('$value' in node) {
      const v = modes(node.$value);
      out.color.push({ name, light: lower(v.light), dark: lower(v.dark) });
    } else {
      for (const [step, token] of Object.entries(node)) {
        if (!STEP.test(step) || !token || !('$value' in token)) continue;
        const v = modes(token.$value);
        out.color.push({ name: `${name}-${step}`, ramp: name, step, light: lower(v.light), dark: lower(v.dark) });
      }
    }
  }
  for (const [name, node] of Object.entries(group.text ?? {})) {
    if (!node || typeof node !== 'object') continue;
    const value = (key, fallback) => node[key]?.$value ?? fallback;
    out.text.push({
      name,
      font: fontRole(value('font', '')),
      weight: Number(value('weight', 400)),
      size: Number(value('size', 16)),
      leading: Number(value('leading', 1.5)),
      tracking: Number(value('tracking', 0)),
    });
  }
  for (const [name, node] of Object.entries(group.radius ?? {})) if (node && '$value' in node) out.radius.push({ name, px: Number(node.$value) });
  for (const [name, node] of Object.entries(group.shadow ?? {})) {
    if (!node || !('$value' in node)) continue;
    const v = modes(node.$value);
    out.shadow.push({ name, light: v.light ?? [], dark: v.dark ?? [] });
  }
  for (const [name, node] of Object.entries(group.border ?? {})) {
    if (!node || typeof node !== 'object') continue;
    out.border.push({ name, width: Number(node.width?.$value ?? 1), ...(node.style?.$value ? { style: node.style.$value } : {}) });
  }
  return out;
}

export const hasExtras = (list) => Object.values(list).some((items) => items.length > 0);

/** A text extra as resolveTextStyles draws a style (line height in px), for textStyleVars. */
export const extraTextStyles = (list) => Object.fromEntries(list.text.map(({ name, ...s }) => [name, { ...s, lineHeight: s.size * s.leading }]));

/**
 * How DESIGN.md and llms.txt describe the extras: one bullet each, with the classes to use. No kit component uses
 * them; a screen may.
 */
export function describeExtras(list, { platform = 'web' } = {}) {
  const lines = [];
  const ramps = new Map();
  for (const c of list.color) {
    if (c.ramp) {
      if (!ramps.has(c.ramp)) ramps.set(c.ramp, []);
      ramps.get(c.ramp).push(c);
      continue;
    }
    const dark = c.dark !== c.light ? ` (dark ${c.dark.toUpperCase()})` : '';
    lines.push(`- \`${c.name}\` colour ${c.light.toUpperCase()}${dark}: \`bg-${c.name}\`, \`text-${c.name}\`, \`border-${c.name}\``);
  }
  for (const [name, steps] of ramps) {
    const mid = steps.find((s) => s.step === '500') ?? steps[Math.floor(steps.length / 2)];
    lines.push(`- \`${name}\` colour ramp ${steps[0].step}–${steps.at(-1).step} (${mid.step} ${mid.light.toUpperCase()}): \`bg-${name}-${mid.step}\`, \`text-${name}-${steps.at(-1).step}\`…`);
  }
  for (const t of list.text) {
    const family = t.font === 'heading' ? ' font-heading' : t.font === 'mono' ? ' font-mono' : '';
    const cls = platform === 'web' ? `type-${t.name}` : `text-type-${t.name} leading-type-${t.name} tracking-type-${t.name} font-type-${t.name}${family}`;
    lines.push(`- \`${t.name}\` text style, ${t.font} font ${t.weight} · ${t.size}px / ×${t.leading}${t.tracking ? ` · ${t.tracking}em` : ''}: \`${cls}\``);
  }
  for (const r of list.radius) lines.push(`- \`${r.name}\` corner ${r.px >= 9999 ? 'full' : `${r.px}px`}: \`rounded-${r.name}\``);
  for (const s of list.shadow) lines.push(`- \`${s.name}\` shadow, ${s.light.length} layer${s.light.length === 1 ? '' : 's'}: \`shadow-${s.name}\``);
  for (const b of list.border) lines.push(`- \`${b.name}\` border ${b.width}px${b.style ? ` ${b.style}` : ''}: \`border-${b.name}\``);
  return lines;
}
