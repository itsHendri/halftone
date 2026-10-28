# Design system

The visual rules and the component registry for the web kit. **Read this before writing any UI.**
Engineering conventions (routes, state, workflows) live in `AGENTS.md`.

Every rule says what to do, *why*, and when (if ever) to break it. For a case a rule doesn't list, apply its why. When
the why doesn't settle it, ask. The mobile kit has the same rules; they differ only where the platform does (hover
here, hitSlop and haptics there).

> **Core rule.** Never introduce a colour, spacing value, component or pattern that is not defined here
> without flagging it first. Never invent a component name. If it is not in the registry, say so and ask
> before building. Everything in the registry is previewed live at **/components**.
> *Why:* a prototype built only from the kit re-brands with one theme and reads as one product. Anything from outside
> keeps its own look when the theme changes, and an invented name either fails to import or becomes a look-alike nobody
> maintains. *Break it only* after flagging the gap and getting a yes, and then through the `add-component` skill, so the
> new piece joins the registry.

## Tokens

Single source of truth: `tokens/tokens.json` (DTCG), shared with the mobile kit. `npm run tokens:build`
regenerates `app/tokens.css` (Tailwind 4 / shadcn variables, oklch), `lib/theme.ts`, `DESIGN.md` and
`tokens/generated/`. In the Halftone monorepo the brand is edited in `apps/mobile/tokens/tokens.json` and copied here
with `npm run tokens:sync`.

- **Never edit the generated files.** *Why:* `tokens:build` writes them from `tokens.json`, so a hand edit is lost on
  the next build. There is no exception.
- **The build checks contrast.** Every `X` / `X-foreground` pairing, muted text on every surface, and each status
  colour used as text must clear WCAG AA (4.5:1) in both themes; `tokens:build` names any that falls short, and
  `--strict` (how Halftone's own kits build) fails on it. *Why:* 4.5:1 is the WCAG AA level for body text, and a
  prototype is shown on screens and projectors you don't control. *Break it only* when the person chose the colour
  knowingly. Say so, and the project builds without `--strict`.

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
| `<tone>-subtle` / `<tone>-border` (primary, success, warning, destructive, info) | a tinted surface (Alert, IconCircle, Spot, PromoCard, a selected card) and its edge: ramp steps, not an alpha |
| `muted-subtle` | a surface a step off the page (a placeholder, a quiet band, the showcase canvas) |
| `primary-pressed`, `secondary-pressed` | the hover/pressed fill of a `bg-primary` / `bg-secondary` control that isn't a Button |
| `border`, `input`, `ring` | hairlines, field borders, focus |
| `button` / `button-foreground` / `button-edge` | the theme's button style's colours (the primary Button's defaults) |
| `field` / `field-edge` | the theme's field style's colours (Input, Textarea and Select's defaults) |
| `button-<variant>-bg` / `-fg` / `-border` / `-pressed`, `chip-…`, `badge-…`, `field-<state>-…` | the component layer: each variant's colours, as the theme sets them (Button, FilterChip, Badge and the fields use them) |
| `sidebar*` | the app shell's sidebar surface, its active item and border |
| `chart-1` … `chart-5` | data series (through a ChartConfig) |

Rules:
- **No hex, `rgb()` or Tailwind palette colours (`bg-blue-500`, `text-white`) in `app/` or `components/`.** *Why:* a
  literal or a palette colour doesn't change with the theme or with dark mode, so after a re-brand it is the one colour
  on screen that is wrong. *Break it only for* black at an opacity as a shade (the modal scrim `bg-black/50` in the
  shadcn overlays), and chart or SVG colours, which take a token variable (`var(--chart-1)`). Lint enforces this
  outside `components/ui` and `components/kit` (`halftone/no-raw-colour`), naming the semantic class to use.
- **Colours come from the ramps, not from opacity.** Fills, text and borders are roles or ramp steps
  (`bg-primary-subtle`, never `bg-primary/15`); the component layer (Button, FilterChip, Badge and the fields) uses
  no opacity at all, and its hover and pressed colours are the next ramp step.
  *Why:* a colour at partial opacity takes on whatever is behind it, so its contrast changes with the surface (the
  page, a grey card, dark mode) and no build can check it. A ramp step is one known colour per theme, which
  `tokens:build` checks against the text and icons that sit on it.
  *Break it only for overlays*, which exist to show what is behind them: the scrim behind a sheet or dialog
  (`bg-black/50`), a frosted bar (`bg-background/90` with `backdrop-blur`), a focus ring's halo (`ring-ring/50`), a
  control drawn over a photo or the camera image.
- **A tint is a role, and the text on it stays neutral.** The tints are `bg-primary-subtle`, `bg-success-subtle`,
  `bg-warning-subtle`, `bg-destructive-subtle`, `bg-info-subtle` with `border-<tone>-border`, and `bg-muted-subtle`;
  each is a ramp step per theme (a light step on a light page, a dark one on a dark page). Hover and pressed are
  `hover:bg-primary-pressed` / `hover:bg-secondary-pressed` (the next step of the ramp), not `/90`. Text on a tint is
  `text-foreground` (or `text-muted-foreground`); a status badge is an outline Badge with a coloured dot.
  `tokens:build` checks every tint's text and icon.
  *Why:* a tone as small text on its own tint can measure under 4.5:1 (primary on `primary-subtle` 4.24, destructive
  4.09). *Break it only for* the icon (3:1, checked) or a dot, which carry the tone.
- Lint enforces it everywhere, `components/ui` and `components/kit` included (`halftone/no-alpha-colour`): a
  `bg-`, `text-` or `border-` colour at an opacity is an error that names the role to use. The overlays it allows:
  the scrim (`bg-black/50`) and a frosted bar (`bg-background/90` with `backdrop-blur`). Focus halos are `ring-*`.
- **Selected is neutral; the brand colour is for the primary action and focus.** Tabs, segmented controls, nav items
  and the active range select with a neutral or inverted foreground. A selected FilterChip is the theme's Chip
  `selected` colour: inverted by default. *Why:* the brand colour marks the one thing to do next, and on a selected tab
  it competes with that. A neutral selection also clears contrast under any theme, where a brand colour may not.
  *Break it only* through the theme: a system may make the Chip's selected colour a role such as primary. Never colour
  one by hand.
- **Never colour alone.** A status carries a word or an icon as well as its colour (a Badge's dot and word, a
  StatusDot beside its label, a chart's legend). *Why:* some people can't tell the colours apart, and screens and
  projectors change them (WCAG 1.4.1). There is no exception.
- **Styles are the theme's, not the screen's.** The theme picks the primary button (solid, soft, outline,
  raised), the text fields (outline, filled, underline), and each component's corner, size, text and variant
  colours, the same as the mobile kit's; `Button`, `FilterChip`, `Badge`, `Input`, `Textarea` and `Select` already
  draw them (`bg-button-primary-bg`, `rounded-button`, `h-(--button-h-md)`, `type-button`…). Never restyle one in
  a page (no `bg-primary` on a `Button`, no `border-b` field, no `h-9` or `rounded-md` on a Button). Inside the primary
  `Button`, a `Spinner` takes `tone="button-foreground"`; an `Icon` needs no colour.
  *Why:* one system sets these for both kits (Studio on the docs site). A restyle in a page survives the next
  re-brand, and that page's button stops matching every other. There is no exception: a look a page needs is a theme
  change, or a new variant through the `add-component` skill.
- **Light and dark are both required.** *Why:* the viewer's system picks the theme, so a prototype is seen in whichever
  one they use. There is no exception.

### Sizing and targets

- **Controls take their size from the theme.** Button, FilterChip, Badge, Input, Textarea and Select take their
  corners, heights, padding and text from the theme's component layer, the same as the mobile kit's (one theme for
  both kits): `rounded-button`, `rounded-chip`, `rounded-badge` (pills by default), `h-(--button-h-md)` (48 by default),
  `h-(--field-h-md)`, `type-button`. *Why:* the theme sets sizes once for both kits, and a hard-coded height keeps its
  size when the system changes. There is no exception: a different size is the component's `size` prop.
- **A click target is at least 24×24, or spaced so it can't be mistaken for its neighbour** (WCAG 2.5.8). *Why:* a
  small target is hard to hit with a shaky hand or a trackpad, and too close to the next one it gets the wrong click.
  *Break it only for* a link inside a sentence.

### Spacing

- **Spacing comes from the scale:** Tailwind's numeric scale on a 4-pt grid, `0 1 2 3 4 5 6 8 10 12 16` (0–64 px).
  Page gutters `px-4 sm:px-6 lg:px-8`, sections `gap-8`–`gap-12`, inside cards `p-5`/`p-6`. The theme's density scales
  the whole scale (`--spacing` × 0.875 compact, × 1.125 spacious). *Why:* space shows what belongs together: close means
  related, more space starts a new group or gives weight. One scale keeps those steps the same on every page, and only
  values on it follow the density. *Break it only for* half steps (`0.5`, `1.5`, `2.5`) inside a component's small
  parts, a hero's or a marketing section's own breathing room (`py-20`, `gap-24`), and the clearance under a fixed bar.
- **`gap-*` between siblings, not margins.** *Why:* the gap belongs to the parent, so adding, hiding or reordering a
  child never leaves a stray or doubled space. *Break it only for* an overlap on purpose (AvatarGroup's negative
  margin) or one child that sits apart from the rest.
- **Vary spacing to show hierarchy.** The values above are defaults. A group that belongs together sits closer than
  the groups around it. *Why:* the same padding on every element flattens the page, so nothing reads as grouped or as
  more important. There is no exception.

### Radius

<!-- GENERATED:tokens:radius -->
`rounded-sm` 6 · `rounded-md` 8 (inputs) · `rounded-lg` 10 (cards, dialogs) · `rounded-xl` 16 (panels, tables) · `rounded-2xl` 20 (hero surfaces) · `rounded-full` (avatars, pills).
<!-- /GENERATED:tokens:radius -->

- **Corners come from the theme.** Buttons, chips and badges use their component corners; everything else uses the
  scale above, which the theme scales from its base. *Why:* the radius is part of the brand and changes with it; a
  fixed corner stays behind when the system changes. *Break it only for* `rounded-full` on what is round by nature
  (avatars, dots, thumbs).
- **A thumb on a track is `bg-card`, not `bg-background`** (the SegmentedControl thumb, the Switch thumb, the Slider
  handle). *Why:* it must stay the raised colour if the page surface is ever tinted. There is no exception.

### Typography

The theme's fonts (`app/fonts.ts`): h1–h4 and card titles take the heading font (`font-heading`), everything
else the body font (`font-sans`). Page title `text-2xl sm:text-3xl font-semibold tracking-tight` (PageHeader does
this); section titles `text-lg`/`text-xl font-semibold`; body `text-base` with `leading-7` for prose; helper text
`text-sm text-muted-foreground`.

- **Text takes the theme's text styles,** the mobile kit's Text variants as utilities: `type-h1 type-h2 type-h3 type-h4
  type-lead type-p type-large type-small type-muted type-code type-blockquote` (font, size, line height, tracking and
  weight from `--type-<style>-*`; `leading-*`, `tracking-*` and `font-*` still override). Prose's running text is
  `type-p`. *Why:* an edited style in tokens.json then changes every use of it, in both kits. *Break it only for* a size
  no style fits: Tailwind's `text-*` sizes.
- **Weights: `font-medium` for row titles, `font-semibold` for headings and values, `font-bold` for the hero figure
  only.** *Why:* bold is the loudest weight. Kept for the one figure the page is about, it stays loud; on every value,
  none stands out. Mark a section with a heading, not bold body text. There is no exception.
- **`tabular-nums` for figures** in tables, tiles and amounts. *Why:* every digit takes the same width, so columns line
  up and a changing number doesn't shift. *Break it only for* a number inside running text.

### Depth and borders

- **Elevation is the theme's three levels:** `shadow-xs`/`shadow-sm` (controls, cards that press), `shadow-md`
  (raised, popovers), `shadow-lg`/`shadow-xl` (menus, dialogs). No shadow colour on surfaces. *Why:* the theme owns
  depth, its shadows and their colour, and a surface's own shadow colour stays put through a re-brand. *Break it only
  for* a thumb or a floating element that must separate on any theme: `shadow-black/20` deepens the level's shadow.
- **`border` is the theme's width.** *Why:* a system can make borders thin or none, and the page follows it. *Break it
  only for* a shape that is only a line (a radio ring, a badge's cut-out, the Timeline's current step), which keeps
  `border-2` so it can't vanish.
- **Lucide icons take the theme's stroke.** *Why:* the stroke is the brand's, and an icon set apart from it looks
  borrowed. There is no exception.

### Motion

- **Duration grows with distance:** 150 ms for hover and small feedback, 200 ms for most transitions, 300 ms for
  sheets. *Why:* a big surface moving as fast as a hover looks like a jump, and a hover as slow as a sheet feels laggy.
  *Break it only for* motion that follows the pointer (it tracks the drag) and reduced motion (below).
- **Anything that moves respects reduced motion:** `motion-safe:`/`motion-reduce:` or `useReducedMotion()` from
  `hooks/use-reduced-motion.ts`. *Why:* the setting is there for people whom motion makes dizzy. There is no exception.

### Icons

- **lucide-react only.** *Why:* one set takes the theme's stroke and sizes, and a second set looks different beside it
  (`halftone/no-foreign-ui`). *Break it only for* the brand mark, which is `Logo`.
- **Size follows where it sits:** `size-4` in buttons and menus, `size-5` in headers and feature blocks. *Why:* an icon
  matches the text beside it, so the line reads as one. There is no exception.
- **Icon-only buttons only for icons everyone knows** (close, search, share, more), always with an `aria-label` and a
  `Tooltip`, and never for a destructive action. *Why:* people learn an action faster from a word than from an icon; a
  screen reader has only the label, and a pointer user only the tooltip. There is no exception.

## Component registry

Two folders, one rule: **use what's here, extend before duplicating, register anything new.** *Why:* the lint, the
/components page, the shadcn registry and llms.txt all read the registry, so a component outside it is invisible to the
next person or agent.

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
| FilterChip / FilterChipRow | `components/kit/filter-chip.tsx` | filter chips in a scrolling row · selected is the theme's Chip colour (inverted by default) |
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
| Logo | `components/kit/logo.tsx` | the brand from lib/brand.ts (Studio › Use system › Brand assets) · one-colour logos take the text colour · placeholder + name without one |
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

#### Pages and layout

- **App page:** `AppShell` in the prototype's `layout.tsx` → `PageHeader` → 2–4 `StatTile`s → `Card`s or a
  `DataTable`. The page's primary action sits in the PageHeader. *Why:* every app page has the same shape, so a viewer
  finds the title, the numbers and the detail in the same places. *Break it only for* a page that is one tool (an
  editor, a map, a conversation): AppShell and PageHeader, then the tool.
- **Marketing page:** `Hero` → `FeatureGrid` → social proof or a product shot → `PricingCard`s → FAQ
  (`Accordion`) → a closing call to action. One promise, one primary action, repeated at the end. *Why:* a visitor
  decides in seconds; one promise and one action keep the decision simple, and the repeat catches those who read on.
  There is no exception.
- **AI conversation:** `ChatMessage`s in a centred column (`max-w-3xl`), `ChatComposer` pinned at the bottom.
  Show work as it happens (`ThinkingIndicator`, `ToolCallCard`), stream the answer (`StreamingText`), and ask
  with an `ApprovalCard` before anything irreversible or costly (consent before consequence). Past
  conversations go in a `ChatThreadList`: a sidebar on desktop, a Sheet on small screens. When the assistant
  can use files, give `ChatComposer` an `accept`; sent files show as `AttachmentChip`s in the user's turn. An answer
  built on the person's data or documents cites them (`CitedText` + `SourceList`); the latest answer can end
  with `FollowUpSuggestions`. A cancelled tool call is `stopped`, not `error`. *Why:* the person can't see the model
  work. Showing each step, citing what an answer rests on and asking before acting keep them in charge and let them
  stop it. There is no exception.
- **Responsive:** design at 375px and 1280px. Sidebars collapse into a sheet (`AppShell` does), tables scroll inside
  their card, grids drop columns. *Why:* 375 and 1280 are the narrow phone and the common laptop, the two ends a
  prototype is shown on, and `qc:look` checks both. There is no exception.
- **A title sits on the thing it names.** A group of rows takes its title above it, outside the card (`SectionHeader`,
  or `ListGroup`'s title). A card that is one thing (a chart, a form, a plan) takes its title at its top, inside
  (`CardHeader`). Never both on one group. *Why:* a title above a list names the whole group and leaves the card to its
  rows; a chart or a form is one object, and its title travels with it. There is no exception.
- **One surface per group: never a card inside a card.** Rows inside a card are `ListRow`s, divided by the list, or a
  `Separator`. *Why:* a card says "this is one group". A second card inside adds an edge and padding without a second
  meaning. There is no exception.
- **Items of one kind are a list; cards are for mixed things.** Records people scan, search or compare (orders,
  people, invoices) are a `ListGroup` or a `DataTable`. Cards hold different things side by side (a dashboard: a chart,
  a KPI, a list). *Why:* a list keeps each field in the same place, so the eye runs down a column. Cards move the
  fields, take more room and hide the order. *Break it only for* things people choose by looking (products, photos,
  places): a grid of `ImageTile`s. A marketing page's `FeatureGrid` holds 3–6 points that differ, not one point
  repeated.
- **Left-align text**, empty and success states included (`EmptyState` and `SuccessScreen` do). *Why:* every line
  starts at the same edge, so the eye finds the next line and the next block without searching. *Break it only for* a
  marketing `Hero` without media (one line and one button), and a figure or a label alone in a small space.
- **Overlays are for short, scoped tasks:** confirming, picking, a short edit form (`Dialog`), a record's details or
  filters (`Sheet`). Secondary content goes on the page or its own route, one overlay at a time, each with a way out.
  *Why:* an overlay stops the task, hides what the person may need to answer it, and can't be linked or scrolled with
  the page. There is no exception.

#### Actions

- **One primary action in view.** Everything else is secondary, outline or ghost. *Why:* the filled button is where the
  eye goes first; two of them compete, and the person has to work out which is the next step. *Break it only for* an
  overlay, which has its own primary, and several empty states shown at once, whose actions drop to secondary.
- **A button names its action** ("Delete 3 invoices", "Send invite"), never "OK" or "Submit" on something with a
  consequence. *Why:* people read the button, not the sentence above it, and a generic label hides what happens.
  *Break it only for* the standard words (Done, Cancel, Close, Back), and OK on an alert that only informs.
- **The cost of a mistake sets the friction.** Reversible: do it, and offer Undo in a `toast()`. Irreversible or
  costly: an `AlertDialog` that names the thing and the effect, its button naming the action, Cancel never the
  default. *Why:* a confirmation people see on every click gets clicked through, so it is kept for what can't be taken
  back. There is no exception.
- **States only on what acts:** a hover or pressed look (`hover:bg-accent`, `active:bg-*`, a shadow that lifts,
  `cursor-pointer`) goes only on an element that does something when clicked: a Button, a link, a ListRow with
  `href` or `onClick`, a card that opens. *Why:* a state is a promise that something happens. A row that lights up
  and does nothing reads as broken, and an agent or a tester reading the page will try to click it. *When a whole
  row or card acts,* the state goes on that one element, never on its parts as well. There is no exception: a
  read-only table row doesn't hover (the kit's `TableRow` doesn't; give a clickable row `hover:bg-muted` and a link).
- **Prefer an enabled button that says what's missing over a disabled one.** When something is disabled, it is the
  theme's 50%, never restyled. *Why:* a disabled control can't say why it is off, and its contrast is exempt from WCAG,
  so some people can't read it. *Break it only for* an action in progress: disabled with a `Spinner`, so it can't be
  sent twice.
- **Forms:** a `Label` for every field, `DatePicker` for a single date, errors next to the field (`aria-invalid` and a
  `text-destructive` line), and the submit button names the action. *Why:* the Label is the field's name for a screen
  reader and a bigger click target, and an error beside its field says where to fix it. There is no exception.

#### Feedback

- **A finished task ends on `SuccessScreen`; a single action gets a toast.** An order, a payment or a sign-up ends on
  the success screen, with what happens next and a "Done". A saved setting or an archived row gets a `toast()`.
  *Why:* a task the person worked through needs a clear end and a receipt; a small action only needs a nod, without
  leaving the page. There is no exception.
- **A toast confirms; it never carries what someone must not miss.** An error that needs action goes next to its field
  or in an `Alert`. *Why:* a toast leaves on a timer, and anyone looking away, or on a screen reader, can miss it.
  There is no exception.
- **Anything that can be empty has an `EmptyState` with the next step.** *Why:* a blank area reads as broken or still
  loading; the empty state says what goes there and how to start. *Break it only for* a space with no next step: a
  filtered table with no matches says so, with a way to clear the filter.
- **Loading:** `Skeleton` for content, `Spinner` inside a button (`tone="button-foreground"` on the primary one),
  `Progress` when you know how far. *Why:* a skeleton shows what is coming and keeps the layout from jumping; a spinner
  in a button ties the wait to that action. *Break it only for* a wait under a second, which shows nothing.
- **Shadow only on what presses or floats** (dialogs, popovers, menus, toasts). Content is flat, and so are fields,
  which are neither. *Why:* a shadow reads as "this lifts off the page", so on static content it promises something
  that isn't there. *Break it only through* the theme: a system may give its fields a shadow in Studio. Never add one by
  hand.

#### Access

- **Every control has a name.** A field has its `Label`, a Switch, Checkbox or radio a `Label htmlFor` its `id` or an
  `aria-label`, an icon-only button an `aria-label`. *Why:* a screen reader announces the name and nothing else. There
  is no exception.
- **One group picks one or picks any, never both.** Radios and checkboxes go in separate groups. *Why:* they look
  alike, and mixed in one group people can't tell which choices exclude each other. There is no exception.

Worked examples of the first three: `/dashboard` (an AppShell app with a chart, a filtered table, a dialog
form, settings and a guarded delete), `/landing` and `/assistant`.

## Anti-patterns

A last look before saying done. Each one breaks a rule above, which says why.

- ✗ A card inside a card. ✗ A section title inside a card of rows. ✗ Centred blocks of text.
- ✗ Cards for a list of like items. ✗ The same padding on every element.
- ✗ Radio and checkbox choices in one group.
- ✗ An overlay as the default home for secondary content.
- ✗ Brand colour put on selected tabs, chips or nav items by hand. ✗ Colour as the only signal. ✗ Grey-on-grey text
  below 4.5:1.
- ✗ A hover or pressed look on something that does nothing when clicked.
- ✗ Two primary buttons in view. ✗ "OK" or "Submit" on an action with a consequence.
- ✗ A confirmation dialog for something Undo could take back.
- ✗ Icon-only buttons without `aria-label`. ✗ A control without a name.
- ✗ A toast carrying an error someone must act on. ✗ A blank list or table.
- ✗ An assistant that acts without asking, or hides what it did.

## Hallucination guard

- **Before writing JSX, list the components you intend to use.** Every name must appear in the registry above
  **exactly**. If you need something else: stop, describe the gap in one line, and use the `add-component` skill. Do
  not import from UI libraries that are not in `package.json` (no MUI, Chakra, Mantine, Ant). *Why:* a name that isn't
  in the registry is a guess; it either fails to import or produces a look-alike outside the theme that nobody
  maintains. There is no exception.
- **`npm run lint` enforces this:** an import from `components/ui` or `components/kit` that the registry doesn't list,
  another UI library, or `recharts` without `ChartContainer` is an error (`halftone/*` rules). *Break it only* with
  `// eslint-disable-next-line <rule> -- <reason>`, the reason saying why the kit can't do it.
