# Design system

The visual rules and the component registry for this kit. **Read this before writing any UI.**
Engineering conventions (routing, state, workflows) live in `AGENTS.md`.

Every rule says what to do, *why*, and when (if ever) to break it. For a case a rule doesn't list, apply its why. When
the why doesn't settle it, ask.

> **Core rule.** Never introduce a colour, spacing value, component or pattern that is not
> defined here without flagging it first. Never invent a component name. If it is not in the
> registry, say so and ask before building. Everything in the registry is previewed live in
> the app under **Components** and **Foundations**.
> *Why:* a prototype built only from the kit re-brands with one theme and reads as one product. Anything from outside
> keeps its own look when the theme changes, and an invented name either fails to import or becomes a look-alike nobody
> maintains. *Break it only* after flagging the gap and getting a yes, and then through the `add-component` skill, so the
> new piece joins the registry.

## Tokens

Single source of truth: `tokens/tokens.json` (DTCG). `npm run tokens:build` regenerates
`global.css` (CSS variables), `lib/theme.ts` (TS mirror), `tokens/generated/tailwind.theme.js`, the
web theme `tokens/generated/web.css` (Tailwind 4 / shadcn, oklch) and `DESIGN.md`.
To re-brand a project, apply a theme (`npx halftone-tokens theme apply <code>`, see the `apply-theme` skill), or change
`tokens.json` and rebuild.

- **Never edit the generated files.** *Why:* `tokens:build` writes them from `tokens.json`, so a hand edit is lost on
  the next build. There is no exception.
- **The build checks contrast.** Every `X` / `X-foreground` pairing, and muted text on every surface it sits on, must
  clear WCAG AA (4.5:1) in both themes; `tokens:build` names any that falls short with its ratio, and `--strict` (how
  Halftone's own kits build) fails on it. A brightened accent needs dark text on it, not white: that is why the dark
  `*-foreground` tokens are `neutral.950` while the light ones are `neutral.0`.
  *Why:* 4.5:1 is the WCAG AA level for body text, and a prototype is read on a phone, often outside. *Break it only*
  when the person chose the colour knowingly. Say so, and the project builds without `--strict`.

### Colour — semantic names only

Use the shadcn vocabulary through Tailwind classes. Each name works as `bg-`, `text-`, `border-`.

| Name | Use |
|---|---|
| `background` / `foreground` | page canvas / default text |
| `card` / `card-foreground` | raised surfaces |
| `popover` / `popover-foreground` | menus, sheets |
| `primary` / `primary-foreground` | the brand action colour and text on it |
| `secondary` / `secondary-foreground` | quieter fills |
| `muted` / `muted-foreground` | subtle fills, helper text, placeholders |
| `accent` / `accent-foreground` | hover/pressed fills |
| `destructive` / `-foreground` | delete, errors |
| `success`, `warning`, `info` (+ `-foreground`) | status |
| `<tone>-subtle` / `<tone>-border` (primary, success, warning, destructive, info) | a tinted surface (Alert, IconCircle, Spot, PromoCard, a selected card) and its edge: ramp steps, not an alpha |
| `muted-subtle` | a surface a step off the page (a placeholder, an open row, a quiet band) |
| `primary-pressed`, `secondary-pressed` | the pressed fill of a `bg-primary` / `bg-secondary` control that isn't a Button |
| `border`, `input`, `ring` | hairlines, field borders, focus |
| `button` / `button-foreground` / `button-edge` | the theme's button style's colours (the primary Button's defaults) |
| `field` / `field-edge` | the theme's field style's colours (Input, Textarea and Select's defaults) |
| `button-<variant>-bg` / `-fg` / `-border` / `-pressed`, `chip-…`, `badge-…`, `field-<state>-…` | the component layer: each variant's colours, as the theme sets them (Button, FilterChip, Badge and the fields use them) |
| `chart-1` … `chart-5` | data series |

Rules:
- **Never a hex literal or `rgb()` in `app/`, `components/` or `prototype/`.** *Why:* a literal doesn't change with the
  theme or with dark mode, so after a re-brand it is the one colour on screen that is wrong. *Break it only for* SVG
  fills and native props (charts, StatusBar), which take `usePalette().<name>` from `lib/palette-context.tsx`. Never
  read `THEME[scheme]` directly (lint rule): the palette follows a runtime theme override, THEME doesn't.
- **No Tailwind palette colours** (`bg-blue-500`, `text-gray-400`). *Why:* they don't follow the theme or the brand.
  *Break it only for* black at an opacity as a shade: the scrim (`bg-black/50`) and a shadow's depth (`shadow-black/20`).
- Lint enforces these in every screen and component outside `components/ui` and `components/kit`
  (`halftone/no-raw-colour`): a raw colour is an error that names the semantic class to use instead.
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
  each is a ramp step per theme (a light step on a light page, a dark one on a dark page). Pressed is
  `active:bg-primary-pressed` / `active:bg-secondary-pressed` (the next step of the ramp), not `/90`. Text on a tint is
  `text-foreground` (or `text-muted-foreground`). `tokens:build` checks every tint's text and icon.
  *Why:* a tone as small text on its own tint can measure under 4.5:1 (primary on `primary-subtle` 4.24, destructive
  4.09). *Break it only for* the icon (3:1, checked) or a dot, which carry the tone.
- Lint enforces it everywhere, `components/ui` and `components/kit` included (`halftone/no-alpha-colour`): a
  `bg-`, `text-` or `border-` colour at an opacity is an error that names the role to use. The overlays it allows:
  the scrim (`bg-black/50`) and a frosted bar (`bg-background/90` with `backdrop-blur`). Focus halos are `ring-*`.
- **Selected is neutral; the brand colour is for the primary action and focus.** Segments, tabs and the active range
  select with an inverted foreground. A selected FilterChip is the theme's Chip `selected` colour: inverted by default.
  *Why:* the brand colour marks the one thing to do next, and on a selected tab it competes with that. An inverted
  foreground also clears contrast under any theme, where a brand colour may not. *Break it only* through the theme: a
  system may make the Chip's selected colour a role such as primary. Never colour one by hand.
- **Never colour alone.** A status carries a word or an icon as well as its colour (a StatusDot beside its label, an
  Alert's icon and title). *Why:* some people can't tell the colours apart, and sunlight and dark mode change them
  (WCAG 1.4.1). There is no exception.
- **Styles are the theme's, not the screen's.** The theme picks the primary button (solid, soft, outline,
  raised), the text fields (outline, filled, underline), and each component's corner, size, text and variant
  colours; `Button`, `FilterChip`, `Badge`, `Input`, `Textarea` and `Select` already draw them
  (`bg-button-primary-bg`, `rounded-button`, `h-field-md`…). Never restyle one in a screen (no `bg-primary` on a
  `Button`, no `border-b` field, no `h-9` or `rounded-md` on a Button). Inside the primary `Button`, a `Spinner` takes
  `tone="button-foreground"`; an `Icon` needs no colour.
  *Why:* one system sets these for both kits (Studio on the docs site). A restyle in a screen survives the next
  re-brand, and that screen's button stops matching every other. There is no exception: a look a screen needs is a
  theme change, or a new variant through the `add-component` skill.
- **Light and dark are both required.** Every component is checked in both on the Components page. *Why:* the
  viewer's phone picks the theme, so a prototype is seen in whichever one they use. There is no exception.

### Sizing and tap targets

- **Controls take their size from the theme.** Button, FilterChip, Badge, Input, Textarea and Select take their
  corners, heights, padding and text from the theme's component layer (`semantic.component.*`, the same in both
  kits): `h-button-md` (48 by default), `h-button-sm` (40), `h-button-lg` (56), `h-chip-md` (36), `h-field-md` (48);
  `rounded-button`, `rounded-chip`, `rounded-badge`; `text-type-button`… Other controls follow the theme's density:
  `h-control` (48), `h-control-sm` (40), `h-control-lg` (56), padding `px-control-x`. Switch 51×31, radio and
  checkbox 24. *Why:* the theme sets sizes once for both kits, and a hard-coded height keeps its size when the system
  changes. There is no exception: a different size is the component's `size` prop.
- **Tap targets are at least 44×44.** Button, FilterChip and Select raise a target under 44 to 44 (hitSlop), and a
  text field is at least 44 tall. *Why:* a fingertip covers about 44 pt (Apple's default target); a smaller one gets
  missed, or hits its neighbour. *Break it only for* a control drawn smaller whose hitSlop or label brings the target to
  44 (a 24 checkbox inside its row).

### Spacing — the 4-pt grid

- **Spacing comes from the scale:** Tailwind's numeric scale, restricted to `0 1 2 3 4 5 6 8 10 12 16` (0, 4, 8, 12,
  16, 20, 24, 32, 40, 48, 64 px). Screen edge padding `px-5`, gap between sections `gap-5`, card inner padding `p-4`,
  list rows `py-3`. *Why:* space shows what belongs together: close means related, more space starts a new group or
  gives weight. One scale keeps those steps the same on every screen. *Break it only for* half steps (`0.5`, `1.5`,
  `2.5`) inside a component's small parts, and the clearance under a fixed bar (`pb-32`).
- **`gap-*` between siblings, not margins.** *Why:* the gap belongs to the parent, so adding, hiding or reordering a
  child never leaves a stray or doubled space. *Break it only for* an overlap on purpose (AvatarGroup's negative
  margin) or one child that sits apart from the rest.
- **Vary spacing to show hierarchy.** The values above are defaults. A group that belongs together sits closer than
  the groups around it. *Why:* the same padding on every element flattens the screen, so nothing reads as grouped or
  as more important. There is no exception.

### Radius

<!-- GENERATED:tokens:radius -->
`rounded-sm` 6 · `rounded-md` 8 (inputs) · `rounded-lg` 10 (cards, sheets base) · `rounded-xl` 16 · `rounded-2xl` 20 (sheet tops, hero surfaces) · `rounded-control` pill (pill controls: FloatingButton, SwipeToConfirm) · `rounded-full` (avatars, dots).
<!-- /GENERATED:tokens:radius -->

- **Corners come from the theme.** Buttons, chips and badges use their component corners (`rounded-button`,
  `rounded-chip`, `rounded-badge`: pills by default, a Foundations corner or px when the theme says so); the text
  fields use `rounded-t-field rounded-b-field-b`. Everything else uses the scale above, which the theme scales from its
  base (`rounded-lg`). *Why:* the radius is part of the brand and changes with it; a fixed corner stays behind when the
  system changes. *Break it only for* `rounded-full` on what is round by nature (avatars, dots, thumbs).
- **A thumb on a track is `bg-card`, not `bg-background`** (the SegmentedControl thumb, the Switch thumb, the Slider
  handle). *Why:* it must stay the raised colour if the page surface is ever tinted. There is no exception.

### Typography

The theme's fonts (`lib/fonts.ts`): h1–h4 and titles take the heading font, everything else the body font;
add `font-heading` to make any Text a heading.

- **Text is `<Text variant>` from `components/ui/text`:** `h1 h2 h3 h4 lead p large small muted code blockquote`.
  Never `Text` from `react-native` in a screen (lint). Each variant is one of the theme's text styles (size, line
  height, weight, tracking from `--type-<variant>-*` in global.css; font role and weight in `TOKENS.textStyles`).
  *Why:* an edited style in tokens.json then changes every use of it, and react-native's `Text` takes none of the
  theme's fonts or colours. *Break it only for* a size no variant fits: `text-xs sm base lg xl 2xl 3xl 4xl` on `<Text>`.
- **Weights: `font-medium` for row titles, `font-semibold` for headings and values, `font-bold` for the hero amount
  only.** *Why:* bold is the loudest weight. Kept for the one figure the screen is about, it stays loud; on every value,
  none stands out. Mark a section with a heading variant, not bold body text. There is no exception.

### Depth and borders

- **Elevation is the theme's three levels:** `shadow-sm` (controls, cards that press), `shadow-md` (raised cards,
  popovers), `shadow-lg` (menus, dialogs, floating buttons). No shadow colour (`shadow-black/5`) on surfaces. *Why:*
  the theme owns depth, its shadows and their colour, and a surface's own shadow colour stays put through a re-brand.
  *Break it only for* a thumb or a floating element that must separate on any theme (Switch, Slider and segmented
  thumbs, toasts, the floating button, KitChip): `shadow-black/20` deepens the level's shadow.
- **`border` is the theme's width; `border-2` and `border-hairline` stay fixed.** *Why:* a system can make borders thin
  or none, and a shape that is only a line (a radio ring, a badge's cut-out, the Timeline's current step) would vanish
  with it. *Break it only for* such shapes: everything else takes `border`.
- **Icons take the theme's stroke;** an Icon's `strokeWidth` is relative to 2. *Why:* the stroke is the brand's, and
  an icon set apart from it looks borrowed. There is no exception.

### Motion

- **Duration grows with distance:** `TOKENS.duration.fast` 150 (micro-feedback), `base` 200 (most transitions), `slow`
  300 (sheets, large surfaces). Easings: `standard` for enters and moves, `emphasized` for hero moments, `exit` for
  leaving. *Why:* a big surface moving as fast as a toggle looks like a jump, and a toggle as slow as a sheet feels
  laggy. The exit easing speeds up as it leaves, which reads as gone. *Break it only for* motion that follows a finger
  (it tracks the gesture) and reduced motion (0 ms, see Patterns).
- **A haptic marks a change of value or an outcome, never a plain tap:** `haptic()` from `lib/haptics`, `selection` on
  toggles and steps, `light` on a keypad's backspace, `success` on commit. *Why:* these are the platform's patterns for
  those meanings, and a haptic on every tap stops meaning anything. There is no exception, and nothing may depend on a
  haptic: people turn them off.

### Icons

- **Lucide only, through `<Icon as={SomeIcon} />` from `components/ui/icon`.** Colour with `text-*` classes. *Why:* one
  set takes the theme's stroke and sizes, and a second set looks different beside it (`halftone/no-foreign-ui`).
  *Break it only for* the brand mark, which is `Logo`.
- **Size follows where it sits:** 14 inline; 16 in fields; 20 in rows and menus; 24 in headers. Button, chip and badge
  icons are the theme's (16, 14, 12 by default). *Why:* an icon matches the text beside it, so the line reads as one.
  There is no exception.
- **Icon-only buttons only for icons everyone knows** (close, search, share, more), always with an
  `accessibilityLabel`, and never for a destructive action. *Why:* people learn an action faster from a word than from
  an icon, and a screen reader has only the label. There is no exception.

## Component registry

Two folders, one rule: **use what's here, extend before duplicating, register anything new.** *Why:* the lint, the
Components page and llms.txt all read the registry, so a component outside it is invisible to the next person or agent.

- `components/ui/*` — react-native-reusables (shadcn for RN). Owned source; edit if needed.
- `components/kit/*` — ours. Composed from `ui` primitives, className-only styling.

The tables are generated from `registry/components.ts` by `npm run registry:build`: edit that file, not the
tables. Text between `GENERATED` markers is overwritten.

### Actions
<!-- GENERATED:registry:actions -->
| Component | Path | Notes |
|---|---|---|
| Button | `components/ui/button.tsx` | `variant` default/secondary/outline/ghost/link/destructive · `size` sm/default/lg/icon · children are `<Text>`/`<Icon>` |
| Toggle | `components/ui/toggle.tsx` | pressed two-state button |
| ToggleGroup | `components/ui/toggle-group.tsx` | `type` single/multiple |
| FloatingButton | `components/kit/floating-button.tsx` | floats OVER the scroll (a Button flows with it) · Material calls it a FAB · `icon label? variant position` · one per screen |
| IconBadge | `components/kit/icon-badge.tsx` | icon button with unread count/dot · always labelled |
| SwipeToConfirm | `components/kit/swipe-to-confirm.tsx` | drag past 85% commits · `tone` primary/destructive · reset via `key` |
| ActionGrid | `components/kit/action-grid.tsx` | the row of shortcuts under a screen hero · 3–4 `items`, one row only, last tile is "More" |
<!-- /GENERATED:registry:actions -->

### Inputs & selection
<!-- GENERATED:registry:inputs -->
| Component | Path | Notes |
|---|---|---|
| Input | `components/ui/input.tsx` | always with `Label` |
| Label | `components/ui/label.tsx` | `htmlFor` · own `onPress` on native |
| Textarea | `components/ui/textarea.tsx` | |
| Checkbox | `components/ui/checkbox.tsx` | `checked onCheckedChange` |
| RadioGroup | `components/ui/radio-group.tsx` | `RadioGroupItem value id` · a `Label htmlFor` the same id names it |
| Switch | `components/ui/switch.tsx` | settings on/off |
| Select | `components/ui/select.tsx` | pass safe-area `insets` to `SelectContent` |
| FilterChip / FilterChipRow | `components/kit/filter-chip.tsx` | filter chips · selected is the theme's Chip colour (inverted by default) |
| SegmentedControl | `components/kit/segmented-control.tsx` | 2–4 options, animated thumb |
| SearchField | `components/kit/search-field.tsx` | Input + search icon + clear |
| QuantityStepper | `components/kit/quantity-stepper.tsx` | `min max step` |
| Rating | `components/kit/rating.tsx` | stars · display (half stars, `showValue`, `count`) or input with `onChange` (44pt radio stars) |
| AmountInput | `components/kit/amount-input.tsx` | hero money field · `editable={false}` with keypad |
| NumericKeypad | `components/kit/numeric-keypad.tsx` | 3×4 in-app keypad, keys on `bg-muted` |
| OtpInput | `components/kit/otp-input.tsx` | N-digit code, paste-aware |
| PasswordInput | `components/kit/password-input.tsx` | Input + show/hide |
| SelectableCard | `components/kit/selectable-card.tsx` | card as a radio/checkbox choice |
| Slider | `components/kit/slider.tsx` | continuous/stepped · `tone` · `accessibilityLabel` names it |
| DatePicker | `components/kit/date-picker.tsx` | field trigger → Calendar in a Sheet |
| Calendar | `components/kit/calendar.tsx` | month grid |
| RangeSelector | `components/kit/range-selector.tsx` | trackless chart range (1D·1W·1M·1Y·ALL), active is a filled disc |
<!-- /GENERATED:registry:inputs -->

### Navigation
<!-- GENERATED:registry:navigation -->
| Component | Path | Notes |
|---|---|---|
| Tabs | `components/ui/tabs.tsx` | in-page content switching |
| Menubar | `components/ui/menubar.tsx` | web/desktop pattern |
| TabBar / TabBarItem / `tabIcon` | `components/kit/tab-bar.tsx` | custom bottom tab bar: opaque tints, label, active dot under the label |
| KitChip | `components/kit/kit-chip.tsx` | scaffolding, not a product component: the way back to the kit from a sample. Not on the Components page; delete it with the kit shell |
| Stepper | `components/kit/stepper.tsx` | `numbered` / `compact` flow progress |
| SectionHeader | `components/kit/section-header.tsx` | title + action, outside the card |
| ScreenHeader | `components/kit/screen-header.tsx` | the in-body page title + intro · one per screen, first child of the ScrollView |
| PagerDots | `components/kit/pager-dots.tsx` | |
| HorizontalPager | `components/kit/horizontal-pager.tsx` | snap pager + dots |
<!-- /GENERATED:registry:navigation -->

App tabs and stacks are Expo Router: `app/(kit)/_layout.tsx` shows the pattern; prototypes own their `app/` routes.

### Data display
<!-- GENERATED:registry:data -->
| Component | Path | Notes |
|---|---|---|
| Text | `components/ui/text.tsx` | the only Text · the scale is previewed in **Foundations › Typography**, not Components |
| Avatar | `components/ui/avatar.tsx` | image + fallback initials |
| AvatarGroup | `components/kit/avatar-group.tsx` | overlapping avatars + "+N" |
| Badge | `components/ui/badge.tsx` | tag/pill/count · tint with semantic classes |
| Separator | `components/ui/separator.tsx` | |
| ListRow | `components/kit/list-row.tsx` | ONE row · the canonical row · `last` on the final row · `select={{mode,selected}}` makes it a radio/checkbox row |
| ListGroup | `components/kit/list-group.tsx` | the CONTAINER around rows: owns the title, dividers, footnote and card/plain surface · wraps ListRows and sets `last` for you · `variant` card/plain (plain = settings look) |
| IconCircle | `components/kit/icon-circle.tsx` | leading icon well, row scale (≤44px) · `shape` circle/square · `tone` |
| KeyValueList / SummaryCard | `components/kit/key-value-list.tsx` | label/value rows, optionally in a Card |
| StatTile | `components/kit/stat-tile.tsx` | KPI tile with delta |
| PercentChange | `components/kit/percent-change.tsx` | signed % with trend icon |
| ProgressRing | `components/kit/progress-ring.tsx` | circular determinate progress |
| StatusDot | `components/kit/status-dot.tsx` | |
| Timeline | `components/kit/timeline.tsx` | vertical status steps joined by a line · each `done` / `current` / `upcoming` with time and note |
| LineChart | `components/kit/line-chart.tsx` | interactive/sparkline · `area` · `onPointerChange` |
| BarChart | `components/kit/bar-chart.tsx` | plain Views |
| DonutChart / ChartLegend | `components/kit/donut-chart.tsx` | ring + legend |
| ValueHeader | `components/kit/value-header.tsx` | hero figure + caption · `maskable` adds the eye toggle |
<!-- /GENERATED:registry:data -->

### Feedback & status
<!-- GENERATED:registry:feedback -->
| Component | Path | Notes |
|---|---|---|
| Alert | `components/ui/alert.tsx` | inline, persistent · `variant` default/info/success/warning/destructive · `icon` · `onDismiss`/`action` make it a nudge |
| Progress | `components/ui/progress.tsx` | 0–100 |
| Skeleton | `components/ui/skeleton.tsx` | |
| Tooltip | `components/ui/tooltip.tsx` | |
| `useToast` / ToastProvider | `components/kit/toast.tsx` | transient · `ToastProvider` is in the root layout |
| Spinner | `components/kit/spinner.tsx` | themed ActivityIndicator · announced as "Loading" |
| EmptyState | `components/kit/empty-state.tsx` | `default` / `compact` |
| SuccessScreen | `components/kit/success-screen.tsx` | the one success template |
<!-- /GENERATED:registry:feedback -->

### Containers & layout
<!-- GENERATED:registry:layout -->
| Component | Path | Notes |
|---|---|---|
| Card | `components/ui/card.tsx` | never nest cards; titles sit outside · **flat — a shadow means pressable or floating** |
| Accordion | `components/ui/accordion.tsx` | |
| Collapsible | `components/ui/collapsible.tsx` | |
| StickyBottomBar | `components/kit/sticky-bottom-bar.tsx` | safe-area action bar under a ScrollView (`pb-32`) |
| PromoCard | `components/kit/promo-card.tsx` | tinted offer/nudge card · circular arrow CTA, dismiss X, generated art · one per screen |
| Footnote | `components/kit/footnote.tsx` | small print / disclosure, last in the scroll |
| Prose | `components/kit/prose.tsx` | long-form text (articles, help, onboarding copy) at the theme's typeset: flow, measure, leading |
<!-- /GENERATED:registry:layout -->

### Overlays
<!-- GENERATED:registry:overlays -->
| Component | Path | Notes |
|---|---|---|
| Dialog | `components/ui/dialog.tsx` | edits with a form |
| AlertDialog | `components/ui/alert-dialog.tsx` | confirmations |
| Popover | `components/ui/popover.tsx` | |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | pass `insets` |
| ContextMenu | `components/ui/context-menu.tsx` | long-press |
| HoverCard | `components/ui/hover-card.tsx` | |
| Sheet | `components/kit/sheet.tsx` | bottom sheet shell |
| OptionSheet | `components/kit/sheet.tsx` | pick one of N |
| ActionSheet | `components/kit/sheet.tsx` | list of actions + Cancel |
<!-- /GENERATED:registry:overlays -->

### Media & icons
<!-- GENERATED:registry:media -->
| Component | Path | Notes |
|---|---|---|
| Icon | `components/ui/icon.tsx` | lucide wrapper |
| Logo | `components/kit/logo.tsx` | the brand from lib/brand.ts (Studio › Use system › Brand assets) · one-colour logos follow the theme · placeholder + name without one |
| ImageTile | `components/kit/image-tile.tsx` | rounded image · `seed` draws generated art when there is no `source` |
| AspectRatio | `components/ui/aspect-ratio.tsx` | |
| Placeholder | `components/kit/placeholder.tsx` | deterministic abstract SVG art from a `seed` · the kit ships no raster imagery |
| Spot | `components/kit/spot.tsx` | an icon at illustration scale (≥64px) · EmptyState, SuccessScreen and PermissionPrimer all use it |
<!-- /GENERATED:registry:media -->

### Marketing
<!-- GENERATED:registry:marketing -->
| Component | Path | Notes |
|---|---|---|
| PricingCard | `components/kit/pricing-card.tsx` | one plan · stack 2–3 on a paywall · `highlighted` on one |
<!-- /GENERATED:registry:marketing -->

### AI product

The parts of an assistant inside an app: turns, the composer, sources, tool calls and approvals. The web kit has
the same components with the same props (presses become `onPress`; the composer's attachments come from `onAttach`).

<!-- GENERATED:registry:ai -->
| Component | Path | Notes |
|---|---|---|
| ChatMessage | `components/kit/chat-message.tsx` | one turn · user = bubble on the right, assistant = plain text on the left |
| ChatComposer | `components/kit/chat-composer.tsx` | the arrow sends · `busy` turns Send into Stop · `onAttach` turns on attachments (paperclip, chips) |
| AttachmentChip / `formatBytes` | `components/kit/attachment-chip.tsx` | a file in a conversation: icon by type, name, size · `onRemove` while composing |
| ChatThreadList | `components/kit/chat-thread-list.tsx` | past conversations, grouped by when · `threads activeId onSelect onNew?` |
| SourceList / CitedText / `stripCitations` | `components/kit/sources.tsx` | what an answer is based on · numbered chips · `[n]` in text → inline citations · previews in a Sheet |
| FollowUpSuggestions | `components/kit/follow-up-suggestions.tsx` | next questions under the latest answer · tapping one sends it |
| StreamingText / `useStreamingText` | `components/kit/streaming-text.tsx` | an answer arriving · all at once under reduced motion · screen readers get it once |
| ThinkingIndicator | `components/kit/thinking-indicator.tsx` | the model is working · say what it is doing when you can · still dots under reduced motion |
| ToolCallCard | `components/kit/tool-call-card.tsx` | an action the assistant took · `status` running/done/error/stopped · details collapsed |
| ApprovalCard | `components/kit/approval-card.tsx` | consent before consequence · says what changes and whether it can be undone |
<!-- /GENERATED:registry:ai -->

### Device capabilities

Everything here resolves through `lib/native.ts` + `useCapability()`: when the real thing cannot
run — the web preview, a simulator, Expo Go, a denied permission — the component draws a simulated
version instead of an error. `simulate` forces the fallback; the kit-wide switch is in Settings.

<!-- GENERATED:registry:native -->
| Component | Path | Notes |
|---|---|---|
| PhotoCapture | `components/kit/photo-capture.tsx` | camera + library · falls back to a seeded `Placeholder` |
| CodeScanner | `components/kit/code-scanner.tsx` | QR/barcode viewfinder · simulated emits a sample payload |
| BiometricGate / `useBiometricAuth` | `components/kit/biometric-gate.tsx` | Face ID gate, or the hook for a single action · real only in a dev build |
| PermissionPrimer | `components/kit/permission-primer.tsx` | shown BEFORE the OS dialog · the skip is not optional |
| `useShare` | `components/kit/share.ts` | OS share sheet · copies to the clipboard on web |
| `useNotify` / NotifyProvider | `components/kit/notify.tsx` | in-app banner now (`delay: 0`), real OS notification when scheduled |
<!-- /GENERATED:registry:native -->

Reality check: photos, camera, scanning and local notifications work in Expo Go on a phone.
The iOS Simulator has no camera. Face ID does **not** work in Expo Go — use the dev client.
Remote push is gone from Expo Go since SDK 53.

## Patterns

#### Screens and layout

- **Screen skeleton:** `ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 p-5 pb-32"` →
  sections (`SectionHeader` + `Card` of `ListRow`s) → `StickyBottomBar` after the ScrollView when there is a primary
  action. *Why:* every screen scrolls the same way, its last row clears the bottom bar, and the screens read as one app.
  *Break it only for* a screen that doesn't scroll by nature: a camera or scanner, a chat with its composer pinned, a
  SuccessScreen.
- **A title sits on the thing it names.** A group of rows takes its title above it, outside the card (`SectionHeader`,
  or `ListGroup`'s title). A card that is one thing (a chart, a form, a plan) takes its title at its top, inside. Never
  both on one group. *Why:* a title above a list names the whole group and leaves the card to its rows; a chart or a
  form is one object, and its title travels with it. There is no exception.
- **One surface per group: never a card inside a card.** Rows inside a card are `ListRow`s, divided by the list, or a
  `Separator`. *Why:* a card says "this is one group". A second card inside adds an edge and padding without a second
  meaning. There is no exception.
- **Items of one kind are a list; cards are for mixed things.** Records people scan, search or compare (orders,
  people, transactions) are a `ListGroup`. Cards hold different things side by side (a chart, a KPI, a list). *Why:* a
  list keeps each field in the same place, so the eye runs down a column. Cards move the fields, take more room and hide
  the order. *Break it only for* things people choose by looking (products, photos, places): a grid of `ImageTile`s.
- **Left-align text**, empty and success states included (`EmptyState` and `SuccessScreen` do). *Why:* every line
  starts at the same edge, so the eye finds the next line and the next block without searching. *Break it only for* a
  figure or a label alone in a small space (a key on the NumericKeypad, the value in a ProgressRing).
- **Overlays are for short, scoped tasks:** confirming, picking one of many, a short edit form. Secondary content goes
  on the screen or its own route, one overlay at a time, each with a way out. *Why:* an overlay stops the task and
  hides what the person may need to answer it. There is no exception.
- **Pickers:** `OptionSheet` on phones; `Select` when the list is short and the field sits in a form. *Why:* a sheet
  is in thumb reach and has room for a long list; a Select's menu suits a short list beside other fields. There is no
  exception.
- **Tracking:** what already happened and what comes next (an order, a delivery, an application) is a `Timeline` in a
  `Card`. `Stepper` is for a flow the person is filling in. *Why:* a Stepper shows where the person is in something they
  are doing; a Timeline records events they don't control. There is no exception.

#### Actions

- **One primary action in view.** Everything else is secondary, outline or ghost. *Why:* the filled button is where the
  eye goes first; two of them compete, and the person has to work out which is the next step. *Break it only for* an
  overlay, which has its own primary, and several empty states shown at once, whose actions drop to secondary.
- **A button names its action** ("Delete 3 photos", "Pay £40"), never "OK" or "Submit" on something with a
  consequence. *Why:* people read the button, not the sentence above it, and a generic label hides what happens.
  *Break it only for* the standard words (Done, Cancel, Close, Back), and OK on an alert that only informs.
- **The cost of a mistake sets the friction.** Reversible: do it, and offer Undo in a toast. Irreversible or costly: an
  `AlertDialog` that names the thing and the effect, its button naming the action, Cancel never the default. Moving
  money or deleting for good: `SwipeToConfirm`. *Why:* a confirmation people see on every tap gets tapped through, so it
  is kept for what can't be taken back. There is no exception.
- **States only on what acts:** a pressed look (`active:bg-accent`, a dimmed row) goes only on something with an
  `onPress`: a Button, a ListRow with `onPress`, a card that opens. In the web build the same goes for hover.
  *Why:* a state is a promise that something happens. A row that reacts and does nothing reads as broken, and
  an agent or a tester reading the screen will try to tap it. *When a whole row or card acts,* the state goes on
  that one element, never on its parts as well. There is no exception: read-only content never reacts.
- **Prefer an enabled button that says what's missing over a disabled one.** When something is disabled, it is the
  theme's 50%, never restyled. *Why:* a disabled control can't say why it is off, and its contrast is exempt from WCAG,
  so some people can't read it. *Break it only for* an action in progress: disabled with a `Spinner`, so it can't be
  sent twice.
- **Forms:** a `Label` for every field, errors next to the field (`aria-invalid` and a `text-destructive` line under
  it), and the button names the action. *Why:* the Label is the field's name for a screen reader, and an error beside
  its field says where to fix it. There is no exception.
- **Asking for a rating:** after the thing is done (an order delivered), as an input `Rating` in its own `Card` with a
  toast to thank them. Show a score as a display `Rating` with the number. *Why:* asked mid-task, it interrupts, and
  the answer is about the interruption. There is no exception.

#### Feedback

- **A finished task ends on `SuccessScreen`; a single action gets a toast.** An order, a payment or a sign-up ends on
  the success screen, with what happens next and a `StickyBottomBar` with "Done". A saved setting or an archived item
  gets a toast. *Why:* a task the person worked through needs a clear end and a receipt; a small action only needs a
  nod, without leaving the screen. There is no exception.
- **A toast confirms; it never carries what someone must not miss.** An error that needs action goes next to its field
  or in an `Alert`. *Why:* a toast leaves on a timer, and anyone looking away, or on a screen reader, can miss it.
  There is no exception.
- **Anything that can be empty has an `EmptyState` with the next step.** *Why:* a blank area reads as broken or still
  loading; the empty state says what goes there and how to start. *Break it only for* a space with no next step: a
  search with no results says so, with a way to clear it.
- **Loading:** `Skeleton` for content, `Spinner` inside a button (`tone="button-foreground"` on the primary one),
  `Progress` when you know how far. *Why:* a skeleton shows what is coming and keeps the layout from jumping; a spinner
  in a button ties the wait to that action. *Break it only for* a wait under a second, which shows nothing.
- **Shadow only on what presses or floats** (dialogs, sheets, menus, toasts, the FloatingButton). Content is flat, and
  so are fields, which are neither. *Why:* a shadow reads as "this lifts off the page", so on static content it promises
  something that isn't there. *Break it only through* the theme: a system may give its fields a shadow in Studio.
  Never add one by hand.
- **Permission:** `PermissionPrimer` before the OS dialog, always with a skip that runs the simulated path. Never show a
  raw denied state. Keep its copy in step with the strings in `app.json`. *Why:* the primer and the OS dialog saying
  the same thing is what earns the grant, and the skip means a prototype never dead-ends on a permission the viewer
  declined. There is no exception.

#### Motion and access

- **Motion:** anything that slides, springs or moves calls `useMotion()` / `useReducedMotion()` from
  `lib/reduced-motion.ts` and collapses to 0 ms when the OS asks. *Why:* the setting is there for people whom motion
  makes dizzy. `components/ui` gets it from reanimated's `ReduceMotion.System`, but the kit's `Animated` code has no
  equivalent, so each component has to ask. There is no exception: a new animated component without it is a bug.
- **Every control has a name.** A Switch, RadioGroupItem or Checkbox needs a `Label htmlFor` its `id`, or an
  `aria-label` (a Switch at the end of a ListRow); an icon-only button needs an `accessibilityLabel`. *Why:* a screen
  reader announces the name and nothing else. There is no exception.
- **State goes in the `aria-*` props** (`aria-checked`, `aria-selected`, `aria-valuenow`), not
  `accessibilityState` / `accessibilityValue`. *Why:* the web export drops the `accessibility*` props, and native reads
  `aria-*` too. *Break it only for* a selected `button` (chip, segment, day), which keeps
  `accessibilityState={{ selected }}` for native and adds `aria-pressed` for web.
- **One group picks one or picks any, never both.** Radios and checkboxes go in separate groups. *Why:* they look
  alike, and mixed in one group people can't tell which choices exclude each other. There is no exception.

## Anti-patterns

A last look before saying done. Each one breaks a rule above, which says why.

- ✗ A card inside a card. ✗ A section title inside a card of rows. ✗ Centred blocks of text.
- ✗ Cards for a list of like items. ✗ The same padding on every element.
- ✗ Radio and checkbox choices in one group.
- ✗ An overlay as the default home for secondary content.
- ✗ Brand colour put on selected chips or tabs by hand. ✗ Colour as the only signal. ✗ Grey-on-grey text below 4.5:1.
- ✗ A pressed look on something that does nothing when tapped.
- ✗ Two primary buttons in view. ✗ "OK" or "Submit" on an action with a consequence.
- ✗ A confirmation dialog for something Undo could take back.
- ✗ Tap targets under 44×44. ✗ A control without a name.
- ✗ A toast carrying an error someone must act on. ✗ A blank list.

## Hallucination guard

- **Before writing JSX, list the components you intend to use.** Every name must appear in the registry above
  **exactly**. If you need something else: stop, describe the gap in one line, and use the `add-component` skill. Do
  not import from `react-native-paper`, `@expo/vector-icons`, `gluestack` or any UI library that is not in
  `package.json`. *Why:* a name that isn't in the registry is a guess; it either fails to import or produces a
  look-alike outside the theme that nobody maintains. There is no exception.
- **`npm run lint` enforces this:** an import from `components/ui` or `components/kit` that the registry doesn't list,
  another UI library, or `Text` / `TextInput` / `Pressable` from react-native in a screen is an error (`halftone/*`
  rules). *Break it only* with `// eslint-disable-next-line <rule> -- <reason>`, the reason saying why the kit can't do
  it (for example, a whole product card that is one tap target).
