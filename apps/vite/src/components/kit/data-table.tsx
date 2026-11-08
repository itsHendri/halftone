'use client';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, InboxIcon } from 'lucide-react';
import { cn } from 'cn';
import * as React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/kit/empty-state';

export type Column<Row> = {
  key: string;
  header: string;
  /** How a cell renders; defaults to the row's value at `key`. */
  cell?: (row: Row) => React.ReactNode;
  /** Sort by this value; omit to make the column unsortable. */
  sortValue?: (row: Row) => string | number;
  align?: 'left' | 'right';
};

type Props<Row> = {
  columns: Column<Row>[];
  rows: Row[];
  /** Stable key per row. */
  rowKey: (row: Row) => string;
  /** Read out by screen readers; also shown under the table. */
  caption?: string;
  emptyTitle?: string;
  className?: string;
};

/**
 * A table with sortable columns and a built-in empty state. For dashboards and settings; not a data grid
 * (no paging, editing or virtualisation in a prototype).
 */
export function DataTable<Row>({ columns, rows, rowKey, caption, emptyTitle = 'Nothing here yet', className }: Props<Row>) {
  const [sort, setSort] = React.useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const get = columns.find((c) => c.key === sort.key)?.sortValue;
    if (!get) return rows;
    const sign = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const [x, y] = [get(a), get(b)];
      return (x < y ? -1 : x > y ? 1 : 0) * sign;
    });
  }, [rows, columns, sort]);

  if (!rows.length) return <EmptyState icon={InboxIcon} title={emptyTitle} variant="compact" />;

  return (
    <div className={cn('border-border overflow-hidden rounded-xl border', className)}>
      <Table>
        {caption ? <TableCaption className="mb-3">{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              const Icon = !active ? ChevronsUpDownIcon : sort.dir === 'asc' ? ArrowUpIcon : ArrowDownIcon;
              return (
                <TableHead
                  key={c.key}
                  className={cn(c.align === 'right' && 'text-right')}
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => setSort((s) => (s?.key === c.key && s.dir === 'asc' ? { key: c.key, dir: 'desc' } : { key: c.key, dir: 'asc' }))}
                      className={cn('hover:text-foreground inline-flex items-center gap-1', c.align === 'right' && 'flex-row-reverse')}>
                      {c.header}
                      <Icon className="size-3.5" aria-hidden />
                    </button>
                  ) : (
                    c.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((c) => (
                <TableCell key={c.key} className={cn(c.align === 'right' && 'text-right tabular-nums')}>
                  {c.cell ? c.cell(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
