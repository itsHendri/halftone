/**
 * halftone-tokens import <tokens.json> — a brand's own tokens into a Halftone system file.
 *
 *   --name <name>        the system's name (default: the brand folder's name, or the file's)
 *   --out <file>         where to write it (default: <name>.halftone.json in the current folder)
 *   --google "A,B"       families that are on Google Fonts beyond the curated list (others stay in tokens)
 *   --offline            don't ask Google Fonts about the file's other families (then only --google counts)
 *   --force              replace --out when it exists
 *   --json               print { file, system, notes, warnings } instead of the summary
 *
 * It never touches an app's tokens: `halftone-tokens theme apply ./<name>.halftone.json` does that, on purpose.
 * The contrast warnings come from a dry run on the package's default tokens.json.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSystem } from './system/generate.mjs';
import { fontFamiliesToCheck, systemFromTokens } from './system/import.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const GENERIC_FOLDERS = new Set(['identity', 'tokens', 'design', 'src', 'styles', '.']);

function fail(message, code = 1) {
  console.error(`halftone-tokens import: ${message}`);
  process.exit(code);
}

/** brands/lisbon-tag/identity/tokens.json → "lisbon-tag"; acme.tokens.json → "acme". */
function nameFromPath(file) {
  const base = basename(file).replace(/\.json$/i, '').replace(/\.?tokens$/i, '');
  if (base) return base;
  let dir = dirname(resolve(file));
  while (GENERIC_FOLDERS.has(basename(dir)) && dirname(dir) !== dir) dir = dirname(dir);
  return basename(dir);
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'brand';

/** Does Google Fonts serve this family? Its CSS API answers 200 for a family it has and 400 for one it doesn't. */
async function onGoogleFonts(family) {
  try {
    const res = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}`, { signal: AbortSignal.timeout(10000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function importCommand({ root, flags, positional }) {
  const file = positional[0];
  if (!file) fail('say which file: halftone-tokens import <tokens.json> [--name <name>] [--out <file>] [--google "A,B"]', 2);
  const path = resolve(root, file);
  if (!existsSync(path)) fail(`no file at ${path}`, 2);
  let dtcg;
  try {
    dtcg = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${file} isn't JSON: ${error.message}`, 2);
  }

  const name = typeof flags.name === 'string' ? flags.name : nameFromPath(path);
  const google = typeof flags.google === 'string' ? flags.google.split(',').map((f) => f.trim()).filter(Boolean) : [];
  if (!flags.offline) for (const family of fontFamiliesToCheck(dtcg)) if (!google.includes(family) && (await onGoogleFonts(family))) google.push(family);
  const { system, notes } = systemFromTokens(dtcg, { name, google });

  const base = JSON.parse(readFileSync(join(here, '../templates/tokens.json'), 'utf8'));
  const { warnings } = generateSystem(system, base);

  const out = resolve(root, typeof flags.out === 'string' ? flags.out : `${slug(name)}.halftone.json`);
  if (existsSync(out) && !flags.force) fail(`${out} exists; pass --force to replace it`, 2);
  writeFileSync(out, `${JSON.stringify(system, null, 2)}\n`);

  if (flags.json) {
    console.log(JSON.stringify({ file: out, system, notes, warnings }, null, 2));
    return;
  }
  console.log(`Wrote ${out}: "${system.name}".`);
  if (notes.length) {
    console.log('\nWhat it guessed or couldn\'t map (check each one):');
    for (const note of notes) console.log(`  - ${note}`);
  }
  if (warnings?.length) {
    console.log('\nBelow WCAG AA with the brand\'s own colours (kept as they are; change them in the Studio if you want AA):');
    for (const w of warnings) console.log(`  ${w.mode.padEnd(5)} ${w.label.padEnd(40)} ${w.ratio}:1 (needs ${w.threshold})`);
  }
  console.log(`\nNext: in an app, halftone-tokens theme apply ./${basename(out)}`);
}
