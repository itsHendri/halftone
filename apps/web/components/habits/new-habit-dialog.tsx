'use client';
import { PlusIcon } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { SegmentedControl } from '@/components/kit/segmented-control';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { habits } from './store';

const KINDS = [
  { value: 'once', label: 'Once a day' },
  { value: 'count', label: 'Count' },
] as const;

/** "New habit": a short form in a Dialog. */
export function NewHabitDialog() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [kind, setKind] = React.useState<'once' | 'count'>('once');
  const [goal, setGoal] = React.useState('8');
  const [unit, setUnit] = React.useState('times');
  const valid = name.trim().length > 1 && (kind === 'once' || Number(goal) > 0);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setName('');
      }}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon aria-hidden />
          New habit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            habits.add(name.trim(), kind === 'once' ? 1 : Number(goal), kind === 'once' ? 'session' : unit || 'times');
            toast.success(`Added ${name.trim()}`);
            setOpen(false);
            setName('');
          }}>
          <DialogHeader>
            <DialogTitle>New habit</DialogTitle>
            <DialogDescription>Something small you want to do every day.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nh-name">Habit</Label>
            <Input id="nh-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Meditate" autoFocus />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Type</span>
            <SegmentedControl aria-label="Type" segments={KINDS} value={kind} onChange={setKind} />
          </div>
          {kind === 'count' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nh-goal">Daily goal</Label>
                <Input id="nh-goal" value={goal} onChange={(e) => setGoal(e.target.value)} inputMode="numeric" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="nh-unit">Unit</Label>
                <Input id="nh-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="glasses" />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={!valid}>
              Add habit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
