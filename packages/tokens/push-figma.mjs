#!/usr/bin/env node
/**
 * tokens/push-figma.mjs — mirror tokens/tokens.json into a Figma Variables collection.
 *
 *   npm run tokens:figma                       # writes tokens/generated/figma-variables.json
 *   FIGMA_TOKEN=… FIGMA_FILE_KEY=… npm run tokens:figma   # …and POSTs it to the Variables REST API
 *
 * One-way, code → Figma. The payload creates (or updates, when FIGMA_COLLECTION_ID is set) a
 * collection "Kit tokens" with two modes (Light, Dark): one COLOR variable per semantic colour, STRING
 * variables for the theme's fonts and
 * FLOAT variables for radius, spacing and font sizes. Every variable gets WEB code syntax
 * (`var(--primary)` / `p-4`) so Dev Mode and the Figma MCP hand back the class names, not hex.
 *
 * The write endpoint (POST /v1/files/:key/variables) needs a full Enterprise seat. Without it, the
 * generated JSON is still useful: paste it into a `use_figma` (Figma MCP) call, or import it with a
 * variables plugin.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// The app root: `halftone-tokens figma --root` sets KIT_TOKENS_ROOT; `npm run tokens:figma` runs from it.
const root = process.env.KIT_TOKENS_ROOT ?? process.cwd();
const theme = await import(pathToFileURL(join(root, 'tokens/generated/figma-theme.mjs')).href).catch(() => null);
if (!theme) {
  console.error('Run `npm run tokens:build` first (it emits tokens/generated/figma-theme.mjs).');
  process.exit(1);
}
const { COLORS, NUMBERS, STRINGS } = theme;

const hexToRgba = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
};

const COLLECTION = process.env.FIGMA_COLLECTION_ID ?? 'tmp-collection';
const LIGHT = 'tmp-mode-light';
const DARK = 'tmp-mode-dark';
const creatingCollection = !process.env.FIGMA_COLLECTION_ID;

const payload = {
  variableCollections: creatingCollection ? [{ action: 'CREATE', id: COLLECTION, name: 'Kit tokens', initialModeId: LIGHT }] : [],
  variableModes: creatingCollection
    ? [
        { action: 'UPDATE', id: LIGHT, name: 'Light', variableCollectionId: COLLECTION },
        { action: 'CREATE', id: DARK, name: 'Dark', variableCollectionId: COLLECTION },
      ]
    : [],
  variables: [],
  variableModeValues: [],
};

for (const [name, { light, dark }] of Object.entries(COLORS)) {
  const id = `tmp-color-${name}`;
  payload.variables.push({
    action: 'CREATE',
    id,
    name: `color/${name}`,
    variableCollectionId: COLLECTION,
    resolvedType: 'COLOR',
    scopes: ['ALL_SCOPES'],
    codeSyntax: { WEB: `var(--${name})` },
  });
  payload.variableModeValues.push({ variableId: id, modeId: LIGHT, value: hexToRgba(light) });
  payload.variableModeValues.push({ variableId: id, modeId: DARK, value: hexToRgba(dark) });
}

for (const [group, entries] of Object.entries(NUMBERS)) {
  for (const [key, { value, code }] of Object.entries(entries)) {
    const id = `tmp-${group}-${key}`;
    payload.variables.push({
      action: 'CREATE',
      id,
      name: `${group}/${key}`,
      variableCollectionId: COLLECTION,
      resolvedType: 'FLOAT',
      scopes:
        group === 'radius' ? ['CORNER_RADIUS'] : group === 'font-size' ? ['FONT_SIZE'] : group === 'border' || group === 'icon' ? ['STROKE_FLOAT'] : ['GAP', 'WIDTH_HEIGHT'],
      codeSyntax: { WEB: code },
    });
    payload.variableModeValues.push({ variableId: id, modeId: LIGHT, value });
    payload.variableModeValues.push({ variableId: id, modeId: DARK, value });
  }
}

for (const [group, entries] of Object.entries(STRINGS ?? {})) {
  for (const [key, { value, code }] of Object.entries(entries)) {
    const id = `tmp-${group}-${key}`;
    payload.variables.push({
      action: 'CREATE',
      id,
      name: `${group}/${key}`,
      variableCollectionId: COLLECTION,
      resolvedType: 'STRING',
      scopes: ['FONT_FAMILY'],
      codeSyntax: { WEB: code },
    });
    payload.variableModeValues.push({ variableId: id, modeId: LIGHT, value });
    payload.variableModeValues.push({ variableId: id, modeId: DARK, value });
  }
}

mkdirSync(join(root, 'tokens/generated'), { recursive: true });
const out = join(root, 'tokens/generated/figma-variables.json');
writeFileSync(out, JSON.stringify(payload, null, 2) + '\n');
console.log(`Wrote ${out}: ${payload.variables.length} variables × 2 modes`);

const token = process.env.FIGMA_TOKEN;
const fileKey = process.env.FIGMA_FILE_KEY;
if (!token || !fileKey) {
  console.log('Set FIGMA_TOKEN and FIGMA_FILE_KEY to push to Figma (Enterprise seat required for the write API).');
  process.exit(0);
}
const res = await fetch(`https://api.figma.com/v1/files/${fileKey}/variables`, {
  method: 'POST',
  headers: { 'X-Figma-Token': token, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const body = await res.text();
if (!res.ok) {
  console.error(`Figma API ${res.status}: ${body}`);
  process.exit(1);
}
console.log('Pushed to Figma:', body.slice(0, 400));
