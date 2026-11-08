#!/usr/bin/env node
/**
 * The Vite + Workers starter as someone gets it: apps/vite copied out of the monorepo (like `npx giget`), installed on
 * its own with this commit's @halftone-ds/tokens (packed), every gate run, then `vite preview` (the Worker in the
 * real Workers runtime, through @cloudflare/vite-plugin) opened in Chromium.
 *
 *   npm run check:vite      (--keep leaves the copy for a look)
 *
 * Gates: tokens:check, typecheck, lint, lint:rules, doctor (offline: the live registry may be ahead of this commit),
 * build. In the browser: /api/health answers {"ready":true} uncached, the overview's tiles come from /api/stats, a
 * deep link (/projects) loads, the kit's tokens apply, the theme follows the stored choice, no console errors.
 * `npm run vite:sync -- --check` (CI runs it first) checks that the starter's kit files match the registry.
 */
import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PREVIEW = 4183;
const keep = process.argv.includes('--keep');

const failures = [];
const check = (ok, what) => {
  console.log(`${ok ? '✓' : '✗'} ${what}`);
  if (!ok) failures.push(what);
};

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
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}\n${quiet ? out.slice(-4000) : ''}`))));
  });
}

const temp = mkdtempSync(join(tmpdir(), 'halftone-vite-'));
const app = join(temp, 'app');
let preview;
try {
  console.log('\n▸ copy apps/vite out and install it on its own, with this commit’s @halftone-ds/tokens');
  cpSync(join(root, 'apps/vite'), app, { recursive: true, filter: (src) => !/node_modules|[/\\]dist$|\.wrangler$/.test(src) });
  await sh('npm', ['pack', '-w', 'packages/tokens', '--pack-destination', temp], root, { quiet: true });
  const tgz = readdirSync(temp).find((f) => f.endsWith('.tgz'));
  await sh('npm', ['pkg', 'set', `devDependencies.@halftone-ds/tokens=file:${join(temp, tgz)}`], app, { quiet: true });
  await sh('npm', ['install', '--no-audit', '--no-fund'], app, { quiet: true });

  for (const script of ['tokens:check', 'typecheck', 'lint', 'lint:rules', 'build']) {
    console.log(`\n▸ npm run ${script}`);
    await sh('npm', ['run', script], app, { quiet: true }).then(
      () => check(true, `npm run ${script}`),
      (e) => check(false, `npm run ${script}\n${e.message}`)
    );
  }
  const doctor = await sh('npx', ['halftone-tokens', 'doctor', '--offline', '--json'], app, { quiet: true }).then(
    (out) => JSON.parse(out.slice(out.indexOf('{'))),
    (e) => ({ ok: false, results: [{ level: 'problem', message: e.message }] })
  );
  const noted = doctor.results.filter((r) => r.level === 'problem' || r.level === 'warning').map((r) => r.message);
  check(doctor.ok && noted.length === 0, `doctor: nothing to fix${noted.length ? `:\n  ${noted.join('\n  ')}` : ''}`);

  console.log('\n▸ vite preview (the Worker in workerd) + Playwright');
  preview = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW), '--strictPort'], { cwd: app, stdio: 'ignore', detached: true });
  const base = `http://localhost:${PREVIEW}`;
  for (let i = 0; i < 90; i++) {
    if (await fetch(`${base}/api/health`).then((r) => r.ok, () => false)) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const health = await fetch(`${base}/api/health`);
  check(health.status === 200 && (await health.text()) === '{"ready":true}' && health.headers.get('cache-control') === 'no-store', 'GET /api/health: 200, {"ready":true}, Cache-Control: no-store');
  check((await fetch(`${base}/api/nope`)).status === 404, 'an unknown /api path is a 404');

  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(base, { waitUntil: 'networkidle' });
    await page.getByText('Active projects').waitFor({ timeout: 15000 });
    const look = await page.evaluate(() => ({
      tiles: document.body.textContent.includes('Open tasks') && document.body.textContent.includes('92%'),
      buttonH: getComputedStyle(document.documentElement).getPropertyValue('--button-h-md').trim(),
      sideways: document.documentElement.scrollWidth > window.innerWidth,
    }));
    check(look.tiles, "the overview's tiles come from /api/stats");
    check(look.buttonH !== '', `the kit's tokens apply (--button-h-md ${look.buttonH})`);
    check(!look.sideways, 'no sideways scroll at 375px');

    await page.goto(`${base}/projects`, { waitUntil: 'networkidle' });
    await page.getByText('Customer portal').waitFor({ timeout: 15000 });
    check(true, 'a deep link (/projects) loads, and its table comes from /api/projects');

    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    await page.reload({ waitUntil: 'networkidle' });
    check(await page.evaluate(() => document.documentElement.classList.contains('dark')), 'a stored dark choice applies before the app loads');

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
  if (keep) console.log(`\nKept: ${app}`);
  else rmSync(temp, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\nvite-check: ${failures.length} problem(s).`);
  process.exit(1);
}
console.log('\nvite-check: the Vite + Workers starter works copied out on its own.');
