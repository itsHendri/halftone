/**
 * Colour ramps from a seed. A seed that is a curated ramp's 600 step returns that ramp untouched;
 * anything else is generated in OKLCH:
 *   - lightness per step follows the average of Tailwind's chromatic ramps (LIGHTNESS below)
 *   - the seed lands EXACTLY on the step nearest its lightness (the anchor), and the steps around it
 *     bend smoothly towards it, so the ramp stays monotonic
 *   - chroma follows Tailwind's relative chroma profile, scaled so the anchor keeps the seed's chroma
 *   - hue stays the seed's; a step outside sRGB loses chroma until it fits (never clipped)
 */
import { hexToOklchParts, inGamut, oklchPartsToHex } from '../color.mjs';
import { BRAND_RAMPS, NEUTRAL_RAMPS, STEPS } from './palettes.mjs';

const LIGHTNESS = { 50: 0.977, 100: 0.95, 200: 0.906, 300: 0.84, 400: 0.761, 500: 0.683, 600: 0.598, 700: 0.515, 800: 0.446, 900: 0.395, 950: 0.278 };
const CHROMA = { 50: 0.094, 100: 0.222, 200: 0.418, 300: 0.653, 400: 0.855, 500: 0.952, 600: 0.934, 700: 0.83, 800: 0.696, 900: 0.58, 950: 0.418 };

/** Map an OKLCH colour into sRGB by lowering chroma. */
export function toGamutHex([L, C, H]) {
  let lo = 0;
  let hi = C;
  if (inGamut([L, C, H])) return oklchPartsToHex([L, C, H]);
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut([L, mid, H])) lo = mid;
    else hi = mid;
  }
  return oklchPartsToHex([L, lo, H]);
}

/** The curated ramp whose 600 step is this seed, if any. */
export function curatedRamp(seed) {
  const hex = seed.toLowerCase();
  return Object.entries(BRAND_RAMPS).find(([, ramp]) => ramp[600] === hex)?.[0] ?? null;
}

/** The step nearest a lightness, in a lightness table. */
const nearestStep = (L, table) => STEPS.reduce((best, s) => (Math.abs(table[s] - L) < Math.abs(table[best] - L) ? s : best), '600');

/** The step a seed sits on: its curated 600, or the generated step nearest its lightness. */
export function anchorStep(seed) {
  if (curatedRamp(seed)) return '600';
  return nearestStep(hexToOklchParts(seed)[0], LIGHTNESS);
}

/**
 * The 11 steps around a seed, in OKLCH, with the seed exactly on `anchor`.
 *   lightness, chroma   the profile per step (chroma is relative: scaled so the anchor keeps the seed's chroma)
 *   auto                the anchor nearest the seed's lightness: the seed's offset fades out over three steps
 *   forced              any other anchor: each side is stretched between the seed and its end of the profile,
 *                       which keeps the ramp in order however far the seed is from its step
 */
function seededRamp(seed, anchor, lightness, chroma) {
  const [Ls, Cs, Hs] = hexToOklchParts(seed);
  const ai = STEPS.indexOf(anchor);
  const auto = nearestStep(Ls, lightness) === anchor;
  const dL = Ls - lightness[anchor];
  const chromaScale = chroma[anchor] ? Cs / chroma[anchor] : 0;
  // Forced: the ends of the ramp, kept a little beyond the seed so a step never repeats it.
  const top = Math.min(1, Math.max(lightness[STEPS[0]], Ls + 0.01 * ai));
  const bottom = Math.max(0, Math.min(lightness[STEPS.at(-1)], Ls - 0.01 * (STEPS.length - 1 - ai)));
  const ramp = {};
  STEPS.forEach((s, i) => {
    if (s === anchor) {
      ramp[s] = seed.toLowerCase();
      return;
    }
    let L;
    if (auto) {
      // The seed's offset from the target lightness fades out over three steps either side, which keeps
      // neighbours in order (|dL| is at most half the gap to the next step).
      const fade = Math.max(0, 1 - Math.abs(i - ai) / 3);
      L = lightness[s] + dL * fade;
    } else {
      const end = i < ai ? STEPS[0] : STEPS.at(-1);
      const t = (lightness[s] - lightness[anchor]) / (lightness[end] - lightness[anchor]);
      L = Ls + t * ((i < ai ? top : bottom) - Ls);
    }
    ramp[s] = toGamutHex([L, chroma[s] * chromaScale, Hs]);
  });
  return ramp;
}

/**
 * { 50: '#…', …, 950: '#…' } for a seed. `anchor` pins the seed to another step than its nearest one (the
 * studio's "pinned step"); a curated seed with any other anchor is generated like any seed.
 */
export function brandRamp(seed, { anchor } = {}) {
  const curated = curatedRamp(seed);
  if (curated && (!anchor || anchor === '600')) return { ...BRAND_RAMPS[curated] };
  const [L] = hexToOklchParts(seed);
  return seededRamp(seed, anchor ?? nearestStep(L, LIGHTNESS), LIGHTNESS, CHROMA);
}

const TINT_CHROMA = { 50: 0.003, 100: 0.005, 200: 0.008, 300: 0.012, 400: 0.02, 500: 0.024, 600: 0.022, 700: 0.02, 800: 0.016, 900: 0.014, 950: 0.012 };

/** The 13-step neutral: 0 (white), the 11 steps, 1000 (black). */
export function neutralRamp(kind, seed) {
  if (kind !== 'brand') return { 0: '#ffffff', ...NEUTRAL_RAMPS[kind], 1000: '#000000' };
  // Brand-tinted: zinc's lightness, a whisper of the brand hue (more in the mid steps, as slate does).
  const [, Cs, Hs] = hexToOklchParts(seed);
  const strength = Math.min(1, Cs / 0.12);
  const ramp = { 0: '#ffffff' };
  for (const s of STEPS) {
    const [L] = hexToOklchParts(NEUTRAL_RAMPS.zinc[s]);
    ramp[s] = toGamutHex([L, TINT_CHROMA[s] * strength, Hs]);
  }
  ramp[1000] = '#000000';
  return ramp;
}

/** Zinc's lightness per step: a neutral seed's ramp keeps the grey ramps' range (950 is near black). */
const NEUTRAL_LIGHTNESS = Object.fromEntries(STEPS.map((s) => [s, hexToOklchParts(NEUTRAL_RAMPS.zinc[s])[0]]));

/** The step a neutral seed sits on: the zinc step nearest its lightness. */
export const neutralAnchorStep = (seed) => nearestStep(hexToOklchParts(seed)[0], NEUTRAL_LIGHTNESS);

/**
 * The 13-step neutral for a custom seed (any grey, or any colour as a tint): zinc's lightness, the tint's
 * chroma profile scaled to the seed, the seed exactly on its step.
 */
export function neutralSeedRamp(seed, { anchor } = {}) {
  return { 0: '#ffffff', ...seededRamp(seed, anchor ?? neutralAnchorStep(seed), NEUTRAL_LIGHTNESS, TINT_CHROMA), 1000: '#000000' };
}
