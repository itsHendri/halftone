'use client';
import { BellIcon, CalendarIcon, MoonIcon } from 'lucide-react';
import * as React from 'react';
import { IconCircle } from '@/components/kit/icon-circle';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export function SettingsView() {
  const [reminders, setReminders] = React.useState(true);
  const [quiet, setQuiet] = React.useState(false);
  const [start, setStart] = React.useState('mon');
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <ListGroup title="Preferences" footnote="Reminders go to this browser. Quiet hours hold them until morning.">
        <ListRow leading={<IconCircle as={BellIcon} />} title="Reminders" subtitle="Daily nudges for unfinished habits" trailing={<Switch aria-label="Reminders" checked={reminders} onCheckedChange={setReminders} />} />
        <ListRow leading={<IconCircle as={MoonIcon} />} title="Quiet hours" subtitle="No reminders after 21:00" trailing={<Switch aria-label="Quiet hours" checked={quiet} onCheckedChange={setQuiet} />} />
        <ListRow
          leading={<IconCircle as={CalendarIcon} />}
          title="Week starts on"
          trailing={
            <Select value={start} onValueChange={setStart}>
              <SelectTrigger aria-label="Week starts on" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="mon">Monday</SelectItem>
                <SelectItem value="sun">Sunday</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </ListGroup>
    </>
  );
}
