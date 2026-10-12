import { cn } from 'cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type KeyValueRow = { label: string; value: string; valueClassName?: string };
type ListProps = { rows: KeyValueRow[]; className?: string };

/** Label and value rows (order summaries, details). */
export function KeyValueList({ rows, className }: ListProps) {
  return (
    <dl className={cn('flex flex-col gap-3', className)}>
      {rows.map((r, i) => (
        <div key={`${r.label}-${i}`} className="flex items-start justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className={cn('text-right font-medium', r.valueClassName)}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** KeyValueList inside a Card: confirmations, receipts, loan details. */
export function SummaryCard({ title, rows, className }: ListProps & { title?: string }) {
  return (
    <Card className={cn('w-full gap-4 py-4', className)}>
      {title ? (
        <CardHeader className="px-4">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="px-4">
        <KeyValueList rows={rows} />
      </CardContent>
    </Card>
  );
}
