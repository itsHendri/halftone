#!/usr/bin/env node
/**
 * The web kit in an app that isn't the kit: tests/react-app (Vite + React Router), set up the way install.md tells
 * anyone to, then built and opened in a browser.
 *
 *   npm run registry:dist -w apps/web && npm run check:react-app      (--keep leaves the temp app for a look)
 *
 * 1. copies tests/react-app to a temp folder and serves apps/web/dist/r/web as its registry;
 * 2. installs the app's pinned packages and the workspace's @halftone-ds/tokens (packed, as npm would ship it);
 * 3. `halftone-tokens init --theme editorial` (a theme with its own fonts, so fonts.css is exercised);
 * 4. `shadcn add` every kit component: the setup note must print once, and the kit's button must survive;
 * 5. `tsc --noEmit && vite build`, then `vite preview` and Playwright: no console errors, the kit's tokens and the
 *    theme's heading font apply, AppShell marks the open page, a kit link navigates without reloading the page,
 *    and the kit's alert dialog opens.
 */
import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'apps/web/dist/r/web');
const SHADCN = 'shadcn@4.22.1';
const PREVIEW = 4174;
const keep = process.argv.includes('--keep');

if (!existsSync(join(dist, 'registry.json'))) {
  console.error('react-app-check: run `npm run registry:dist -w apps/web` first.');
  process.exit(1);
}

const failures = [];
const check = (ok, what) => {
  console.log(`${ok ? '✓' : '✗'} ${what}`);
  if (!ok) failures.push(what);
};

/** Run a command, stream its output, resolve with it. Async: the registry server below shares this process. */
function sh(cmd, args, cwd, { quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CI: '1' } });
    let out = '';
    const take = (stream) => (chunk) => {
      out += chunk;
      if (!quiet) stream.write(chunk);
    };
    child.stdout.on('data', take(process.stdout));
    child.stderr.on('data', take(process.stderr));
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}\n${quiet ? out : ''}`))));
  });
}

const server = createServer((req, res) => {
  const file = join(dist, decodeURIComponent(req.url.split('?')[0]));
  if (file.startsWith(dist) && existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200, { 'content-type': 'application/json' });
    createReadStream(file).pipe(res);
  } else res.writeHead(404).end();
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const registry = `http://127.0.0.1:${server.address().port}/{name}.json`;

const temp = mkdtempSync(join(tmpdir(), 'halftone-react-app-'));
const app = join(temp, 'app');
let preview;
try {
  cpSync(join(root, 'tests/react-app'), app, { recursive: true, filter: (src) => !/node_modules|dist$/.test(src) });
  const config = JSON.parse(readFileSync(join(app, 'components.json'), 'utf8'));
  config.registries['@halftone-web'] = registry;
  writeFileSync(join(app, 'components.json'), JSON.stringify(config, null, 2));

  console.log('\n▸ install the app and @halftone-ds/tokens (packed from the workspace)');
  await sh('npm', ['pack', '-w', 'packages/tokens', '--pack-destination', temp], root, { quiet: true });
  const tgz = readdirSync(temp).find((f) => f.endsWith('.tgz'));
  await sh('npm', ['install', '--no-audit', '--no-fund', '--no-package-lock'], app, { quiet: true });
  await sh('npm', ['install', '--no-audit', '--no-fund', '--no-package-lock', '-D', join(temp, tgz)], app, { quiet: true });

  console.log('\n▸ halftone-tokens init --theme editorial');
  await sh('npx', ['halftone-tokens', 'init', '--theme', 'editorial'], app);
  const css = readFileSync(join(app, 'src/index.css'), 'utf8');
  check(css.startsWith("@import './fonts.css';") && css.includes("@import './tokens.css';"), 'init wired fonts.css and tokens.css into src/index.css');

  console.log('\n▸ shadcn add every kit component');
  const { items } = JSON.parse(readFileSync(join(dist, 'registry.json'), 'utf8'));
  const names = items.filter((i) => i.type === 'registry:ui' || i.type === 'registry:component').map((i) => `@halftone-web/${i.name}`);
  const added = await sh('npx', ['-y', SHADCN, 'add', ...names, '--overwrite', '--yes'], app, { quiet: true });
  check((added.match(/Kit components need the whole generated tokens\.css/g) ?? []).length === 1, `the setup note printed once for ${names.length} components`);
  check(readFileSync(join(app, 'src/components/ui/button.tsx'), 'utf8').includes('h-(--button-h-md)'), "the kit's button survived (not shadcn's stock one)");

  console.log('\n▸ tsc --noEmit && vite build');
  await sh('npm', ['run', 'build'], app);

  console.log('\n▸ vite preview + Playwright');
  preview = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW), '--strictPort'], { cwd: app, stdio: 'ignore', detached: true });
  const base = `http://localhost:${PREVIEW}`;
  for (let i = 0; i < 60; i++) {
    if (await fetch(base).then((r) => r.ok, () => false)) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base, { waitUntil: 'networkidle' });

    const look = await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find((b) => b.textContent === 'New item');
      return {
        buttonH: getComputedStyle(document.documentElement).getPropertyValue('--button-h-md').trim(),
        buttonHeight: button?.getBoundingClientRect().height ?? 0,
        headingFont: getComputedStyle(document.querySelector('h1')).fontFamily,
        current: [...document.querySelectorAll('nav a[aria-current="page"]')].map((a) => a.getAttribute('href')),
      };
    });
    check(look.buttonH !== '' && look.buttonHeight >= 32, `the kit's tokens apply (--button-h-md ${look.buttonH}, button ${look.buttonHeight}px)`);
    check(/Fraunces/.test(look.headingFont), `the theme's heading font applies (${look.headingFont})`);
    check(look.current.join() === '/', `AppShell marks the open page (${look.current.join() || 'none'})`);

    await page.evaluate(() => (window.__kept = true));
    await page.locator('nav').first().getByRole('link', { name: 'Settings' }).click();
    await page.waitForURL(`${base}/settings`);
    // React Router renders the new route in a transition, a moment after the URL changes.
    await page
      .waitForFunction(() => document.querySelector('nav a[aria-current="page"]')?.getAttribute('href') === '/settings', null, { timeout: 5000 })
      .catch(() => {});
    const after = await page.evaluate(() => ({
      kept: window.__kept === true,
      current: [...document.querySelectorAll('nav a[aria-current="page"]')].map((a) => a.getAttribute('href')),
    }));
    check(after.kept, 'a kit link navigates through React Router (no page reload)');
    check(after.current.join() === '/settings', `the active item follows (${after.current.join() || 'none'})`);

    await page.getByRole('button', { name: 'Delete workspace' }).click();
    check(await page.getByRole('alertdialog').isVisible(), "the kit's alert dialog opens");

    const real = errors.filter((e) => !/fonts\.(googleapis|gstatic)\.com/.test(e));
    check(real.length === 0, `no console errors${real.length ? `:\n  ${real.join('\n  ')}` : ''}`);
  } finally {
    await browser.close();
  }
} catch (error) {
  failures.push(error.message);
  console.error(`\n${error.message}`);
} finally {
  if (preview) process.kill(-preview.pid);
  server.close();
  if (keep) console.log(`\nKept: ${app}`);
  else rmSync(temp, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\nreact-app-check: ${failures.length} problem(s).`);
  process.exit(1);
}
console.log('\nreact-app-check: the web kit works in a Vite + React Router app.');
