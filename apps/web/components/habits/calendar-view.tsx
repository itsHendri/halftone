'use client';
import * as React from 'react';
import { StatusDot } from '@/components/kit/status-dot';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { COMPLETED_DAYS } from './data';

export function CalendarView() {
  // Set after mount: the server and the browser can disagree on "today" (AGENTS.md › Gotchas).
  const [day, setDay] = React.useState<Date | undefined>();
  const [month, setMonth] = React.useState<Date | undefined>();
  React.useEffect(() => {
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-off after mount, for hydration
    setDay(now);
    setMonth(now);
  }, []);
  const perfect = (d: Date) => !!month && d.getMonth() === month.getMonth() && COMPLETED_DAYS.includes(d.getDate());
  const complete = day ? perfect(day) : false;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
      <div className="grid items-start gap-4 md:grid-cols-[auto_1fr]">
        <Card className="items-center p-3">
          <Calendar
            mode="single"
            selected={day}
            onSelect={setDay}
            month={month}
            onMonthChange={setMonth}
            modifiers={{ perfect }}
            modifiersClassNames={{ perfect: '[&>button]:underline [&>button]:decoration-success [&>button]:decoration-2 [&>button]:underline-offset-4' }}
          />
        </Card>
        <div className="flex flex-col gap-4">
          {day ? (
            <Card className="flex-row items-center gap-3 p-4">
              <StatusDot tone={complete ? 'success' : 'muted'} size="lg" />
              <div>
                <p className="font-medium">{day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <p className="text-muted-foreground text-sm">{complete ? 'All habits completed' : 'Some habits missed'}</p>
              </div>
            </Card>
          ) : null}
          <p className="text-muted-foreground text-sm">{COMPLETED_DAYS.length} perfect days this month, underlined in the calendar.</p>
        </div>
      </div>
    </>
  );
}
