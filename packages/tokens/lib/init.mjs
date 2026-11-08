/**
 * `halftone-tokens init` — set up Halftone's tokens in an existing web app (any React app on Tailwind 4 + shadcn).
 *
 *   halftone-tokens init [--theme <code|preset|file.halftone.json>] [--css <stylesheet>] [--force]
 *
 * 1. writes tokens/tokens.json (Halftone's brand, templates/tokens.json) and tokens/tokens.config.json
 *    (shadcn-web, and fonts for the plain web: always, so a later `theme apply` with its own fonts loads them);
 * 2. applies --theme, if given (the same as `halftone-tokens theme apply`);
 * 3. builds tokens.css and fonts.css next to the app's stylesheet, contrast checked;
 * 4. adds the imports to that stylesheet, and names any rules there that would override the kit, without
 *    deleting them.
 * It refuses to replace an existing tokens.json or tokens.config.json without --force.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';


const here = dirname(fileURLToPath(import.meta.url));
export const TEMPLATE = join(here, '..', 'templates', 'tokens.json');

/** Where a React app keeps its main stylesheet, most likely first (Next.js, then Vite and React Router). */
export const STYLESHEETS = ['app/globals.css', 'src/app/globals.css', 'src/index.css', 'src/app.css', 'app/app.css', 'src/styles/globals.css', 'styles/globals.css', 'src/styles.css'];

/** Rules in the app's stylesheet that tokens.css also defines; left there, they win over it. */
const OVERRIDES = [
  [/^\s*:root\s*\{/, ':root'],
  [/^\s*\.dark\s*\{/, '.dark'],
  [/^\s*@theme\b/, '@theme'],
  [/^\s*@layer\s+base\b/, '@layer base'],
  [/^\s*body\s*\{/, 'body'],
  [/^\s*@media\s*\(prefers-color-scheme/, '@media (prefers-color-scheme)'],
];

class InitError extends Error {}

const toPosix = (p) => p.split('\\').join('/');
const importOf = (from, file) => {
  const rel = toPosix(relative(dirname(from), file));
  return rel.startsWith('.') ? rel : `./${rel}`;
};
const imports = (css, spec) => new RegExp(`@import\\s+(url\\()?['"]${spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(css);

/** Add the token imports to the stylesheet: fonts.css first (URL imports must lead), tokens.css after tailwindcss. */
export function wireStylesheet(css, { tokens, fonts }) {
  const lines = css.split('\n');
  const added = [];
  if (!imports(css, tokens)) {
    let after = -1;
    lines.forEach((line, i) => {
      if (/^\s*@import\s+['"](tailwindcss|tw-animate-css)['"]/.test(line)) after = i;
    });
    lines.splice(after + 1, 0, `@import '${tokens}';`);
    added.push(tokens);
  }
  if (!imports(css, fonts)) {
    lines.unshift(`@import '${fonts}';`);
    added.push(fonts);
  }
  return { css: lines.join('\n'), added };
}

/** Line numbers of rules in the stylesheet that tokens.css also defines. */
export function overridingRules(css) {
  const found = [];
  css.split('\n').forEach((line, i) => {
    for (const [re, name] of OVERRIDES) if (re.test(line)) found.push({ line: i + 1, name });
  });
  return found;
}

export async function initCommand({ root, flags, positional, run }) {
  try {
    await init({ root, flags, positional, run });
  } catch (e) {
    if (!(e instanceof InitError)) throw e;
    console.error(`halftone-tokens init: ${e.message}`);
    process.exit(2);
  }
}

async function init({ root, flags, run }) {
  const tokensPath = join(root, 'tokens/tokens.json');
  const configPath = join(root, 'tokens/tokens.config.json');
  const existing = [tokensPath, configPath].filter(existsSync);
  if (existing.length && !flags.force) {
    throw new InitError(
      `already set up (${existing.map((p) => toPosix(relative(root, p))).join(', ')}). Use \`halftone-tokens build\` to rebuild, \`theme apply\` to re-brand, or --force to start again from Halftone's tokens.`
    );
  }

  const cssRel = typeof flags.css === 'string' ? toPosix(flags.css) : STYLESHEETS.find((p) => existsSync(join(root, p)));
  if (!cssRel) throw new InitError(`no stylesheet found (looked for ${STYLESHEETS.join(', ')}). Pass the app's main CSS file: --css <path>.`);
  const cssPath = join(root, cssRel);
  if (!existsSync(cssPath)) throw new InitError(`${cssRel} does not exist.`);
  const outDir = posix.dirname(cssRel);
  const tokensOut = posix.join(outDir, 'tokens.css');
  const fontsOut = posix.join(outDir, 'fonts.css');

  mkdirSync(dirname(tokensPath), { recursive: true });
  writeFileSync(tokensPath, readFileSync(TEMPLATE, 'utf8'));
  const config = { source: 'tokens/tokens.json', targets: { 'shadcn-web': { out: tokensOut }, fonts: { platform: 'web', out: fontsOut } } };
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(`halftone-tokens init: wrote tokens/tokens.json and tokens/tokens.config.json`);

  // theme apply writes the theme into tokens.json and rebuilds; otherwise build Halftone's own.
  if (typeof flags.theme === 'string') await run(['theme', 'apply', flags.theme, '--root', root]);
  else await run(['build', '--root', root]);

  const css = readFileSync(cssPath, 'utf8');
  const wired = wireStylesheet(css, { tokens: importOf(cssRel, tokensOut), fonts: importOf(cssRel, fontsOut) });
  if (wired.added.length) {
    writeFileSync(cssPath, wired.css);
    console.log(`halftone-tokens init: ${cssRel} now imports ${wired.added.join(' and ')}`);
  }

  const notes = [];
  if (!/@import\s+['"]tailwindcss['"]/.test(css)) notes.push(`${cssRel} has no \`@import 'tailwindcss'\`: kit components need Tailwind 4.`);
  if (!/@import\s+['"]tw-animate-css['"]/.test(css)) notes.push(`Kit components animate with tw-animate-css: \`npm install tw-animate-css\`, then add \`@import 'tw-animate-css';\` after tailwindcss in ${cssRel}.`);
  const overrides = overridingRules(wired.css);
  if (overrides.length) {
    notes.push(
      `${cssRel} has rules that tokens.css also defines, and they win over it. Delete them unless you mean to override the kit:\n` +
        overrides.map((o) => `    line ${o.line}: ${o.name}`).join('\n')
    );
  }
  notes.push('Dark mode is a `.dark` class on <html> (next-themes with attribute="class", or your own code).');
  notes.push('Re-brand any time: `npx halftone-tokens theme apply <code|preset|file.halftone.json>`.');
  console.log(`\nNext:\n${notes.map((n) => `  - ${n}`).join('\n')}`);
}
