#!/usr/bin/env node
/**
 * The native kit in an app that isn't the kit: tests/expo-app (Expo + NativeWind + react-native-reusables), set up
 * the way install.md path C tells anyone to, exported for the web and opened in a browser.
 *
 *   npm run registry:dist -w apps/mobile && npm run check:expo-app      (--keep leaves the temp app for a look)
 *
 * 1. copies tests/expo-app to a temp folder and serves apps/mobile/dist/r/native as its registry;
 * 2. installs the app and the workspace's @halftone-ds/tokens (packed, as npm would ship it);
 * 3. `halftone-tokens init --theme editorial`: a theme with its own fonts, so the font packages are installed and
 *    lib/fonts.ts loads them; global.css and tailwind.config.js must be wired;
 * 4. `shadcn add` every kit component (the setup note must print once), `npx expo install --fix`, then
 *    `halftone-tokens build`, which must put the app's brand back into lib/fonts.ts;
 * 5. `tsc --noEmit` and `expo export --platform web`, served and opened in Chromium: no console errors, the button
 *    takes the kit's height, headings the theme's font, and ?theme=dark switches the surfaces.
 * CI can't run a simulator: the native look is checked by hand (the qc-pass skill).
 */
import { spawn } from 'node:child_process';
import { cpSync, createReadStream, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'apps/mobile/dist/r/native');
const SHADCN = 'shadcn@4.22.1';
const keep = process.argv.includes('--keep');

if (!existsSync(join(dist, 'registry.json'))) {
  console.error('expo-app-check: run `npm run registry:dist -w apps/mobile` first.');
  process.exit(1);
}

const failures = [];
const check = (ok, what) => {
  console.log(`${ok ? '✓' : '✗'} ${what}`);
  if (!ok) failures.push(what);
};

/** Run a command, stream its output, resolve with it. Async: the servers below share this process. */
function sh(cmd, args, cwd, { quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' } });
    let out = '';
    const take = (stream) => (chunk) => {
      out += chunk;
      if (!quiet) stream.write(chunk);
    };
    child.stdout.on('data', take(process.stdout));
    child.stderr.on('data', take(process.stderr));
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}\n${quiet ? out.slice(-4000) : ''}`))));
  });
}

/** A static server: `dir` at `/`, with `fallback` for paths that aren't files (the web export's SPA). */
function serve(dir, fallback) {
  const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png' };
  const server = createServer((req, res) => {
    let file = join(dir, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(dir) || !existsSync(file) || !statSync(file).isFile()) file = fallback ? join(dir, fallback) : null;
    if (!file || !existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const registryServer = await serve(dist);
const registry = `http://127.0.0.1:${registryServer.address().port}/{name}.json`;
const temp = mkdtempSync(join(tmpdir(), 'halftone-expo-app-'));
const app = join(temp, 'app');
let webServer;
try {
  cpSync(join(root, 'tests/expo-app'), app, { recursive: true, filter: (src) => !/node_modules|dist$|\.expo$/.test(src) });
  const config = JSON.parse(readFileSync(join(app, 'components.json'), 'utf8'));
  config.registries['@halftone-native'] = registry;
  writeFileSync(join(app, 'components.json'), JSON.stringify(config, null, 2));

  console.log('\n▸ install the app and @halftone-ds/tokens (packed from the workspace)');
  await sh('npm', ['pack', '-w', 'packages/tokens', '--pack-destination', temp], root, { quiet: true });
  const tgz = readdirSync(temp).find((f) => f.endsWith('.tgz'));
  await sh('npm', ['install', '--no-audit', '--no-fund', '--no-package-lock'], app, { quiet: true });
  await sh('npm', ['install', '--no-audit', '--no-fund', '--no-package-lock', '-D', join(temp, tgz)], app, { quiet: true });

  console.log('\n▸ halftone-tokens init --theme editorial');
  await sh('npx', ['halftone-tokens', 'init', '--theme', 'editorial'], app);
  check(readFileSync(join(app, 'global.css'), 'utf8').startsWith("@import './tokens/generated/tokens.css';"), 'init imported tokens.css first in global.css');
  check(readFileSync(join(app, 'tailwind.config.js'), 'utf8').includes("require('./tokens/generated/tailwind.preset')"), "init added the kit's preset to tailwind.config.js");

  console.log('\n▸ shadcn add every kit component, expo install --fix, halftone-tokens build');
  const { items } = JSON.parse(readFileSync(join(dist, 'registry.json'), 'utf8'));
  const names = items.filter((i) => i.type === 'registry:ui' || i.type === 'registry:component').map((i) => `@halftone-native/${i.name}`);
  const added = await sh('npx', ['-y', SHADCN, 'add', ...names, '--overwrite', '--yes'], app, { quiet: true });
  check((added.match(/Kit components need the whole generated theme/g) ?? []).length === 1, `the setup note printed once for ${names.length} components`);
  await sh('npx', ['expo', 'install', '--fix'], app, { quiet: true });
  await sh('npx', ['halftone-tokens', 'build'], app);
  check(readFileSync(join(app, 'lib/fonts.ts'), 'utf8').includes('@expo-google-fonts/fraunces'), "halftone-tokens build put the app's fonts back into lib/fonts.ts");

  console.log('\n▸ tsc --noEmit && expo export --platform web');
  await sh('npm', ['run', 'typecheck'], app);
  await sh('npm', ['run', 'export:web'], app, { quiet: true });

  console.log('\n▸ the web export in Chromium');
  webServer = await serve(join(app, 'dist'), 'index.html');
  const base = `http://127.0.0.1:${webServer.address().port}`;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    const look = async (url) => {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.getByText('Primary').first().waitFor({ timeout: 30000 });
      return page.evaluate(() => {
        const button = document.querySelector('[data-testid="primary"]');
        const heading = [...document.querySelectorAll('div, h1')].find((e) => e.textContent === 'Halftone' && e.children.length === 0);
        return {
          buttonH: getComputedStyle(document.documentElement).getPropertyValue('--button-h-md').trim(),
          buttonHeight: button?.getBoundingClientRect().height ?? 0,
          headingFont: heading ? getComputedStyle(heading).fontFamily : '',
          background: getComputedStyle(document.body).backgroundColor,
          surface: getComputedStyle(document.querySelector('[data-testid="primary"]')?.closest('div[class*="bg-background"]') ?? document.body).backgroundColor,
        };
      });
    };
    const light = await look(`${base}/?theme=light`);
    check(light.buttonH !== '' && light.buttonHeight >= 32, `the kit's tokens apply (--button-h-md ${light.buttonH}, button ${light.buttonHeight}px)`);
    check(/Fraunces/.test(light.headingFont), `headings take the theme's font (${light.headingFont})`);
    const dark = await look(`${base}/?theme=dark`);
    check(dark.surface !== light.surface, `?theme=dark switches the surfaces (${light.surface} → ${dark.surface})`);
    const real = errors.filter((e) => !/fonts\.(googleapis|gstatic)\.com|favicon/.test(e));
    check(real.length === 0, `no console errors${real.length ? `:\n  ${real.join('\n  ')}` : ''}`);
  } finally {
    await browser.close();
  }
} catch (error) {
  failures.push(error.message);
  console.error(`\n${error.message}`);
} finally {
  registryServer.close();
  webServer?.close();
  if (keep) console.log(`\nKept: ${app}`);
  else rmSync(temp, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\nexpo-app-check: ${failures.length} problem(s).`);
  process.exit(1);
}
console.log('\nexpo-app-check: the native kit works in a plain Expo app.');
