# Kit navigation — decision record (living contract)

Builds that contradict this must stop and re-check here first. Updated in place; no v2 files.

## Thesis
The kit shell (Kit · Foundations · Components · Settings) is a browser. Prototypes hosted in
the same app own their whole chrome; the only kit affordance over them is a floating chip.

## Decisions (2026-09-22)
- **Exit from a hosted prototype: floating "Kit" chip** (option B). Rendered once in the
  prototype's root layout, top-right, safe-area aware, on every screen. Replaces the earlier
  "Back to the kit" button buried in Settings. Rejected: modal presentation (A) — the sample
  should feel like an app, not a sheet; header back links (C) — forces every prototype header
  to reserve a slot.
- **Two sample apps** instead of one finance app: **Shop and orders** (widest component
  coverage: lists, chips, quantity, selectable cards, checkout stepper, swipe to pay, success,
  order status) and **Habit tracker** (rings, charts, calendar, switches, sliders). Finance
  demo copy removed everywhere (sheets, success screen, amount fields keep a currency symbol only).
- **Components hub**: one screen, search on top, categories as disclosures, all collapsed by
  default, one open at a time, count in a badge, leading icon never tints. No nested category
  screens. Deep links: `/components?open=<category>`.
- **Previews show the component, not code.** The API line lives in the registry data and
  DESIGN_SYSTEM.md.
- **Tab order**: Kit, Foundations, Components, Settings. Active tab: colour + dot under the label.

## Per-surface rules
- Kit home: counts, Browse (Foundations, Components), Sample apps, How it works. No category list.
- Hosted prototype root layout: `<Stack …/>` then `<KitChip />`.
- Sample apps: mock data and a tiny store under `components/<app>/`; screens use registry
  components only; every flow ends in `SuccessScreen` + `StickyBottomBar`.

## Explicitly deferred
- Scenario picker / multiple prototypes per install beyond the two samples.
- Top app bar variants for prototypes (large title, search-in-header).

## Phasing
1. KitChip + hub rules (done). 2. Shop sample. 3. Habits sample. 4. Re-verify on device, publish.
