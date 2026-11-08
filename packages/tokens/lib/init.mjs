/**
 * `halftone-tokens init` — set up Halftone's tokens in an existing app: any React app on Tailwind 4 + shadcn, or an
 * Expo app on NativeWind + react-native-reusables (found from package.json; --platform web|expo overrides).
 *
 *   halftone-tokens init [--theme <code|preset|file.halftone.json>] [--css <stylesheet>] [--platform web|expo] [--no-install] [--force]
 *
 * 1. writes tokens/tokens.json (Halftone's brand, templates/tokens.json) and tokens/tokens.config.json;
 * 2. applies --theme, if given (the same as `halftone-tokens theme apply`), and builds, contrast checked;
 * 3. web: tokens.css and fonts.css next to the app's stylesheet, imported from it (fonts.css first, tokens.css after
 *    Tailwind). Expo: tokens/generated/tokens.css imported first in global.css, a Tailwind preset added to
 *    tailwind.config.js (when it has the standard shape; otherwise the line to add is printed), and lib/theme.ts and
 *    lib/fonts.ts where the app's `@/lib` points;
 * 4. names any rules in the app's own files that would override the kit, without deleting them.
 * It refuses to replace an existing tokens.json or tokens.config.json without --force.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';


const here = dirname(fileURLToPath(import.meta.url));
export const TEMPLATE = join(here, '..', 'templates', 'tokens.json');

/** Where a React app keeps its main stylesheet, most likely first (Next.js, then Vite and React Router). */
export const STYLESHEETS_EXPO = ['global.css', 'src/global.css', 'app/global.css'];
export const STYLESHEETS = ['app/globals.css', 'src/app/globals.css', 'src/index.css', 'src/app.css', 'app/app.css', 'src/styles/globals.css', 'styles/globals.css', 'src/styles.css'];

/** Rules in the app's stylesheet that tokens.css also defines; left there, they win over it. */
const OVERRIDES = [
  [/^\s*:root\s*\{/, ':root'],
  [/^\s*\.dark\s*\{/, '.dark'],
  [/^\s*\.dark:root\s*\{/, '.dark:root'],
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

/** web or expo, from the app's package.json (Expo with NativeWind is the native kit's shape). */
export function detectPlatform(pkg) {
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies };
  return deps.expo && deps.nativewind ? 'expo' : 'web';
}

/**
 * Add the kit's Tailwind preset to tailwind.config.js when it lists `presets: [require('nativewind/preset')]`, the
 * shape react-native-reusables and create-expo-app's NativeWind setup write. null: not that shape, nothing changed.
 */
export function wirePreset(config, presetSpec) {
  if (config.includes(presetSpec)) return config;
  const re = /presets\s*:\s*\[\s*require\((['"])nativewind\/preset\1\)\s*,?\s*\]/;
  if (!re.test(config)) return null;
  return config.replace(re, (m, q) => `presets: [require(${q}nativewind/preset${q}), require(${q}${presetSpec}${q})]`);
}

/**
 * Theme keys the app's own tailwind.config.js extends; they win over the preset's. Only the keys directly inside
 * `extend`: a `height` inside `keyframes` is an animation, not the theme's heights.
 */
export function overridingExtends(config) {
  const start = /extend\s*:\s*\{/.exec(config);
  if (!start) return [];
  const direct = new Set();
  let depth = 1;
  let token = '';
  for (let i = start.index + start[0].length; i < config.length && depth > 0; i++) {
    const c = config[i];
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') depth--;
    else if (depth === 1 && c === ':' && token) direct.add(token);
    if (/[\w'"-]/.test(c)) token += c === "'" || c === '"' ? '' : c;
    else if (!/\s/.test(c)) token = '';
  }
  const keys = ['colors', 'borderRadius', 'borderWidth', 'boxShadow', 'fontSize', 'fontFamily', 'height', 'spacing'];
  return keys.filter((k) => direct.has(k));
}

/** Where `@/lib` points in this app (tsconfig paths), so lib/theme.ts lands where kit components import it. */
function libDir(root) {
  try {
    const tsconfig = JSON.parse(readFileSync(join(root, 'tsconfig.json'), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
    const target = tsconfig.compilerOptions?.paths?.['@/*']?.[0];
    if (typeof target === 'string') return posix.join(posix.normalize(target.replace(/\*$/, '') || '.'), 'lib');
  } catch {
    // no tsconfig, or not plain JSON: the usual place
  }
  return 'lib';
}

function readPackage(root) {
  try {
    return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  } catch {
    return {};
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
  const pkg = readPackage(root);
  const platform = flags.platform === 'expo' || flags.platform === 'web' ? flags.platform : detectPlatform(pkg);
  if (flags.platform && flags.platform !== platform) throw new InitError(`--platform is web or expo, not "${flags.platform}".`);

  const candidates = platform === 'expo' ? STYLESHEETS_EXPO : STYLESHEETS;
  const cssRel = typeof flags.css === 'string' ? toPosix(flags.css) : candidates.find((p) => existsSync(join(root, p)));
  if (!cssRel) throw new InitError(`no stylesheet found (looked for ${candidates.join(', ')}). Pass the app's main CSS file: --css <path>.`);
  const cssPath = join(root, cssRel);
  if (!existsSync(cssPath)) throw new InitError(`${cssRel} does not exist.`);

  const write = (config) => {
    mkdirSync(dirname(tokensPath), { recursive: true });
    writeFileSync(tokensPath, readFileSync(TEMPLATE, 'utf8'));
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    console.log(`halftone-tokens init: ${platform === 'expo' ? 'an Expo app. ' : ''}wrote tokens/tokens.json and tokens/tokens.config.json`);
  };
  // theme apply writes the theme into tokens.json and rebuilds; otherwise build Halftone's own.
  // --no-install: an Expo theme's font packages are printed, not installed (theme apply's own flag).
  const build = () =>
    typeof flags.theme === 'string'
      ? run(['theme', 'apply', flags.theme, '--root', root, ...(flags['no-install'] ? ['--no-install'] : [])])
      : run(['build', '--root', root]);
  const notes = platform === 'expo' ? await initExpo({ root, pkg, cssRel, cssPath, write, build }) : await initWeb({ cssRel, cssPath, write, build });
  notes.push('Re-brand any time: `npx halftone-tokens theme apply <code|preset|file.halftone.json>`.');
  console.log(`\nNext:\n${notes.map((n) => `  - ${n}`).join('\n')}`);
}

function overrideNote(cssRel, css, what) {
  const overrides = overridingRules(css);
  return overrides.length
    ? [
        `${cssRel} has rules that ${what} also defines, and they win over it. Delete them unless you mean to override the kit:\n` +
          overrides.map((o) => `    line ${o.line}: ${o.name}`).join('\n'),
      ]
    : [];
}

async function initWeb({ cssRel, cssPath, write, build }) {
  const outDir = posix.dirname(cssRel);
  const tokensOut = posix.join(outDir, 'tokens.css');
  const fontsOut = posix.join(outDir, 'fonts.css');
  write({ source: 'tokens/tokens.json', targets: { 'shadcn-web': { out: tokensOut }, fonts: { platform: 'web', out: fontsOut } } });
  await build();

  const css = readFileSync(cssPath, 'utf8');
  const wired = wireStylesheet(css, { tokens: importOf(cssRel, tokensOut), fonts: importOf(cssRel, fontsOut) });
  if (wired.added.length) {
    writeFileSync(cssPath, wired.css);
    console.log(`halftone-tokens init: ${cssRel} now imports ${wired.added.join(' and ')}`);
  }
  const notes = [];
  if (!/@import\s+['"]tailwindcss['"]/.test(css)) notes.push(`${cssRel} has no \`@import 'tailwindcss'\`: kit components need Tailwind 4.`);
  if (!/@import\s+['"]tw-animate-css['"]/.test(css)) notes.push(`Kit components animate with tw-animate-css: \`npm install tw-animate-css\`, then add \`@import 'tw-animate-css';\` after tailwindcss in ${cssRel}.`);
  notes.push(...overrideNote(cssRel, wired.css, 'tokens.css'));
  notes.push('Dark mode is a `.dark` class on <html> (next-themes with attribute="class", or your own code).');
  return notes;
}

async function initExpo({ root, pkg, cssRel, cssPath, write, build }) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const lib = libDir(root);
  const tokensOut = 'tokens/generated/tokens.css';
  const presetOut = 'tokens/generated/tailwind.preset.js';
  // The navigation theme (NAV_THEME in lib/theme.ts) from wherever this app's React Navigation comes.
  const navTheme = deps['@react-navigation/native'] ? '@react-navigation/native' : deps['expo-router'] ? 'expo-router/react-navigation' : false;
  write({
    source: 'tokens/tokens.json',
    targets: {
      nativewind3: { css: tokensOut, partial: true, preset: presetOut },
      'ts-theme': { out: posix.join(lib, 'theme.ts'), navTheme },
      fonts: { platform: 'expo', out: posix.join(lib, 'fonts.ts') },
    },
  });
  await build();

  const notes = [];
  // global.css: the variables first. Tailwind's build (which NativeWind runs) inlines a local @import, so they reach native.
  const css = readFileSync(cssPath, 'utf8');
  const spec = importOf(cssRel, tokensOut);
  const wired = new RegExp(`@import\\s+['"]${spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(css) ? css : `@import '${spec}';\n${css}`;
  if (wired !== css) {
    writeFileSync(cssPath, wired);
    console.log(`halftone-tokens init: ${cssRel} now imports ${spec} (first, before @tailwind base)`);
  }
  notes.push(...overrideNote(cssRel, wired, 'tokens/generated/tokens.css'));

  // tailwind.config.js: the preset, one line.
  const configRel = ['tailwind.config.js', 'tailwind.config.cjs', 'tailwind.config.ts'].find((f) => existsSync(join(root, f)));
  const presetSpec = `./${presetOut.replace(/\.js$/, '')}`;
  if (!configRel) {
    notes.push(`No tailwind.config.js found. NativeWind needs one; list the kit's preset in it: \`presets: [require('nativewind/preset'), require('${presetSpec}')]\`.`);
  } else {
    const config = readFileSync(join(root, configRel), 'utf8');
    const next = wirePreset(config, presetSpec);
    if (next === null) notes.push(`Add the kit's preset to ${configRel}: \`presets: [require('nativewind/preset'), require('${presetSpec}')]\`.`);
    else if (next !== config) {
      writeFileSync(join(root, configRel), next);
      console.log(`halftone-tokens init: ${configRel} now uses the kit's preset (${presetSpec})`);
    }
    const own = overridingExtends(config);
    if (own.length) {
      notes.push(
        `${configRel} extends ${own.join(', ')} itself, and those win over the kit's preset. Delete them from theme.extend unless you mean to override the kit (the kit's preset maps the same CSS variables, and more).`
      );
    }
  }

  notes.push(`At the root: wrap the app in \`KitThemeProvider\` (\`npx shadcn@latest add @halftone-native/lib-theme-context\`) and load the theme's fonts with \`useFonts(FONT_ASSETS)\` from \`${posix.join(lib, 'fonts')}\` (expo-font).`);
  notes.push(`After each \`npx shadcn add\`, run \`npx halftone-tokens build\`: the registry brings ${posix.join(lib, 'theme.ts')} and ${posix.join(lib, 'fonts.ts')} with Halftone's default brand, and the build puts yours back.`);
  return notes;
}
