'use client';
import * as React from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/kit/page-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Settings: the forms pattern (a Label per field, errors beside the field) and a guarded destructive action. */
export function SettingsView() {
  const id = React.useId();
  const [name, setName] = React.useState('Northwind Studio');
  const [email, setEmail] = React.useState('billing@northwind.co');
  const [errors, setErrors] = React.useState<{ name?: string; email?: string }>({});
  const [autoRemind, setAutoRemind] = React.useState(true);
  const [digest, setDigest] = React.useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      name: name.trim() ? undefined : 'Enter your business name.',
      email: EMAIL.test(email.trim()) ? undefined : 'Enter an email address like billing@studio.co.',
    };
    setErrors(next);
    if (next.name || next.email) return;
    toast.success('Business details saved');
  };

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader title="Settings" description="Your studio’s details and how Northwind chases payments." />

      <Card>
        <form onSubmit={save} noValidate className="flex flex-col gap-6">
          <CardHeader>
            <CardTitle>Business details</CardTitle>
            <CardDescription>Shown on every invoice you send.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field id={`${id}-name`} label="Business name" error={errors.name}>
              <Input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${id}-name-error` : undefined} />
            </Field>
            <Field id={`${id}-email`} label="Billing email" error={errors.email}>
              <Input
                id={`${id}-email`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? `${id}-email-error` : undefined}
              />
            </Field>
            <Field id={`${id}-currency`} label="Currency">
              <Select defaultValue="gbp">
                <SelectTrigger id={`${id}-currency`} className="w-full sm:w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gbp">GBP · Pound sterling</SelectItem>
                  <SelectItem value="eur">EUR · Euro</SelectItem>
                  <SelectItem value="usd">USD · US dollar</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit">Save details</Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminders</CardTitle>
          <CardDescription>Northwind emails customers for you when an invoice is late.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${id}-auto`}>Send reminders automatically</Label>
              <p className="text-muted-foreground text-sm">Off means you approve each one.</p>
            </div>
            <Switch
              id={`${id}-auto`}
              checked={autoRemind}
              onCheckedChange={(v) => {
                setAutoRemind(v);
                toast(v ? 'Reminders will go out automatically' : 'You’ll approve each reminder');
              }}
            />
          </div>
          <fieldset className="flex flex-col gap-3" disabled={!autoRemind}>
            <legend className="mb-3 text-sm font-medium">First reminder</legend>
            <RadioGroup defaultValue="3" className="gap-3">
              {[
                ['1', 'The day after it’s due'],
                ['3', 'Three days after'],
                ['7', 'A week after'],
              ].map(([value, label]) => (
                <div key={value} className="flex items-center gap-3">
                  <RadioGroupItem value={value} id={`${id}-first-${value}`} />
                  <Label htmlFor={`${id}-first-${value}`} className="font-normal">
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
          <div className="flex items-center gap-3">
            <Checkbox id={`${id}-digest`} checked={digest} onCheckedChange={(v) => setDigest(v === true)} />
            <Label htmlFor={`${id}-digest`} className="font-normal">
              Email me a weekly summary of what’s outstanding
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive-border">
        <CardHeader>
          <CardTitle>Delete workspace</CardTitle>
          <CardDescription>Removes every invoice, customer and teammate. This can’t be undone.</CardDescription>
        </CardHeader>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete workspace</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Northwind Studio?</AlertDialogTitle>
                <AlertDialogDescription>
                  All 10 invoices and 7 customers go with it, and your teammates lose access. You can’t undo this.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep workspace</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => toast('This is a prototype: nothing was deleted')}>
                  Delete workspace
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
