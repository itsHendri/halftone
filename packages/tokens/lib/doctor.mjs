/**
 * `halftone-tokens doctor` — check that an app is set up for Halftone's kit components, and say how to fix what isn't.
 * Read-only: it never changes a file.
 *
 *   halftone-tokens doctor [--platform web|expo] [--offline] [--json]
 *
 * Problems (exit 1): tokens not set up or out of date; the stylesheet (web) or global.css (Expo) not importing them;
 * the Tailwind preset missing (Expo); a components.json on another style; `@/` aliases that don't resolve; a kit
 * file in components/ui that shadcn's or react-native-reusables' stock version has replaced.
 * Warnings: rules in the app's own files that win over the kit's; nothing that sets dark mode; kit links without
 * KitLinkProvider; fonts not loaded (Expo); a second `cn` in lib/utils.ts.
 *
 * The stock-file check reads the kit's registry (the URL in components.json) and the upstream one: --offline skips it.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, posix, relative } from 'node:path';

import { loadContext, renderTargets } from './generate.mjs';
import { detectPlatform, overridingExtends, overridingRules, STYLESHEETS, STYLESHEETS_EXPO } from './init.mjs';

/** Where the stock version of a kit-changed ui file comes from, by platform. */
export const UPSTREAM = {
  web: { registry: '@halftone-web', url: 'https://ui.shadcn.com/r/styles/new-york-v4/{name}.json', label: "shadcn/ui's" },
  expo: { registry: '@halftone-native', url: 'https://reactnativereusables.com/r/nativewind/{name}.json', label: "react-native-reusables'" },
};

const toPosix = (p) => p.split('\\').join('/');
const read = (path) => readFileSync(path, 'utf8');
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** JSON with comments and trailing commas (tsconfig), read without mistaking "@/*" for a comment. */
export function parseJsonc(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j;
    } else if (c === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      out += '\n';
    } else if (c === '/' && text[i + 1] === '*') {
      i = text.indexOf('*/', i + 2);
      if (i === -1) break;
      i++;
    } else out += c;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
}

/**
 * A file's code without its imports, directives and whitespace: what `shadcn add` leaves alone. It rewrites import
 * paths to the app's aliases and drops "use client" outside RSC, so those can't tell two copies apart.
 */
export function normalizeSource(src) {
  return src
    .replace(/^\s*['"]use client['"];?/gm, '')
    .replace(/^\s*import\s[\s\S]*?\sfrom\s*['"][^'"]+['"];?/gm, '')
    .replace(/^\s*import\s*['"][^'"]+['"];?/gm, '')
    .replace(/\s+/g, '');
}

/** The `paths` of the app's tsconfig (tsconfig.json, then tsconfig.app.json, as Vite splits them). */
export function tsPaths(root) {
  for (const file of ['tsconfig.json', 'tsconfig.app.json']) {
    try {
      const paths = parseJsonc(read(join(root, file))).compilerOptions?.paths;
      if (paths && Object.keys(paths).length) return { file, paths };
    } catch {
      // missing or unreadable: try the next
    }
  }
  return { file: null, paths: {} };
}

/** An import alias (`@/components/ui`) as a folder relative to the root (`src/components/ui`), or null. */
export function aliasDir(paths, alias) {
  for (const [key, targets] of Object.entries(paths)) {
    const prefix = key.replace(/\*$/, '');
    const target = Array.isArray(targets) ? targets[0] : null;
    if (!key.endsWith('*') || typeof target !== 'string' || !alias.startsWith(prefix)) continue;
    return posix.normalize(posix.join(target.replace(/\*$/, '') || '.', alias.slice(prefix.length)));
  }
  return null;
}

/** Files under dir (relative to root), skipping dependencies, builds and the kit's own folders. */
function sourceFiles(root, dir, found = []) {
  const full = join(root, dir);
  if (!existsSync(full)) return found;
  for (const name of readdirSync(full)) {
    if (/^(node_modules|dist|build|\.next|\.expo|\.git|ios|android|tokens|ui|kit)$/.test(name)) continue;
    const rel = posix.join(dir, name);
    const stat = statSync(join(root, rel));
    if (stat.isDirectory()) sourceFiles(root, rel, found);
    else if (/\.(tsx?|jsx?|html)$/.test(name)) found.push(rel);
  }
  return found;
}
const anySource = (root, dirs, re) => dirs.some((dir) => sourceFiles(root, dir).some((f) => re.test(read(join(root, f)))));

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

export async function doctorCommand({ root, flags }) {
  const results = await doctor({ root, flags });
  const problems = results.filter((r) => r.level === 'problem');
  const warnings = results.filter((r) => r.level === 'warning');
  if (flags.json) {
    console.log(JSON.stringify({ ok: problems.length === 0, results }, null, 2));
  } else {
    const mark = { ok: '✓', problem: '✗', warning: '!', info: '·' };
    for (const r of results) {
      console.log(`${mark[r.level]} ${r.message}`);
      if (r.fix) console.log(`    ${r.fix.split('\n').join('\n    ')}`);
    }
    const summary = [problems.length && `${problems.length} problem(s)`, warnings.length && `${warnings.length} warning(s)`].filter(Boolean);
    console.log(`\nhalftone-tokens doctor: ${summary.length ? summary.join(', ') : 'all good'}.`);
  }
  if (problems.length) process.exitCode = 1;
}

/** Every check, as [{ level: ok|problem|warning|info, message, fix? }]. */
export async function doctor({ root, flags = {} }) {
  const results = [];
  const ok = (message) => results.push({ level: 'ok', message });
  const problem = (message, fix) => results.push({ level: 'problem', message, fix });
  const warning = (message, fix) => results.push({ level: 'warning', message, fix });
  const info = (message, fix) => results.push({ level: 'info', message, fix });

  let pkg = {};
  try {
    pkg = JSON.parse(read(join(root, 'package.json')));
  } catch {
    problem('No package.json here.', 'Run doctor in the app’s root folder, or pass --root <dir>.');
    return results;
  }
  const platform = flags.platform === 'web' || flags.platform === 'expo' ? flags.platform : detectPlatform(pkg);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  info(platform === 'expo' ? 'An Expo app (NativeWind).' : 'A React app (Tailwind 4).');

  // components.json: the style, the aliases, the registry.
  let components = null;
  try {
    components = JSON.parse(read(join(root, 'components.json')));
  } catch {
    warning('No components.json: shadcn needs one to add kit components.', 'install.md, path ' + (platform === 'expo' ? 'C' : 'D') + ', step 1, has the file to write.');
  }
  if (components) {
    if (components.style && components.style !== 'new-york') {
      problem(
        `components.json has style "${components.style}". Kit components are built on Radix with the new-york style.`,
        'Set "style": "new-york" (install.md, path D, step 1). A Base UI app can’t use kit components.'
      );
    }
    const upstream = UPSTREAM[platform];
    if (!components.registries?.[upstream.registry]) {
      warning(`components.json has no "${upstream.registry}" registry.`, `Add it: "registries": { "${upstream.registry}": "https://halftonedesignsystem.com/r/${platform === 'expo' ? 'native' : 'web'}/{name}.json" }`);
    }
  }

  // The @/ aliases kit components import through.
  const { file: tsFile, paths } = tsPaths(root);
  const aliases = components?.aliases ?? { ui: '@/components/ui', lib: '@/lib', utils: '@/lib/utils', components: '@/components' };
  const uiDir = aliasDir(paths, aliases.ui ?? '@/components/ui');
  const libDir = aliasDir(paths, aliases.lib ?? '@/lib');
  if (!uiDir) {
    problem(
      `${tsFile ?? 'tsconfig.json'} doesn't map "${aliases.ui ?? '@/components/ui'}": kit components import through the @/ aliases.`,
      `Add "paths": { "@/*": ["./${platform === 'expo' ? '' : 'src/'}*"] } to compilerOptions${platform === 'expo' ? '' : ' (and the same alias to vite.config.ts in a Vite app)'}.`
    );
  } else {
    ok(`The @/ aliases resolve (${aliases.ui} → ${uiDir}).`);
    const vite = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'].find((f) => existsSync(join(root, f)));
    if (vite && !/['"]@['"]\s*:|find:\s*['"]@['"]|tsconfigPaths|tsconfig-paths/.test(read(join(root, vite)))) {
      warning(`${vite} has no "@" alias: TypeScript resolves @/ imports, but the build won't.`, "resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }");
    }
  }

  // The tokens: set up, built, up to date.
  const configPath = join(root, flags.config ?? 'tokens/tokens.config.json');
  let config = null;
  if (!existsSync(configPath)) {
    problem('Halftone’s tokens aren’t set up (no tokens/tokens.config.json).', 'npx halftone-tokens init        # or: npx halftone-tokens init --theme <code>');
  } else {
    config = JSON.parse(read(configPath));
    const source = config.source ?? 'tokens/tokens.json';
    if (!existsSync(join(root, source))) {
      problem(`${source} is missing.`, 'npx halftone-tokens init --force');
      config = null;
    } else {
      const ctx = await loadContext(root, source);
      const files = await renderTargets(ctx, config);
      const stale = files.filter((f) => !existsSync(join(root, f.path)) || read(join(root, f.path)) !== f.contents);
      if (stale.length) {
        problem(
          `${stale.length} generated file(s) out of date: ${stale.map((f) => f.path).join(', ')}.`,
          'npx halftone-tokens build' + (platform === 'expo' ? '   (after every `shadcn add`: the registry brings lib/theme.ts and lib/fonts.ts with Halftone’s default brand)' : '')
        );
      } else ok(`The tokens are built and up to date (${files.length} files).`);
    }
  }

  if (platform === 'expo') expoChecks({ root, deps, config, components, ok, problem, warning });
  else webChecks({ root, deps, config, components, libDir, ok, problem, warning });

  // One cn: kit and shadcn files import it from the `cn` package; an older lib/utils.ts has its own.
  if (platform === 'web') {
    const utilsDir = aliasDir(paths, posix.dirname(aliases.utils ?? '@/lib/utils'));
    const utils = utilsDir && ['ts', 'tsx', 'js'].map((ext) => posix.join(utilsDir, `${basename(aliases.utils ?? 'utils')}.${ext}`)).find((f) => existsSync(join(root, f)));
    if (utils) {
      const src = read(join(root, utils));
      if (/\bcn\b/.test(src) && !/from\s+['"]cn['"]/.test(src) && /twMerge|clsx/.test(src)) {
        warning(
          `${utils} has its own cn (clsx + tailwind-merge). Kit and shadcn files import cn from the \`cn\` package, so the app has two.`,
          `Make ${utils} re-export it, as shadcn's own utils does now: export { cn } from 'cn';\nKeep any other helpers in the file. Then remove clsx and tailwind-merge if nothing else imports them.`
        );
      }
    }
  }

  if (uiDir && !flags.offline) await stockChecks({ root, platform, components, uiDir, ok, problem, info, warning });
  return results;
}

function webChecks({ root, deps, config, components, libDir, ok, problem, warning }) {
  const cssRel = components?.tailwind?.css ?? STYLESHEETS.find((p) => existsSync(join(root, p)));
  if (!cssRel || !existsSync(join(root, cssRel))) {
    problem(`No stylesheet found${cssRel ? ` at ${cssRel}` : ''}.`, 'Set "tailwind": { "css": "<your main stylesheet>" } in components.json.');
    return;
  }
  const css = read(join(root, cssRel));
  const importsOf = [...css.matchAll(/^\s*@import\s+(?:url\()?['"]([^'"]+)['"]/gm)].map((m) => m[1]);
  const wants = (target) => {
    const out = config?.targets?.[target]?.out;
    if (!out) return null;
    const rel = toPosix(relative(posix.dirname(cssRel), out));
    return rel.startsWith('.') ? rel : `./${rel}`;
  };
  if (!importsOf.includes('tailwindcss')) problem(`${cssRel} doesn't import tailwindcss: kit components need Tailwind 4.`, `@import 'tailwindcss';`);
  if (!importsOf.includes('tw-animate-css')) {
    warning(`${cssRel} doesn't import tw-animate-css: dialogs, menus and sheets won't animate.`, `npm install tw-animate-css, then @import 'tw-animate-css'; after tailwindcss in ${cssRel}.`);
  }
  const tokens = wants('shadcn-web');
  if (config && tokens) {
    if (!importsOf.includes(tokens)) problem(`${cssRel} doesn't import ${tokens}: kit components get no colours, sizes or type.`, `@import '${tokens}'; after tailwindcss in ${cssRel}.`);
    else if (importsOf.indexOf(tokens) < importsOf.indexOf('tailwindcss')) warning(`${cssRel} imports ${tokens} before tailwindcss.`, `Move @import '${tokens}'; after @import 'tailwindcss';.`);
    else ok(`${cssRel} imports ${tokens}.`);
  }
  // The fonts target writes CSS for a plain web app (platform: 'web'); a Next app loads them in code (next/font).
  const fonts = /\.css$/.test(config?.targets?.fonts?.out ?? '') ? wants('fonts') : null;
  if (config && fonts) {
    if (!importsOf.includes(fonts)) problem(`${cssRel} doesn't import ${fonts}: the theme's fonts won't load.`, `@import '${fonts}'; as the first line of ${cssRel}.`);
    else if (importsOf[0] !== fonts) warning(`${fonts} isn't the first import in ${cssRel}: a font @import after other rules is ignored.`, `Move @import '${fonts}'; to the top.`);
  }
  const overrides = overridingRules(css);
  if (overrides.length) {
    warning(
      `${cssRel} has rules that tokens.css also defines, and they win over it: ${overrides.map((o) => `line ${o.line} ${o.name}`).join(', ')}.`,
      'Delete them unless you mean to override the kit.'
    );
  }
  // Dark mode: something has to put .dark on <html>.
  const setsDark = deps['next-themes'] || anySource(root, ['src', 'app', '.'].filter((d) => d !== '.' || existsSync(join(root, 'index.html'))), /classList\.(add|toggle)\(\s*['"]dark['"]|class=["'][^"']*\bdark\b/);
  if (!setsDark) warning('Nothing here sets the .dark class, so dark mode never shows.', 'next-themes with attribute="class" (Next.js), or your own code that toggles .dark on <html>.');
  // Kit links: without KitLinkProvider they reload the page.
  if (libDir && existsSync(join(root, libDir, 'link.tsx')) && !anySource(root, ['src', 'app', 'components'], /KitLinkProvider/)) {
    warning('Kit components link through @/lib/link, but nothing sets KitLinkProvider: kit links reload the page.', "Wrap the app once in <KitLinkProvider link={…} usePathname={…}> (install.md, path D, step 5).");
  }
}

function expoChecks({ root, deps, config, components, ok, problem, warning }) {
  if (!deps.nativewind) problem('NativeWind isn’t installed: kit components are NativeWind classes.', 'npx expo install nativewind');
  const cssRel = components?.tailwind?.css ?? STYLESHEETS_EXPO.find((p) => existsSync(join(root, p)));
  const tokensOut = config?.targets?.nativewind3?.css;
  if (cssRel && existsSync(join(root, cssRel)) && tokensOut) {
    const css = read(join(root, cssRel));
    const rel = toPosix(relative(posix.dirname(cssRel), tokensOut));
    const spec = rel.startsWith('.') ? rel : `./${rel}`;
    const first = css.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').find((l) => l.trim());
    if (!new RegExp(`@import\\s+['"]${escape(spec)}['"]`).test(css)) problem(`${cssRel} doesn't import ${spec}: kit components get no colours or sizes.`, `@import '${spec}'; as the first line of ${cssRel}.`);
    else if (!first?.includes(spec)) warning(`${spec} isn't the first line of ${cssRel}: Tailwind only inlines an @import that comes first.`, `Move @import '${spec}'; to the top.`);
    else ok(`${cssRel} imports ${spec} first.`);
    const overrides = overridingRules(css);
    if (overrides.length) warning(`${cssRel} has rules that win over the kit's: ${overrides.map((o) => `line ${o.line} ${o.name}`).join(', ')}.`, 'Delete them unless you mean to override the kit.');
  }
  const presetOut = config?.targets?.nativewind3?.preset;
  const configRel = ['tailwind.config.js', 'tailwind.config.cjs', 'tailwind.config.ts'].find((f) => existsSync(join(root, f)));
  if (presetOut) {
    const spec = `./${presetOut.replace(/\.js$/, '')}`;
    if (!configRel) problem('No tailwind.config.js: NativeWind needs one, with the kit’s preset.', `presets: [require('nativewind/preset'), require('${spec}')]`);
    else {
      const tw = read(join(root, configRel));
      if (!tw.includes(presetOut.replace(/\.js$/, ''))) problem(`${configRel} doesn't use the kit's preset: kit classes like h-button-md don't exist.`, `presets: [require('nativewind/preset'), require('${spec}')]`);
      else ok(`${configRel} uses the kit's preset.`);
      const own = overridingExtends(tw);
      if (own.length) warning(`${configRel} extends ${own.join(', ')} itself, and those win over the kit's preset.`, 'Delete them from theme.extend unless you mean to override the kit.');
    }
  }
  const dirs = ['app', 'src'];
  if (!anySource(root, dirs, /KitThemeProvider/)) {
    warning('Nothing wraps the app in KitThemeProvider: light, dark and the system setting won’t follow the kit.', `npx shadcn@latest add @halftone-native/lib-theme-context, then wrap the root layout in <KitThemeProvider>.`);
  }
  if (config?.targets?.fonts && !anySource(root, dirs, /FONT_ASSETS/)) {
    warning("Nothing loads the theme's fonts: text falls back to the system font.", `useFonts(FONT_ASSETS) from '${components?.aliases?.lib ?? '@/lib'}/fonts' at the root (expo-font).`);
  }
}

/** Kit-changed files in components/ui, compared with the kit's copy and, when they differ, the stock one. */
async function stockChecks({ root, platform, components, uiDir, ok, problem, info, warning }) {
  const upstream = UPSTREAM[platform];
  const entry = components?.registries?.[upstream.registry];
  const template = typeof entry === 'string' ? entry : entry?.url;
  if (!template) return;
  let index;
  try {
    index = await fetchJson(template.replace('{name}', 'registry'));
  } catch (e) {
    info(`Couldn't read the kit's registry (${e.message}), so kit files weren't compared. --offline skips this.`);
    return;
  }
  const ui = (index.items ?? []).filter((i) => i.type === 'registry:ui').flatMap((i) => (i.files ?? []).map((f) => ({ item: i.name, path: f.path })));
  const installed = ui.map((f) => ({ ...f, local: posix.join(uiDir, posix.basename(f.path)) })).filter((f) => existsSync(join(root, f.local)));
  if (!installed.length) return;
  const replaced = [];
  const edited = [];
  await Promise.all(
    installed.map(async (f) => {
      const local = normalizeSource(read(join(root, f.local)));
      const kit = await fetchJson(template.replace('{name}', f.item)).catch(() => null);
      const kitFile = kit?.files?.find((x) => x.path === f.path);
      if (!kitFile || normalizeSource(kitFile.content) === local) return;
      const name = posix.basename(f.path).replace(/\.tsx?$/, '');
      const stock = await fetchJson(upstream.url.replace('{name}', name)).catch(() => null);
      const stockFile = stock?.files?.find((x) => posix.basename(x.path) === posix.basename(f.path)) ?? stock?.files?.[0];
      if (stockFile && normalizeSource(stockFile.content) === local) replaced.push(f);
      else edited.push(f);
    })
  );
  const ns = upstream.registry;
  if (replaced.length) {
    problem(
      `${replaced.map((f) => f.local).join(', ')}: ${upstream.label} stock version replaced the kit's, so kit components look and behave wrong.`,
      `npx shadcn@latest add ${replaced.map((f) => `${ns}/${f.item}`).join(' ')} --overwrite`
    );
  }
  if (edited.length) {
    warning(
      `${edited.map((f) => f.local).join(', ')} differ${edited.length === 1 ? 's' : ''} from the kit's version (edited here, or from an older kit).`,
      `Fine if you meant it. To take the kit's again: npx shadcn@latest add ${edited.map((f) => `${ns}/${f.item}`).join(' ')} --overwrite`
    );
  }
  const same = installed.length - replaced.length - edited.length;
  if (same) ok(`${same} kit file(s) in ${uiDir} match the kit's registry.`);
}
