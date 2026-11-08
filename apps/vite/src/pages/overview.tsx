import { ArrowRightIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import type { Stats } from '../../shared/api';
import { LoadState } from '@/components/load-state';
import { PageHeader } from '@/components/kit/page-header';
import { StatTile } from '@/components/kit/stat-tile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useApi } from '@/lib/api';

const chartConfig = {
  opened: { label: 'Opened', color: 'var(--chart-1)' },
  closed: { label: 'Closed', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function Overview() {
  const { data, error, loading, retry } = useApi<Stats>('/api/stats');

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Overview"
        description="This week across your projects."
        actions={
          <Button asChild variant="outline">
            <Link to="/projects">
              All projects <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
        }
      />
      {loading || !data ? (
        <LoadState error={error} retry={retry} what="the overview" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.tiles.map((tile) => (
              <StatTile key={tile.label} {...tile} />
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Tasks opened and closed</CardTitle>
              <CardDescription>Monday to Friday</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
                <BarChart accessibilityLayer data={data.activity}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="opened" fill="var(--color-opened)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="closed" fill="var(--color-closed)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
