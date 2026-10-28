'use client';
import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { InvoiceTable } from '@/components/dashboard/invoice-table';
import { MONTHLY, money } from '@/components/dashboard/data';
import { useInvoices } from '@/components/dashboard/store';
import { PageHeader } from '@/components/kit/page-header';
import { StatTile } from '@/components/kit/stat-tile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  paid: { label: 'Paid', color: 'var(--chart-1)' },
  outstanding: { label: 'Outstanding', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const sum = (xs: { amount: number }[]) => xs.reduce((n, x) => n + x.amount, 0);

export default function Overview() {
  const invoices = useInvoices();
  const open = invoices.filter((i) => i.status === 'Due' || i.status === 'Overdue');
  const overdue = invoices.filter((i) => i.status === 'Overdue');

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Overview"
        description="June 2026 · how your studio is getting paid."
        actions={
          <Button asChild>
            <Link href="/dashboard/invoices?new=1">
              <PlusIcon aria-hidden />
              New invoice
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Outstanding" value={money(sum(open))} delta={18.2} deltaLabel="vs May" invert />
        <StatTile label="Overdue" value={money(sum(overdue))} delta={42} deltaLabel="vs May" invert />
        <StatTile label="Paid this month" value={money(9800)} delta={-17.6} deltaLabel="vs May" />
        <StatTile label="Average days to pay" value="19" delta={-8} deltaLabel="vs May" invert />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paid and outstanding</CardTitle>
          <CardDescription>By month invoiced, January to June</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <BarChart accessibilityLayer data={MONTHLY}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="paid" stackId="a" fill="var(--color-paid)" />
              <Bar dataKey="outstanding" stackId="a" fill="var(--color-outstanding)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <section aria-labelledby="recent" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 id="recent" className="type-large">
            Recent invoices
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/invoices">
              View all <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
        </div>
        <InvoiceTable rows={invoices.slice(0, 5)} />
      </section>
    </div>
  );
}
