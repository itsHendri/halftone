'use client';
import { toast } from 'sonner';
import { ApprovalCard } from '@/components/kit/approval-card';
import { StatTile } from '@/components/kit/stat-tile';

/** The hero's "product shot": the real components, so it follows the theme and stays honest. */
export function ProductShot() {
  return (
    <div className="bg-muted-subtle border-border flex flex-col gap-4 rounded-2xl border p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Paid this month" value="£9,800" delta={12.4} deltaLabel="vs May" />
        <StatTile label="Overdue" value="£4,410" delta={-21} deltaLabel="vs May" invert />
      </div>
      <ApprovalCard
        title="Send 3 reminder emails"
        description="Polite nudges to the customers whose invoices are late."
        details={[
          { label: 'To', value: 'Lumen Labs, Acme Studio, Fernway' },
          { label: 'Total due', value: '£4,410' },
        ]}
        approveLabel="Send reminders"
        onApprove={() => toast.success('Reminders sent', { description: 'This is the landing page, so nothing really went out.' })}
        onDeny={() => toast('Nothing was sent')}
      />
    </div>
  );
}
