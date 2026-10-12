'use client';
import * as React from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { SegmentedControl } from '@/components/kit/segmented-control';
import { StatTile } from '@/components/kit/stat-tile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BY_CATEGORY, COMPLETION_30D, WEEK } from './data';

const RANGES = [
  { value: 'w', label: 'Week' },
  { value: 'm', label: 'Month' },
] as const;

const doneConfig = { done: { label: 'Habits done', color: 'var(--chart-1)' } } satisfies ChartConfig;
const rateConfig = { rate: { label: 'Completion', color: 'var(--chart-1)' } } satisfies ChartConfig;
const categoryConfig = {
  value: { label: 'Share' },
  health: { label: 'Health', color: 'var(--chart-1)' },
  mind: { label: 'Mind', color: 'var(--chart-2)' },
  movement: { label: 'Movement', color: 'var(--chart-3)' },
} satisfies ChartConfig;

export function InsightsView() {
  const [range, setRange] = React.useState<'w' | 'm'>('w');
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <SegmentedControl aria-label="Range" segments={RANGES} value={range} onChange={setRange} className="w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Completion" value={range === 'w' ? '74%' : '82%'} delta={range === 'w' ? -3 : 4} deltaLabel={range === 'w' ? 'vs last week' : 'vs last month'} />
        <StatTile label="Habits done" value={range === 'w' ? '26' : '118'} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{range === 'w' ? 'Habits done per day' : 'Completion rate'}</CardTitle>
            <CardDescription>{range === 'w' ? 'This week' : 'Last 30 days'}</CardDescription>
          </CardHeader>
          <CardContent>
            {range === 'w' ? (
              <ChartContainer config={doneConfig} className="h-56 w-full">
                <BarChart accessibilityLayer data={WEEK}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="done" fill="var(--color-done)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <ChartContainer config={rateConfig} className="h-56 w-full">
                <AreaChart accessibilityLayer data={COMPLETION_30D}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} interval={4} />
                  <YAxis domain={[0, 100]} hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="rate" type="monotone" stroke="var(--color-rate)" fill="var(--color-rate)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
            <CardDescription>Share of habits done</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryConfig} className="mx-auto aspect-square h-56">
              <PieChart accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent nameKey="category" hideLabel />} />
                <Pie data={BY_CATEGORY} dataKey="value" nameKey="category" innerRadius={56} strokeWidth={4}>
                  {BY_CATEGORY.map((c) => (
                    <Cell key={c.category} fill={`var(--color-${c.category})`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="category" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
