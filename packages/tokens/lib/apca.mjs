/**
 * APCA (the Accessible Perceptual Contrast Algorithm, APCA-W3 0.0.98G-4g), the candidate contrast method
 * for WCAG 3. ADVISORY ONLY: the build gates on WCAG 2.1 AA (contrast.mjs) and nothing here can fail it.
 * The docs studio shows Lc beside the WCAG ratio so a re-brand can be read both ways.
 *
 * Unlike the WCAG ratio, APCA is not symmetric: the text colour comes first. Lc is positive for dark text
 * on a light background and negative for light on dark; compare |Lc| against the guidance (roughly 75 for
 * body text, 60 for other content text, 45 for large text, 30 for icons and other non-text).
 */

// The 0.0.98G-4g constants, as published in apca-w3.
const TRC = 2.4;
const [R, G, B] = [0.2126729, 0.7151522, 0.072175];
const NORM_BG = 0.56;
const NORM_TXT = 0.57;
const REV_TXT = 0.62;
const REV_BG = 0.65;
const BLK_THRS = 0.022;
const BLK_CLMP = 1.414;
const SCALE = 1.14;
const LO_OFFSET = 0.027;
const LO_CLIP = 0.1;
const DELTA_Y_MIN = 0.0005;

function parseHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error(`Expected a 6-digit hex colour, got "${hex}"`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** APCA's screen luminance Y: a simple 2.4 power curve, not the sRGB piecewise one WCAG uses. */
export function apcaLuminance(hex) {
  const [r, g, b] = parseHex(hex).map((c) => (c / 255) ** TRC);
  return R * r + G * g + B * b;
}

/** Soft-clamp near-black, as APCA does, so very dark pairs don't report inflated contrast. */
const clampBlack = (y) => (y > BLK_THRS ? y : y + (BLK_THRS - y) ** BLK_CLMP);

/** Lc (lightness contrast) of `text` on `background`, about -108 to 106. 0 means no usable contrast. */
export function apcaContrast(text, background) {
  const yTxt = clampBlack(apcaLuminance(text));
  const yBg = clampBlack(apcaLuminance(background));
  if (Math.abs(yBg - yTxt) < DELTA_Y_MIN) return 0;

  if (yBg > yTxt) {
    // Dark text on a light background.
    const sapc = (yBg ** NORM_BG - yTxt ** NORM_TXT) * SCALE;
    return sapc < LO_CLIP ? 0 : (sapc - LO_OFFSET) * 100;
  }
  // Light text on a dark background.
  const sapc = (yBg ** REV_BG - yTxt ** REV_TXT) * SCALE;
  return sapc > -LO_CLIP ? 0 : (sapc + LO_OFFSET) * 100;
}
