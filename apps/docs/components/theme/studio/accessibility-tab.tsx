'use client';
import { cvdWarnings } from '@halftone-ds/tokens/theme';
import * as React from 'react';
import { ContrastTable } from '@/components/theme/studio/contrast-table';
import { ColourVision } from '@/components/theme/studio/vision';
import { autoFixed, choicesToCheck, contrastLines, lineFails } from '@/lib/studio/accessibility';
import { editedSlots, VARIANT_LABELS } from '@/lib/studio/components';
import { COMPONENTS } from '@halftone-ds/tokens/theme';
import { contrast, grade, RAMP_LABELS, rampsOf, ratioText, roleLabel, STEPS } from '@/lib/studio/foundations';
import { useLiveTheme } from '@/lib/theme/store';

/**
 * The Accessibility tab (apps/docs/design/studio-wireframes.md › Accessibility tab, wireframe 5): a summary, then every
 * pairing light and dark (your edits first, each with a fix), a contrast grid for each ramp, and the colour-vision
 * previews.
 */

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-border bg-card text-card-foreground flex scroll-mt-[calc(var(--studio-bar,3.5rem)+4rem)] flex-col gap-4 rounded-xl border p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {/* Focusable, so a fix that takes its row away leaves focus somewhere that makes sense. */}
        <h2 id={`${id}-title`} tabIndex={-1} className="text-base font-semibold focus-visible:outline-none">
          {title}
        </h2>
        {note ? <p className="text-muted-foreground text-xs">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Metric({ href, label, value, note, warn }: { href: string; label: string; value: React.ReactNode; note: string; warn?: boolean }) {
  return (
    <a href={href} className="border-border bg-card text-card-foreground hover:border-muted-foreground focus-visible:ring-ring flex flex-col gap-1 rounded-xl border p-4 focus-visible:outline-none focus-visible:ring-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`text-xl font-semibold tabular-nums ${warn ? 'text-destructive' : ''}`}>{value}</span>
      <span className="text-muted-foreground text-xs">{note}</span>
    </a>
  );
}

function Summary() {
  const { theme, system } = useLiveTheme();
  const lines = contrastLines(theme);
  const failing = lines.filter(lineFails).length;
  const roles = choicesToCheck(system).map((c) => `${roleLabel(c.name)} (${c.mode})`);
  // A component variant whose own colours (Foundations › Components) fail its label on its fill.
  const variants = lines
    .filter((l) => l.component && lineFails(l) && editedSlots(system, l.component.name, l.component.variant).some((s) => s === 'fill' || s === 'label'))
    .map((l) => `${COMPONENTS[l.component!.name].label} ${VARIANT_LABELS[l.component!.variant]?.toLowerCase()}`);
  const choices = [...roles, ...variants];
  const moved = autoFixed(theme);
  const close = new Set(cvdWarnings(theme.resolved).map((w) => `${w.a}/${w.b}`)).size;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Metric
        href="#a11y-contrast"
        label="Pairings pass AA"
        value={`${lines.length - failing} of ${lines.length}`}
        note={failing ? `${failing} below, in light or dark` : 'In light and dark'}
      />
      <Metric
        href="#a11y-contrast"
        label="Your edits to check"
        value={choices.length}
        warn={choices.length > 0}
        note={choices.length ? choices.join(', ') : 'Nothing you chose fails'}
      />
      <Metric href="#a11y-contrast" label="Auto-fixed" value={moved.length} note={moved.length ? 'Generated values moved to pass' : 'Nothing needed moving'} />
      <Metric href="#a11y-vision" label="Colour vision" value="4 previews" note={close ? `${close} ${close === 1 ? 'pair' : 'pairs'} close together` : 'Every pair stays apart'} />
    </div>
  );
}

/** A ramp sample: the ratio alone on a phone (six to a row), with its grade from sm up. */
const SAMPLE = 'truncate before:content-[attr(data-ratio)] sm:before:content-[attr(data-sample)]';

/**
 * Each ramp's steps with white text and with the ramp's own 950 on them, and the ratio. The samples are drawn
 * with CSS content: they're pictures of contrast (some fail on purpose), and each step's numbers are in its text.
 */
function RampGrids() {
  const { system } = useLiveTheme();
  const ramps = rampsOf(system);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground text-xs leading-5">
        Text on every step: white on top, the ramp’s 950 below. <span className="text-foreground font-medium">AA</span> is 4.5:1 for text,{' '}
        <span className="text-foreground font-medium">AAA</span> 7:1; <span className="text-foreground font-medium">L</span> passes for large text only (3:1).
        <span className="sm:hidden"> On a phone the ratio shows alone.</span>
      </p>
      {(Object.keys(RAMP_LABELS) as (keyof typeof RAMP_LABELS)[]).map((role) => {
        const values = ramps[role].values;
        const ink = values['950'];
        return (
          <div key={role} className="flex flex-col gap-2">
            <h3 id={`a11y-ramp-${role}`} className="text-sm font-medium">
              {RAMP_LABELS[role]}
            </h3>
            <ul aria-labelledby={`a11y-ramp-${role}`} className="grid grid-cols-6 gap-1 sm:gap-1.5 md:grid-cols-11">
              {STEPS.map((step) => {
                const hex = values[step];
                const onWhite = contrast('#ffffff', hex);
                const onInk = contrast(ink, hex);
                const tag = (r: number) => ({ AAA: 'AAA', AA: 'AA', 'AA large': 'L' } as Record<string, string>)[grade(r) ?? ''] ?? '';
                const sample = (r: number) => `${ratioText(r)} ${tag(r)}`.trim();
                const words = (r: number) => `${ratioText(r)}:1, ${grade(r) ?? 'fails'}`;
                return (
                  <li key={step} className="flex min-w-0 flex-col gap-1">
                    <span
                      aria-hidden
                      className="ring-border flex h-14 flex-col justify-center gap-0.5 rounded-md px-1 text-[11px] font-semibold tabular-nums ring-1 ring-inset sm:px-1.5"
                      style={{ background: hex }}>
                      {/* eslint-disable-next-line halftone/no-raw-colour -- the white-text sample the ratio is measured against */}
                      <span data-sample={sample(onWhite)} data-ratio={ratioText(onWhite)} className={SAMPLE} style={{ color: '#ffffff' }} />
                      <span data-sample={sample(onInk)} data-ratio={ratioText(onInk)} className={SAMPLE} style={{ color: ink }} />
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {step}
                      <span className="sr-only">
                        : white text {words(onWhite)}; 950 text {words(onInk)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function AccessibilityTab() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <Summary />
      <Section id="a11y-contrast" title="Contrast">
        <ContrastTable onFixed={() => document.getElementById('a11y-contrast-title')?.focus()} />
      </Section>
      <Section id="a11y-ramps" title="Ramps" note="Every step, as text and under it">
        <RampGrids />
      </Section>
      <Section id="a11y-vision" title="Colour vision">
        <ColourVision />
      </Section>
    </div>
  );
}
