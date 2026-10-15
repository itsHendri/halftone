/**
 * Storage keys and the pre-paint script for the live theme. A plain module (not 'use client') so the
 * root layout, a server component, can inline the script.
 */
export const STORAGE_KEY = 'halftone.theme';
/** The site's CSS for the current theme, painted before hydration. */
export const CSS_KEY = 'halftone.theme.css';
/**
 * The kits' payloads, read before paint by the embedded kits (same origin). The kits read this key too. Not
 * `kit.embed.theme`: the web kit keeps the frame's light/dark there.
 */
export const EMBED_KEY = 'kit.embed.tokens';
export const STYLE_ID = 'halftone-theme';
export const FONTS_ID = 'halftone-theme-fonts';
/** The Google Fonts stylesheet for the current theme's fonts, linked before paint too. */
export const FONTS_KEY = 'halftone.theme.fonts';

/** The ambient drift (lib/theme/ambient.ts): its last colours, painted before hydration, and its pause. */
export const AMBIENT_CSS_KEY = 'halftone.ambient.css';
export const AMBIENT_ID = 'halftone-ambient';
export const AMBIENT_PAUSE_KEY = 'halftone.ambient.paused';

/** The components filter (All | Native | Web), as <html data-kit-filter>. */
export const FILTER_KEY = 'halftone.kits';

/**
 * Inline in <head>: the last theme's CSS before first paint, so a themed site never flashes the default; the
 * ambient drift's last colours when nothing is picked; and the components filter, so the sidebar doesn't
 * flash entries it hides.
 */
export const themeBootScript = `(function(){try{var c=localStorage.getItem('${CSS_KEY}');if(c){var s=document.createElement('style');s.id='${STYLE_ID}';s.textContent=c;document.head.appendChild(s)}
var a=localStorage.getItem('${AMBIENT_CSS_KEY}');if(a&&!localStorage.getItem('${STORAGE_KEY}')){var t=document.createElement('style');t.id='${AMBIENT_ID}';t.textContent=a;document.head.appendChild(t)}
var f=localStorage.getItem('${FONTS_KEY}');if(c&&f&&f.indexOf('https://fonts.googleapis.com/')===0){var l=document.createElement('link');l.id='${FONTS_ID}';l.rel='stylesheet';l.href=f;document.head.appendChild(l)}
var k=localStorage.getItem('${FILTER_KEY}');if(k==='native'||k==='web')document.documentElement.dataset.kitFilter=k}catch(e){}})();`;
