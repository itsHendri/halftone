'use client';
import { ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { ProgressRing } from '@/components/kit/progress-ring';
import { StatTile } from '@/components/kit/stat-tile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { isDone, progressLine } from './data';
import { NewHabitDialog } from './new-habit-dialog';
import { habits, useHabits } from './store';

export function TodayView() {
  const list = useHabits();
  const done = list.filter(isDone).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;
  const best = Math.max(0, ...list.map((h) => h.streak));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <NewHabitDialog />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
        <Card className="col-span-2 flex-row items-center gap-5 p-5 md:col-span-1">
          <ProgressRing value={pct} size={88} strokeWidth={8} aria-label="Today's habits">
            <span className="text-xl font-bold">{pct}%</span>
          </ProgressRing>
          <div className="flex flex-col gap-1">
            <p className="text-xl font-semibold">
              {done} of {list.length} done
            </p>
            <p className="text-muted-foreground">{done === list.length ? 'All habits complete. Nice.' : `${list.length - done} to go today.`}</p>
          </div>
        </Card>
        <StatTile label="Best streak" value={`${best} days`} />
        <StatTile label="This week" value="26 / 35" delta={8} deltaLabel="vs last week" />
      </div>
      <ListGroup title="Habits">
        {list.map((h) => (
          <ListRow
            key={h.id}
            leading={<Checkbox checked={isDone(h)} onCheckedChange={() => habits.toggleDone(h.id)} aria-label={`Mark ${h.name} done`} />}
            title={h.name}
            subtitle={progressLine(h)}
            // Not an href on the row: the checkbox would sit inside a link. The chevron is the way in.
            trailing={
              <Button asChild variant="ghost" size="icon" aria-label={`Open ${h.name}`}>
                <Link href={`/habits/habit?id=${h.id}`}>
                  <ChevronRightIcon className="text-muted-foreground" />
                </Link>
              </Button>
            }
          />
        ))}
      </ListGroup>
    </>
  );
}
