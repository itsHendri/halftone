/** `node --test apps/docs/lib/brand/svg.test.ts` (Node strips the types). */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { brandImageFromPng, brandImageFromSvg, BrandImageError, cleanSvg, isBrandImage, isMonochrome, MAX_SVG, svgColours, toCurrentColor, viewBox } from './svg.ts';

const MONO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><path fill="#111827" d="M0 0h120v40H0z"/><circle cx="20" cy="20" r="8" fill="#111"/></svg>';
const TWO = '<svg viewBox="0 0 40 40"><rect fill="#2563eb" width="20" height="40"/><rect fill="#f59e0b" x="20" width="20" height="40"/></svg>';

test('cleans scripts, foreign objects, handlers and outside links', () => {
  const dirty = `<?xml version="1.0"?><!-- made in a tool --><svg viewBox="0 0 10 10" onload="alert(1)"><script>alert(1)</script><foreignObject><div>x</div></foreignObject><a href="https://evil.example"><path onclick="x()" d="M0 0"/></a><use href="#a"/><image xlink:href="data:image/png;base64,AAA"/></svg>`;
  const clean = cleanSvg(dirty);
  assert.doesNotMatch(clean, /script|foreignObject|onload|onclick|evil|base64|<\?xml|<!--/);
  assert.match(clean, /href="#a"/);
});

test('rejects a file that is not an SVG, has no viewBox, or is too large', () => {
  assert.throws(() => cleanSvg('<html></html>'), BrandImageError);
  assert.throws(() => cleanSvg('<svg width="10" height="10"><path d="M0 0"/></svg>'), /viewBox/);
  assert.throws(() => cleanSvg(`<svg viewBox="0 0 1 1">${'x'.repeat(MAX_SVG)}</svg>`), /KB/);
});

test('measures the viewBox', () => {
  assert.deepEqual(viewBox(MONO), { w: 120, h: 40 });
  assert.deepEqual(viewBox('<svg viewBox="-5,-5,30,10"></svg>'), { w: 30, h: 10 });
  assert.equal(viewBox('<svg viewBox="0 0 0 10"></svg>'), null);
});

test('one colour, written two ways, is one colour', () => {
  assert.deepEqual(svgColours(MONO), ['#111827', '#111111']);
  // #111 and #111827 differ: this logo has two colours.
  assert.equal(isMonochrome(MONO), false);
  assert.equal(isMonochrome('<svg viewBox="0 0 1 1"><path fill="#111" d=""/><path style="fill:#111111" d=""/></svg>'), true);
});

test('no colour at all (default black) and currentColor are monochrome; gradients and two colours are not', () => {
  assert.equal(isMonochrome('<svg viewBox="0 0 1 1"><path d="M0 0"/></svg>'), true);
  assert.equal(isMonochrome('<svg viewBox="0 0 1 1"><path fill="currentColor" stroke="none" d=""/></svg>'), true);
  assert.equal(isMonochrome(TWO), false);
  assert.equal(isMonochrome('<svg viewBox="0 0 1 1"><linearGradient id="g"><stop stop-color="#000"/><stop stop-color="#000"/></linearGradient><path fill="url(#g)" d=""/></svg>'), false);
});

test('recolours to currentColor, keeping none and gradient references', () => {
  const out = toCurrentColor('<svg viewBox="0 0 1 1"><path fill="#000" stroke="none" d=""/><path style="fill: #000; opacity:.5" d=""/></svg>');
  assert.match(out, /<svg viewBox="0 0 1 1" fill="currentColor">/);
  assert.match(out, /fill="currentColor" stroke="none"/);
  assert.match(out, /fill:currentColor; opacity:.5/);
  assert.doesNotMatch(out, /#000/);
});

test('a one-colour upload becomes a mono brand image with its aspect', () => {
  const img = brandImageFromSvg('<svg viewBox="0 0 120 40"><path fill="#0f172a" d="M0 0"/></svg>');
  assert.equal(img.mono, true);
  assert.equal(img.aspect, 3);
  assert.match(img.svg!, /currentColor/);
  assert.equal(isBrandImage(img), true);
  const multi = brandImageFromSvg(TWO);
  assert.equal(multi.mono, false);
  assert.match(multi.svg!, /#2563eb/);
});

test('PNGs are accepted only as data URLs under the limit; messages are checked before the kits show them', () => {
  const png = brandImageFromPng('data:image/png;base64,iVBORw0KGgo=', 200, 100);
  assert.equal(png.aspect, 2);
  assert.equal(isBrandImage(png), true);
  assert.throws(() => brandImageFromPng('data:image/jpeg;base64,AAA', 1, 1), /not a PNG/);
  assert.equal(isBrandImage({ svg: '<svg viewBox="0 0 1 1"><script/></svg>', aspect: 1 }), false);
  assert.equal(isBrandImage({ png: 'https://example.com/x.png', aspect: 1 }), false);
  assert.equal(isBrandImage({ svg: '<svg viewBox="0 0 1 1"/>', aspect: 0 }), false);
});
