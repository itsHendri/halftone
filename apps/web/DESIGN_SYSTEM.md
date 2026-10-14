# Design system

The visual rules and the component registry for the web kit. **Read this before writing any UI.**
Engineering conventions (routes, state, workflows) live in `AGENTS.md`.

> **Core rule.** Never introduce a colour, spacing value, component or pattern that is not defined here
> without flagging it first. Never invent a component name. If it is not in the registry, say so and ask
> before building. Everything in the registry is previewed live at **/components**.

## Tokens

Single source of truth: `tokens/tokens.json` (DTCG), shared with the mobile kit. `npm run tokens:build`
regenerates `app/tokens.css` (Tailwind 4 / shadcn variables, oklch), `lib/theme.ts`, `DESIGN.md` and
`tokens/generated/`. Never edit the generated files. In the Halftone monorepo the brand is edited in
`apps/mobile/tokens/tokens.json` and copied here with `npm run tokens:sync`.

**The build enforces contrast.** Every `X` / `X-foreground` pairing, muted text on every surface, and each
status colour used as text must clear WCAG AA (4.5:1) in both themes, or `tokens:build` fails.

### Colour — semantic names only

The shadcn vocabulary through Tailwind classes; each works as `bg-`, `text-`, `border-`, `ring-`.

| Name | Use |
|---|---|
| `background` / `foreground` | page canvas / default text |
| `card` / `card-foreground` | raised surfaces |
| `popover` / `popover-foreground` | menus, popovers |
| `primary` / `primary-foreground` | the brand action colour and text on it |
| `secondary`, `muted`, `accent` (+ `-foreground`) | quieter fills, helper text, hover fills |
| `destructive`, `success`, `warning`, `info` (+ `-foreground`) | status |
| `border`, `input`, `ring` | hairlines, field borders, focus |
| `sidebar*` | the app shell's sidebar surface, its active item and border |
| `chart-1` … `chart-5` | data series (through a ChartConfig) |

Rules:
- **No hex, `rgb()` or Tailwind palette colours (`bg-blue-500`, `text-white`) in `app/` or `components/`.**
  The one exception is the modal scrim, `bg-black/50`, in the shadcn overlays.
- Tint a surface with an alpha of a semantic colour: `bg-primary/10`, `bg-success/15`. Text on a tint stays
  `text-foreground`: a status colour as small text on its own tint measures under 4.5:1 (success 4.09,
  destructive 3.81). A status badge is an outline Badge with a coloured dot.
- Selected / active states (tabs, segmented controls, nav items) are **neutral**, not the brand colour.
- Light and dark are both required.

### Spacing

Tailwind's numeric scale on a 4-pt grid: `0 1 2 3 4 5 6 8 10 12 16` (0–64 px). Page gutters `px-4 sm:px-6
lg:px-8`, sections `gap-8`–`gap-12`, inside cards `p-5`/`p-6`. Use `gap-*` for siblings, not margins.
The theme's density scales the whole scale (`--spacing` × 0.875 compact, × 1.125 spacious), so stay on it.

### Radius

<!-- GENERATED:tokens:radius -->
`rounded-sm` 6 · `rounded-md` 8 (inputs, buttons) · `rounded-lg` 10 (cards, dialogs) · `rounded-xl` 16 (panels, tables) · `rounded-2xl` 20 (hero surfaces) · `rounded-full` (avatars, pills).
<!-- /GENERATED:tokens:radius -->

### Typography

The theme's fonts (`app/fonts.ts`): h1–h4 and card titles take the heading font (`font-heading`), everything
else the body font (`font-sans`). Page title `text-2xl sm:text-3xl font-semibold
tracking-tight` (PageHeader does this); section titles `text-lg`/`text-xl font-semibold`; body `text-base`
with `leading-7` for prose; helper text `text-sm text-muted-foreground`. `tabular-nums` for figures.

### Depth and borders

`shadow-xs`/`shadow-sm` (controls, cards), `shadow-md` (raised, popovers), `shadow-lg`/`shadow-xl` (menus,
dialogs) are the theme's three elevation levels; `border` is its width; Lucide icons take its stroke.
Buttons follow the radius scale (`rounded-md`); the theme's pill setting is for the mobile kit.

### Motion

150 ms for hover and small feedback, 200 ms for most transitions, 300 ms for sheets. Anything that moves
uses `motion-safe:`/`motion-reduce:` or `useReducedMotion()` from `hooks/use-reduced-motion.ts`.

### Icons

lucide-react only. `size-4` in buttons and menus, `size-5` in headers and feature blocks. Icon-only buttons
always carry an `aria-label`.

## Component registry

Two folders, one rule: **use what's here, extend before duplicating, register anything new.**

- `components/ui/*` — shadcn/ui (owned source; installed with the shadcn CLI, then ours to edit).
- `components/kit/*` — ours, composed from `ui` primitives, className-only styling.

The tables are generated from `registry/components.ts` by `npm run registry:build`: edit that file, not
the tables. Text between `GENERATED` markers is overwritten.

### Actions
<!-- GENERATED:registry:actions -->
| Component | Path | Notes |
|---|---|---|
| Button / `buttonVariants` | `components/ui/button.tsx` | `variant` default/secondary/outline/ghost/link/destructive · `size` default/sm/lg/icon · `asChild` for links |
| Toggle / `toggleVariants` | `components/ui/toggle.tsx` | a pressed/unpressed button (bold, mute, favourite) |
| ToggleGroup / ToggleGroupItem | `components/ui/toggle-group.tsx` | `type` single (a segmented control) or multiple |
| FloatingButton | `components/kit/floating-button.tsx` | floats OVER the scroll (a Button flows with it) · Material calls it a FAB · `icon label? variant position` · one per page |
| IconBadge | `components/kit/icon-badge.tsx` | icon button with unread count/dot · always labelled |
| ActionGrid | `components/kit/action-grid.tsx` | the row of shortcuts under a page hero · 3–4 `items`, one row only, last tile is "More" |
<!-- /GENERATED:registry:actions -->

### Inputs & selection
<!-- GENERATED:registry:inputs -->
| Component | Path | Notes |
|---|---|---|
| Input | `components/ui/input.tsx` | always with a `Label` · `aria-invalid` for errors |
| Label | `components/ui/label.tsx` | `htmlFor` the field it names |
| Textarea | `components/ui/textarea.tsx` | multi-line text, grows with content |
| Checkbox | `components/ui/checkbox.tsx` | `checked onCheckedChange` · pick any |
| RadioGroup / RadioGroupItem | `components/ui/radio-group.tsx` | pick exactly one · `RadioGroupItem value id` |
| Switch | `components/ui/switch.tsx` | a setting that applies at once (no Save button) |
| Select / SelectTrigger / SelectValue / SelectContent / SelectItem | `components/ui/select.tsx` | one of 5–15 options in a form; fewer → RadioGroup, more → Command |
| DatePicker | `components/kit/date-picker.tsx` | one date in a form · field-styled button → Calendar in a Popover · `value onChange disabled?` |
| Calendar / CalendarDayButton | `components/ui/calendar.tsx` | a month grid (react-day-picker) · `mode` single/range/multiple · use DatePicker for a form field |
| Slider | `components/ui/slider.tsx` | a value on a range · two thumbs for a range |
| FilterChip / FilterChipRow | `components/kit/filter-chip.tsx` | neutral-active chips in a scrolling row |
| SegmentedControl | `components/kit/segmented-control.tsx` | 2–4 options, sliding thumb |
| SearchField | `components/kit/search-field.tsx` | Input + search icon + clear |
| QuantityStepper | `components/kit/quantity-stepper.tsx` | − value + · `min max step` |
| Rating | `components/kit/rating.tsx` | stars · display (half stars, `showValue`, `count`) or input with `onChange` |
| AmountInput | `components/kit/amount-input.tsx` | hero money field · MAX and currency switch |
| OtpInput | `components/kit/otp-input.tsx` | N-digit code, paste-aware |
| PasswordInput | `components/kit/password-input.tsx` | Input + show/hide |
| SelectableCard | `components/kit/selectable-card.tsx` | card as a radio/checkbox choice |
| RangeSelector | `components/kit/range-selector.tsx` | chart range (1D·1W·1M·1Y·ALL), the active one inverts |
<!-- /GENERATED:registry:inputs -->

### Navigation
<!-- GENERATED:registry:navigation -->
| Component | Path | Notes |
|---|---|---|
| AppShell | `components/kit/app-shell.tsx` | sidebar of 4–8 destinations on desktop, a sheet on mobile · active item follows the URL |
| Tabs / TabsList / TabsTrigger / TabsContent | `components/ui/tabs.tsx` | switch views of the same thing in place; not page navigation |
| NavigationMenu / NavigationMenuList / NavigationMenuItem / NavigationMenuTrigger / NavigationMenuContent / NavigationMenuLink / `navigationMenuTriggerStyle` | `components/ui/navigation-menu.tsx` | a marketing site’s top nav with dropdown panels · not for app navigation (AppShell) |
| Breadcrumb / BreadcrumbList / BreadcrumbItem / BreadcrumbLink / BreadcrumbPage / BreadcrumbSeparator | `components/ui/breadcrumb.tsx` | where a detail page sits · the last item is the current page |
| Pagination / PaginationContent / PaginationItem / PaginationLink / PaginationPrevious / PaginationNext / PaginationEllipsis | `components/ui/pagination.tsx` | pages of a long list or table · Previous/Next + page links · `isActive` on the current page |
| Command / CommandDialog / CommandInput / CommandList / CommandEmpty / CommandGroup / CommandItem | `components/ui/command.tsx` | search-as-you-type list · `CommandDialog` for a ⌘K palette |
| Menubar / MenubarMenu / MenubarTrigger / MenubarContent / MenubarItem / MenubarSeparator / MenubarShortcut / MenubarCheckboxItem | `components/ui/menubar.tsx` | desktop-app menus (File · Edit · View) across the top of an editor |
| Stepper | `components/kit/stepper.tsx` | `numbered` / `compact` flow progress |
| SectionHeader | `components/kit/section-header.tsx` | title + action, outside the card |
| PagerDots | `components/kit/pager-dots.tsx` | page indicator · HorizontalPager renders them for you |
| HorizontalPager | `components/kit/horizontal-pager.tsx` | CSS scroll-snap pager + dots · keyboard scrollable |
<!-- /GENERATED:registry:navigation -->

### Data display
<!-- GENERATED:registry:data -->
| Component | Path | Notes |
|---|---|---|
| DataTable | `components/kit/data-table.tsx` | sortable columns + built-in empty state · `columns rows rowKey caption?` |
| Table / TableHeader / TableBody / TableRow / TableHead / TableCell / TableCaption | `components/ui/table.tsx` | the primitive under DataTable; use it directly for small static tables |
| StatTile | `components/kit/stat-tile.tsx` | one KPI with a signed change · `invert` when down is good |
| ChartContainer / ChartTooltip / ChartTooltipContent / ChartLegend / ChartLegendContent | `components/ui/chart.tsx` | Recharts with the theme · series colours from `var(--chart-1)`…`--chart-5` |
| Badge / `badgeVariants` | `components/ui/badge.tsx` | a status or tag · a status is an outline Badge with a coloured dot (`bg-success` …), the word in foreground text |
| Avatar / AvatarImage / AvatarFallback | `components/ui/avatar.tsx` | image with initials fallback |
| Separator | `components/ui/separator.tsx` | a hairline between groups · prefer spacing |
| AvatarGroup | `components/kit/avatar-group.tsx` | overlapping avatars + "+N" |
| ListRow | `components/kit/list-row.tsx` | ONE row · the canonical row · `last` on the final row · `select={{mode,selected}}` makes it a radio/checkbox row |
| ListGroup | `components/kit/list-group.tsx` | the CONTAINER around rows: title, dividers, footnote, card/plain surface · sets `last` for you |
| IconCircle | `components/kit/icon-circle.tsx` | leading icon well, row scale (≤64px) · `shape` circle/square · `tone` |
| KeyValueList / SummaryCard | `components/kit/key-value-list.tsx` | label/value rows, optionally in a Card |
| PercentChange | `components/kit/percent-change.tsx` | signed % with trend icon |
| ProgressRing | `components/kit/progress-ring.tsx` | circular determinate progress |
| StatusDot | `components/kit/status-dot.tsx` | small semantic status indicator, beside its label |
| Timeline | `components/kit/timeline.tsx` | vertical status steps joined by a line · each `done` / `current` / `upcoming` with time and note |
| ValueHeader | `components/kit/value-header.tsx` | hero figure + caption · `maskable` adds the eye toggle |
<!-- /GENERATED:registry:data -->

### Feedback & status
<!-- GENERATED:registry:feedback -->
| Component | Path | Notes |
|---|---|---|
| Alert / AlertTitle / AlertDescription | `components/ui/alert.tsx` | inline and persistent · `variant` default/destructive |
| Toaster | `components/ui/sonner.tsx` | transient confirmation · `toast()` from `sonner` · the Toaster is in the root layout |
| Progress | `components/ui/progress.tsx` | determinate 0–100 |
| Skeleton | `components/ui/skeleton.tsx` | the shape of content that is loading |
| EmptyState | `components/kit/empty-state.tsx` | nothing here yet, and the way out · `default` page / `compact` in a card |
| Spinner | `components/kit/spinner.tsx` | themed loading indicator · announced as "Loading" |
| SuccessScreen | `components/kit/success-screen.tsx` | the one success template |
<!-- /GENERATED:registry:feedback -->

### Containers & layout
<!-- GENERATED:registry:layout -->
| Component | Path | Notes |
|---|---|---|
| PageHeader | `components/kit/page-header.tsx` | title, description and actions · one per page, first in the content |
| Prose | `components/kit/prose.tsx` | long-form text (articles, docs, rendered markdown) at the theme's typeset: measure, leading, flow |
| Card / CardHeader / CardTitle / CardDescription / CardAction / CardContent / CardFooter | `components/ui/card.tsx` | a raised surface for one group · never nest cards |
| Accordion / AccordionItem / AccordionTrigger / AccordionContent | `components/ui/accordion.tsx` | FAQs and long optional detail |
| Collapsible / CollapsibleTrigger / CollapsibleContent | `components/ui/collapsible.tsx` | one show/hide region |
| ScrollArea / ScrollBar | `components/ui/scroll-area.tsx` | a fixed-height region that scrolls on its own |
| StickyBottomBar | `components/kit/sticky-bottom-bar.tsx` | action bar that sticks to the bottom of its scroll container · safe-area aware |
| PromoCard | `components/kit/promo-card.tsx` | tinted offer/nudge card · arrow CTA, dismiss X, generated art · one per page |
| Footnote | `components/kit/footnote.tsx` | small print / disclosure, last on the page |
<!-- /GENERATED:registry:layout -->

### Overlays
<!-- GENERATED:registry:overlays -->
| Component | Path | Notes |
|---|---|---|
| Dialog / DialogTrigger / DialogContent / DialogHeader / DialogTitle / DialogDescription / DialogFooter / DialogClose | `components/ui/dialog.tsx` | a short task on top of the page (an edit form) |
| AlertDialog / AlertDialogTrigger / AlertDialogContent / AlertDialogAction / AlertDialogCancel | `components/ui/alert-dialog.tsx` | confirm something destructive · name the action on the button |
| Sheet / SheetTrigger / SheetContent / SheetHeader / SheetTitle / SheetDescription / SheetFooter | `components/ui/sheet.tsx` | a side panel: filters, a record’s details, mobile navigation · `side` |
| Drawer / DrawerTrigger / DrawerContent / DrawerHeader / DrawerTitle / DrawerDescription / DrawerFooter / DrawerClose | `components/ui/drawer.tsx` | a bottom sheet you can drag down (vaul) · mobile-first quick actions and filters |
| Popover / PopoverTrigger / PopoverContent | `components/ui/popover.tsx` | a small panel anchored to a control |
| DropdownMenu / DropdownMenuTrigger / DropdownMenuContent / DropdownMenuItem / DropdownMenuLabel / DropdownMenuSeparator | `components/ui/dropdown-menu.tsx` | actions on a thing (row menu, account menu) · `variant="destructive"` items last |
| Tooltip / TooltipTrigger / TooltipContent | `components/ui/tooltip.tsx` | names an icon button · never the only place information lives |
| ContextMenu / ContextMenuTrigger / ContextMenuContent / ContextMenuItem / ContextMenuSeparator / ContextMenuShortcut | `components/ui/context-menu.tsx` | right-click menu on a thing |
| HoverCard / HoverCardTrigger / HoverCardContent | `components/ui/hover-card.tsx` | a preview on hover or focus (a profile, a link) |
<!-- /GENERATED:registry:overlays -->

### Media
<!-- GENERATED:registry:media -->
| Component | Path | Notes |
|---|---|---|
| ImageTile | `components/kit/image-tile.tsx` | rounded image · `seed` draws generated art when there is no `src` |
| AspectRatio | `components/ui/aspect-ratio.tsx` | holds a box at a ratio (video, map, embed) |
| Placeholder | `components/kit/placeholder.tsx` | deterministic abstract SVG art from a `seed` · the kit ships no raster imagery |
| Spot | `components/kit/spot.tsx` | an icon at illustration scale (≥64px) · SuccessScreen uses it |
<!-- /GENERATED:registry:media -->

### Marketing
<!-- GENERATED:registry:marketing -->
| Component | Path | Notes |
|---|---|---|
| Hero | `components/kit/hero.tsx` | one promise, one primary action · `media` for a product shot, omit for centred |
| FeatureGrid | `components/kit/feature-grid.tsx` | 3–6 short blocks · `columns` 2/3 |
| PricingCard | `components/kit/pricing-card.tsx` | one plan · 2–4 side by side · `highlighted` on one |
<!-- /GENERATED:registry:marketing -->

### AI product
<!-- GENERATED:registry:ai -->
| Component | Path | Notes |
|---|---|---|
| ChatMessage | `components/kit/chat-message.tsx` | one turn · user = bubble on the right, assistant = plain text on the left |
| ChatComposer | `components/kit/chat-composer.tsx` | Enter sends, Shift+Enter breaks · `busy` turns Send into Stop · `accept` turns on attachments (paperclip, drop, chips) |
| AttachmentChip / `formatBytes` | `components/kit/attachment-chip.tsx` | a file in a conversation: icon by type, name, size · `onRemove` while composing |
| ChatThreadList | `components/kit/chat-thread-list.tsx` | past conversations, grouped by when · `threads activeId onSelect onNew?` |
| SourceList / CitedText / `stripCitations` | `components/kit/sources.tsx` | what an answer is based on · numbered chips with previews · `[n]` in text → inline citations |
| FollowUpSuggestions | `components/kit/follow-up-suggestions.tsx` | next questions under the latest answer · picking one sends it |
| StreamingText / `useStreamingText` | `components/kit/streaming-text.tsx` | an answer arriving · all at once under reduced motion · screen readers get it once |
| ThinkingIndicator | `components/kit/thinking-indicator.tsx` | the model is working · say what it is doing when you can |
| ToolCallCard | `components/kit/tool-call-card.tsx` | an action the assistant took · `status` running/done/error/stopped · details collapsed |
| ApprovalCard | `components/kit/approval-card.tsx` | consent before consequence · says what changes and whether it can be undone |
<!-- /GENERATED:registry:ai -->

## Patterns

- **App page:** `AppShell` in the prototype's `layout.tsx` → `PageHeader` → 2–4 `StatTile`s → `Card`s or a
  `DataTable`. One primary action per page, in the PageHeader.
- **Marketing page:** `Hero` → `FeatureGrid` → social proof or a product shot → `PricingCard`s → FAQ
  (`Accordion`) → a closing call to action. One promise, one primary action, repeated at the end.
- **AI conversation:** `ChatMessage`s in a centred column (`max-w-3xl`), `ChatComposer` pinned at the bottom.
  Show work as it happens (`ThinkingIndicator`, `ToolCallCard`), stream the answer (`StreamingText`), and ask
  with an `ApprovalCard` before anything irreversible or costly (consent before consequence). Past
  conversations go in a `ChatThreadList`: a sidebar on desktop, a Sheet on small screens. When the assistant
  can use files, give `ChatComposer` an `accept`; sent files show as `AttachmentChip`s in the user's turn. An answer
  built on the person's data or documents cites them (`CitedText` + `SourceList`); the latest answer can end
  with `FollowUpSuggestions`. A cancelled tool
  call is `stopped`, not `error`.
- **Forms:** a `Label` for every field, `DatePicker` for a single date, errors next to the field (`aria-invalid` + a `text-destructive`
  line), the submit button names the action.
- **Confirmations:** `AlertDialog` for destructive actions, its button says what happens. `toast()` for
  done-and-undo.
- **Empty and loading:** every list has an `EmptyState` with the next step; `Skeleton` for content shapes.
- **Shadow:** only on what you can press or what floats (dialogs, popovers, menus, toasts). Content is flat.
- **Responsive:** design at 375px and 1280px. Sidebars collapse into a sheet (`AppShell` does), tables
  scroll inside their card, grids drop columns.

Worked examples of the first three: `/dashboard` (an AppShell app with a chart, a filtered table, a dialog
form, settings and a guarded delete), `/landing` and `/assistant`.

## Anti-patterns

- ✗ Cards inside cards. ✗ Identical icon + heading + body cards repeated as filler.
- ✗ Brand colour on selected tabs, chips or nav items. ✗ Grey-on-grey text below 4.5:1.
- ✗ More than one primary button in view. ✗ “OK”/“Submit” as the label of a consequential action.
- ✗ Modals as the default home for secondary content. ✗ Icon-only buttons without `aria-label`.
- ✗ An assistant that acts without asking, or hides what it did.

## Hallucination guard

Before writing JSX, list the components you intend to use. Every name must appear in the registry above
**exactly**. If you need something else: stop, describe the gap in one line, and use the `add-component`
skill. Do not import from UI libraries that are not in `package.json` (no MUI, Chakra, Mantine, Ant).
