/**
 * Which components draw which tokens: the Studio's "Show usage" (apps/docs). Each kit's `registry:build` calls
 * tokenUsage with its registry (component ids and their files) and writes the result to
 * registry/generated/token-usage.json, which the docs site reads.
 *
 *   tokenUsage({ root, components: [{ id, files }], tokens }) → { 'color.primary': ['button', …], 'radius.md': […], … }
 *
 * Keys:
 *   color.<name>   a semantic colour (or an extra) in a class (bg-primary, text-muted-foreground/80, border-input),
 *                  var(--name), or the mobile palette (palette.mutedForeground)
 *   radius.<step>  rounded-sm…2xl, full, control (any side: rounded-t-md)
 *   shadow.<1|2|3> shadow-xs / shadow-sm / shadow (1), shadow-md (2), shadow-lg / xl / 2xl (3)
 *   type.<style>   type-h2 (web), text-type-h2 (mobile), or a Text variant ("h2")
 *   font.<role>    font-heading, font-sans (body), font-mono
 *   border.width   border, border-x…, the theme's width
 * A static read of class strings: a class built at runtime from parts is not seen.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const TEXT_STYLES = ['h1', 'h2', 'h3', 'h4', 'lead', 'p', 'large', 'small', 'muted', 'code', 'blockquote'];
const COLOR_UTILITY =
  /^(?:bg|text|border(?:-[xytrblse])?|divide|outline|ring(?:-offset)?|fill|stroke|from|via|to|accent|caret|placeholder|decoration|shadow)-(.+?)(?:\/[\d.]+)?$/;
const RADIUS = /^rounded(?:-[trblse]{1,2})?-(sm|md|lg|xl|2xl|full|control)$/;
const SHADOW = { 'shadow-2xs': '1', 'shadow-xs': '1', 'shadow-sm': '1', shadow: '1', 'shadow-md': '2', 'shadow-lg': '3', 'shadow-xl': '3', 'shadow-2xl': '3' };
const FONT = { 'font-heading': 'heading', 'font-sans': 'body', 'font-mono': 'mono' };

const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

/** The class itself, without variants (`dark:hover:`, `[&_svg]:`), important (`!`) or a negative sign. */
function baseClass(token) {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < token.length; i++) {
    if (token[i] === '[') depth++;
    else if (token[i] === ']') depth--;
    else if (token[i] === ':' && depth === 0) cut = i;
  }
  return token.slice(cut + 1).replace(/^!|!$/g, '').replace(/^-/, '');
}

/** The colour names a token file defines: semantic colours and extras (a ramp's steps as name-step). */
export function colourNames(tokens) {
  const names = new Set(Object.keys(tokens.semantic?.color ?? {}));
  for (const [name, node] of Object.entries(tokens.extra?.color ?? {})) {
    if (node && '$value' in node) names.add(name);
    else for (const step of Object.keys(node ?? {})) if (/^\d+$/.test(step)) names.add(`${name}-${step}`);
  }
  return names;
}

/** The token keys one source file uses. */
export function usageIn(source, colours) {
  const keys = new Set();
  const byCamel = new Map([...colours].map((n) => [camel(n), n]));
  for (const m of source.matchAll(/(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g)) {
    for (const token of m[2].split(/\s+/)) {
      if (!token) continue;
      const cls = baseClass(token);
      const colour = COLOR_UTILITY.exec(cls);
      if (colour && colours.has(colour[1])) keys.add(`color.${colour[1]}`);
      const radius = RADIUS.exec(cls);
      if (radius) keys.add(`radius.${radius[1]}`);
      if (SHADOW[cls]) keys.add(`shadow.${SHADOW[cls]}`);
      const type = /^(?:text-)?type-([a-z0-9]+)$/.exec(cls);
      if (type && TEXT_STYLES.includes(type[1])) keys.add(`type.${type[1]}`);
      if (FONT[cls]) keys.add(`font.${FONT[cls]}`);
      if (/^border(?:-[xytrblse])?$/.test(cls)) keys.add('border.width');
    }
  }
  for (const m of source.matchAll(/var\(--([a-z0-9-]+)\)/g)) if (colours.has(m[1])) keys.add(`color.${m[1]}`);
  for (const m of source.matchAll(/\b(?:palette|colors|colours)\.([a-z][A-Za-z0-9]*)\b/g)) if (byCamel.has(m[1])) keys.add(`color.${byCamel.get(m[1])}`);
  for (const m of source.matchAll(/\bvariant(?:=|:\s*)\{?["']([a-z0-9]+)["']/g)) if (TEXT_STYLES.includes(m[1])) keys.add(`type.${m[1]}`);
  return keys;
}

export function tokenUsage({ root, components, tokens }) {
  const colours = colourNames(tokens);
  const usage = {};
  for (const { id, files } of components) {
    const keys = new Set();
    for (const file of files ?? []) {
      let source;
      try {
        source = readFileSync(join(root, file), 'utf8');
      } catch {
        continue;
      }
      for (const key of usageIn(source, colours)) keys.add(key);
    }
    for (const key of keys) (usage[key] ??= []).push(id);
  }
  return Object.fromEntries(
    Object.keys(usage)
      .sort()
      .map((key) => [key, [...new Set(usage[key])].sort()])
  );
}
