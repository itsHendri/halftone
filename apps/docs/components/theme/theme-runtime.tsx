'use client';
import * as React from 'react';
import { fontsHref, kitPayloads, kitScopeCss, siteCss } from '@/lib/theme/payload';
import { CSS_KEY, EMBED_BRAND_KEY, EMBED_KEY, FONTS_ID, FONTS_KEY, STYLE_ID } from '@/lib/theme/keys';
import { kitBrand } from '@/lib/theme/brand';
import { startAmbient } from '@/lib/theme/ambient';
import { currentSystem, currentTheme, isAmbient, isLive, isPreviewing, startTheme, subscribeTheme } from '@/lib/theme/store';
import { systemsState } from '@/lib/studio/systems';

/**
 * Puts the active system on the site: a stylesheet over app/tokens.css (the chrome's colours, and the components'
 * shape under .kit-scope), a cached copy for the next page load (the pre-paint script in app/layout.tsx), and the
 * kits' payloads and brand in sessionStorage so an embedded kit paints them on its first frame. Renders nothing.
 * Until the saved systems have loaded (IndexedDB is async) the boot stylesheet stays as it is, so nothing flashes.
 */
export function ThemeRuntime() {
  React.useLayoutEffect(() => {
    const apply = () => {
      const s = systemsState();
      if (s.status === 'loading' && !s.ambient) return;
      const doc = currentSystem();
      const theme = currentTheme();
      const live = isLive(doc);
      // A hover preview or a shared link changes the page, not what the next page load paints.
      const keep = !isPreviewing() && !s.shared;
      let style = document.getElementById(STYLE_ID);
      try {
        // While ambient, lib/theme/ambient.ts writes the frames' payload (the drifting theme).
        if (!isPreviewing() && !isAmbient()) sessionStorage.setItem(EMBED_KEY, JSON.stringify(kitPayloads(theme, live)));
        const brand = kitBrand(s.doc.brand, s.doc.name);
        if (brand) sessionStorage.setItem(EMBED_BRAND_KEY, JSON.stringify(brand));
        else sessionStorage.removeItem(EMBED_BRAND_KEY);
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
