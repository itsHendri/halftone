'use client';
import * as React from 'react';
import { fontsHref, kitPayloads, kitScopeCss, siteCss } from '@/lib/theme/payload';
import { CSS_KEY, EMBED_KEY, FONTS_ID, FONTS_KEY, STYLE_ID } from '@/lib/theme/keys';
import { startAmbient } from '@/lib/theme/ambient';
import { committed, currentRecipe, isAmbient, isPreviewing, startTheme, subscribeTheme, themeFor } from '@/lib/theme/store';
import { sameRecipe } from '@halftone-ds/tokens/theme';

/**
 * Puts the live theme on the site: a stylesheet over app/tokens.css (the chrome's colours, and the
 * components' shape under .kit-scope), a cached copy for the next page load (the pre-paint script in
 * app/layout.tsx), and the kits' payloads in sessionStorage so an embedded kit paints the theme on its first
 * frame. Renders nothing.
 */
export function ThemeRuntime() {
  React.useLayoutEffect(() => {
    const apply = () => {
      const recipe = currentRecipe();
      const theme = themeFor(recipe);
      const live = !sameRecipe(recipe, committed);
      // A hover preview changes the page, not what the next page load paints.
      const keep = !isPreviewing();
      let style = document.getElementById(STYLE_ID);
      try {
        // While ambient, lib/theme/ambient.ts writes the frames' payload (the drifting theme).
        if (keep && !isAmbient()) sessionStorage.setItem(EMBED_KEY, JSON.stringify(kitPayloads(theme, live)));
      } catch {
        /* storage unavailable: the frames still get the theme over postMessage */
      }
      // The theme's fonts, for .kit-scope and the frames (null for the system fonts).
      const href = fontsHref(theme);
      let link = document.getElementById(FONTS_ID) as HTMLLinkElement | null;
      if (!href) link?.remove();
      else {
        if (!link) {
          link = Object.assign(document.createElement('link'), { id: FONTS_ID, rel: 'stylesheet' });
          document.head.appendChild(link);
        }
        if (link.href !== href) link.href = href;
      }
      try {
        if (!keep) {
          /* previewing */
        } else if (href) localStorage.setItem(FONTS_KEY, href);
        else localStorage.removeItem(FONTS_KEY);
      } catch {}
      // The site's colours only when the theme differs from app/tokens.css; the components' shape always, so
      // a .kit-scope specimen matches the kits even after a rebrand moved them away from the site's pins.
      const css = (live ? siteCss(theme) : '') + kitScopeCss(theme);
      if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ID;
        document.head.appendChild(style);
      }
      if (style.textContent !== css) style.textContent = css;
      try {
        if (keep) localStorage.setItem(CSS_KEY, css);
      } catch {}
    };
    startTheme();
    apply();
    const stop = subscribeTheme(apply);
    startAmbient();
    return stop;
  }, []);
  return null;
}
