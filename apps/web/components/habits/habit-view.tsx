'use client';
import { ChevronLeftIcon, MoreHorizontalIcon, Share2Icon, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { ProgressRing } from '@/components/kit/progress-ring';
import { QuantityStepper } from '@/components/kit/quantity-stepper';
import { StatTile } from '@/components/kit/stat-tile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer } from '@/components/ui/chart';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { COMPLETION_30D, isDone } from './data';
import { habits, useHabits } from './store';

const TONE_VAR = { primary: 'var(--primary)', success: 'var(--success)', warning: 'var(--warning)', info: 'var(--info)' } as const;

/** One habit: today's count, its streak and history, its reminder and goal. `?id=` picks it. */
export function HabitView() {
  const id = useSearchParams().get('id');
  const router = useRouter();
  const list = useHabits();
  const h = list.find((x) => x.id === id) ?? list[0];
  if (!h) return null;
  const pct = Math.round((h.today / h.goal) * 100);
  const config = { rate: { label: 'Completion', color: TONE_VAR[h.tone] } } satisfies ChartConfig;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href="/habits">
          <ChevronLeftIcon aria-hidden />
          Today
        </Link>
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="type-h3">{h.name}</h1>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More actions">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => toast.success('Progress shared')}>
                <Share2Icon aria-hidden />
                Share progress
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  const undo = habits.remove(h.id);
                  toast(`Deleted ${h.name}`, { action: { label: 'Undo', onClick: undo } });
                  router.push('/habits');
                }}>
                <Trash2Icon aria-hidden />
                Delete habit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => {
              habits.toggleDone(h.id);
              toast.success(isDone(h) ? 'Marked as not done' : 'Nice, done for today');
            }}>
            {isDone(h) ? 'Undo' : 'Mark done'}
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
        <Card className="items-center justify-center gap-3 p-6">
          <ProgressRing value={pct} size={120} strokeWidth={10} tone={h.tone} aria-label={`${h.name} today`}>
            <span className="flex flex-col items-center">
              <span className="text-2xl font-bold">{h.today}</span>
              <span className="text-muted-foreground text-xs">of {h.goal}</span>
            </span>
          </ProgressRing>
          <p className="text-muted-foreground">{isDone(h) ? 'Done for today' : `${h.goal - h.today} ${h.unit} to go`}</p>
          <QuantityStepper aria-label={h.unit} value={h.today} onChange={(v) => habits.setToday(h.id, v)} min={0} max={h.goal} />
        </Card>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <StatTile label="Streak" value={`${h.streak} days`} />
            <StatTile label="30-day rate" value="82%" delta={4} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Last 30 days</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={config} className="aspect-auto h-32 w-full">
                <AreaChart accessibilityLayer data={COMPLETION_30D}>
                  <XAxis dataKey="day" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Area dataKey="rate" type="monotone" stroke="var(--color-rate)" fill="var(--color-rate)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className="gap-5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="habit-reminder">Reminder</Label>
            <p className="text-muted-foreground text-sm">Daily at 8:00</p>
          </div>
          <Switch id="habit-reminder" checked={h.reminder} onCheckedChange={(v) => habits.setReminder(h.id, v)} />
        </div>
        {h.goal > 1 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="habit-goal">Daily goal</Label>
              <span className="text-muted-foreground text-sm">
                {h.goal} {h.unit}
              </span>
            </div>
            <Slider id="habit-goal" aria-label="Daily goal" value={[h.goal]} onValueChange={([v]) => habits.setGoal(h.id, v)} min={1} max={30} step={1} />
          </div>
        ) : null}
      </Card>
    </>
  );
}
