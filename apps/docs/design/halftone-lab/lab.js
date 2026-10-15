/**
 * Halftone lab: the ambient theme engine and the halftone effects, as throwaway prototypes.
 * The theme maths is the real package (served from the repo root); nothing here is imported by the site.
 */
import { BRAND_RAMPS, generateTheme, normalizeRecipe, themeStatus, themeVars } from '/packages/tokens/lib/theme/index.mjs';
import { toGamutHex } from '/packages/tokens/lib/theme/ramp.mjs';
import { contrast } from '/packages/tokens/lib/color.mjs';

const PAPER = 'https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.81/+esm';
const base = await (await fetch('/apps/mobile/tokens/tokens.json')).json();
const status = themeStatus(base);
const committed = normalizeRecipe(status.applied ? status.recipe : {});
const CURATED = new Set(Object.values(BRAND_RAMPS).map((r) => r['600'].toLowerCase()));

// ---------------------------------------------------------------- state and controls

const DEFAULTS = {
  route: 'A', neutral: 'tinted', gradient: 'A', field: 'C', ripple: 'B', swarm: 'B', texture: 'fine', scheme: 'light', motion: 'full',
  cycle: 60, step: 4, spacing: 20, light: 220, brightness: 0.35, distort: 6, dotMax: 0.36, rippleDur: 1000, rippleStrength: 1,
};
const KEY = 'halftone-lab.v1';
let state = { ...DEFAULTS };
try {
  Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}'));
} catch {}
if (matchMedia('(prefers-reduced-motion: reduce)').matches) state.motion = 'reduced';
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
};

const ROWS = [
  { key: 'route', label: 'Hue route', options: [['A', 'A · Curated stops'], ['B', 'B · Full wheel'], ['C', 'C · Time of day']], hint: 'A: violet → orange → pink → blue. C squeezes a day into one cycle.' },
  { key: 'neutral', label: 'Neutrals', options: [['tinted', 'Tinted by the hue'], ['grey', 'Grey (zinc)']], hint: 'Grey keeps backgrounds still; only primary, ring and chart-1 move. Tinted moves every surface.' },
  { key: 'gradient', label: 'Gradient', options: [['A', 'A · CSS blobs'], ['B', 'B · Paper mesh (WebGL)'], ['off', 'Off']] },
  { key: 'field', label: 'Hero dot field', options: [['A', 'A · Lit grid'], ['B', 'B · Paper halftone'], ['C', 'C · Halftone of the gradient'], ['off', 'Off']], hint: 'A: Surface Field. C: the gradient itself drawn as dots.' },
  { key: 'ripple', label: 'Click ripple', options: [['A', 'A · Push'], ['B', 'B · Halftone pulse'], ['off', 'Off']] },
  { key: 'swarm', label: 'CTA hover', options: [['A', 'A · Flood from cursor'], ['B', 'B · Gather into mark'], ['off', 'Fill only']] },
  { key: 'texture', label: 'Page texture', options: [['off', 'Off'], ['fine', 'Fine'], ['mid', 'Medium'], ['coarse', 'Coarse']] },
  { key: 'scheme', label: 'Scheme', options: [['light', 'Light'], ['dark', 'Dark']] },
  { key: 'motion', label: 'Motion', options: [['full', 'Full'], ['reduced', 'Reduced']], hint: 'Reduced: one still hue for the day, no drift, ripple or swarm.' },
];
const SLIDERS = [
  { key: 'cycle', label: 'Gradient cycle', min: 20, max: 180, step: 5, unit: ' s' },
  { key: 'step', label: 'Kit frame step', min: 1, max: 10, step: 1, unit: ' s' },
  { key: 'spacing', label: 'Dot spacing', min: 10, max: 34, step: 1, unit: ' px' },
  { key: 'dotMax', label: 'Max dot size (C)', min: 0.15, max: 0.6, step: 0.01, unit: '' },
  { key: 'light', label: 'Light radius (A)', min: 80, max: 420, step: 10, unit: ' px' },
  { key: 'brightness', label: 'Brightness (A)', min: 0, max: 1, step: 0.05, unit: '' },
  { key: 'distort', label: 'Cursor distortion', min: 0, max: 20, step: 1, unit: ' px' },
  { key: 'rippleDur', label: 'Ripple duration', min: 400, max: 2000, step: 50, unit: ' ms' },
  { key: 'rippleStrength', label: 'Ripple strength', min: 0.3, max: 2, step: 0.1, unit: '×' },
];

const rowsEl = document.getElementById('rows');
for (const row of ROWS) {
  const fs = document.createElement('fieldset');
  fs.className = 'row';
  fs.innerHTML = `<legend>${row.label}</legend><div class="seg"></div>${row.hint ? `<p class="hint">${row.hint}</p>` : ''}`;
  const seg = fs.querySelector('.seg');
  for (const [value, text] of row.options) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.dataset.key = row.key;
    b.dataset.value = value;
    b.addEventListener('click', () => set(row.key, value));
    seg.appendChild(b);
  }
  rowsEl.appendChild(fs);
}
const slidersEl = document.getElementById('sliders');
for (const s of SLIDERS) {
  const id = `s-${s.key}`;
  const wrap = document.createElement('div');
  wrap.className = 'slider';
  wrap.innerHTML = `<label for="${id}">${s.label}</label><output for="${id}"></output><input id="${id}" type="range" min="${s.min}" max="${s.max}" step="${s.step}">`;
  const input = wrap.querySelector('input');
  input.value = state[s.key];
  input.addEventListener('input', () => set(s.key, Number(input.value)));
  slidersEl.appendChild(wrap);
}

function set(key, value) {
  state[key] = value;
  save();
  sync();
}

const mock = document.getElementById('mock');
const docs = document.getElementById('docs');
const reduced = () => state.motion === 'reduced';

function sync() {
  for (const b of rowsEl.querySelectorAll('button')) b.setAttribute('aria-pressed', String(state[b.dataset.key] === b.dataset.value));
  for (const s of SLIDERS) {
    const input = document.getElementById(`s-${s.key}`);
    if (Number(input.value) !== state[s.key]) input.value = state[s.key];
    input.parentElement.querySelector('output').textContent = `${state[s.key]}${s.unit}`;
  }
  mock.classList.toggle('dark', state.scheme === 'dark');
  mock.classList.toggle('still', reduced());
  docs.className = `m-docs${state.texture === 'off' ? '' : ` tex-${state.texture}`}`;
  document.getElementById('gradA').hidden = state.gradient !== 'A';
  document.getElementById('gradB').hidden = state.gradient !== 'B';
  document.getElementById('fieldB').hidden = state.field !== 'B';
  document.getElementById('phoneCap').textContent = `Kit frame · re-themed every ${state.step} s`;
  setupPaper();
  syncPill();
  lastKey = ''; // re-apply the theme (scheme or neutral may have changed)
  stepAt = 0;
}

// ---------------------------------------------------------------- hue routes

const STOPS = [292, 40, 355, 262];
const CLOCK = [[0, 262], [5, 292], [7, 350], [10, 45], [13, 205], [17, 30], [19, 335], [21, 285], [24, 262]];
const lerpHue = (a, b, t) => (a + ((((b - a + 540) % 360) - 180) * t) + 360) % 360;
const smooth = (t) => t * t * (3 - 2 * t);

function routeHue(route, phase) {
  phase = ((phase % 1) + 1) % 1;
  if (route === 'B') return phase * 360;
  if (route === 'A') {
    const x = phase * STOPS.length;
    const i = Math.floor(x) % STOPS.length;
    return lerpHue(STOPS[i], STOPS[(i + 1) % STOPS.length], smooth(x - Math.floor(x)));
  }
  const hour = phase * 24;
  const j = CLOCK.findIndex(([h]) => h > hour) - 1;
  const [h0, a] = CLOCK[Math.max(0, j)];
  const [h1, b] = CLOCK[Math.max(1, j + 1)];
  return lerpHue(a, b, smooth((hour - h0) / (h1 - h0)));
}

/** Reduced motion: one hue per day (route C: the real hour). */
function stillPhase() {
  const now = new Date();
  if (state.route === 'C') return (now.getHours() + now.getMinutes() / 60) / 24;
  const day = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  return (day * 0.618) % 1;
}

// ---------------------------------------------------------------- theme engine

const SEED = { L: 0.58, C: 0.19 };
const seedHex = (h) => {
  let hex = toGamutHex([SEED.L, SEED.C, h]);
  if (CURATED.has(hex.toLowerCase())) hex = toGamutHex([SEED.L, SEED.C, h + 0.3]); // a curated 600 would snap the ramp
  return hex;
};
const SHAPE = /^--(radius|border-width|icon-stroke|density|control-|type-|leading-|typeset-|shadow-)/;
const colours = (map) => Object.fromEntries(Object.entries(map).filter(([k]) => !SHAPE.test(k)));

const cache = new Map();
const genTimes = [];
function themeAt(hue) {
  const q = (Math.round(hue * 2) / 2) % 360;
  const key = `${q}|${state.neutral}`;
  let hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const brand = seedHex(q);
  const t0 = performance.now();
  const theme = generateTheme({ ...committed, brand, neutral: state.neutral === 'tinted' ? 'brand' : committed.neutral }, base);
  const vars = themeVars(theme, 'oklch');
  genTimes.push(performance.now() - t0);
  if (genTimes.length > 60) genTimes.shift();
  hit = { hue: q, brand, theme, vars: { light: colours(vars.light), dark: colours(vars.dark) } };
  cache.set(key, hit);
  if (cache.size > 96) cache.delete(cache.keys().next().value);
  return hit;
}

/** The gradient's own colours: neighbours of the hue, softer for the blobs, stronger for dots. */
function ambient(hue, dark) {
  const blob = (h) => toGamutHex([dark ? 0.5 : 0.8, dark ? 0.16 : 0.14, (h + 360) % 360]);
  const ink = (h) => toGamutHex([dark ? 0.74 : 0.6, 0.2, (h + 360) % 360]);
  const hs = [hue, hue + 48, hue - 56];
  return { blobs: hs.map(blob), inks: hs.map(ink) };
}

let lastKey = '';
let current = null; // { hit, mode, amb, res }
function applyTheme(hue) {
  const mode = state.scheme;
  const hit = themeAt(hue);
  const key = `${hit.hue}|${state.neutral}|${mode}`;
  if (key === lastKey) return;
  lastKey = key;
  for (const [k, v] of Object.entries(hit.vars[mode])) mock.style.setProperty(k, v);
  const amb = ambient(hit.hue, mode === 'dark');
  amb.blobs.forEach((c, i) => mock.style.setProperty(`--amb-${i + 1}`, c));
  current = { hit, mode, amb, res: hit.theme.resolved[mode] };
}

const phone = document.getElementById('phone');
let stepAt = 0;
function stepKitFrame(now) {
  if (!current || now < stepAt) return;
  stepAt = now + state.step * 1000;
  for (const [k, v] of Object.entries(current.hit.vars[current.mode])) phone.style.setProperty(k, v);
}

// ---------------------------------------------------------------- picked vs ambient (the pill)

let picked = null;
let paused = false;
const pauseBtn = document.getElementById('pause');
const pillPause = document.getElementById('pillPause');
const pillPick = document.getElementById('pillPick');
const pillLabel = document.getElementById('pillLabel');
function syncPill() {
  pauseBtn.textContent = paused ? 'Resume drift' : 'Pause drift';
  pillPause.textContent = paused ? 'Play' : 'Pause';
  pillPause.hidden = picked !== null || reduced();
  pillPick.textContent = picked === null ? 'Pick this colour' : 'Resume gradient';
  pillLabel.textContent = picked === null ? (reduced() ? "Today's colour" : 'Ambient') : 'Picked';
}
const togglePause = () => {
  paused = !paused;
  syncPill();
};
pauseBtn.addEventListener('click', togglePause);
pillPause.addEventListener('click', togglePause);
pillPick.addEventListener('click', () => {
  picked = picked === null ? (current?.hit.hue ?? 0) : null;
  syncPill();
});

// ---------------------------------------------------------------- canvases

const dpr = Math.min(2, window.devicePixelRatio || 1);
function fit(canvas, w, h) {
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

const hero = document.getElementById('hero');
const fieldCanvas = document.getElementById('field');
const pointer = { x: -1e4, y: -1e4, in: false };
hero.addEventListener('pointermove', (e) => {
  const r = hero.getBoundingClientRect();
  pointer.x = e.clientX - r.left;
  pointer.y = e.clientY - r.top;
  pointer.in = true;
});
hero.addEventListener('pointerleave', () => (pointer.in = false));
let heroVisible = true;
new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting)).observe(hero);

// Ripples, in mock coordinates; the hero field reads them too.
const ripples = [];
const heroOffset = () => hero.offsetTop;
function rippleAt(r, now, x, y) {
  const p = (now - r.t0) / state.rippleDur;
  const radius = 40 + 300 * (1 - (1 - p) ** 3);
  const d = Math.hypot(x - r.x, y - r.y);
  const band = 46;
  const k = 1 - Math.abs(d - radius) / band;
  return k > 0 ? { k: k * (1 - p), ux: (x - r.x) / (d || 1), uy: (y - r.y) / (d || 1) } : null;
}

function drawFieldA(ctx, w, h, t, now) {
  const S = state.spacing;
  const R = state.light;
  const lights = [];
  if (pointer.in) lights.push({ x: pointer.x, y: pointer.y, cursor: true });
  if (!reduced()) lights.push({ x: w * (0.5 + 0.35 * Math.sin(t * 0.00021)), y: h * (0.45 + 0.3 * Math.sin(t * 0.00033 + 1.3)) });
  else lights.push({ x: w * 0.68, y: h * 0.3 });
  const LEVELS = 8;
  const buckets = Array.from({ length: LEVELS }, () => []);
  const top = heroOffset();
  for (let y = S / 2; y < h; y += S) {
    for (let x = S / 2; x < w; x += S) {
      let I = 0;
      let dx = 0;
      let dy = 0;
      for (const L of lights) {
        const d = Math.hypot(x - L.x, y - L.y);
        if (d >= R) continue;
        const k = (1 - d / R) ** 2;
        I = Math.max(I, k);
        if (L.cursor) {
          dx += ((x - L.x) / (d || 1)) * state.distort * k;
          dy += ((y - L.y) / (d || 1)) * state.distort * k;
        }
      }
      for (const r of ripples) {
        const hit = rippleAt(r, now, x, y + top);
        if (hit) {
          dx += hit.ux * 10 * state.rippleStrength * hit.k;
          dy += hit.uy * 10 * state.rippleStrength * hit.k;
          I = Math.max(I, hit.k * 0.8);
        }
      }
      const breathe = reduced() ? 0 : 0.05 * Math.sin(t * 0.0013 + ((x * 7 + y * 13) % 6.28));
      const alpha = Math.min(1, 0.12 + breathe + I * (0.45 + state.brightness));
      const level = Math.min(LEVELS - 1, Math.floor(alpha * LEVELS));
      buckets[level].push(x + dx, y + dy, 0.9 + I * 1.5);
    }
  }
  ctx.clearRect(0, 0, w, h);
  buckets.forEach((b, i) => {
    if (!b.length) return;
    ctx.globalAlpha = (i + 0.5) / LEVELS;
    ctx.fillStyle = i >= 4 ? current.res.primary : current.res.foreground;
    ctx.beginPath();
    for (let j = 0; j < b.length; j += 3) {
      ctx.moveTo(b[j] + b[j + 2], b[j + 1]);
      ctx.arc(b[j], b[j + 1], b[j + 2], 0, Math.PI * 2);
    }
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function blobsAt(w, h, t) {
  const m = reduced() ? 0 : 1;
  return [
    { x: w * (0.22 + 0.12 * m * Math.sin(t * 0.00017)), y: h * (0.2 + 0.14 * m * Math.cos(t * 0.00023)), r: w * 0.32, wgt: 1 },
    { x: w * (0.8 + 0.1 * m * Math.cos(t * 0.00019 + 2)), y: h * (0.3 + 0.16 * m * Math.sin(t * 0.00015 + 1)), r: w * 0.3, wgt: 0.95 },
    { x: w * (0.5 + 0.18 * m * Math.sin(t * 0.00013 + 4)), y: h * (0.62 + 0.12 * m * Math.cos(t * 0.00021 + 3)), r: w * 0.26, wgt: 0.85 },
  ];
}

function drawFieldC(ctx, w, h, t, now) {
  const S = state.spacing;
  const blobs = blobsAt(w, h, t);
  if (pointer.in) blobs.push({ x: pointer.x, y: pointer.y, r: 150, wgt: 0.9, cursor: true });
  const paths = [[], [], []];
  const top = heroOffset();
  const rowShift = S / 2; // hex grid
  let row = 0;
  for (let y = S / 2; y < h; y += S * 0.866, row++) {
    for (let x = (row % 2 ? rowShift : 0) + S / 4; x < w; x += S) {
      let v = 0;
      let best = 0;
      let bestC = 0;
      let px = x;
      let py = y;
      blobs.forEach((b, i) => {
        const d2 = (x - b.x) ** 2 + (y - b.y) ** 2;
        const c = b.wgt * Math.exp(-d2 / (b.r * b.r));
        v += c;
        if (c > best) {
          best = c;
          bestC = b.cursor ? 0 : i;
        }
      });
      if (pointer.in) {
        const d = Math.hypot(x - pointer.x, y - pointer.y);
        if (d < 160) {
          const k = (1 - d / 160) ** 2;
          px += ((x - pointer.x) / (d || 1)) * state.distort * k;
          py += ((y - pointer.y) / (d || 1)) * state.distort * k;
        }
      }
      for (const r of ripples) {
        const hit = rippleAt(r, now, x, y + top);
        if (hit) {
          v += hit.k * 0.7 * state.rippleStrength;
          px += hit.ux * 6 * state.rippleStrength * hit.k;
          py += hit.uy * 6 * state.rippleStrength * hit.k;
        }
      }
      v = Math.min(1, v);
      const rad = S * state.dotMax * Math.sqrt(v);
      if (rad < 0.35) continue;
      paths[bestC].push(px, py, rad);
    }
  }
  ctx.clearRect(0, 0, w, h);
  ctx.globalAlpha = current.mode === 'dark' ? 0.85 : 0.75;
  paths.forEach((p, i) => {
    ctx.fillStyle = current.amb.inks[i];
    ctx.beginPath();
    for (let j = 0; j < p.length; j += 3) {
      ctx.moveTo(p[j] + p[j + 2], p[j + 1]);
      ctx.arc(p[j], p[j + 1], p[j + 2], 0, Math.PI * 2);
    }
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// Paper Shaders (WebGL) for gradient B and field B, loaded only when picked.
let paper = null;
let paperLoad = null;
let meshMount = null;
let halftoneMount = null;
const srcCanvas = document.createElement('canvas');
srcCanvas.width = 320;
srcCanvas.height = 200;
let srcAt = 0;

function setupPaper() {
  const wantMesh = state.gradient === 'B';
  const wantHalf = state.field === 'B';
  if (!wantMesh && meshMount) {
    meshMount.dispose();
    meshMount = null;
  }
  if (!wantHalf && halftoneMount) {
    halftoneMount.dispose();
    halftoneMount = null;
  }
  if (!wantMesh && !wantHalf) return;
  paperLoad ??= import(PAPER).then((m) => (paper = m)).catch((err) => {
    document.getElementById('copied').textContent = `Paper Shaders failed to load: ${err.message}`;
  });
  paperLoad.then(() => {
    if (!paper || !current) return;
    const vec = (hex) => paper.getShaderColorFromString(hex);
    if (state.gradient === 'B' && !meshMount) {
      meshMount = new paper.ShaderMount(document.getElementById('gradB'), paper.meshGradientFragmentShader, {
        ...sizing(paper.defaultObjectSizing, 'cover'),
        u_colors: [...current.amb.blobs, current.res.background].map(vec),
        u_colorsCount: 4,
        u_distortion: 0.8,
        u_swirl: 0.15,
        u_grainMixer: 0,
        u_grainOverlay: 0,
      }, undefined, reduced() ? 0 : 0.25);
    }
    if (state.field === 'B' && !halftoneMount) {
      paintSource(performance.now());
      sourceImage().then((img) => {
        if (state.field !== 'B' || halftoneMount) return;
        halftoneMount = new paper.ShaderMount(document.getElementById('fieldB'), paper.halftoneDotsFragmentShader, {
        ...sizing(paper.defaultObjectSizing, 'cover'),
        u_image: img,
        u_colorFront: vec(current.res.primary),
        u_colorBack: [0, 0, 0, 0],
        u_originalColors: true,
        u_type: 0,
        u_inverted: false,
        u_grid: 1,
        u_size: 0.5,
        u_radius: 1.2,
        u_contrast: 0.45,
        u_grainMixer: 0,
        u_grainOverlay: 0,
        u_grainSize: 0.5,
        }, undefined, 0);
      });
    }
  });
}

/** Paper's sizing defaults are plain names; the shaders want them as uniforms. */
const sizing = (d, fit) => ({
  u_fit: paper.ShaderFitOptions[fit ?? d.fit],
  u_scale: d.scale,
  u_rotation: d.rotation,
  u_offsetX: d.offsetX,
  u_offsetY: d.offsetY,
  u_originX: d.originX,
  u_originY: d.originY,
  u_worldWidth: d.worldWidth,
  u_worldHeight: d.worldHeight,
});

/** The halftone filter takes an <img>, not a data URL. */
async function sourceImage() {
  const img = new Image();
  img.src = srcCanvas.toDataURL();
  await img.decode();
  return img;
}

/** Field B's source image: the gradient drawn small, re-uploaded a few times a second. */
function paintSource(t) {
  const ctx = srcCanvas.getContext('2d');
  const { width: w, height: h } = srcCanvas;
  ctx.fillStyle = current.res.background;
  ctx.fillRect(0, 0, w, h);
  blobsAt(w, h, t).forEach((b, i) => {
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 1.3);
    g.addColorStop(0, current.amb.inks[i]);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function updatePaper(now, t) {
  if (!paper || !current) return;
  const vec = (hex) => paper.getShaderColorFromString(hex);
  meshMount?.setUniforms({ u_colors: [...current.amb.blobs, current.res.background].map(vec) });
  meshMount?.setSpeed(reduced() || paused ? 0 : 0.25);
  if (halftoneMount && now > srcAt) {
    srcAt = now + 200;
    paintSource(t);
    const mount = halftoneMount;
    sourceImage().then((img) => mount === halftoneMount && mount.setUniforms({ u_image: img, u_colorFront: vec(current.res.primary) }));
  }
}

// ---------------------------------------------------------------- click ripple (site-wide)

const rippleCanvas = document.getElementById('ripple');
const SKIP = 'a, button, input, textarea, select, label, [role], [contenteditable], .m-phone, .m-pill';
mock.addEventListener('pointerdown', (e) => {
  if (state.ripple === 'off' || reduced() || e.button !== 0) return;
  if (e.target.closest(SKIP)) return;
  if (String(getSelection()).length) return;
  const r = mock.getBoundingClientRect();
  ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t0: performance.now() });
});

function drawRipples(now) {
  for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].t0 > state.rippleDur) ripples.splice(i, 1);
  const w = mock.scrollWidth;
  const h = mock.scrollHeight;
  const ctx = fit(rippleCanvas, w, h);
  ctx.clearRect(0, 0, w, h);
  if (!ripples.length || state.ripple === 'off') return;
  const S = 14;
  ctx.fillStyle = current.res.primary;
  for (const r of ripples) {
    const p = (now - r.t0) / state.rippleDur;
    const reach = 40 + 300 * (1 - (1 - p) ** 3) + 50;
    ctx.beginPath();
    for (let y = Math.max(S / 2, Math.floor((r.y - reach) / S) * S + S / 2); y < Math.min(h, r.y + reach); y += S) {
      for (let x = Math.max(S / 2, Math.floor((r.x - reach) / S) * S + S / 2); x < Math.min(w, r.x + reach); x += S) {
        const hit = rippleAt(r, now, x, y);
        if (!hit) continue;
        let px = x;
        let py = y;
        let rad;
        if (state.ripple === 'A') {
          px += hit.ux * 12 * state.rippleStrength * hit.k;
          py += hit.uy * 12 * state.rippleStrength * hit.k;
          rad = 1.3;
          ctx.globalAlpha = 1;
        } else {
          rad = S * 0.42 * Math.min(1.4, state.rippleStrength) * hit.k;
        }
        if (rad < 0.3) continue;
        ctx.moveTo(px + rad, py);
        ctx.arc(px, py, rad, 0, Math.PI * 2);
      }
    }
    ctx.globalAlpha = state.ripple === 'A' ? 0.85 * (1 - p) : 0.75;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- CTA hover swarm

const cards = [...document.querySelectorAll('.m-cta')].map((el) => ({ el, canvas: el.querySelector('canvas'), phase: 'idle', t0: 0, entry: { x: 0, y: 0 }, pts: null, cur: null }));
for (const c of cards) {
  c.el.addEventListener('pointerenter', (e) => {
    const r = c.el.getBoundingClientRect();
    c.entry = { x: e.clientX - r.left, y: e.clientY - r.top };
    c.cur = { ...c.entry };
    c.phase = 'in';
    c.t0 = performance.now();
    c.pts = null;
  });
  c.el.addEventListener('pointermove', (e) => {
    const r = c.el.getBoundingClientRect();
    c.cur = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  c.el.addEventListener('pointerleave', () => {
    if (c.phase === 'in') {
      c.phase = 'out';
      c.t0 = performance.now();
    }
  });
}

const easeOutBack = (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;
/** Halftone mark: a sphere of dots, bigger where the light falls. */
function markPoints(w, h) {
  const R = Math.min(h * 0.36, 74);
  const cx = w - R - 30;
  const cy = h / 2;
  const S = 7.5;
  const lx = cx - R * 0.38;
  const ly = cy - R * 0.38;
  const pts = [];
  for (let y = cy - R; y <= cy + R; y += S) {
    for (let x = cx - R; x <= cx + R; x += S) {
      if (Math.hypot(x - cx, y - cy) > R) continue;
      const shade = 1 - Math.min(1, Math.hypot(x - lx, y - ly) / (R * 1.55));
      pts.push({ tx: x, ty: y, r: 0.5 + 2.9 * shade, delay: Math.random() * 220 });
    }
  }
  return pts;
}

function drawSwarm(c, now) {
  const w = c.el.clientWidth;
  const h = c.el.clientHeight;
  const ctx = fit(c.canvas, w, h);
  ctx.clearRect(0, 0, w, h);
  if (c.phase === 'idle' || state.swarm === 'off' || reduced()) return;
  const dt = now - c.t0;
  ctx.fillStyle = current.res['primary-foreground'];
  if (state.swarm === 'A') {
    const S = 10;
    const diag = Math.hypot(w, h);
    const out = c.phase === 'out' ? Math.max(0, 1 - dt / 260) : 1;
    if (c.phase === 'out' && out === 0) return void (c.phase = 'idle');
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    for (let y = S / 2; y < h; y += S) {
      for (let x = S / 2; x < w; x += S) {
        const d = Math.hypot(x - c.entry.x, y - c.entry.y);
        const grow = c.phase === 'in' ? Math.min(1, Math.max(0, (dt - d / 1.1) / 160)) : 1;
        const near = Math.max(0, 1 - Math.hypot(x - c.cur.x, y - c.cur.y) / 90);
        const rad = (S * 0.42 * (0.25 + 0.6 * (1 - d / diag)) + near * 2.2) * grow * out;
        if (rad < 0.3) continue;
        ctx.moveTo(x + rad, y);
        ctx.arc(x, y, rad, 0, Math.PI * 2);
      }
    }
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  // B: gather into the mark, scatter on leave.
  c.pts ??= markPoints(w, h).map((p) => ({ ...p, sx: c.entry.x + (Math.random() - 0.5) * 60, sy: c.entry.y + (Math.random() - 0.5) * 60 }));
  const cx = w - Math.min(h * 0.36, 74) - 30;
  const cy = h / 2;
  let alive = false;
  ctx.beginPath();
  for (const p of c.pts) {
    let x;
    let y;
    let rad;
    if (c.phase === 'in') {
      const k = Math.min(1, Math.max(0, (dt - p.delay) / 720));
      const e = easeOutBack(k);
      x = p.sx + (p.tx - p.sx) * e;
      y = p.sy + (p.ty - p.sy) * e;
      rad = p.r * Math.min(1, 0.4 + k);
      alive = true;
    } else {
      const k = Math.min(1, dt / 320);
      const ux = p.tx - cx;
      const uy = p.ty - cy;
      x = p.tx + ux * 0.6 * k;
      y = p.ty + uy * 0.6 * k;
      rad = p.r * (1 - k);
      if (k < 1) alive = true;
    }
    if (rad < 0.2) continue;
    ctx.moveTo(x + rad, y);
    ctx.arc(x, y, rad, 0, Math.PI * 2);
  }
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;
  if (!alive) c.phase = 'idle';
}

// ---------------------------------------------------------------- loop

let elapsed = 0;
let last = performance.now();
let themeAtMs = 0;
let frameMs = 0;
const readout = document.getElementById('readout');
let readoutAt = 0;

function frame(now) {
  const dt = Math.max(0, Math.min(100, now - last)); // rAF's first timestamp can predate `last`
  last = now;
  const f0 = performance.now();
  if (!paused && !reduced() && picked === null) elapsed += dt;
  const phase = reduced() ? stillPhase() : (elapsed / (state.cycle * 1000)) % 1;
  const hue = picked ?? routeHue(state.route, phase);

  // Theme: ~30 fps is plenty for colour.
  if (now - themeAtMs > 33) {
    themeAtMs = now;
    applyTheme(hue);
  }
  stepKitFrame(now);

  const w = hero.clientWidth;
  const h = hero.clientHeight;
  if (heroVisible && (state.field === 'A' || state.field === 'C')) {
    const ctx = fit(fieldCanvas, w, h);
    (state.field === 'A' ? drawFieldA : drawFieldC)(ctx, w, h, reduced() ? 0 : now, now);
  } else if (fieldCanvas.width) {
    fieldCanvas.getContext('2d').clearRect(0, 0, fieldCanvas.width, fieldCanvas.height);
  }
  updatePaper(now, reduced() ? 0 : now);
  drawRipples(now);
  for (const c of cards) drawSwarm(c, now);

  frameMs = frameMs * 0.9 + (performance.now() - f0) * 0.1;
  if (now > readoutAt) {
    readoutAt = now + 250;
    const avg = genTimes.length ? genTimes.reduce((a, b) => a + b, 0) / genTimes.length : 0;
    const res = current.res;
    const hour = state.route === 'C' ? `  (${String(Math.floor(phase * 24)).padStart(2, '0')}:00)` : '';
    readout.textContent = [
      `mode      ${picked !== null ? 'picked' : reduced() ? 'still (reduced motion)' : paused ? 'ambient, paused' : 'ambient'}`,
      `hue       ${current.hit.hue.toFixed(1)}°${hour}`,
      `seed      ${current.hit.brand}`,
      `primary   ${res.primary} on fg ${contrast(res.primary, res['primary-foreground']).toFixed(2)}:1`,
      `fixes     ${current.hit.theme.adjustments.length} nudged`,
      `generate  ${avg.toFixed(2)} ms (cache ${cache.size})`,
      `frame     ${frameMs.toFixed(2)} ms script`,
    ].join('\n');
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- picks

document.getElementById('copy').addEventListener('click', async () => {
  const label = (row) => row.options.find(([v]) => v === state[row.key])?.[1] ?? state[row.key];
  const md = [
    `## Picks (${new Date().toISOString().slice(0, 10)})`,
    '',
    ...ROWS.filter((r) => !['scheme', 'motion'].includes(r.key)).map((r) => `- **${r.label}:** ${label(r)}`),
    '',
    '| Setting | Value |',
    '|---|---|',
    ...SLIDERS.map((s) => `| ${s.label} | ${state[s.key]}${s.unit} |`),
  ].join('\n');
  const note = document.getElementById('copied');
  try {
    await navigator.clipboard.writeText(md);
    note.textContent = 'Copied. Paste it into DECISIONS.md.';
  } catch {
    note.textContent = 'Clipboard unavailable; the picks are in the console.';
    console.log(md);
  }
});
document.getElementById('resetLab').addEventListener('click', () => {
  state = { ...DEFAULTS };
  save();
  location.reload();
});

applyTheme(routeHue(state.route, 0));
sync();
syncPill();
requestAnimationFrame(frame);
