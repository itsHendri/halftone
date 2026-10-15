'use client';
import { AA, AA_NON_TEXT, contrastReport, type ContrastRow, type Mode } from '@halftone-ds/tokens/theme';
import { CheckIcon, CircleAlertIcon, ShieldCheckIcon, StarIcon, XIcon } from 'lucide-react';
import * as React from 'react';
import { useLiveTheme } from '@/lib/theme/store';

/**
 * Every pairing the token build's contrast gate checks (the strict set: lib/contrast.mjs), in both schemes,
 * for the live theme: the WCAG ratio, pass or fail against the threshold that pairing must clear, and the
 * APCA Lc beside it. APCA is advisory: it never fails a row, the build gates on WCAG 2.1 AA alone.
 */

const MODES: Mode[] = ['light', 'dark'];
const MODE_LABEL: Record<Mode, string> = { light: 'Light', dark: 'Dark' };

const GROUPS = [
  { id: 'fill', title: 'Labels on fills', note: 'A fill and its own -foreground: buttons, badges, chips.' },
  { id: 'text', title: 'Text on surfaces', note: 'Body and muted text on the page, cards and muted panels.' },
  { id: 'ink', title: 'Tones as text', note: 'A tone used as ink: links, status text, coloured icons.' },
  { id: 'icon', title: 'Icons on tints', note: 'A tone’s icon on its own tint, as Alert and IconCircle draw it.' },
] as const;
type Group = (typeof GROUPS)[number]['id'];

const groupOf = (r: ContrastRow): Group =>
  r.fgName === 'foreground' || r.fgName === 'muted-foreground' ? 'text' : r.fgName === `${r.bgName}-foreground` ? 'fill' : r.threshold < AA ? 'icon' : 'ink';

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

type Line = { label: string; fgName: string; bgName: string; threshold: number; group: Group; modes: Partial<Record<Mode, ContrastRow>> };

export function ContrastTable() {
  const { theme } = useLiveTheme();
  // `muted-foreground on muted` is both a fill label and body text to the gate: count it once.
  const rows = React.useMemo(() => {
    const seen = new Set<string>();
    return contrastReport(theme.resolved).filter((r) => !seen.has(`${r.mode}:${r.label}`) && !!seen.add(`${r.mode}:${r.label}`));
  }, [theme.resolved]);
  // One line per pairing, light and dark side by side.
  const lines = React.useMemo(() => {
    const byLabel = new Map<string, Line>();
    for (const r of rows) {
      const line = byLabel.get(r.label) ?? { label: r.label, fgName: r.fgName, bgName: r.bgName, threshold: r.threshold, group: groupOf(r), modes: {} };
      line.modes[r.mode] = r;
      byLabel.set(r.label, line);
    }
    return [...byLabel.values()];
  }, [rows]);
  const adjusted = React.useMemo(() => new Set(theme.adjustments.map((a) => `${a.mode}:${a.token}`)), [theme.adjustments]);
  const failing = rows.filter((r) => !r.pass);

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
              ? `${failing.length} of ${rows.length} pairings fail WCAG AA`
              : `All ${lines.length} pairings pass WCAG AA in light and dark`}
          </p>
          <p className="text-muted-foreground text-xs leading-5">
            Text needs {AA}:1, icons {AA_NON_TEXT}:1. The build checks exactly these pairings and fails on any below.
            {theme.adjustments.length ? ' A shield marks a colour the build moved to get there.' : ''}
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
          <caption className="sr-only">Contrast of every pairing the build checks, light and dark: WCAG ratio, pass or fail, and APCA Lc</caption>
          <colgroup className="@max-xl:hidden">
            <col />
            <col className="w-44" />
            <col className="w-44" />
          </colgroup>
          <thead role="rowgroup" className="bg-muted/60 text-muted-foreground text-xs @max-xl:block">
            <tr role="row" className={STACK}>
              <th role="columnheader" scope="col" className="px-3 py-2 font-medium @max-xl:sr-only">
                Pairing
              </th>
              {MODES.map((m) => (
                <th key={m} role="columnheader" scope="col" className="px-3 py-2 font-medium">
                  {MODE_LABEL[m]}
                </th>
              ))}
            </tr>
          </thead>
          {GROUPS.map((g) => {
            const list = lines.filter((l) => l.group === g.id);
            if (!list.length) return null;
            return (
              <tbody key={g.id} role="rowgroup" className="border-border border-t @max-xl:block">
                <tr role="row" className="@max-xl:block">
                  <th role="rowheader" scope="rowgroup" colSpan={3} className="bg-muted/30 px-3 pb-1.5 pt-3 font-normal @max-xl:block">
                    <span className="block text-xs font-semibold">{g.title}</span>
                    <span className="text-muted-foreground block text-xs">{g.note}</span>
                  </th>
                </tr>
                {list.map((l) => (
                  <tr key={l.label} role="row" className={`border-border border-t ${STACK}`}>
                    <th role="rowheader" scope="row" className="px-3 py-2 align-top font-normal @max-xl:col-span-2 @max-xl:pb-0">
                      <span className="font-mono text-xs [overflow-wrap:anywhere] @xl:block">{l.fgName}</span>{' '}
                      <span className="text-muted-foreground font-mono text-xs [overflow-wrap:anywhere] @xl:block">on {l.bgName}</span>
                      <span className="text-muted-foreground block text-[11px] @xl:mt-0.5">min {l.threshold}:1</span>
                    </th>
                    {MODES.map((m) => {
                      const r = l.modes[m];
                      return (
                        <td key={m} role="cell" className="px-3 py-2 align-top">
                          {r ? <ModeCell row={r} icon={l.group === 'icon'} moved={adjusted.has(`${m}:${l.fgName}`) || adjusted.has(`${m}:${l.bgName}`)} /> : <span className="text-muted-foreground">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      </div>
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
