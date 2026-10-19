/** `node --test apps/docs/lib/brand/module.test.ts`: the download's lib/brand.ts is the kits' own, plus data. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { brandModule } from './module.ts';

const kit = (app: string) => readFileSync(new URL(`../../../${app}/lib/brand.ts`, import.meta.url), 'utf8');
const head = (s: string) => s.slice(0, s.indexOf('export const BRAND'));

test('the download writes the same lib/brand.ts as each kit ships, apart from the brand', () => {
  for (const app of ['mobile', 'web']) assert.equal(head(brandModule({ name: 'Acme' })), head(kit(app)), `apps/${app}/lib/brand.ts`);
});

test('the brand is written as data, leaving out what was not set', () => {
  const out = brandModule({ name: 'Acme', logo: { svg: '<svg viewBox="0 0 2 1"/>', mono: true, aspect: 2 } });
  assert.match(out, /export const BRAND: Brand = \{\n {2}"name": "Acme",\n {2}"logo": \{/);
  assert.doesNotMatch(out.slice(out.indexOf("export const BRAND")), /logoDark|"mark"/);
});
