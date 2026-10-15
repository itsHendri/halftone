'use client';
import { fontById, normalizeRecipe, PRESETS, sameRecipe, type Adjustment, type Recipe } from '@halftone-ds/tokens/theme';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { CheckIcon, ChevronDownIcon, MoonIcon, PaintBucketIcon, PauseIcon, PlayIcon, RotateCcwIcon, ShieldCheckIcon, SlidersHorizontalIcon, SunIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme as useSiteMode } from 'next-themes';
import * as React from 'react';
import { ExportPanel } from '@/components/theme/export-panel';
import { SWATCHES, swatchName } from '@/lib/theme/swatches';
import { rovingKeyDown, rovingTabIndex } from '@/lib/roving';
import { ambientBrand, pauseAmbient, playAmbient, useAmbient } from '@/lib/theme/ambient';
import { resumeAmbient, setRecipe, themeFor, useLiveTheme } from '@/lib/theme/store';

/** The preset a recipe came from, if it is still exactly that preset. */
export function presetLabel(recipe: Recipe) {
  // A shared code carries no preset name, so a recipe that is exactly a preset is named after it.
  const preset = PRESETS.find((p) => p.id === recipe.preset) ?? PRESETS.find((p) => sameRecipe(recipe, p.recipe));
  if (!preset) return 'Custom';
  return sameRecipe(recipe, preset.recipe) ? preset.name : `${preset.name}, edited`;
}

/**
 * On a phone, whether the bar would sit on top of something marked `data-theme-bar-avoid` (the home hero's
 * buttons): then it slides away until that has scrolled clear. From sm up the bar is narrow enough to leave them.
 */
function useCoversAvoided(bar: React.RefObject<HTMLDivElement | null>, pathname: string | null) {
  const [covering, setCovering] = React.useState(false);
  React.useEffect(() => {
    const phone = window.matchMedia('(max-width: 639px)');
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const targets = document.querySelectorAll('[data-theme-bar-avoid]');
        if (!phone.matches || !targets.length) return setCovering(false);
        // The band the bar occupies: its own height plus the 1rem gap, measured from the bottom of the window.
        const top = window.innerHeight - (bar.current?.offsetHeight ?? 48) - 24;
        setCovering(Array.from(targets).some((el) => {
          const r = el.getBoundingClientRect();
          return r.bottom > top && r.top < window.innerHeight;
        }));
      });
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    phone.addEventListener('change', check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      phone.removeEventListener('change', check);
    };
  }, [bar, pathname]);
  return covering;
}

/** Linked tokens move with `primary`; list each change once. */
export const visibleAdjustments = (list: Adjustment[]) => list.filter((a) => !/^(ring|sidebar-)/.test(a.token));

const itemClass =
  'focus-visible:ring-ring inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2';

/**
 * The theme bar at the bottom of every docs page: a preset, a colour, light or dark, and the way out
 * (export). The full set of controls lives on /themes. Everything here changes the site and every
 * embedded kit live. Until anything is picked the colours drift (lib/theme/ambient.ts): the bar says so,
 * can pause it, and any pick (or "Use theme") keeps the colour on screen.
 */
export function ThemePill() {
  const pathname = usePathname();
  const { recipe, theme, ambient } = useLiveTheme();
  const drift = useAmbient();
  const { resolvedTheme, setTheme } = useSiteMode();
  const [colours, setColours] = React.useState(false);
  const bar = React.useRef<HTMLDivElement>(null);
  const covering = useCoversAvoided(bar, pathname);

  // Close the colour row on Escape or a click outside the bar.
  React.useEffect(() => {
    if (!colours) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setColours(false);
    const onDown = (e: PointerEvent) => !bar.current?.contains(e.target as Node) && setColours(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [colours]);

  if (pathname?.startsWith('/themes')) return null;
  const adjusted = visibleAdjustments(theme.adjustments);
  const dark = resolvedTheme === 'dark';

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 transition-[translate,opacity] duration-200 motion-reduce:transition-none print:hidden ${
        covering ? 'translate-y-[calc(100%+1rem)] opacity-0' : ''
      }`}
      inert={covering}>
      <div
        ref={bar}
        role="toolbar"
        aria-label="Theme"
        className="border-border bg-background/85 text-foreground pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full border p-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.12)] backdrop-blur-xl">
        <Popover>
          <PopoverTrigger className={`${itemClass} hover:bg-accent px-3`} aria-label={ambient ? 'Preset: none, the colours drift' : `Preset: ${presetLabel(recipe)}`}>
            <span className="bg-primary size-3 rounded-full" aria-hidden />
            <span className="hidden max-w-32 truncate sm:inline">{ambient ? 'Ambient' : presetLabel(recipe)}</span>
            <ChevronDownIcon className="text-muted-foreground size-3.5" aria-hidden />
          </PopoverTrigger>
          <PopoverContent side="top" align="start" sideOffset={10} className="w-72 p-1.5">
            <div role="radiogroup" aria-label="Presets" className="flex flex-col" onKeyDown={(e) => rovingKeyDown(e)}>
              {PRESETS.map((p, i) => {
                const t = themeFor(normalizeRecipe(p.recipe));
                const selected = !ambient && sameRecipe(recipe, p.recipe);
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={rovingTabIndex(i, ambient ? -1 : PRESETS.findIndex((x) => sameRecipe(recipe, x.recipe)))}
                    onClick={() => setRecipe({ ...p.recipe, preset: p.id })}
                    className="hover:bg-accent focus-visible:ring-ring flex items-center gap-3 rounded-lg px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2">
                    <span className="flex shrink-0 -space-x-1" aria-hidden>
                      <span className="ring-background size-4 rounded-full ring-2" style={{ background: t.resolved.light.primary }} />
                      <span className="ring-background size-4 rounded-full ring-2" style={{ background: t.resolved.light.muted }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{p.name}</span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {fontById(t.recipe.font.heading)?.family} · {t.recipe.radius === 'none' ? 'square' : `radius ${t.recipe.radius}`}
                      </span>
                    </span>
                    {selected ? <CheckIcon className="size-4 shrink-0" aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <span className="bg-border mx-0.5 h-5 w-px shrink-0" aria-hidden />

        <button
          type="button"
          onClick={() => setColours((v) => !v)}
          aria-expanded={colours}
          aria-label={ambient ? 'Brand colour: drifting' : `Brand colour: ${swatchName(recipe.brand)}`}
          className={`${itemClass} hover:bg-accent w-9`}>
          {colours ? (
            <PaintBucketIcon className="size-4" aria-hidden />
          ) : (
            <span className="ring-border bg-primary size-4 rounded-full ring-1" style={ambient ? undefined : { background: recipe.brand }} aria-hidden />
          )}
        </button>
        <div
          className="flex items-center overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
          style={{ maxWidth: colours ? 400 : 0, opacity: colours ? 1 : 0 }}
          aria-hidden={!colours}>
          <div role="radiogroup" aria-label="Brand colour" className="flex items-center gap-1.5 px-1" onKeyDown={(e) => rovingKeyDown(e)}>
            {SWATCHES.map((s, i) => {
              const selected = !ambient && recipe.brand === s.hex;
              return (
                <button
                  key={s.hex}
                  type="button"
                  role="radio"
                  tabIndex={colours ? rovingTabIndex(i, ambient ? -1 : SWATCHES.findIndex((x) => x.hex === recipe.brand)) : -1}
                  aria-label={s.name}
                  aria-checked={selected}
                  onClick={() => {
                    setRecipe({ brand: s.hex });
                    setColours(false);
                  }}
                  className="focus-visible:ring-ring size-5 shrink-0 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 motion-reduce:transition-none"
                  style={{ background: s.hex, boxShadow: selected ? `0 0 0 2px var(--background), 0 0 0 3.5px ${s.hex}` : undefined }}
                />
              );
            })}
            <label
              className="relative size-5 shrink-0 cursor-pointer rounded-full"
              style={{ background: 'conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #06b6d4, #6366f1, #d946ef, #ef4444)' }}
              title="Any colour">
              <span className="sr-only">Any colour</span>
              <input
                type="color"
                tabIndex={colours ? 0 : -1}
                value={recipe.brand}
                onChange={(e) => setRecipe({ brand: e.target.value }, { coalesce: 'brand' })}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>

        {/* The drift moves for longer than five seconds, so it can be paused (WCAG 2.2.2). */}
        {ambient && drift.active && !drift.reduced ? (
          <button
            type="button"
            onClick={drift.paused ? playAmbient : pauseAmbient}
            className={`${itemClass} text-muted-foreground hover:bg-accent hover:text-foreground w-9`}
            aria-label={drift.paused ? 'Play the colour drift' : 'Pause the colour drift'}
            title={drift.paused ? 'Play the colour drift' : 'Pause the colour drift'}>
            {drift.paused ? <PlayIcon className="size-4" aria-hidden /> : <PauseIcon className="size-4" aria-hidden />}
          </button>
        ) : null}

        <span className="bg-border mx-0.5 h-5 w-px shrink-0" aria-hidden />

        {/* The icon switches in CSS: the server can't know the visitor's theme (a hydration mismatch). */}
        <button type="button" onClick={() => setTheme(dark ? 'light' : 'dark')} className={`${itemClass} hover:bg-accent w-9`} aria-label="Toggle light and dark">
          <SunIcon className="hidden size-4 dark:block" aria-hidden />
          <MoonIcon className="size-4 dark:hidden" aria-hidden />
        </button>

        {adjusted.length && !ambient ? (
          <Popover>
            <PopoverTrigger className={`${itemClass} text-muted-foreground hover:bg-accent hover:text-foreground px-2.5 max-sm:hidden`} aria-label={`${adjusted.length} colours adjusted for contrast`}>
              <ShieldCheckIcon className="size-4" aria-hidden />
              <span className="tabular-nums">{adjusted.length}</span>
            </PopoverTrigger>
            <PopoverContent side="top" sideOffset={10} className="w-80">
              <AdjustmentList adjustments={adjusted} />
            </PopoverContent>
          </Popover>
        ) : null}

        {!ambient ? (
          <button
            type="button"
            onClick={() => {
              resumeAmbient();
              playAmbient();
            }}
            className={`${itemClass} text-muted-foreground hover:bg-accent hover:text-foreground w-9 max-sm:hidden`}
            aria-label="Back to the drifting colours"
            title="Back to the drifting colours">
            <RotateCcwIcon className="size-4" aria-hidden />
          </button>
        ) : null}

        <Link href="/themes" className={`${itemClass} text-muted-foreground hover:bg-accent hover:text-foreground w-9`} aria-label="Open the theme studio" title="Theme studio">
          <SlidersHorizontalIcon className="size-4" aria-hidden />
        </Link>

        <Popover
          onOpenChange={(open) => {
            // Taking the theme while it drifts keeps the colour on screen.
            const brand = ambientBrand();
            if (open && ambient && brand) setRecipe({ brand });
          }}>
          <PopoverTrigger className={`${itemClass} bg-primary text-primary-foreground px-4 hover:opacity-90`}>Use theme</PopoverTrigger>
          <PopoverContent side="top" align="end" sideOffset={10} className="max-h-[70vh] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto p-4">
            <ExportPanel theme={theme} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/** Which colours the generator moved to pass WCAG AA, before → after. */
export function AdjustmentList({ adjustments }: { adjustments: Adjustment[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        <span className="font-medium">Adjusted for contrast.</span>{' '}
        <span className="text-muted-foreground">Same hue, lightness nudged until every pairing passes WCAG AA.</span>
      </p>
      <ul className="flex flex-col gap-2">
        {adjustments.map((a) => (
          <li key={`${a.mode}-${a.token}`} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground w-10 shrink-0">{a.mode}</span>
            <span className="min-w-0 flex-1 truncate font-mono">{a.token}</span>
            <span className="ring-border size-4 shrink-0 rounded ring-1" style={{ background: a.from }} title={a.from} aria-hidden />
            <span className="text-muted-foreground" aria-hidden>
              →
            </span>
            <span className="ring-border size-4 shrink-0 rounded ring-1" style={{ background: a.to }} title={a.to} aria-hidden />
            <span className="sr-only">
              {a.from} to {a.to}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
