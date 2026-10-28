'use client';
import { CircleAlertIcon, InboxIcon, PlusIcon } from 'lucide-react';
import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { toast } from 'sonner';
import { ApprovalCard } from '@/components/kit/approval-card';
import { ChatComposer } from '@/components/kit/chat-composer';
import { ChatMessage } from '@/components/kit/chat-message';
import { DataTable } from '@/components/kit/data-table';
import { EmptyState } from '@/components/kit/empty-state';
import { PricingCard } from '@/components/kit/pricing-card';
import { Prose } from '@/components/kit/prose';
import { StatTile } from '@/components/kit/stat-tile';
import { ToolCallCard } from '@/components/kit/tool-call-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { faqs, invoices, money, revenue, team, type Invoice } from '@/components/showcase/data';

const chartConfig = {
  paid: { label: 'Paid', color: 'var(--chart-1)' },
  outstanding: { label: 'Outstanding', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const STATUS: Record<Invoice['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Paid: 'secondary',
  Overdue: 'destructive',
  Draft: 'outline',
};

function RevenueCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paid and outstanding</CardTitle>
        <CardDescription>January to June</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
          <BarChart accessibilityLayer data={revenue}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="paid" stackId="a" fill="var(--color-paid)" />
            <Bar dataKey="outstanding" stackId="a" fill="var(--color-outstanding)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function NewInvoiceCard() {
  const [terms, setTerms] = React.useState('14');
  return (
    <Card>
      <CardHeader>
        <CardTitle>New invoice</CardTitle>
        <CardDescription>Bill a client for finished work.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="details">
          <TabsList className="w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="showcase-client">Client</Label>
              <Input id="showcase-client" defaultValue="Lumen Labs" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="showcase-terms">Payment terms</Label>
              <Select value={terms} onValueChange={setTerms}>
                <SelectTrigger id="showcase-terms" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="showcase-reminders">Send reminders</Label>
              <Switch id="showcase-reminders" defaultChecked />
            </div>
          </TabsContent>
          <TabsContent value="payment" className="flex flex-col gap-2 pt-2">
            <Label htmlFor="showcase-amount">Amount</Label>
            <Input id="showcase-amount" defaultValue="£2,310.00" />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Save draft</Button>
        <Button onClick={() => toast.success('Invoice sent to Lumen Labs')}>Send</Button>
      </CardFooter>
    </Card>
  );
}

function InvoicesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rows={invoices}
          rowKey={(r) => r.id}
          columns={[
            { key: 'client', header: 'Client', cell: (r) => <span className="font-medium">{r.client}</span> },
            { key: 'status', header: 'Status', cell: (r) => <Badge variant={STATUS[r.status]}>{r.status}</Badge> },
            { key: 'amount', header: 'Amount', align: 'right', cell: (r) => money(r.amount), sortValue: (r) => r.amount },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function AssistantCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChatMessage role="user" initials="AM">
          Which invoices are overdue?
        </ChatMessage>
        <ToolCallCard title="Searched invoices" status="done" input='{ "status": "overdue" }' output="2 invoices, £3,270 total" />
        <ChatMessage role="assistant">
          <p>Two, totalling £3,270. Lumen Labs is the larger at £2,310 and usually pays late.</p>
        </ChatMessage>
        <ChatComposer onSend={(text) => toast(`Would send: ${text}`)} placeholder="Ask about your invoices" />
      </CardContent>
    </Card>
  );
}

function TeamCard() {
  const [budget, setBudget] = React.useState([60]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>3 of 5 seats used</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ul className="flex flex-col gap-3">
          {team.map((m) => (
            <li key={m.initials} className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{m.initials}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 text-sm font-medium">{m.name}</span>
              <Badge variant="outline">{m.role}</Badge>
            </li>
          ))}
        </ul>
        <Progress value={60} aria-label="Seats used" />
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Monthly tool budget</span>
            <span className="text-muted-foreground tabular-nums">{money(budget[0] * 10)}</span>
          </div>
          <Slider value={budget} onValueChange={setBudget} min={0} max={100} step={5} aria-label="Monthly tool budget" />
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsCard() {
  const [period, setPeriod] = React.useState('weekly');
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>What we tell you, and how often.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {[
          ['showcase-paid', 'An invoice is paid', true],
          ['showcase-late', 'An invoice goes overdue', true],
          ['showcase-news', 'Product news', false],
        ].map(([id, label, on]) => (
          <div key={id as string} className="flex items-center justify-between gap-4">
            <Label htmlFor={id as string}>{label}</Label>
            <Switch id={id as string} defaultChecked={on as boolean} />
          </div>
        ))}
        <ToggleGroup type="single" variant="outline" value={period} onValueChange={(v) => v && setPeriod(v)} className="w-full" aria-label="Summary email">
          <ToggleGroupItem value="daily" className="flex-1">
            Daily
          </ToggleGroupItem>
          <ToggleGroupItem value="weekly" className="flex-1">
            Weekly
          </ToggleGroupItem>
          <ToggleGroupItem value="never" className="flex-1">
            Never
          </ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>
  );
}

function ScheduleCard() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 5, 24));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Send on</CardTitle>
        <CardDescription>The invoice goes out at 9:00 that day.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={new Date(2026, 5, 1)} className="rounded-lg border" />
      </CardContent>
    </Card>
  );
}

function HelpCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="0">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={String(i)}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ArticleCard() {
  return (
    <Card>
      <CardContent>
        <Prose as="article">
          <h3>Getting paid faster</h3>
          <p>
            Invoices sent the day the work ends are paid in <strong>14 days</strong> on average. Late ones usually
            share a cause: nobody at the client knew who should approve them.
          </p>
          <ul>
            <li>Name the project on the invoice.</li>
            <li>
              Put the purchase order in <code>reference</code>.
            </li>
          </ul>
        </Prose>
      </CardContent>
    </Card>
  );
}

/** Every card a real registry component, in a masonry the docs home page frames (and the theme restyles). */
export function ShowcaseCards() {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 2xl:columns-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
      <StatTile label="Paid this month" value="£25,300" delta={8.2} deltaLabel="vs May" />
      <NewInvoiceCard />
      <RevenueCard />
      <AssistantCard />
      <InvoicesCard />
      <TeamCard />
      <StatTile label="Overdue" value="£3,270" delta={-26} deltaLabel="vs May" invert />
      <ApprovalCard
        title="Send 2 reminder emails"
        description="They go out now from billing@northwind.co. You can’t unsend them."
        details={[
          { label: 'To', value: 'Lumen Labs, Acme Studio' },
          { label: 'Total due', value: '£3,270' },
        ]}
        onApprove={() => toast.success('Reminders sent')}
        onDeny={() => toast('Nothing was sent')}
      />
      <ScheduleCard />
      <PricingCard
        name="Team"
        price="£24"
        period="per month"
        description="For studios billing every week."
        highlighted
        features={['Unlimited invoices', 'Automatic reminders', '5 teammates']}
        action={<Button className="w-full">Start 14-day trial</Button>}
      />
      <NotificationsCard />
      <Alert variant="destructive">
        <CircleAlertIcon />
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Your card was declined. Update it to keep your plan.</AlertDescription>
      </Alert>
      <ArticleCard />
      <HelpCard />
      <Card>
        <EmptyState
          variant="compact"
          icon={InboxIcon}
          title="No estimates yet"
          description="Estimates you send appear here, with their status."
          action={
            <Button variant="outline">
              <PlusIcon /> New estimate
            </Button>
          }
        />
      </Card>
    </div>
  );
}
