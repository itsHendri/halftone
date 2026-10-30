'use client';
/**
 * Components page demos, keyed by the component id in registry/components.ts. Each one is self-contained
 * (owns its state) and shows the variants and states that matter.
 */
import { Logo } from '@/components/kit/logo';
import {
  BarChart3Icon,
  BoldIcon,
  CircleAlertIcon,
  CreditCardIcon,
  FileTextIcon,
  HomeIcon,
  InboxIcon,
  ItalicIcon,
  LayoutGridIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
  ZapIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';
import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { toast } from 'sonner';
import { TWIN_DEMOS } from './demos-native-twins';
import { AppShell } from '@/components/kit/app-shell';
import { ApprovalCard } from '@/components/kit/approval-card';
import { AttachmentChip } from '@/components/kit/attachment-chip';
import { ChatComposer } from '@/components/kit/chat-composer';
import { FollowUpSuggestions } from '@/components/kit/follow-up-suggestions';
import { CitedText, SourceList } from '@/components/kit/sources';
import { type ChatThread, ChatThreadList } from '@/components/kit/chat-thread-list';
import { DatePicker } from '@/components/kit/date-picker';
import { ChatMessage } from '@/components/kit/chat-message';
import { DataTable } from '@/components/kit/data-table';
import { EmptyState } from '@/components/kit/empty-state';
import { FeatureGrid } from '@/components/kit/feature-grid';
import { Hero } from '@/components/kit/hero';
import { PageHeader } from '@/components/kit/page-header';
import { Prose } from '@/components/kit/prose';
import { PricingCard } from '@/components/kit/pricing-card';
import { StatTile } from '@/components/kit/stat-tile';
import { StreamingText } from '@/components/kit/streaming-text';
import { ThinkingIndicator } from '@/components/kit/thinking-indicator';
import { ToolCallCard } from '@/components/kit/tool-call-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const Row = ({ children }: { children: React.ReactNode }) => <div className="flex flex-wrap items-center gap-3">{children}</div>;

const INVOICES = [
  { id: 'INV-1042', customer: 'Northwind', status: 'Paid', amount: 1240 },
  { id: 'INV-1043', customer: 'Acme Studio', status: 'Due', amount: 860 },
  { id: 'INV-1044', customer: 'Lumen Labs', status: 'Overdue', amount: 2310 },
];

/** A status: outline Badge, coloured dot, the word in foreground text (status-coloured small text fails AA on its tint). */
const StatusBadge = ({ dot, children }: { dot: string; children: React.ReactNode }) => (
  <Badge variant="outline" className="gap-1.5">
    <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
    {children}
  </Badge>
);
const STATUS_DOT: Record<string, string> = { Paid: 'bg-success', Due: 'bg-warning', Overdue: 'bg-destructive' };

const chartConfig = { visitors: { label: 'Visitors', color: 'var(--chart-1)' } } satisfies ChartConfig;
const chartData = [
  { month: 'Jan', visitors: 186 },
  { month: 'Feb', visitors: 305 },
  { month: 'Mar', visitors: 237 },
  { month: 'Apr', visitors: 273 },
  { month: 'May', visitors: 209 },
  { month: 'Jun', visitors: 314 },
];

function ChatDemo() {
  const [turns, setTurns] = React.useState<{ text: string; files: File[] }[]>([]);
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      {turns.map((t, i) => (
        <ChatMessage key={i} role="user" initials="AM">
          {t.files.length ? (
            <span className="flex flex-wrap gap-2">
              {t.files.map((f) => (
                <AttachmentChip key={f.name} file={f} />
              ))}
            </span>
          ) : null}
          {t.text ? <span>{t.text}</span> : null}
        </ChatMessage>
      ))}
      <ChatComposer onSend={(text, files) => setTurns((x) => [...x, { text, files }])} accept="" placeholder="Type, attach or drop a file" />
    </div>
  );
}

function StreamingDemo() {
  const [run, setRun] = React.useState(0);
  return (
    <div className="flex max-w-xl flex-col items-start gap-3">
      <StreamingText
        key={run}
        className="leading-7"
        text="Your three overdue invoices total £4,410. Lumen Labs is the largest at £2,310 and is 12 days late; I can draft a reminder."
      />
      <Button size="sm" variant="outline" onClick={() => setRun((r) => r + 1)}>
        Replay
      </Button>
    </div>
  );
}


function DatePickerDemo() {
  const [due, setDue] = React.useState<Date | undefined>(new Date(2026, 6, 24));
  const [start, setStart] = React.useState<Date | undefined>();
  const [today] = React.useState(() => new Date(new Date().setHours(0, 0, 0, 0)));
  return (
    <div className="grid w-full max-w-md gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="demo-due">Due date</Label>
        <DatePicker id="demo-due" value={due} onChange={setDue} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="demo-start">Start date</Label>
        <DatePicker id="demo-start" value={start} onChange={setStart} placeholder="Pick a start date" disabled={(d) => d < today} />
      </div>
    </div>
  );
}

function CalendarDemo() {
  const [range, setRange] = React.useState<{ from: Date | undefined; to?: Date | undefined } | undefined>({
    from: new Date(2026, 6, 13),
    to: new Date(2026, 6, 17),
  });
  return <Calendar mode="range" selected={range} onSelect={setRange} defaultMonth={new Date(2026, 6, 1)} className="border-border rounded-xl border" />;
}

function PaginationDemo() {
  const [page, setPage] = React.useState(3);
  const last = 13;
  const go = (p: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setPage(Math.min(last, Math.max(1, p)));
  };
  const pages = [1, page - 1, page, page + 1, last].filter((p, i, a) => p >= 1 && p <= last && a.indexOf(p) === i);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={go(page - 1)} aria-disabled={page === 1} className={page === 1 ? 'pointer-events-none opacity-50' : undefined} />
          </PaginationItem>
          {/* Seven 48px page links don't fit a phone: there it says where you are instead. */}
          <PaginationItem className="px-2 text-sm sm:hidden">
            Page {page} of {last}
          </PaginationItem>
          {pages.map((p, i) => (
            <React.Fragment key={p}>
              {i > 0 && p - pages[i - 1] > 1 ? (
                <PaginationItem className="hidden sm:block">
                  <PaginationEllipsis />
                </PaginationItem>
              ) : null}
              <PaginationItem className="hidden sm:block">
                <PaginationLink href="#" isActive={p === page} onClick={go(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            </React.Fragment>
          ))}
          <PaginationItem>
            <PaginationNext href="#" onClick={go(page + 1)} aria-disabled={page === last} className={page === last ? 'pointer-events-none opacity-50' : undefined} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-muted-foreground text-sm">
        {(page - 1) * 10 + 1}–{Math.min(page * 10, 128)} of 128 invoices
      </p>
    </div>
  );
}

const THREADS: ChatThread[] = [
  { id: 't1', title: 'Overdue invoices this month', preview: 'Three are overdue, £4,410 in total.', group: 'Today' },
  { id: 't2', title: 'Draft a reminder for Fernway', preview: 'Here is a friendlier version…', group: 'Today' },
  { id: 't3', title: 'Summarise June', preview: 'You were paid £9,800 in June.', group: 'Previous 7 days' },
  { id: 't4', title: 'Which customers pay late?', preview: 'Lumen Labs and Acme Studio, usually by 2–3 weeks.', group: 'Previous 7 days' },
];

function ThreadListDemo() {
  const [threads, setThreads] = React.useState(THREADS);
  const [active, setActive] = React.useState('t1');
  return (
    <ChatThreadList
      className="border-border bg-sidebar w-full max-w-xs rounded-xl border p-3"
      threads={threads}
      activeId={active}
      onSelect={setActive}
      onNew={() => {
        const id = `t${threads.length + 1}`;
        setThreads((ts) => [{ id, title: 'New conversation', group: 'Today' }, ...ts]);
        setActive(id);
      }}
    />
  );
}

export const DEMOS: Record<string, ComponentType> = {
  ...TWIN_DEMOS,
  logo: () => (
    <div className="flex flex-col gap-4">
      <Logo size={28} />
      <Row>
        <Logo variant="mark" size={40} />
        <Logo variant="mark" size={24} />
        <Logo name="Northwind" />
      </Row>
      <div className="bg-primary text-primary-foreground rounded-xl p-4">
        <Logo size={24} />
      </div>
    </div>
  ),
  button: () => (
    <Row>
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Delete</Button>
      <Button size="sm">
        <PlusIcon /> Small
      </Button>
      <Button size="icon" variant="outline" aria-label="Settings">
        <SettingsIcon />
      </Button>
      <Button disabled>Disabled</Button>
    </Row>
  ),
  toggle: () => (
    <Row>
      <Toggle aria-label="Bold">
        <BoldIcon />
      </Toggle>
      <Toggle aria-label="Italic" defaultPressed>
        <ItalicIcon />
      </Toggle>
      <Toggle variant="outline" aria-label="Favourite">
        <StarIcon /> Favourite
      </Toggle>
    </Row>
  ),
  'toggle-group': () => (
    <ToggleGroup type="single" defaultValue="month" variant="outline" aria-label="Range">
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
      <ToggleGroupItem value="year">Year</ToggleGroupItem>
    </ToggleGroup>
  ),
  input: () => (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor="demo-email">Email</Label>
        <Input id="demo-email" type="email" placeholder="you@example.com" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="demo-name">Workspace name</Label>
        <Input id="demo-name" aria-invalid defaultValue="a" aria-describedby="demo-name-error" />
        <p id="demo-name-error" className="text-destructive text-sm">
          At least 3 characters.
        </p>
      </div>
      <Input disabled placeholder="Disabled" aria-label="Disabled field" />
    </div>
  ),
  textarea: () => (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="demo-notes">Notes</Label>
      <Textarea id="demo-notes" placeholder="Anything the team should know" />
    </div>
  ),
  checkbox: () => (
    <div className="grid gap-3">
      {['Product updates', 'Weekly summary', 'Billing alerts'].map((l, i) => (
        <div key={l} className="flex items-center gap-2">
          <Checkbox id={`demo-cb-${i}`} defaultChecked={i !== 1} />
          <Label htmlFor={`demo-cb-${i}`}>{l}</Label>
        </div>
      ))}
    </div>
  ),
  'radio-group': () => (
    <RadioGroup defaultValue="monthly" aria-label="Billing period">
      {['monthly', 'yearly'].map((v) => (
        <div key={v} className="flex items-center gap-2">
          <RadioGroupItem value={v} id={`demo-r-${v}`} />
          <Label htmlFor={`demo-r-${v}`} className="capitalize">
            {v}
          </Label>
        </div>
      ))}
    </RadioGroup>
  ),
  switch: () => (
    <div className="flex items-center gap-3">
      <Switch id="demo-switch" defaultChecked />
      <Label htmlFor="demo-switch">Email notifications</Label>
    </div>
  ),
  select: () => (
    <div className="grid w-full max-w-xs gap-2">
      <Label htmlFor="demo-select">Role</Label>
      <Select defaultValue="editor">
        <SelectTrigger id="demo-select" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="owner">Owner</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  slider: () => <Slider defaultValue={[40]} max={100} step={1} className="max-w-sm" aria-label="Volume" />,
  'app-shell': () => (
    <div className="border-border h-80 w-full overflow-hidden rounded-xl border [&>div]:min-h-full">
      <AppShell
        brand="Northwind"
        nav={[
          { href: '/components', label: 'Overview', icon: HomeIcon },
          { href: '#customers', label: 'Customers', icon: UsersIcon },
          { href: '#billing', label: 'Billing', icon: CreditCardIcon },
        ]}
        topbar={
          <Avatar className="size-8">
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
        }>
        <PageHeader title="Overview" description="The app shell puts the sidebar here." />
      </AppShell>
    </div>
  ),
  tabs: () => (
    <Tabs defaultValue="overview" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-muted-foreground pt-2 text-sm">
        The overview panel.
      </TabsContent>
      <TabsContent value="activity" className="text-muted-foreground pt-2 text-sm">
        Recent activity.
      </TabsContent>
      <TabsContent value="settings" className="text-muted-foreground pt-2 text-sm">
        Settings.
      </TabsContent>
    </Tabs>
  ),
  breadcrumb: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Customers</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Northwind</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
  command: () => (
    <Command className="border-border max-w-sm rounded-xl border">
      <CommandInput placeholder="Search or jump to…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem>
            <LayoutGridIcon /> Dashboard
          </CommandItem>
          <CommandItem>
            <UsersIcon /> Customers
          </CommandItem>
          <CommandItem>
            <FileTextIcon /> Invoices
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
  'data-table': () => (
    <DataTable
      className="w-full max-w-2xl"
      caption="Invoices this month"
      rows={INVOICES}
      rowKey={(r) => r.id}
      columns={[
        { key: 'id', header: 'Invoice', sortValue: (r) => r.id },
        { key: 'customer', header: 'Customer', sortValue: (r) => r.customer },
        {
          key: 'status',
          header: 'Status',
          cell: (r) => <StatusBadge dot={STATUS_DOT[r.status]}>{r.status}</StatusBadge>,
        },
        { key: 'amount', header: 'Amount', align: 'right', sortValue: (r) => r.amount, cell: (r) => `£${r.amount.toLocaleString('en-GB')}` },
      ]}
    />
  ),
  table: () => (
    <Table className="max-w-md">
      <TableHeader>
        <TableRow>
          <TableHead>Plan</TableHead>
          <TableHead className="text-right">Seats</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Team</TableCell>
          <TableCell className="text-right">12</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Business</TableCell>
          <TableCell className="text-right">40</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  'stat-tile': () => (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <StatTile label="Revenue" value="£48,210" delta={12.4} deltaLabel="vs last month" />
      <StatTile label="Active customers" value="1,284" delta={3.1} deltaLabel="vs last month" />
      <StatTile label="Churn" value="2.4%" delta={-0.6} deltaLabel="vs last month" invert />
    </div>
  ),
  chart: () => (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full max-w-xl">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="visitors" fill="var(--color-visitors)" radius={6} />
      </BarChart>
    </ChartContainer>
  ),
  badge: () => (
    <Row>
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <StatusBadge dot="bg-success">Paid</StatusBadge>
      <StatusBadge dot="bg-warning">Pending</StatusBadge>
      <Badge size="sm" variant="secondary">
        Small
      </Badge>
    </Row>
  ),
  avatar: () => (
    <Row>
      {['AM', 'JL', 'RK'].map((i) => (
        <Avatar key={i}>
          <AvatarFallback>{i}</AvatarFallback>
        </Avatar>
      ))}
    </Row>
  ),
  separator: () => (
    <div className="max-w-sm">
      <p className="text-sm font-medium">Account</p>
      <Separator className="my-3" />
      <p className="text-muted-foreground text-sm">Profile, security, billing.</p>
    </div>
  ),
  alert: () => (
    <div className="grid w-full max-w-xl gap-3">
      <Alert>
        <ShieldCheckIcon />
        <AlertTitle>Two-step sign-in is on</AlertTitle>
        <AlertDescription>We’ll ask for a code when you sign in on a new device.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <CircleAlertIcon />
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Your card was declined. Update it to keep your plan.</AlertDescription>
      </Alert>
    </div>
  ),
  toast: () => (
    <Row>
      <Button variant="outline" onClick={() => toast.success('Invoice sent')}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast('Project archived', { action: { label: 'Undo', onClick: () => toast('Restored') } })}>
        With undo
      </Button>
    </Row>
  ),
  progress: () => <Progress value={64} className="max-w-sm" aria-label="Upload progress" />,
  skeleton: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  ),
  'empty-state': () => (
    <Card className="w-full max-w-xl">
      <EmptyState
        icon={InboxIcon}
        title="No invoices yet"
        description="Invoices you send appear here, with their status."
        action={
          <Button>
            <PlusIcon /> New invoice
          </Button>
        }
      />
    </Card>
  ),
  'page-header': () => (
    <PageHeader
      className="w-full"
      eyebrow="Billing"
      title="Invoices"
      description="Everything you have billed, newest first."
      actions={
        <>
          <Button variant="outline">Export</Button>
          <Button>
            <PlusIcon /> New invoice
          </Button>
        </>
      }
    />
  ),
  prose: () => (
    <Prose as="article">
      <h2>Getting paid faster</h2>
      <p>
        Most invoices are paid within <strong>14 days</strong> when they go out the day the work ends. Late ones
        tend to share a cause: the client could not find the right person to approve them.
      </p>
      <ul>
        <li>Send from the project, so the invoice names the work.</li>
        <li>
          Add a purchase order number in the <code>reference</code> field.
        </li>
        <li>Turn on reminders at 7 and 14 days.</li>
      </ul>
      <blockquote>We cut our average wait from 31 days to 12 by sending on the last day of the project.</blockquote>
      <h3>Exporting</h3>
      <p>
        Export every invoice as CSV from <a href="#prose">Settings › Billing</a>, or from the command line:
      </p>
      <pre tabIndex={0}>
        <code>northwind invoices export --since 2026-01-01</code>
      </pre>
    </Prose>
  ),
  card: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>12 of 20 seats used</CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={60} aria-label="Seats used" />
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">
          Manage seats
        </Button>
      </CardFooter>
    </Card>
  ),
  accordion: () => (
    <Accordion type="single" collapsible className="w-full max-w-md">
      <AccordionItem value="a">
        <AccordionTrigger>Can I change plans later?</AccordionTrigger>
        <AccordionContent>Yes, any time. We prorate the difference.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Is there a free trial?</AccordionTrigger>
        <AccordionContent>14 days on every plan, no card needed.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  collapsible: () => (
    <Collapsible className="max-w-sm">
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm">
          Show advanced settings
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="text-muted-foreground pt-3 text-sm">Webhooks, API keys and audit logs.</CollapsibleContent>
    </Collapsible>
  ),
  dialog: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Rename project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          <DialogDescription>Everyone with access sees the new name.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="demo-project">Name</Label>
          <Input id="demo-project" defaultValue="Website relaunch" />
        </div>
        <DialogFooter>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  'alert-dialog': () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “Website relaunch”?</AlertDialogTitle>
          <AlertDialogDescription>Its 24 tasks and files go too. This can’t be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep project</AlertDialogCancel>
          <AlertDialogAction>Delete project</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  sheet: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Filters</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow the invoice list.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
  popover: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Share</Button>
      </PopoverTrigger>
      <PopoverContent className="grid gap-2">
        <Label htmlFor="demo-share">Invite by email</Label>
        <Input id="demo-share" placeholder="name@company.com" />
      </PopoverContent>
    </Popover>
  ),
  'dropdown-menu': () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="More actions">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Invoice</DropdownMenuLabel>
        <DropdownMenuItem>Download PDF</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Void invoice</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  tooltip: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Insights">
          <BarChart3Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Insights</TooltipContent>
    </Tooltip>
  ),
  hero: () => (
    <Hero
      className="py-6 md:py-8"
      eyebrow="New: automatic reminders"
      title="Get paid on time, without chasing."
      description="Invoices that follow up for you, in your brand, on your schedule."
      actions={
        <>
          <Button size="lg">Start free</Button>
          <Button size="lg" variant="outline">
            See how it works
          </Button>
        </>
      }
    />
  ),
  'feature-grid': () => (
    <FeatureGrid
      features={[
        { icon: ZapIcon, title: 'Sent in seconds', description: 'Turn a quote into an invoice with one click.' },
        { icon: ShieldCheckIcon, title: 'Paid safely', description: 'Cards and bank transfers, reconciled for you.' },
        { icon: SparklesIcon, title: 'Reminders that work', description: 'Polite follow-ups that stop when they pay.' },
      ]}
    />
  ),
  'pricing-card': () => (
    <div className="grid w-full gap-6 pt-3 md:grid-cols-2">
      <PricingCard name="Starter" price="£0" period="per month" features={['5 invoices a month', 'Card payments']} action={<Button variant="outline" className="w-full">Start free</Button>} />
      <PricingCard
        name="Team"
        price="£24"
        period="per month"
        highlighted
        features={['Unlimited invoices', 'Automatic reminders', '5 teammates']}
        action={<Button className="w-full">Start 14-day trial</Button>}
      />
    </div>
  ),
  'chat-message': () => (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <ChatMessage role="user" initials="AM">
        Which invoices are overdue?
      </ChatMessage>
      <ChatMessage role="assistant">
        <p>Three, totalling £4,410. Lumen Labs is the largest at £2,310.</p>
      </ChatMessage>
    </div>
  ),
  'chat-composer': ChatDemo,
  sources: () => {
    const sources = [
      { title: 'INV-1045 · Lumen Labs', meta: 'Invoice · due 24 May · £2,310', snippet: 'Brand refresh, phase 2. Payment due within 14 days of issue.' },
      { title: 'Payment timing by customer', meta: 'Report · Jan–Jun', snippet: 'Lumen Labs: 17 days late on average.' },
    ];
    return (
      <div className="flex max-w-xl flex-col gap-3 leading-7">
        <CitedText text="Lumen Labs owes £2,310 [1] and usually pays about two and a half weeks late [2]." sources={sources} />
        <SourceList sources={sources} />
      </div>
    );
  },
  'follow-up-suggestions': () => (
    <FollowUpSuggestions suggestions={['Which customers usually pay late?', 'Draft a reminder I can edit first', 'Summarise June']} onSelect={(s) => toast(`Would send: ${s}`)} />
  ),
  'attachment-chip': () => (
    <div className="flex flex-wrap gap-2">
      <AttachmentChip file={{ name: 'INV-1047-fernway.pdf', size: 184_320, type: 'application/pdf' }} />
      <AttachmentChip file={{ name: 'receipt-photo.jpg', size: 2_516_582, type: 'image/jpeg' }} onRemove={() => toast('Removed receipt-photo.jpg')} />
      <AttachmentChip file={{ name: 'q2-board-report-final-final-v3.xlsx', size: 48_211 }} />
    </div>
  ),
  'streaming-text': StreamingDemo,
  'thinking-indicator': () => <ThinkingIndicator label="Checking your invoices" />,
  'date-picker': DatePickerDemo,
  calendar: CalendarDemo,
  'navigation-menu': () => (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-72 gap-1 p-1">
              {[
                ['Invoices', 'Send and track every invoice'],
                ['Reminders', 'Polite nudges when payment is late'],
                ['Reports', 'What is paid, due and overdue'],
              ].map(([title, body]) => (
                <li key={title}>
                  <NavigationMenuLink href="#" className="flex flex-col items-start gap-0.5">
                    <span className="font-medium">{title}</span>
                    <span className="text-muted-foreground text-xs">{body}</span>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
            Customers
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
  pagination: PaginationDemo,
  drawer: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Filter invoices</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Filter invoices</DrawerTitle>
            <DrawerDescription>Show only what you need to act on.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3 px-4">
            {['Overdue', 'Due this week', 'Drafts'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <Checkbox id={`drawer-${f}`} defaultChecked={f === 'Overdue'} />
                <Label htmlFor={`drawer-${f}`} className="font-normal">
                  {f}
                </Label>
              </div>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button>Show 3 invoices</Button>
            </DrawerClose>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  ),
  'chat-thread-list': ThreadListDemo,
  'tool-call-card': () => (
    <div className="grid w-full max-w-xl gap-3">
      <ToolCallCard title="Searched invoices" status="done" input='{ "status": "overdue" }' output="3 invoices, £4,410 total" />
      <ToolCallCard title="Drafting reminder emails" status="running" />
      <ToolCallCard title="Sent reminder to Lumen Labs" status="error" output="The contact has no email address." />
      <ToolCallCard title="Exporting June’s invoices" status="stopped" output="Stopped before it finished." />
    </div>
  ),
  'approval-card': () => (
    <ApprovalCard
      className="max-w-xl"
      title="Send 3 reminder emails"
      description="Emails go out now from billing@northwind.co. You can’t unsend them."
      details={[
        { label: 'To', value: 'Lumen Labs, Acme Studio, Fernway' },
        { label: 'Total due', value: '£4,410' },
      ]}
      onApprove={() => toast.success('Reminders sent')}
      onDeny={() => toast('Nothing was sent')}
    />
  ),
};
