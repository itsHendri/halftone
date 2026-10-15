'use client';
import { cvdWarnings, MIN_DELTA_E, pairDistances, simulateCvd, type CvdType, type CvdWarning } from '@halftone-ds/tokens/theme';
import { CircleCheckIcon, TriangleAlertIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { rovingKeyDown, rovingTabIndex } from '@/lib/roving';
import { useLiveTheme } from '@/lib/theme/store';

/**
 * The status tones and chart colours as someone with a colour-vision deficiency sees them, simulated in
 * @halftone-ds/tokens (Machado 2009), and the pairs that stop being told apart under any vision: a warning,
 * not a block, because the kit gives every status an icon or a label as well.
 */

type Vision = CvdType | 'none';

// `short` is the picker's label: four full names don't fit one row in a narrow panel. The full name is
// the button's accessible name and starts the hint below it.
const VISIONS: { id: Vision; label: string; short: string; hint: string }[] = [
  { id: 'none', label: 'Normal', short: 'Normal', hint: 'Typical colour vision.' },
  { id: 'protanopia', label: 'Protanopia', short: 'Protan', hint: 'Protanopia: no working red cones. Reds darken and fall toward green.' },
  { id: 'deuteranopia', label: 'Deuteranopia', short: 'Deutan', hint: 'Deuteranopia: no working green cones, the most common. Red and green meet in olive.' },
  { id: 'tritanopia', label: 'Tritanopia', short: 'Tritan', hint: 'Tritanopia: no working blue cones (rare). Blue meets green, yellow meets pink.' },
];
const visionLabel = (v: Vision) => VISIONS.find((x) => x.id === v)?.label ?? v;

const STATUS = ['success', 'warning', 'destructive', 'info'] as const;
const CHART = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const;

/** The warnings grouped by pair, worst first: one row per pair, its visions and modes listed. */
function byPair(warnings: CvdWarning[]) {
  const groups = new Map<string, CvdWarning[]>();
  for (const w of warnings) {
    const key = `${w.a}/${w.b}`;
    groups.set(key, [...(groups.get(key) ?? []), w]);
  }
  return [...groups.values()];
}

export function ColourVision() {
  const { theme } = useLiveTheme();
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
  const [vision, setVision] = React.useState<Vision>('none');
  const hex = theme.resolved[mode];
  const sim = (name: string) => simulateCvd(hex[name], vision);

  const pairs = React.useMemo(() => byPair(cvdWarnings(theme.resolved)), [theme.resolved]);
  // Tones too close to a neighbour as shown right now (this vision, this mode): marked on the swatches.
  const close = new Set(pairDistances(hex, vision).flatMap((d) => (d.deltaE < MIN_DELTA_E ? [d.a, d.b] : [])));
  const hint = VISIONS.find((v) => v.id === vision)?.hint;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div
          role="radiogroup"
          aria-label="Colour vision"
          onKeyDown={(e) => rovingKeyDown(e, { select: true })}
          className="bg-card border-border grid grid-cols-4 gap-0.5 rounded-full border p-0.5">
          {VISIONS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={vision === v.id}
              tabIndex={rovingTabIndex(
                i,
                VISIONS.findIndex((x) => x.id === vision)
              )}
              aria-label={v.label}
              onClick={() => setVision(v.id)}
              className={`focus-visible:ring-ring rounded-full px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                vision === v.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {v.short}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {hint}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STATUS.map((name) => (
          <div
            key={name}
            className="border-border flex h-16 min-w-0 flex-col justify-between rounded-lg border p-2.5"
            style={{ background: sim(name), color: sim(`${name}-foreground`) }}>
            <span className="flex items-center justify-between gap-1 text-xs font-medium">
              <span className="truncate">{name}</span>
              {close.has(name) ? (
                <>
                  <TriangleAlertIcon className="size-3.5 shrink-0" aria-hidden />
                  <span className="sr-only">, too close to another tone</span>
                </>
              ) : null}
            </span>
            <span className="font-mono text-[11px] uppercase">{sim(name)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {/* The series touch, the way a stacked bar or a pie puts them. */}
        <div className="border-border flex h-12 overflow-hidden rounded-lg border">
          {CHART.map((name) => (
            <span key={name} className="flex-1" style={{ background: sim(name) }} title={`${name} ${sim(name)}`} />
          ))}
        </div>
        <div className="grid grid-cols-5 text-center">
          {CHART.map((name) => (
            <span key={name} className="text-muted-foreground inline-flex items-center justify-center gap-1 font-mono text-[11px]">
              {name}
              {close.has(name) ? (
                <>
                  <TriangleAlertIcon className="text-foreground size-3" aria-hidden />
                  <span className="sr-only">, too close to its neighbour</span>
                </>
              ) : null}
            </span>
          ))}
        </div>
      </div>

      {pairs.length ? (
        <div className="flex flex-col gap-2">
          <p className="flex items-start gap-2 text-sm">
            <TriangleAlertIcon className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="font-medium">
                {pairs.length} {pairs.length === 1 ? 'pair falls' : 'pairs fall'} below ΔE {MIN_DELTA_E}.
              </span>{' '}
              <span className="text-muted-foreground">Colour alone won’t tell them apart: keep the icon or label beside it.</span>
            </span>
          </p>
          <ul className="flex flex-col gap-1">
            {pairs.map((group) => {
              const worst = group[0];
              // The visions it fails under, in the toggle's order, and the modes.
              const visions = VISIONS.filter((v) => group.some((w) => w.vision === v.id));
              const modes = [...new Set(group.map((w) => w.mode))];
              return (
                <li key={`${worst.a}/${worst.b}`} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className="flex shrink-0" aria-hidden>
                    <span className="ring-border size-4 rounded-l ring-1" style={{ background: worst.fg }} />
                    <span className="ring-border size-4 rounded-r ring-1" style={{ background: worst.bg }} />
                  </span>
                  <span className="font-mono">
                    {worst.a} / {worst.b}
                  </span>
                  <span className="text-muted-foreground font-mono">ΔE {worst.deltaE.toFixed(3)}</span>
                  <span className="text-muted-foreground flex flex-wrap items-center gap-x-1.5">
                    {visions.map((v, i) => (
                      <React.Fragment key={v.id}>
                        <button
                          type="button"
                          onClick={() => setVision(v.id)}
                          aria-pressed={vision === v.id}
                          aria-label={`Preview ${v.label}`}
                          className={`focus-visible:ring-ring rounded underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 ${vision === v.id ? 'text-foreground' : ''}`}>
                          {v.label}
                        </button>
                        {i < visions.length - 1 ? <span aria-hidden>·</span> : null}
                      </React.Fragment>
                    ))}
                    <span>({modes.join(' and ')})</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm">
          <CircleCheckIcon className="text-success size-4 shrink-0" aria-hidden />
          <span className="text-muted-foreground">
            Every status pair and neighbouring chart colour stays at least ΔE {MIN_DELTA_E} apart under all three.
          </span>
        </p>
      )}
    </div>
  );
}
