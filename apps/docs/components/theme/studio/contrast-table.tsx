'use client';
import { AA, AA_NON_TEXT, type ContrastRow, type Mode } from '@halftone-ds/tokens/theme';
import { CheckIcon, CircleAlertIcon, ShieldCheckIcon, StarIcon, WrenchIcon, XIcon } from 'lucide-react';
import * as React from 'react';
import { toast } from '@/components/theme/studio/toast';
import { applyFix, autoFixed, choicesIn, contrastLines, describeMoves, fixFor, lineFails, MODES, type Line } from '@/lib/studio/accessibility';
import { editedSlots, SLOT_LABELS, VARIANT_LABELS } from '@/lib/studio/components';
import { roleLabel, targetLabel } from '@/lib/studio/foundations';
import { COMPONENTS } from '@halftone-ds/tokens/theme';
import { undo, useLiveTheme } from '@/lib/theme/store';

/**
 * Every pairing the token build's contrast gate checks (the strict set: lib/contrast.mjs), in both schemes,
 * for the live theme: the WCAG ratio, pass or fail against the threshold that pairing must clear, and the
 * APCA Lc beside it. APCA is advisory: it never fails a row, the build gates on WCAG 2.1 AA alone.
 *
 * Pairings that fail because of a colour chosen by hand come first, each with a "fix" (the nearest passing step,
 * one undo away). Generated colours the build moved to pass say "auto-fixed" (wireframe 5).
 */

const MODE_LABEL: Record<Mode, string> = { light: 'Light', dark: 'Dark' };

const GROUPS = [
  { id: 'yours', title: 'Your edits to check', note: 'Below AA because of a colour you chose. The build warns and leaves it to you.' },
  { id: 'fill', title: 'Labels on fills', note: 'A fill and its own -foreground: buttons, badges, chips.' },
  { id: 'components', title: 'Components', note: 'A variant’s label on its fill, as Button, Chip, Badge and Input draw it (Foundations › Components), where it differs from the pairings above.' },
  { id: 'text', title: 'Text on surfaces', note: 'Body and muted text on the page, cards and muted panels.' },
  { id: 'ink', title: 'Tones as text', note: 'A tone used as ink: links, status text, coloured icons.' },
  { id: 'icon', title: 'Icons on tints', note: 'A tone’s icon on its own tint, as Alert and IconCircle draw it.' },
] as const;
type Group = (typeof GROUPS)[number]['id'];

const groupOf = (l: Line): Group =>
  l.component ? 'components' : l.fgName === 'foreground' || l.fgName === 'muted-foreground' ? 'text' : l.fgName === `${l.bgName}-foreground` ? 'fill' : l.threshold < AA ? 'icon' : 'ink';

/** APCA's rough guidance, for the Lc column's word. Advisory, never a verdict. */
const APCA_USE = [
  [75, 'body text'],
  [60, 'content text'],
  [45, 'large text'],
  [30, 'non-text'],
] as const;
const apcaUse = (lc: number) => APCA_USE.find(([min]) => Math.abs(lc) >= min)?.[1] ?? 'too low';

/** A row that stacks in a narrow panel: two columns, light and dark, under a full-width pairing. */
const STACK = '@max-xl:grid @max-xl:grid-cols-2';

export function ContrastTable({ onFixed }: { onFixed?: () => void }) {
  const { theme, system } = useLiveTheme();
  const lines = contrastLines(theme);
  const adjusted = React.useMemo(() => new Set(theme.adjustments.map((a) => `${a.mode}:${a.token}`)), [theme.adjustments]);
  const failing = lines.filter(lineFails);
  const yours = (l: Line) =>
    lineFails(l) && (l.component ? editedSlots(system, l.component.name, l.component.variant).some((s) => s === 'fill' || s === 'label') : choicesIn(system, l.label).length > 0);
  const moved = autoFixed(theme);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2 text-sm font-medium" role="status">
            {failing.length ? (
              <CircleAlertIcon className="text-destructive size-4 shrink-0" aria-hidden />
            ) : (
              <ShieldCheckIcon className="text-success size-4 shrink-0" aria-hidden />
            )}
            {failing.length
              ? `${failing.length} of ${lines.length} pairings fail WCAG AA in light or dark`
              : `All ${lines.length} pairings pass WCAG AA in light and dark`}
          </p>
          <p className="text-muted-foreground text-xs leading-5">
            Text needs {AA}:1, icons {AA_NON_TEXT}:1. The build checks exactly these pairings and warns on any below (fails with --strict).
            {moved.length ? ' A shield marks a colour the build moved to get there.' : ''}
          </p>
        </div>
        <p className="text-muted-foreground max-w-xs text-xs leading-5 sm:text-right">
          <span className="text-foreground font-medium">APCA Lc</span> is shown for reference only and never fails a pairing. Roughly 75 for body text,
          60 for other text, 45 for large text, 30 for icons.
        </p>
      </div>

      {/*
        Below 36rem of panel (a phone, or the preview squeezed by the rail) each row stacks: the pairing on
        its own line, light and dark side by side under it. The explicit roles keep it a table to a screen
        reader once the display changes.
      */}
      <div className="border-border @container overflow-hidden rounded-lg border">
        <table role="table" className="w-full table-fixed border-collapse text-left text-sm @max-xl:block">
          <caption className="sr-only">Contrast of every pairing the build checks, light and dark: WCAG ratio, pass or fail, and APCA Lc; your edits to check first</caption>
          <colgroup className="@max-xl:hidden">
            <col />
            <col className="w-40" />
            <col className="w-40" />
            <col className="w-44" />
          </colgroup>
          <thead role="rowgroup" className="bg-muted text-muted-foreground text-xs @max-xl:block">
            <tr role="row" className={STACK}>
              <th role="columnheader" scope="col" className="px-3 py-2 font-medium @max-xl:sr-only">
                Pairing
              </th>
              {MODES.map((m) => (
                <th key={m} role="columnheader" scope="col" className="px-3 py-2 font-medium">
                  {MODE_LABEL[m]}
                </th>
              ))}
              <th role="columnheader" scope="col" className="px-3 py-2 font-medium @max-xl:sr-only">
                Status
              </th>
            </tr>
          </thead>
          {GROUPS.map((g) => {
            const list = lines.filter((l) => (yours(l) ? 'yours' : groupOf(l)) === g.id);
            if (!list.length) return null;
            return (
              <tbody key={g.id} role="rowgroup" className="border-border border-t @max-xl:block">
                <tr role="row" className="@max-xl:block">
                  <th role="rowheader" scope="rowgroup" colSpan={4} className="bg-muted-subtle px-3 pb-1.5 pt-3 font-normal @max-xl:block">
                    <span className="block text-xs font-semibold">{g.title}</span>
                    <span className="text-muted-foreground block text-xs">{g.note}</span>
                  </th>
                </tr>
                {list.map((l) => (
                  <tr key={l.label} role="row" className={`border-border border-t ${STACK}`}>
                    <th role="rowheader" scope="row" className="px-3 py-2 align-top font-normal @max-xl:col-span-2 @max-xl:pb-0">
                      {l.component ? <span className="block text-xs font-medium">{COMPONENTS[l.component.name].label} {VARIANT_LABELS[l.component.variant]?.toLowerCase()}</span> : null}
                      <span className="font-mono text-xs [overflow-wrap:anywhere] @xl:block">{l.fgName}</span>{' '}
                      <span className="text-muted-foreground font-mono text-xs [overflow-wrap:anywhere] @xl:block">on {l.bgName}</span>
                      <span className="text-muted-foreground block text-[11px] @xl:mt-0.5">min {l.threshold}:1</span>
                    </th>
                    {MODES.map((m) => {
                      const r = l.modes[m];
                      return (
                        <td key={m} role="cell" className="px-3 py-2 align-top">
                          {r ? <ModeCell row={r} icon={l.threshold < AA} moved={adjusted.has(`${m}:${l.fgName}`) || adjusted.has(`${m}:${l.bgName}`)} /> : <span className="text-muted-foreground">—</span>}
                        </td>
                      );
                    })}
                    <td role="cell" className="px-3 py-2 align-top @max-xl:col-span-2 @max-xl:pt-0 @max-xl:empty:hidden">
                      {yours(l) ? (
                        <FixCell line={l} onFixed={onFixed} />
                      ) : MODES.some((m) => adjusted.has(`${m}:${l.fgName}`) || adjusted.has(`${m}:${l.bgName}`)) ? (
                        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                          <ShieldCheckIcon className="size-3.5 shrink-0" aria-hidden />
                          auto-fixed
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      </div>

      {moved.length ? (
        <details className="group text-sm">
          <summary className="text-muted-foreground hover:text-foreground focus-visible:ring-ring w-fit cursor-pointer rounded text-xs focus-visible:outline-none focus-visible:ring-2">
            {moved.length} generated {moved.length === 1 ? 'value was' : 'values were'} auto-fixed to pass
          </summary>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {moved.map((a) => (
              <li key={`${a.mode}:${a.token}`} className="flex items-center gap-2 text-xs">
                <span className="flex shrink-0" aria-hidden>
                  <span className="ring-border size-4 rounded-l ring-1" style={{ background: a.from }} />
                  <span className="ring-border size-4 rounded-r ring-1" style={{ background: a.to }} />
                </span>
                <span className="font-mono">{a.token}</span>
                <span className="text-muted-foreground">
                  {a.mode}: <span className="font-mono uppercase">{a.from}</span> → <span className="font-mono uppercase">{a.to}</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function ModeCell({ row, icon, moved }: { row: ContrastRow; icon: boolean; moved: boolean }) {
  const lc = Math.round(Math.abs(row.apca));
  return (
    <div className="flex items-start gap-2">
      {/* The pair itself, in its literal colours, so it reads the same on a light or a dark page. */}
      <span
        className="ring-border inline-flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold ring-1"
        style={{ background: row.bg, color: row.fg }}
        aria-hidden>
        {icon ? <StarIcon className="size-4" strokeWidth={2.25} /> : 'Aa'}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-1 tabular-nums">
          <span className="font-medium">{row.ratio.toFixed(2)}</span>
          {row.pass ? (
            <CheckIcon className="text-success size-3.5 shrink-0" strokeWidth={2.5} aria-label={`passes ${row.threshold}:1`} role="img" />
          ) : (
            <XIcon className="text-destructive size-3.5 shrink-0" strokeWidth={2.5} aria-label={`fails ${row.threshold}:1`} role="img" />
          )}
          {moved ? <ShieldCheckIcon className="text-muted-foreground size-3.5 shrink-0" aria-label="adjusted by the build" role="img" /> : null}
        </span>
        <span className="text-muted-foreground text-xs tabular-nums" title={`APCA Lc ${row.apca.toFixed(1)}: ${apcaUse(row.apca)} (advisory)`}>
          Lc {lc}
          <span className="@max-xl:sr-only"> · {apcaUse(row.apca)}</span>
        </span>
      </span>
    </div>
  );
}

/** "fix · your edit": the nearest passing step for the colour you chose, as one undoable edit. */
function FixCell({ line, onFixed }: { line: Line; onFixed?: () => void }) {
  const { system } = useLiveTheme();
  if (line.component) {
    const { name, variant } = line.component;
    // Input's placeholder pairing: the placeholder role is its label; the fill is the default state's.
    const slots = editedSlots(system, name, variant).map((s) => (variant === 'placeholder' ? (s === 'label' ? 'role' : 'default fill') : SLOT_LABELS[s].toLowerCase()));
    return (
      <span className="flex flex-col items-start gap-0.5 text-xs">
        <span className="text-muted-foreground">Pick another {variant === 'placeholder' ? 'placeholder' : 'fill or label'} role in Foundations › Components.</span>
        <span className="text-muted-foreground">
          edited: {COMPONENTS[name].label} {VARIANT_LABELS[variant]?.toLowerCase()} {slots.join(', ')}
        </span>
      </span>
    );
  }
  const choices = choicesIn(system, line.label);
  const moves = fixFor(system, line.label);
  const yours = choices.map((c) => `${roleLabel(c.name)} (${c.mode})`).join(', ');
  return (
    <span className="flex flex-col items-start gap-0.5 text-xs">
      {moves ? (
        <button
          type="button"
          onClick={() => {
            applyFix(moves);
            toast(`Moved ${describeMoves(moves)}.`, { label: 'Undo', run: undo });
            onFixed?.();
          }}
          aria-label={`Fix ${line.label}: move ${describeMoves(moves)}`}
          title={`Move ${describeMoves(moves)}`}
          // Not text-primary: the Studio wears the system being checked, and the primary may be what fails.
          className="text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2">
          <WrenchIcon className="size-3.5 shrink-0" aria-hidden />
          <span className="underline underline-offset-2">fix</span>
          <span className="text-muted-foreground font-normal">→ {moves.map((m) => targetLabel(m.to)).join(', ')}</span>
        </button>
      ) : (
        <span className="text-muted-foreground">No step on its ramp passes: pick one by hand.</span>
      )}
      <span className="text-muted-foreground">edited: {yours}</span>
    </span>
  );
}
