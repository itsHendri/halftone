import { STATUS_TONE, type InvoiceStatus } from '@/components/northwind/store';
import { StatusDot } from '@/components/kit/status-dot';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';

/** An invoice's status: an outline Badge with a coloured dot, the word in foreground text. */
export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <StatusDot tone={STATUS_TONE[status]} size="sm" />
      <Text>{status}</Text>
    </Badge>
  );
}
