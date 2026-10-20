#!/usr/bin/env node
/**
 * Refreshes lib/studio/google-fonts.json, the Studio font picker's list of every Google Fonts family (the picker
 * makes no request beyond Google Fonts CSS). Run by hand now and then: `node scripts/google-fonts.mjs`.
 *
 * Reads Google Fonts' public metadata (no API key) and keeps, per family: its name, a category (sans, serif,
 * display, handwriting, mono) and its upright weights, most popular first:
 *   [["Roboto", "sans", [100, 200, …, 900]], …]
 * Noto families for one script, icon fonts and brand fonts are left out (they aren't open text faces for a design
 * system), and so is any name a system document can't store (letters, digits and spaces).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CATEGORY = { 'Sans Serif': 'sans', Serif: 'serif', Display: 'display', Handwriting: 'handwriting', Monospace: 'mono' };

const res = await fetch('https://fonts.google.com/metadata/fonts');
if (!res.ok) throw new Error(`google-fonts: ${res.status} from fonts.google.com`);
const { familyMetadataList } = await res.json();

const list = familyMetadataList
  .filter((f) => CATEGORY[f.category] && !/icons|symbols/i.test(f.family) && !(f.isNoto && f.primaryScript))
  .filter((f) => f.isOpenSource !== false && !f.isBrandFont && /^[A-Za-z0-9][A-Za-z0-9 ]{0,63}$/.test(f.family))
  .sort((a, b) => a.popularity - b.popularity)
  .map((f) => {
    const wght = f.axes?.find((a) => a.tag === 'wght');
    const weights = wght
      ? [100, 200, 300, 400, 500, 600, 700, 800, 900].filter((w) => w >= wght.min && w <= wght.max)
      : [...new Set(Object.keys(f.fonts).filter((k) => /^\d+$/.test(k)).map(Number))].sort((a, b) => a - b);
    return [f.family, CATEGORY[f.category], weights];
  })
  .filter(([, , weights]) => weights.length);

const out = join(import.meta.dirname, '../lib/studio/google-fonts.json');
writeFileSync(out, `${JSON.stringify(list)}\n`);
console.log(`google-fonts: ${list.length} families → lib/studio/google-fonts.json`);
