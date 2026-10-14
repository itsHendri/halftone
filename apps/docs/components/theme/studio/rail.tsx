'use client';
import { decodeRecipe, FONTS, OPTIONS, PRESETS, sameRecipe, themeVars, type Recipe, type RecipeInput, type Theme } from '@halftone/tokens/theme';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { CheckIcon, CopyIcon, LockIcon, LockOpenIcon, MoonIcon, Redo2Icon, RotateCcwIcon, ShieldCheckIcon, ShuffleIcon, SunIcon, Undo2Icon } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { ExportPanel } from '@/components/theme/export-panel';
import { fontFamily, fontLabel, LABELS, ORDER, PresetCard } from '@/components/theme/studio/parts';
import { AdjustmentList, presetLabel, visibleAdjustments } from '@/components/theme/theme-pill';
import { SWATCHES } from '@/lib/theme/swatches';
import { rovingKeyDown, rovingTabIndex } from '@/lib/roving';
import { previewRecipe, redo, reset, setRecipe, shuffle, toggleLock, undo, useLiveTheme, useLocks, type LockKey } from '@/lib/theme/store';

/**
 * The studio's control rail, like ui.shadcn.com/create: one compact row per choice ("Label / value"), each
 * opening a picker, with a lock that shuffle respects. Hovering an option previews it on the whole page and
 * in the frames. The rail (and its pickers) take the opposite scheme to the page, so they stand apart from
 * the theme being edited: `.kit-dark` on a light page, `.kit-light` on a dark one (InvertedSchemeStyle).
 */
export function useInvertedScheme() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? 'kit-light' : 'kit-dark dark';
}

const ROW = 'focus-visible:ring-ring flex h-7 min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-2.5 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 data-[state=open]:bg-accent';

function LockButton({ k, label }: { k: LockKey; label: string }) {
  const locked = useLocks().has(k);
  return (
    <button
      type="button"
      onClick={() => toggleLock(k)}
      aria-pressed={locked}
      aria-label={`Keep ${label.toLowerCase()} when shuffling`}
      title={locked ? 'Locked: shuffle keeps it' : 'Lock it for shuffle'}
      // Always visible so people find them; the footer says what they do.
      className={`focus-visible:ring-ring hover:bg-accent inline-flex size-7 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 ${
        locked ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}>
      {locked ? <LockIcon className="size-3.5" aria-hidden /> : <LockOpenIcon className="size-3.5" aria-hidden />}
    </button>
  );
}

/** One row: the label, the current value, a picker in a popover, and the lock. */
function Row({
  label,
  value,
  valueStyle,
  adornment,
  lock,
  wide,
  hint,
  children,
}: {
  label: string;
  /** One line at the top of the picker: what this choice changes. */
  hint?: string;
  value: React.ReactNode;
  valueStyle?: React.CSSProperties;
  adornment?: React.ReactNode;
  lock?: LockKey;
  wide?: boolean;
  children: (close: () => void) => React.ReactNode;
}) {
  const scheme = useInvertedScheme();
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  return (
    <div className="group flex items-center gap-0.5">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) previewRecipe(null);
        }}>
        <PopoverTrigger className={ROW} aria-label={`${label}: ${typeof value === 'string' ? value : ''}`}>
          <span className="text-muted-foreground shrink-0">{label}</span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium" style={valueStyle}>
              {value}
            </span>
            {adornment}
          </span>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={12}
          className={`${scheme} bg-popover text-popover-foreground border-border ${wide ? 'w-72' : 'w-60'} p-1.5 shadow-xl backdrop-blur-none`}
          style={{ colorScheme: scheme.startsWith('kit-dark') ? 'dark' : 'light' }}>
          {hint ? <p className="text-muted-foreground px-2 pb-2 pt-1 text-xs leading-5">{hint}</p> : null}
          {children(close)}
        </PopoverContent>
      </Popover>
      {lock ? <LockButton k={lock} label={label} /> : <span className="size-7 shrink-0" aria-hidden />}
    </div>
  );
}

/** A list of choices: hover or focus previews one, a click picks it. */
function Choices({ label, items, close }: { label: string; items: { key: string; patch: RecipeInput; selected: boolean; node: React.ReactNode; style?: React.CSSProperties }[]; close: () => void }) {
  return (
    // Arrows move focus, and focus previews; Enter or a click picks.
    <div role="radiogroup" aria-label={label} className="flex flex-col" onPointerLeave={() => previewRecipe(null)} onKeyDown={(e) => rovingKeyDown(e)}>
      {items.map((item, i) => (
        <button
          key={item.key}
          type="button"
          role="radio"
          aria-checked={item.selected}
          tabIndex={rovingTabIndex(i, items.findIndex((x) => x.selected))}
          onPointerEnter={() => previewRecipe(item.patch)}
          onFocus={() => previewRecipe(item.patch)}
          onClick={() => {
            setRecipe(item.patch);
            close();
          }}
          className="hover:bg-accent focus-visible:bg-accent flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm focus-visible:outline-none"
          style={item.style}>
          <span className="min-w-0 truncate">{item.node}</span>
          {item.selected ? <CheckIcon className="size-4 shrink-0" aria-hidden /> : null}
        </button>
      ))}
    </div>
  );
}

type Axis = keyof typeof OPTIONS;

/** One line at the top of each picker: what the choice changes, in both kits. */
const HINTS: Record<string, string> = {
  preset: 'A whole theme to start from. Every row below stays editable.',
  brand: 'Buttons, links, focus rings and the charts’ first colour. Contrast is checked for you.',
  neutral: 'The greys behind surfaces, borders and secondary text. Tinted mixes in the brand.',
  heading: 'Titles and headings in both kits.',
  body: 'Everything people read: labels, paragraphs, table cells.',
  mono: 'Codes, amounts in tables, anything that must line up.',
  size: 'The base text size long-form copy is set at.',
  leading: 'The space between lines of text.',
  flow: 'The space between paragraphs, headings and blocks.',
  measure: 'How wide a column of text grows before it wraps.',
  radius: 'The corners of cards, inputs and buttons.',
  controls: 'The native kit’s buttons and chips: always round, or the radius above.',
  border: 'How heavy every border and divider is.',
  depth: 'Shadows: none, soft, raised, or a hard offset.',
  stroke: 'The line weight of every icon.',
  density: 'How much space controls and rows take.',
  contrast: 'Colours the build moved to keep text at WCAG AA, in either scheme.',
};
function optionItems(axis: Axis, recipe: Recipe) {
  return (ORDER[axis] as readonly string[]).map((value) => ({
    key: value,
    patch: { [axis]: value } as RecipeInput,
    selected: recipe[axis] === value,
    node: LABELS[value] ?? value,
  }));
}

function fontItems(role: 'heading' | 'body' | 'mono', recipe: Recipe) {
  const list = FONTS.filter((f) => !f.hidden && (role === 'mono' ? f.category === 'mono' : f.id !== 'system-mono'));
  return list.map((f) => ({
    key: f.id,
    patch: { font: { [role]: f.id } } as RecipeInput,
    selected: recipe.font[role] === f.id,
    node: (
      <span className="flex items-baseline gap-2">
        {fontLabel(f.id)}
        <span className="text-muted-foreground text-[11px] font-normal" style={{ fontFamily: 'inherit' }}>
          {f.category}
        </span>
      </span>
    ),
    style: { fontFamily: fontFamily(f.id) },
  }));
}

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title ? undefined : 'Preset'} className="flex flex-col border-t px-1.5 py-1 first:border-t-0">
      {title ? <h2 className="text-muted-foreground px-2.5 pt-0.5 text-[11px] font-semibold uppercase leading-4 tracking-wider">{title}</h2> : null}
      {children}
    </section>
  );
}

function BrandPicker({ close }: { close: () => void }) {
  const { recipe } = useLiveTheme();
  const [hex, setHex] = React.useState(recipe.brand);
  return (
    <div className="flex flex-col gap-3 p-1.5">
      <div role="radiogroup" aria-label="Brand colour" className="grid grid-cols-5 gap-2" onPointerLeave={() => previewRecipe(null)} onKeyDown={(e) => rovingKeyDown(e)}>
        {SWATCHES.map((s, i) => (
          <button
            key={s.hex}
            type="button"
            role="radio"
            aria-label={s.name}
            aria-checked={recipe.brand === s.hex}
            tabIndex={rovingTabIndex(i, SWATCHES.findIndex((x) => x.hex === recipe.brand))}
            onPointerEnter={() => previewRecipe({ brand: s.hex })}
            onFocus={() => previewRecipe({ brand: s.hex })}
            onClick={() => {
              setRecipe({ brand: s.hex });
              close();
            }}
            className="focus-visible:ring-ring size-8 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 motion-reduce:transition-none"
            style={{ background: s.hex, boxShadow: recipe.brand === s.hex ? `0 0 0 2px var(--popover), 0 0 0 4px ${s.hex}` : undefined }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="border-border relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border" style={{ background: recipe.brand }} title="Pick any colour">
          <span className="sr-only">Pick any colour</span>
          <input type="color" value={recipe.brand} onChange={(e) => setRecipe({ brand: e.target.value }, { coalesce: 'brand' })} className="absolute inset-0 size-full cursor-pointer opacity-0" />
        </label>
        <input
          aria-label="Brand colour, hex"
          value={hex}
          spellCheck={false}
          onChange={(e) => {
            setHex(e.target.value);
            const v = e.target.value.trim().replace(/^#?/, '#');
            if (/^#[0-9a-f]{6}$/i.test(v)) setRecipe({ brand: v.toLowerCase() }, { coalesce: 'brand' });
          }}
          className="border-border bg-background focus-visible:ring-ring h-9 w-full rounded-lg border px-3 font-mono text-sm uppercase focus-visible:outline-none focus-visible:ring-2"
        />
      </div>
    </div>
  );
}

function OpenCode() {
  const scheme = useInvertedScheme();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRecipe({ ...decodeRecipe(value), preset: undefined });
      setOpen(false);
      setValue('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not a theme code');
    }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger aria-label="Open a theme code" title="Open a theme code" className="border-border hover:bg-accent focus-visible:ring-ring inline-flex h-8 items-center justify-center rounded-md border px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
        Open
      </PopoverTrigger>
      <PopoverContent side="right" align="end" sideOffset={12} className={`${scheme} bg-popover text-popover-foreground border-border w-72 p-3 shadow-xl backdrop-blur-none`}>
        <form onSubmit={apply} className="flex flex-col gap-2">
          <label htmlFor="studio-open-code" className="text-sm font-medium">
            Paste a theme code
          </label>
          <input
            id="studio-open-code"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="pk1-… or pk2-…"
            spellCheck={false}
            className="border-border bg-background focus-visible:ring-ring h-9 rounded-lg border px-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2"
          />
          {error ? (
            <p role="alert" className="text-destructive text-xs">
              {error}
            </p>
          ) : null}
          <button type="submit" className="bg-primary text-primary-foreground focus-visible:ring-ring h-8 rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2">
            Open
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The rail's scrolling middle, fading at whichever edge has more to scroll to, so a cut-off row reads as "more
 * below" rather than as the end of the list.
 */
function ScrollFade({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ top: false, bottom: false });
  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.scrollTop > 1;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    setEdges((e) => (e.top === top && e.bottom === bottom ? e : { top, bottom }));
  }, []);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);
  const fade = 24;
  const mask = `linear-gradient(to bottom, ${edges.top ? 'transparent' : 'black'}, black ${fade}px, black calc(100% - ${fade}px), ${edges.bottom ? 'transparent' : 'black'})`;
  return (
    <div ref={ref} onScroll={measure} className="min-h-0 flex-1 overflow-y-auto" style={{ maskImage: mask, WebkitMaskImage: mask }}>
      {children}
    </div>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="hover:bg-accent focus-visible:ring-ring text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-md disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2">
      {children}
    </button>
  );
}

export function Rail({ className, id }: { className?: string; id?: string }) {
  const { recipe, theme, isCommitted, canUndo, canRedo } = useLiveTheme();
  const { resolvedTheme, setTheme } = useTheme();
  const scheme = useInvertedScheme();
  const [copied, setCopied] = React.useState(false);
  const adjusted = visibleAdjustments(theme.adjustments);
  const label = presetLabel(recipe);

  const options = (axis: Axis, title: string, lock?: LockKey) => (
    <Row label={title} value={LABELS[recipe[axis]] ?? recipe[axis]} lock={lock ?? (axis as LockKey)} hint={HINTS[axis]}>
      {(close) => <Choices label={title} items={optionItems(axis, recipe)} close={close} />}
    </Row>
  );
  const font = (role: 'heading' | 'body' | 'mono', title: string) => (
    <Row
      label={title}
      value={fontLabel(recipe.font[role])}
      valueStyle={{ fontFamily: fontFamily(recipe.font[role]) }}
      adornment={
        <span className="text-base" style={{ fontFamily: fontFamily(recipe.font[role]) }} aria-hidden>
          Aa
        </span>
      }
      lock={role}
      hint={HINTS[role]}
      wide>
      {(close) => (
        <div className="max-h-80 overflow-y-auto">
          <Choices label={`${title} font`} items={fontItems(role, recipe)} close={close} />
        </div>
      )}
    </Row>
  );

  return (
    <aside
      id={id}
      aria-label="Theme controls"
      className={`${scheme} bg-card text-card-foreground border-border flex flex-col overflow-hidden rounded-2xl border shadow-2xl ${className ?? ''}`}
      style={{ colorScheme: scheme.startsWith('kit-dark') ? 'dark' : 'light' }}>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Theme</p>
          <p className="text-muted-foreground truncate text-xs">{isCommitted ? 'Kit default' : label}</p>
        </div>
        <div className="-mr-1.5 flex items-center">
          <IconButton label="Undo (⌘Z)" onClick={undo} disabled={!canUndo}>
            <Undo2Icon className="size-4" aria-hidden />
          </IconButton>
          <IconButton label="Redo (⇧⌘Z)" onClick={redo} disabled={!canRedo}>
            <Redo2Icon className="size-4" aria-hidden />
          </IconButton>
          <IconButton label="Back to the kits’ theme" onClick={reset} disabled={isCommitted}>
            <RotateCcwIcon className="size-4" aria-hidden />
          </IconButton>
          <IconButton label="Switch light and dark" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
            {resolvedTheme === 'dark' ? <SunIcon className="size-4" aria-hidden /> : <MoonIcon className="size-4" aria-hidden />}
          </IconButton>
        </div>
      </div>

      <ScrollFade>
        {/* No heading: the preset is where you start, and every group below is titled. */}
        <Group>
          <Row label="Preset" value={label} hint={HINTS.preset} wide>
            {(close) => (
              <div className="grid grid-cols-2 gap-1.5 p-1">
                {PRESETS.map((p) => (
                  <PresetCard key={p.id} id={p.id} name={p.name} recipe={p.recipe} selected={sameRecipe(recipe, p.recipe)} onPick={close} />
                ))}
              </div>
            )}
          </Row>
        </Group>

        <Group title="Colour">
          <Row
            label="Brand"
            value={recipe.brand.toUpperCase()}
            valueStyle={{ fontFamily: 'var(--font-mono)' }}
            adornment={<span className="ring-border size-4 shrink-0 rounded-full ring-1" style={{ background: recipe.brand }} aria-hidden />}
            lock="brand"
            hint={HINTS.brand}>
            {(close) => <BrandPicker close={close} />}
          </Row>
          {options('neutral', 'Neutral')}
          {adjusted.length ? (
            <Row label="Contrast" value={`${adjusted.length} adjusted`} adornment={<ShieldCheckIcon className="text-muted-foreground size-4" aria-hidden />} hint={HINTS.contrast} wide>
              {() => (
                <div className="p-2">
                  <AdjustmentList adjustments={adjusted} />
                </div>
              )}
            </Row>
          ) : null}
        </Group>

        <Group title="Type">
          {font('heading', 'Heading')}
          {font('body', 'Body')}
          {font('mono', 'Mono')}
        </Group>

        <Group title="Typeset">
          {options('size', 'Size')}
          {options('leading', 'Leading')}
          {options('flow', 'Flow')}
          {options('measure', 'Measure')}
        </Group>

        <Group title="Shape">
          {options('radius', 'Radius')}
          {options('controls', 'Mobile buttons')}
          {options('border', 'Border')}
        </Group>

        <Group title="Depth and icons">
          {options('depth', 'Depth')}
          {options('stroke', 'Icon stroke')}
          {options('density', 'Density')}
        </Group>
      </ScrollFade>

      <div className="flex flex-col gap-2 border-t px-3 py-2.5">
        <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] leading-4">
          <LockIcon className="size-3 shrink-0" aria-hidden />
          Lock a row to keep it when you shuffle.
        </p>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(theme.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="border-border bg-background hover:bg-accent focus-visible:ring-ring inline-flex h-8 items-center justify-between gap-2 rounded-md border px-2.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-2"
          aria-label={`Copy theme code ${theme.code}`}>
          <span className="truncate">{theme.code}</span>
          {copied ? <CheckIcon className="size-3.5 shrink-0" aria-hidden /> : <CopyIcon className="size-3.5 shrink-0" aria-hidden />}
        </button>
        <div className="flex gap-2">
          <OpenCode />
          <button
            type="button"
            onClick={shuffle}
            title="Shuffle everything that isn't locked"
            className="border-border hover:bg-accent focus-visible:ring-ring inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2">
            <ShuffleIcon className="size-3.5" aria-hidden />
            Shuffle
          </button>
          <Popover>
            <PopoverTrigger className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-8 flex-1 items-center justify-center rounded-md text-xs font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
              Use theme
            </PopoverTrigger>
            <PopoverContent side="right" align="end" sideOffset={12} className="max-h-[75vh] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto p-4">
              <ExportPanel theme={theme} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </aside>
  );
}

/**
 * The theme in both schemes under `.kit-light` / `.kit-dark`, so the rail can take the opposite one. More
 * specific than app/tokens.css (`:root`, `.dark`) and the live theme's own sheet (`:root:root`).
 */
export function InvertedSchemeStyle() {
  const { theme } = useLiveTheme();
  const css = React.useMemo(() => {
    const { light, dark } = invertVars(theme);
    const block = (sel: string, vars: Record<string, string>) => `${sel}{${Object.entries(vars).map(([k, v]) => `${k}:${v};`).join('')}}`;
    return block(':root:root .kit-light', light) + block(':root:root .kit-dark', dark);
  }, [theme]);
  return <style>{css}</style>;
}

const invertVars = (theme: Theme) => {
  const vars = themeVars(theme, 'oklch');
  // Shape and type variables live on :root already; only the colours (and shadows) differ per scheme.
  const colours = (map: Record<string, string>) => Object.fromEntries(Object.entries(map).filter(([k]) => !/^--(radius|border-width|icon-stroke|density|control-|type-|leading-|typeset-)/.test(k)));
  return { light: colours(vars.light), dark: colours(vars.dark) };
};
