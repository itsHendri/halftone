#!/usr/bin/env node
/**
 * scripts/qc-look.mjs — the browser half of qc-pass, as checks a run can pass or fail.
 *
 *   npm run qc:look                                  # the kit home and every prototype, against npm run dev
 *   npm run qc:look -- /acme /acme/settings          # just these pages
 *   npm run qc:look -- --label before …              # save the screenshots under .qc/before (default: .qc/latest)
 *   npm run qc:look -- --compare before after        # which screenshots changed between two runs
 *
 * Each page is opened at every width in both themes, against a dev server that is already running (start it
 * first). A page passes when:
 *   - axe-core (the engine behind Lighthouse's accessibility score) finds no WCAG 2.1 A or AA violation,
 *   - nothing scrolls sideways (the page is no wider than the window),
 *   - the console has no errors (hydration warnings included) and the page threw nothing,
 *   - the theme it rendered is the one asked for,
 *   - and, where the kit asks for it (the web kit), every stop the Tab key reaches shows a focus ring.
 * Screenshots land in .qc/<label>/ (gitignored) for a person or an agent to look at; --compare lists the ones
 * that differ between two labels, and the ones only one of them has.
 *
 * Needs Chromium once: `npx playwright install chromium`.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- this kit -----------------------------------------------------------------------------------
const KIT = {
  url: 'http://localhost:3100',
  start: 'npm run dev',
  widths: [375, 1280],
  /** The kit home, plus each prototype: a folder under app/ with its own page.tsx. */
  pages: (root) => [
    '/',
    ...readdirSync(join(root, 'app'), { withFileTypes: true })
      .filter((d) => d.isDirectory() && !/^[(_]|^api$/.test(d.name) && existsSync(join(root, 'app', d.name, 'page.tsx')))
      .map((d) => `/${d.name}`),
  ],
  focus: true,
};
// -------------------------------------------------------------------------------------------------------

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const SCHEMES = ['light', 'dark'];
const TAB_STOPS = 25;

function fail(message) {
  console.error(`qc:look: ${message}`);
  process.exit(1);
}

const argv = process.argv.slice(2);
const option = (name) => {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  const value = argv[i + 1];
  if (!value || value.startsWith('--')) fail(`${name} needs a value`);
  argv.splice(i, 2);
  return value;
};

const compareAt = argv.indexOf('--compare');
const compare = compareAt === -1 ? null : argv.splice(compareAt, 3).slice(1);
if (compare && compare.length < 2) fail('--compare needs two labels, e.g. --compare before after');
const base = (option('--url') ?? KIT.url).replace(/\/$/, '');
const label = option('--label') ?? 'latest';
const widthsArg = option('--widths');
const widths = widthsArg ? widthsArg.split(',').map(Number) : KIT.widths;
const unknown = argv.filter((a) => a.startsWith('--'));
if (unknown.length) fail(`unknown ${unknown.join(', ')}. Options: [paths…] --url <dev server> --label <name> --widths 375,1280 | --compare <a> <b>`);
const pages = argv.length ? argv.map((p) => (p.startsWith('/') ? p : `/${p}`)) : KIT.pages(root);

let chromium, AxeBuilder;
try {
  ({ chromium } = await import('playwright'));
  ({ default: AxeBuilder } = await import('@axe-core/playwright'));
} catch {
  fail('playwright and @axe-core/playwright are dev dependencies of this kit; run npm install.');
}
async function launch() {
  try {
    return await chromium.launch();
  } catch (error) {
    if (/Executable doesn't exist|install/i.test(error.message)) fail('Chromium is not installed: npx playwright install chromium');
    throw error;
  }
}

// --compare a b: which screenshots changed, by pixel, with a diff image for each that did.
if (compare) {
  const [a, b] = compare;
  const shots = (name) => {
    const dir = join(root, '.qc', name);
    if (!existsSync(dir)) fail(`no screenshots under .qc/${name}; run npm run qc:look -- --label ${name} first`);
    return new Set(readdirSync(dir).filter((f) => f.endsWith('.png')));
  };
  const [before, after] = [shots(a), shots(b)];
  const both = [...after].filter((f) => before.has(f));
  const diffDir = join(root, '.qc', `diff-${a}-${b}`);
  mkdirSync(diffDir, { recursive: true });
  const browser = await launch();
  const page = await browser.newPage();
  const changed = [];
  for (const f of both) {
    const [x, y] = [a, b].map((l) => `data:image/png;base64,${readFileSync(join(root, '.qc', l, f)).toString('base64')}`);
    // Decode both in the browser and count pixels that differ by more than anti-aliasing does. The diff image is
    // the new shot faded, with every changed pixel in magenta.
    const result = await page.evaluate(
      async ([x, y, tolerance]) => {
        const load = (src) => new Promise((ok, no) => Object.assign(new Image(), { onload() { ok(this); }, onerror: no, src }));
        const [i, j] = await Promise.all([load(x), load(y)]);
        const w = Math.max(i.width, j.width), h = Math.max(i.height, j.height);
        const pixels = (img) => {
          const c = new OffscreenCanvas(w, h).getContext('2d');
          c.drawImage(img, 0, 0);
          return c.getImageData(0, 0, w, h);
        };
        const [p, q] = [pixels(i), pixels(j)];
        const out = new OffscreenCanvas(w, h).getContext('2d');
        const diff = out.createImageData(w, h);
        let count = 0;
        for (let k = 0; k < p.data.length; k += 4) {
          const d = Math.max(...[0, 1, 2, 3].map((n) => Math.abs(p.data[k + n] - q.data[k + n])));
          const hit = d > tolerance;
          if (hit) count++;
          diff.data.set(hit ? [255, 0, 200, 255] : [q.data[k], q.data[k + 1], q.data[k + 2], 60], k);
        }
        if (!count) return { count, size: w !== i.width || h !== i.height || w !== j.width || h !== j.height };
        out.putImageData(diff, 0, 0);
        const blob = await out.canvas.convertToBlob({ type: 'image/png' });
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let bin = '';
        for (let k = 0; k < bytes.length; k += 0x8000) bin += String.fromCharCode(...bytes.subarray(k, k + 0x8000));
        return { count, share: count / (w * h), png: btoa(bin) };
      },
      [x, y, 24]
    );
    if (result.count) {
      writeFileSync(join(diffDir, f), Buffer.from(result.png, 'base64'));
      changed.push({ f, share: result.share });
    }
  }
  await browser.close();
  const added = [...after].filter((f) => !before.has(f));
  const gone = [...before].filter((f) => !after.has(f));
  console.log(`qc:look --compare ${a} ${b}: ${changed.length} changed, ${both.length - changed.length} the same, ${added.length} only in ${b}, ${gone.length} only in ${a}`);
  for (const c of changed) console.log(`  changed   ${(c.share * 100).toFixed(2).padStart(6)}% of pixels  .qc/${a}/${c.f} → .qc/${b}/${c.f}  (diff: .qc/diff-${a}-${b}/${c.f})`);
  for (const f of added) console.log(`  only ${b}  .qc/${b}/${f}`);
  for (const f of gone) console.log(`  only ${a}  .qc/${a}/${f}`);
  process.exit(0);
}

try {
  await fetch(base);
} catch {
  fail(`nothing answers at ${base}. Start the dev server first (${KIT.start}), or pass --url.`);
}
const browser = await launch();

const out = join(root, '.qc', label);
mkdirSync(out, { recursive: true });
const shotName = (path, width, scheme) => `${path.replace(/^\/$/, 'home').replace(/^\//, '').replace(/[^\w-]+/g, '_')}__${width}__${scheme}.png`;
const results = [];

for (const scheme of SCHEMES) {
  for (const width of widths) {
    const context = await browser.newContext({ colorScheme: scheme, viewport: { width, height: width < 768 ? 812 : 900 } });
    for (const path of pages) {
      const page = await context.newPage();
      const problems = [];
      page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text().split('\n')[0].slice(0, 200)}`));
      page.on('pageerror', (e) => problems.push(`threw: ${e.message.split('\n')[0].slice(0, 200)}`));

      const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 60_000 }).catch((e) => {
        problems.push(`load: ${e.message.split('\n')[0]}`);
        return null;
      });
      if (response && response.status() >= 400) problems.push(`load: HTTP ${response.status()}`);
      // Let entrance animations and theme hydration settle before looking.
      await page.waitForTimeout(800);

      const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      if (dark !== (scheme === 'dark')) problems.push(`theme: asked for ${scheme}, rendered ${dark ? 'dark' : 'light'}`);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) problems.push(`overflow: the page is ${overflow}px wider than the ${width}px window`);

      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      for (const v of violations) {
        const node = v.nodes[0];
        const why = (node?.any[0] ?? node?.all[0] ?? node?.none[0])?.message ?? '';
        problems.push(`axe ${v.id}: ${v.help} (${v.nodes.length}×; first: ${node?.target.join(' > ')}${why ? `, ${why}` : ''})`);
      }

      if (KIT.focus && width === Math.max(...widths)) {
        const missing = [];
        let previous;
        for (let i = 0; i < TAB_STOPS; i++) {
          await page.keyboard.press('Tab');
          const stop = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            // Next's dev-only overlay, not the page.
            if (el.tagName === 'NEXTJS-PORTAL') return { id: 'nextjs-portal', ring: true };
            const s = getComputedStyle(el);
            const clear = (c) => c === 'transparent' || /(?:\/\s*0|,\s*0)\)$/.test(c);
            const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 && !clear(s.outlineColor)) || (s.boxShadow && s.boxShadow !== 'none');
            const name = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 30) || '';
            return { id: `${el.tagName.toLowerCase()}${name ? ` "${name}"` : ''}`, ring };
          });
          if (!stop || stop.id === previous) break;
          previous = stop.id;
          if (!stop.ring) missing.push(stop.id);
        }
        if (missing.length) problems.push(`focus: no visible ring on ${missing.length} Tab stop(s): ${missing.slice(0, 4).join(', ')}`);
        await page.keyboard.press('Escape');
        await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : null));
      }

      const shot = shotName(path, width, scheme);
      // Next's dev badge sits over the page in development; keep it out of the pictures.
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' }).catch(() => {});
      await page.screenshot({ path: join(out, shot), fullPage: true }).catch(() => problems.push('screenshot: could not take it'));
      results.push({ path, width, scheme, screenshot: `.qc/${label}/${shot}`, problems });
      console.log(`${problems.length ? '✗' : '✓'} ${scheme.padEnd(5)} ${String(width).padStart(4)}px ${path}${problems.length ? `  (${problems.length})` : ''}`);
      await page.close();
    }
    await context.close();
  }
}
await browser.close();

writeFileSync(join(out, 'report.json'), JSON.stringify({ base, widths, results }, null, 2) + '\n');
const failed = results.filter((r) => r.problems.length);
if (failed.length) {
  console.error(`\nqc:look: ${failed.length} of ${results.length} views failed (screenshots in .qc/${label}/)`);
  for (const r of failed) {
    console.error(`  ${r.scheme} ${r.width}px ${r.path}`);
    for (const p of r.problems) console.error(`      ${p}`);
  }
  process.exit(1);
}
console.log(`\nqc:look: ${pages.length} page(s) × ${widths.length} width(s) × 2 themes, all pass. Screenshots in .qc/${label}/`);
