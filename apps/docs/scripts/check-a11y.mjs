#!/usr/bin/env node
/**
 * Accessibility gate for the built site: `npm run check:a11y` after `npm run build`.
 *
 * Serves out/ with wrangler (the same rules Cloudflare applies), opens each page in Chromium in light and
 * dark, and runs axe-core (the engine behind Lighthouse's accessibility score) against WCAG 2.1 A and AA,
 * including the kits running inside the phone and browser frames. Any violation fails the run.
 *
 * Needs Chromium once: `npx playwright install chromium` (CI: `--with-deps`).
 *
 * The mobile kit in the phone frames (/m) is checked too. React Native for Web only renders the `aria-*`
 * props, not `accessibilityState`/`accessibilityValue`, so the kit's components use those; a failure in a
 * phone frame is fixed in apps/mobile. MOBILE_FRAMES = false skips the frames while one is being fixed.
 *
 * It also checks the top bar is the same on every site page at 1920px (wider than Fumadocs' 97rem layout
 * width, where the notebook grid used to inset it): same width, logo at the same x. See lib/layout.shared.tsx.
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const docs = join(import.meta.dirname, '..');
const PORT = Number(process.env.A11Y_PORT ?? 8799);
const BASE = `http://localhost:${PORT}`;

/** The pages people land on, one of each kind, plus the web kit's own pages. */
const PAGES = [
  '/',
  '/components/',
  '/components/button/',
  '/components/list-row/',
  '/components/data-table/',
  '/components/biometric-gate/',
  '/components/dialog/',
  '/screens/',
  '/docs/',
  '/docs/install/',
  '/docs/web/',
  '/docs/patterns/',
  '/docs/foundations/',
  '/docs/themes/',
  '/studio/',
  '/studio/?tab=components',
  '/studio/?tab=accessibility',
  '/w/',
  '/w/components/',
  '/w/dashboard/',
  '/w/dashboard/invoices/',
  '/w/dashboard/settings/',
  '/w/landing/',
  '/w/assistant/',
  '/w/shop/',
  '/w/shop/product/lamp/',
  '/w/shop/cart/',
  '/w/shop/checkout/',
  '/w/shop/order/',
  '/w/habits/',
  '/w/habits/insights/',
  '/w/habits/calendar/',
  '/w/habits/habit/',
  '/w/showcase/',
  '/w/showcase/typeset/',
];
/**
 * The Studio's popovers, open (components/theme/studio/item-popover.tsx): each is clicked open on /studio/ and checked
 * as it stands, in both themes, at a desktop width and as a phone's bottom sheet. `click` is the selectors to click
 * in turn; `wait` what shows once it's open (a popover, by default).
 */
const POPOVERS = [
  { name: 'logo slot', click: ['button[aria-label^="Logo:"]'] },
  { name: 'role + token picker', click: ['button[aria-label^="Primary:"]', 'button[aria-label^="Primary, light:"]'] },
  { name: 'ramp', click: ['button[aria-label^="Brand ramp"]'] },
  { name: 'step', click: ['button[aria-label^="Brand 600,"]'] },
  { name: 'font picker', click: ['button[aria-label^="Heading font:"]'] },
  { name: 'text style', click: ['button[aria-label^="Heading 2,"]'] },
  { name: 'shadow layers', click: ['button[aria-label^="Shadow 2:"]'] },
  { name: 'item menu', click: ['button[aria-label="Primary · role: more"]'], wait: '[role="menu"]' },
  { name: '+ New', click: ['button:has-text("New colour")'], wait: '[role="menu"]' },
];
const SCHEMES = ['light', 'dark'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const MOBILE_FRAMES = true;

const server = spawn('npx', ['wrangler', 'dev', '--port', String(PORT), '--ip', '127.0.0.1', '--log-level', 'error'], {
  cwd: docs,
  env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: 'true' },
  stdio: ['ignore', 'inherit', 'inherit'],
});
const stop = () => server.kill('SIGTERM');
process.on('exit', stop);

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`check-a11y: the preview server did not start on ${BASE}`);
}

await waitForServer();
const browser = await chromium.launch();
const failures = [];

for (const scheme of SCHEMES) {
  const context = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 900 } });
  for (const path of PAGES) {
    const page = await context.newPage();
    // networkidle can take a while on a page with several kit frames and Google Fonts (Studio);
    // past 60s, check the page as it is rather than fail on a slow CDN.
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 60_000 }).catch(async (error) => {
      if (error.name !== 'TimeoutError') throw error;
      console.log(`  (${path}: still loading after 60s, checked as it is)`);
    });
    // Let the frames boot and take the theme, and let entrance animations finish.
    await page.waitForTimeout(1500);
    const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (dark !== (scheme === 'dark')) {
      failures.push({ path, scheme, rule: 'theme', help: `expected the ${scheme} theme, page rendered ${dark ? 'dark' : 'light'}`, nodes: [] });
    }
    const axe = new AxeBuilder({ page }).withTags(TAGS);
    if (!MOBILE_FRAMES) axe.exclude('iframe[src^="/m/"]');
    const { violations } = await axe.analyze();
    for (const v of violations) {
      failures.push({
        path,
        scheme,
        rule: v.id,
        help: v.help,
        // axe's own reason, e.g. "insufficient color contrast of 3.1 (foreground #…, background #…)".
        nodes: v.nodes.slice(0, 3).map((n) => `${n.target.join(' > ')}  ${(n.any[0] ?? n.all[0] ?? n.none[0])?.message ?? ''}`),
      });
    }
    console.log(`${violations.length ? '✗' : '✓'} ${scheme.padEnd(5)} ${path}${violations.length ? `  (${violations.map((v) => v.id).join(', ')})` : ''}`);
    await page.close();
  }
  await context.close();

  for (const [width, height] of [
    [1280, 900],
    [375, 812],
  ]) {
    const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width, height } });
    for (const popover of POPOVERS) {
      const page = await ctx.newPage();
      const label = `/studio/ (${popover.name} popover, ${width}px)`;
      await page.goto(`${BASE}/studio/`, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => {});
      await page.waitForTimeout(1000);
      try {
        for (const selector of popover.click) {
          await page.locator(selector).first().click();
          await page.waitForTimeout(400);
        }
        await page.locator(popover.wait ?? '[data-studio-popover]').first().waitFor({ state: 'visible', timeout: 5000 });
      } catch (error) {
        failures.push({ path: label, scheme, rule: 'open', help: `could not open it: ${error.message.split('\n')[0]}`, nodes: [] });
        await page.close();
        continue;
      }
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).exclude('iframe').analyze();
      for (const v of violations) {
        failures.push({ path: label, scheme, rule: v.id, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => `${n.target.join(' > ')}  ${(n.any[0] ?? n.all[0] ?? n.none[0])?.message ?? ''}`) });
      }
      console.log(`${violations.length ? '✗' : '✓'} ${scheme.padEnd(5)} ${label}${violations.length ? `  (${violations.map((v) => v.id).join(', ')})` : ''}`);
      await page.close();
    }
    await ctx.close();
  }
}

// The top bar never moves between sections: full width, logo in the same place, on every site page.
{
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const bars = [];
  for (const path of PAGES.filter((p) => !p.startsWith('/w/') && !p.includes('?'))) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
    const bar = await page.evaluate(() => {
      const logo = document.querySelector('header a[href="/"]')?.getBoundingClientRect();
      return { width: document.querySelector('header')?.getBoundingClientRect().width, x: logo?.x };
    });
    bars.push({ path, ...bar });
  }
  const [first] = bars;
  for (const b of bars) {
    if (b.width !== first.width || b.x !== first.x) {
      failures.push({
        path: b.path,
        scheme: 'any',
        rule: 'top-bar',
        help: `the top bar moved: width ${b.width}px, logo at x=${b.x} (${first.path}: ${first.width}px, x=${first.x})`,
        nodes: [],
      });
    }
  }
  console.log(`${bars.some((b) => b.width !== first.width || b.x !== first.x) ? '✗' : '✓'} top bar identical on ${bars.length} pages at 1920px`);
  await context.close();
}

await browser.close();
stop();

if (failures.length) {
  console.error(`\ncheck-a11y: ${failures.length} violation(s)`);
  for (const f of failures) {
    console.error(`  ${f.scheme} ${f.path}  ${f.rule}: ${f.help}`);
    for (const n of f.nodes) console.error(`      ${n}`);
  }
  process.exit(1);
}
console.log(`\ncheck-a11y: ${PAGES.length} pages and ${POPOVERS.length} Studio popovers (desktop and phone) × ${SCHEMES.length} themes, no WCAG 2.1 AA violations${MOBILE_FRAMES ? '' : ' (mobile kit frames not checked yet)'}`);
