'use client';
import { migrate, systemOverrides } from '@halftone-ds/tokens/system';
import { fontById, normalizeRecipe, PRESETS, sameRecipe, type Adjustment, type Recipe, type RecipeInput } from '@halftone-ds/tokens/theme';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, PauseIcon, PlayIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { ExportPanel } from '@/components/theme/export-panel';
import { toast, Toaster } from '@/components/theme/studio/toast';
import { SWATCHES, swatchName } from '@/lib/theme/swatches';
import { rovingKeyDown, rovingTabIndex } from '@/lib/roving';
import { ambientBrand, pauseAmbient, playAmbient, useAmbient } from '@/lib/theme/ambient';
import { resumeAmbient, setRecipe, themeFor, undo, useLiveTheme } from '@/lib/theme/store';
import { editSystem, switchSystem, systemLabel, systemTheme, useSystems } from '@/lib/studio/systems';

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
const rowClass = 'hover:bg-accent focus-visible:ring-ring flex items-center gap-3 rounded-lg px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2';

/** The drifting colours as a swatch: the route the hue takes (lib/theme/ambient.ts). */
const DRIFT_SWATCH = 'conic-gradient(from 0deg, oklch(0.58 0.19 292), oklch(0.58 0.19 40), oklch(0.58 0.19 355), oklch(0.58 0.19 262), oklch(0.58 0.19 292))';

/** Back to the drifting colours: the first choice in both popovers. */
function DriftChoice({ selected, tabIndex, close }: { selected: boolean; tabIndex: number; close?: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabIndex}
      onClick={() => {
        resumeAmbient();
        playAmbient();
        close?.();
      }}
      className={rowClass}>
      <span className="ring-background size-4 shrink-0 rounded-full ring-2" style={{ background: DRIFT_SWATCH }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">Drifting colours</span>
        <span className="text-muted-foreground block truncate text-xs">Moves until you pick a colour</span>
      </span>
      {selected ? <CheckIcon className="size-4 shrink-0" aria-hidden /> : null}
    </button>
  );
}

/**
 * The theme bar at the bottom of every docs page. It follows the active system (lib/studio/systems.ts): its name,
 * switching between saved systems, a preset or a colour for it, pausing the drift, and the way out (Use system).
 * Everything else lives in Studio (/studio, in the header). Every control is a fixed width and opens upwards in a
 * popover, so the bar never changes size as names change. Until a system is active the colours drift
 * (lib/theme/ambient.ts); "Drifting colours", first in both popovers, brings it back (saved systems stay).
 */
export function ThemePill() {
  const pathname = usePathname();
  const { system, recipe, theme, ambient } = useLiveTheme();
  const systems = useSystems();
  const drift = useAmbient();
  const [colourOpen, setColourOpen] = React.useState(false);
  const [systemOpen, setSystemOpen] = React.useState(false);
  // A preset picked for a system with hand edits waits here until the person says whether to keep them.
  const [asking, setAsking] = React.useState<(typeof PRESETS)[number] | null>(null);
  const bar = React.useRef<HTMLDivElement>(null);
  const covering = useCoversAvoided(bar, pathname);

  if (pathname?.startsWith('/studio') || pathname?.startsWith('/themes')) return null;
  const presetIndex = ambient ? -1 : PRESETS.findIndex((x) => sameRecipe(recipe, x.recipe));
  const systemIndex = ambient || systems.shared ? -1 : systems.saved.findIndex((x) => x.id === systems.activeId);
  const label = ambient ? 'Drifting' : systemLabel(systems);
  const swatchIndex = ambient ? -1 : SWATCHES.findIndex((x) => x.hex === recipe.brand);
  // A colour rewrites the recipe and keeps the hand edits (as the Studio's base knobs do); a preset asks first
  // whether to keep them. Either way the bar says what changed, with an Undo: there's none outside the Studio.
  const edits = ambient ? 0 : systemOverrides(system).length;
  const editsNote = edits ? (edits === 1 ? 'Your edit stays.' : `Your ${edits} edits stay.`) : '';
  const pick = (input: RecipeInput, message: string) => {
    setRecipe(input);
    if (!ambient) toast([message, editsNote].filter(Boolean).join(' '), { label: 'Undo', run: undo });
  };
  // The whole preset: a key it leaves out (button, field) goes back to its default, not the last one.
  const presetRecipe = (p: (typeof PRESETS)[number]) => normalizeRecipe({ ...p.recipe, preset: p.id });
  const applyPreset = (p: (typeof PRESETS)[number], keepEdits: boolean) => {
    if (keepEdits) pick(presetRecipe(p), `${label} now uses ${p.name}.`);
    else {
      // Start fresh: the preset with no hand edits (extras go too), keeping the system's id, name and logo.
      editSystem((doc) => ({ ...migrate(presetRecipe(p), doc.brand, { id: doc.id, name: doc.name, updatedAt: doc.updatedAt }) }));
      toast(`${label} now uses ${p.name}, without its edits.`, { label: 'Undo', run: undo });
    }
    setAsking(null);
    // Closed, so the toast (and its Undo) isn't hidden behind the menu.
    setSystemOpen(false);
  };

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 transition-[translate,opacity] duration-200 motion-reduce:transition-none print:hidden ${
          covering ? 'translate-y-[calc(100%+1rem)] opacity-0' : ''
        }`}
        inert={covering}>
        <div
          ref={bar}
          role="toolbar"
          aria-label="Theme"
          className="border-border bg-background/85 text-foreground pointer-events-auto flex max-w-full items-center gap-1 rounded-full border p-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.12)] backdrop-blur-xl">
          <Popover
            open={systemOpen}
            onOpenChange={(open) => {
              setSystemOpen(open);
              if (!open) setAsking(null);
            }}>
            <PopoverTrigger className={`${itemClass} hover:bg-accent px-3`} aria-label={ambient ? 'System: none, the colours drift' : `System: ${label}`}>
              <span className="bg-primary size-3 shrink-0 rounded-full" aria-hidden />
              {/* A fixed width: the bar keeps its size whatever the system is called. */}
              <span className="hidden w-28 truncate text-left sm:inline">{label}</span>
              <ChevronDownIcon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
            </PopoverTrigger>
            <PopoverContent side="top" align="start" sideOffset={10} className="max-h-[70vh] w-72 overflow-y-auto p-1.5">
              <div role="radiogroup" aria-label="Systems" className="flex flex-col" onKeyDown={(e) => rovingKeyDown(e)}>
                <DriftChoice selected={ambient} tabIndex={rovingTabIndex(0, ambient ? 0 : systemIndex + 1)} />
                {systems.saved.map((doc, i) => {
                  const t = systemTheme(doc);
                  const selected = !ambient && !systems.shared && systems.activeId === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      tabIndex={rovingTabIndex(i + 1, ambient ? 0 : systemIndex + 1)}
                      onClick={() => switchSystem(doc.id)}
                      className={rowClass}>
                      <span className="flex shrink-0 -space-x-1" aria-hidden>
                        <span className="ring-background size-4 rounded-full ring-2" style={{ background: t.resolved.light.primary }} />
                        <span className="ring-background size-4 rounded-full ring-2" style={{ background: t.resolved.light.muted }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{doc.name}</span>
                        <span className="text-muted-foreground block truncate text-xs">Saved in this browser</span>
                      </span>
                      {selected ? <CheckIcon className="size-4 shrink-0" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
              <p className="text-muted-foreground px-2.5 pb-1 pt-3 text-xs font-medium">{ambient ? 'Start from a preset' : `Presets for ${label}`}</p>
              {asking ? (
                <div role="group" aria-label={`${asking.name} on ${label}`} className="bg-muted/60 mx-1 mb-1.5 flex flex-col gap-2 rounded-lg p-2.5">
                  <p className="text-sm">
                    <span className="font-medium">{asking.name}</span> on {label}, which has {edits} hand edit{edits === 1 ? '' : 's'}.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" autoFocus onClick={() => applyPreset(asking, true)} className="bg-primary text-primary-foreground focus-visible:ring-ring rounded-full px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
                      Keep my edits
                    </button>
                    <button type="button" onClick={() => applyPreset(asking, false)} className="border-border hover:bg-accent focus-visible:ring-ring rounded-full border px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
                      Start fresh
                    </button>
                    <button type="button" onClick={() => setAsking(null)} className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-full px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
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
                      tabIndex={rovingTabIndex(i, Math.max(0, presetIndex))}
                      // With hand edits, ask first whether to keep them; without, there's nothing to lose.
                      onClick={() => (edits ? setAsking(p) : applyPreset(p, true))}
                      className={rowClass}>
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
              <div className="border-border mt-1.5 border-t pt-1.5">
                <Link href="/studio" className={`${rowClass} text-sm font-medium`}>
                  <span className="flex-1">Open in Studio</span>
                  <ArrowRightIcon className="size-4 shrink-0" aria-hidden />
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={colourOpen} onOpenChange={setColourOpen}>
            <PopoverTrigger className={`${itemClass} hover:bg-accent w-9`} aria-label={ambient ? 'Brand colour: drifting' : `Brand colour: ${swatchName(recipe.brand)}`}>
              <span className="ring-border size-4 rounded-full ring-1" style={{ background: ambient ? DRIFT_SWATCH : recipe.brand }} aria-hidden />
            </PopoverTrigger>
            <PopoverContent side="top" sideOffset={10} className="w-72 p-1.5">
              <div role="radiogroup" aria-label="Brand colour" className="flex flex-col gap-1" onKeyDown={(e) => rovingKeyDown(e)}>
                <DriftChoice selected={ambient} tabIndex={rovingTabIndex(0, ambient ? 0 : swatchIndex + 1)} close={() => setColourOpen(false)} />
                <div className="grid grid-cols-5 gap-2 px-2.5 pb-1.5 pt-1">
                  {SWATCHES.map((s, i) => {
                    const selected = !ambient && recipe.brand === s.hex;
                    return (
                      <button
                        key={s.hex}
                        type="button"
                        role="radio"
                        tabIndex={rovingTabIndex(i + 1, ambient ? 0 : swatchIndex + 1)}
                        aria-label={s.name}
                        aria-checked={selected}
                        title={s.name}
                        onClick={() => {
                          pick({ brand: s.hex }, `${label}'s brand colour is now ${s.name}.`);
                          setColourOpen(false);
                        }}
                        className="focus-visible:ring-ring mx-auto size-8 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 motion-reduce:transition-none"
                        style={{ background: s.hex, boxShadow: selected ? `0 0 0 2px var(--background), 0 0 0 3.5px ${s.hex}` : undefined }}
                      />
                    );
                  })}
                  <label
                    className="relative mx-auto size-8 cursor-pointer rounded-full"
                    style={{ background: 'conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #06b6d4, #6366f1, #d946ef, #ef4444)' }}
                    title="Any colour">
                    <span className="sr-only">Any colour</span>
                    <input
                      type="color"
                      value={recipe.brand}
                      onChange={(e) => setRecipe({ brand: e.target.value }, { coalesce: 'brand' })}
                      className="absolute inset-0 size-full cursor-pointer opacity-0"
                    />
                  </label>
                </div>
              </div>
            </PopoverContent>
          </Popover>

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

          <Popover
            onOpenChange={(open) => {
              // Taking the theme while it drifts keeps the colour on screen.
              const brand = ambientBrand();
              if (open && ambient && brand) setRecipe({ brand });
            }}>
            <PopoverTrigger className={`${itemClass} bg-primary text-primary-foreground ml-1 px-4 hover:opacity-90`}>Use system</PopoverTrigger>
            <PopoverContent side="top" align="end" sideOffset={10} className="max-h-[70vh] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto p-4">
              <ExportPanel theme={theme} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {/* Above the bar, which sits at bottom-4. The Studio has its own (the bar isn't drawn there). */}
      <Toaster className="bottom-20" />
    </>
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
