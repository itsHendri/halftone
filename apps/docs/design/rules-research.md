# Rules research: what real design systems say

Done 2026-10-28 for "every rule with its why and its exceptions". The user asked for a deep dive into real design systems
before the kits' rules get their reasons, and said rules should be universal, not split by platform.

Sources read: Apple HIG (alerts, modality, colour, haptics, accessibility, lists, segmented controls), GOV.UK Design System
and Service Manual, IBM Carbon (buttons, empty states, loading, motion, spacing), Atlassian (elevation, typography, flags),
Shopify Polaris (Section), NN/g (cards, confirmation dialogs, modals, skeleton screens), WCAG 2.2 (2.5.8, 1.4.11). Material 3's
site renders client-side and could not be read; its numbers below come from Google's Android accessibility pages and are
marked.

Each entry: what the sources say, then the rule we would write (**rule**, *Why*, *Break it only for*), and whether it keeps,
changes, adds or drops a rule in the guides.

## Layout and content

### Section titles and cards (changes: one rule for both kits)
- Apple: the grouped list "uses headers, footers, and additional space to separate groups of data". The header sits above
  the group.
- Polaris: a Section's heading sits "at the top of the section", inside its card; a nested section "doesn't draw its own
  card", so nesting is structure, not another surface.
- Today the mobile guide says titles go outside the card, and the web dashboard puts `CardTitle` inside. Both are right for
  different things. The rule that holds on both platforms is about what the title names.

**A title sits on the thing it names.** A group of rows takes its title above it (`SectionHeader`, or `ListGroup`'s
title). A card that is one thing (a chart, a form, a plan) takes its title at its top, inside. Never both on one group.
*Why:* a title above a list names the whole group and keeps the card for its rows. A chart or a form is one object, and its
title travels with it. *Break it:* no exception.

### Alignment (changes)
- Every reading source: left-aligned text is easier to read, because each line starts at the same edge. Centred text breaks that
  edge and slows reading after two or three lines.
- Carbon left-aligns empty states "as a block" in panels and large spaces. It centres only in small tiles, with the image
  above left-aligned text.
- The user (2026-10-28): left aligned is often better.

**Left-align text, empty and success states included.** *Why:* every line starts at the same edge, so the eye finds the next
line and the next block without searching. *Break it only for* one short block alone in a small space (a compact empty state
in a tile), or a marketing Hero of one line and one button.
Follow-up: `SuccessScreen` and `EmptyState` centre today. They would need a left-aligned layout, which is a code change, not docs.

### Cards vs lists (replaces "identical card grids")
- NN/g: "Cards work best for collections of heterogeneous items". Cards "are not appropriate when users search for a
  specific item" and are "a poor choice when users need to compare". Card layouts "are less scannable than lists". Photos are
  "better served by a regular grid".
- Atlassian: don't raise a surface "to group content when a border or white space would suffice".

**Items of one kind are a list; cards are for mixed things.** Records people scan, search or compare (orders, people,
transactions) are a `ListGroup` or a `DataTable`. Cards hold different things side by side (a dashboard: a chart, a KPI, a
list). *Why:* a list keeps each field in the same place, so the eye runs down a column. Cards move the fields, take more room
and hide the order. *Break it only for* things people choose by looking (products, photos, places): a grid of `ImageTile`s.
The old anti-pattern (the same icon, heading and body repeated as filler) becomes a case of this rule. `FeatureGrid` stays for
a marketing page's 3–6 distinct points.

### Imagery (drops)
The user asked to remove the Imagery pattern. `Placeholder` and `Spot` keep their registry notes.

### Spacing (keeps, gains a why)
- Carbon: a fixed scale "provides a consistent approach". Nearby elements read as related; more space "signals higher
  importance". Off-scale values are allowed "but should be avoided"; percentages are fine for widths.
- In our code, screens stay on the scale. The exceptions are half steps (2, 6, 10 px) inside components and `pb-32`, which clears a fixed bar.

**Spacing comes from the scale.** *Why:* space shows what belongs together: close means related, more space means a new
group or more weight. One scale keeps that consistent, and on the web the theme's density scales it. *Break it only for* half
steps inside a component's small parts, and the clearance under a fixed bar (`pb-32`).

## Actions and flows

### Confirmations (changes: one ladder for both kits)
- Apple: "skip alerts for common, undoable actions, even destructive ones". Use an alert for "uncommon destructive actions
  that can't be undone". Always include Cancel, and never make it the default.
- NN/g: confirm "actions with serious consequences", and "do try your best to offer undo". Overuse teaches people to
  click through. Name the item and the effect. Use a stronger confirmation for "the most dangerous and rare" actions.
- GOV.UK: a warning button is for actions "users cannot easily undo", used "very sparingly", after a confirmation step.

**The cost of a mistake sets the friction.** Reversible: do it and offer Undo in a toast. Irreversible or costly: an
`AlertDialog` that names the thing and the effect, with a button that names the action (Cancel never the default). The rarest
and most dangerous (moving money, deleting an account) gets a deliberate gesture: `SwipeToConfirm` on phones, the
`AlertDialog` on the web. *Why:* a confirmation people see on every tap gets clicked through, so it is kept for what can't be
taken back. *Break it:* no exception.
Today mobile says "AlertDialog for reversible", which contradicts every source.

### Multi-step flows (keeps, gains a why; reason needs the user)
- GOV.UK: "each page containing just one thing". This helps people focus, "recover easily from form errors", and use the
  service on mobile.
- Apple: "help people avoid data loss by getting confirmation before closing" a task view.

**A flow is one route with a step state, and each step asks one thing.** *Why (to confirm):* the answers live in one
place for the whole flow, the header, `Stepper` and bottom bar stay put, and one question per step is easier to answer and to
correct. Leaving with answers entered asks first. *Break it:* no exception.

### One primary action (adds to mobile; web has it)
- GOV.UK: "Having more than one main call to action reduces their impact".
- Carbon: "Each page should have only one primary button", except "temporary flows" opened on top.
- Apple: "refrain from adding color to the background of multiple controls".

**One primary action in view.** *Why:* the filled button is where the eye goes first. Two filled buttons compete, and the
person has to work out which one is the next step. *Break it only for* an overlay (a Dialog or Sheet has its own primary), and
for several empty states shown at once, whose actions drop to secondary.

### Labels say what happens (adds to mobile; web has it)
- Apple: "a one- or two-word title that describes the result". "Avoid OK", "avoid Yes and No".
- Carbon: verb + noun. NN/g: "Delete file" / "Keep file".

**A button names its action** ("Delete 3 files", "Pay £40"). *Why:* people read the button, not the sentence above it. A
generic label hides the consequence. *Break it only for* the standard words (Done, Cancel, Close, Back), and OK on an alert
that only informs.

### Disabled controls (adds)
- GOV.UK: avoid disabled buttons; "they have poor contrast and can confuse some users".
- WCAG 1.4.11: inactive components are exempt from contrast, so a disabled control may be unreadable by design.
- Carbon: disable a button while its action runs, to block repeat presses. Halftone's disabled look is fixed at 50%.

**Prefer an enabled button that says what's missing over a disabled one.** When something is disabled, it is the theme's
50%, never restyled. *Why:* a disabled control can't say why it is off, and some people can't read it. *Break it only for* an
action in progress (disabled with a Spinner, so it can't be sent twice).

### Modals (expands the anti-pattern into a rule)
- Apple: modal "only when there's a clear benefit": critical information, confirming an action, "a narrowly scoped task".
  Keep it short, give an obvious way out, one at a time.
- NN/g: modals interrupt, add cognitive load and "block background content". Don't interrupt high-stakes flows like
  checkout. Fix errors in place.

**Overlays are for short, scoped tasks.** Secondary content goes on the screen or its own route. *Why:* an overlay stops the
task, hides what the person may need to answer it, and can't be scrolled with the page or linked. *Break it only for*
confirming, picking one of many (`OptionSheet`, `Select`), or a short edit form. Always with a way to dismiss it, and one at a time.

## Feedback

### Loading (keeps, gains a why)
- NN/g: under 1 s show nothing. Use a skeleton for full-page loads, because it "sets expectations". Use a spinner for one module, for 2–10 s.
  Use a progress bar over 10 s or for uploads.
- Carbon: skeletons "only on container-based components", never on buttons, inputs, toasts or modals.

**A skeleton for content, a spinner for one action, a progress bar when you know how far.** *Why:* a skeleton shows what is
coming and keeps the layout from jumping. A spinner in a button ties the wait to that action. *Break it only for* waits under a
second, which show nothing.

### Success (changes "Always")
- GOV.UK: a confirmation page ends a transaction, says what happens next and gives the reference.
- Atlassian: flags (toasts) are for "brief, transient confirmations".

**A finished task ends on `SuccessScreen`; a single action gets a toast.** An order, a payment or a sign-up ends on the
success screen, with what happens next and a "Done". A saved setting or an archived item gets a toast. *Why:* a task the
person worked through needs a clear end and a receipt. A small action needs only a nod, without leaving the screen.
*Break it:* no exception.

### Toasts (adds)
- Atlassian: never auto-dismiss "critical warnings or errors". Don't rely on flags for critical messages. Keep them short.

**A toast confirms; it never carries what someone must not miss.** Errors that need action go next to the field or in an
`Alert`. *Why:* a toast disappears on a timer, and anyone looking away or using a screen reader can miss it. *Break it:* no
exception.

### Empty states (adds to mobile; web has it)
- Carbon: a short, positive title and the next action. "Avoid ... dead ends". The empty state replaces the element it
  stands in for.

**Anything that can be empty has an `EmptyState` with the next step.** *Why:* a blank area reads as broken or still loading.
The empty state says what goes there and how to start. *Break it only for* a space with no next step (a filtered list that
matches nothing just says so, with a way to clear the filter).

## Visual

### Shadow and elevation (keeps, gains a why; fixes inputs)
- Atlassian: raised is "reserved for movable cards", overlay is for UI over UI (dialogs, menus, floating buttons). Don't raise to
  group content. Shadows are harder to see in dark mode.
- Studio decision 2026-10-26: a boxed Input takes the theme's field shadow, so "inputs are flat" is out of date.

**A shadow means it lifts: it presses or it floats.** *Why:* people read a shadow as "this sits above the page", so on
static content it promises something that isn't there. *Break it only for* the shadow the theme's field style gives a boxed
field. Never add one by hand.

### Colour and selection (keeps, gains a source)
- Apple: reserve colour "for elements that truly benefit from emphasis, such as status indicators or primary actions". Don't
  use the same colour for interactive and non-interactive text. "Avoid relying solely on color".

Keep "selected is neutral, brand is for the primary action and focus". Add a rule: **never colour alone.** A status
carries a word or an icon too (the status Badge has a dot and the word). *Why:* some people can't tell the colours apart, and
grey-scale, sunlight and dark mode change them. *Break it:* no exception (WCAG 1.4.1).

### Weights (keeps, gains a why)
- Atlassian: "Use this weight [bold] sparingly". Headings and metrics are bold. Mark sections with a heading style "rather than
  bold or a change of font size".

**Bold is for the one figure the screen is about.** *Why:* bold is the loudest weight. On every value, none stands out.
A section is marked with a heading variant, not bold body text. *Break it:* no exception.

### Touch targets (keeps for phones, adds for web)
- Apple: 44×44 pt default, 28 minimum. Android/Material (Google's accessibility help): 48×48 dp, with about 8 dp between targets.
- WCAG 2.5.8: 24×24 CSS px, or spaced so a 24 px circle around each touches no other. Text links inside a sentence are exempt.

Phones: **at least 44×44**, and hitSlop counts. *Why:* a fingertip covers about that much, and a smaller target gets missed or
hits its neighbour. Web: **at least 24×24, or spaced** (WCAG 2.5.8). *Break it only for* a link inside a sentence.

### Motion (keeps, gains a why)
- Carbon: "longer distance or scale change calls for longer duration". Exit easing speeds up as the element leaves.
  Expressive motion is for key moments only.
- Apple, Reduce Motion: track gestures directly, and replace slides with fades.

**Duration grows with distance:** fast for feedback, base for most, slow for sheets. *Why:* a big surface moving as fast
as a toggle looks like a jump, and a toggle moving as slowly as a sheet feels laggy. *Break it only for* motion that follows a
finger, which tracks the gesture, and reduced motion, which collapses to 0.

### Haptics (keeps, gains a source)
- Apple: use the system patterns for their meaning (selection "when values ... are changing", success when "a task ... has
  completed", impact for a collision or snap). "Avoid overusing haptics". The app must work with them off.

**A haptic marks a change of value or an outcome, never a plain tap.** *Why:* a haptic on every tap stops meaning anything.
*Break it:* no exception, and nothing may depend on one.

### Icon-only buttons (keeps, gains a limit)
- Carbon: icon-only buttons "sparingly", only for standard icons, always with a tooltip on the web. Danger actions are never
  icon-only.

**Icon-only only for icons everyone knows** (close, search, share, more). They are always labelled, and never for a destructive
action. *Why:* people learn an action faster from a word than from an icon. *Break it:* no exception.

## Open for the user
1. Multi-step flows: confirm the why (state in one place + one frame + one thing per step).
2. Alignment: left-aligned SuccessScreen and EmptyState is a code change in both kits. Do it in this PR, or as a follow-up?
3. Rules not yet written down: one primary, labels, empty states and disabled are proposed above. Anything else?

Sources: [Apple HIG](https://developer.apple.com/design/human-interface-guidelines) ·
[GOV.UK buttons](https://design-system.service.gov.uk/components/button/) ·
[GOV.UK form structure](https://www.gov.uk/service-manual/design/form-structure) ·
[GOV.UK confirmation pages](https://design-system.service.gov.uk/patterns/confirmation-pages/) ·
[Carbon buttons](https://carbondesignsystem.com/components/button/usage/) ·
[Carbon empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/) ·
[Carbon loading](https://carbondesignsystem.com/patterns/loading-pattern/) ·
[Carbon motion](https://carbondesignsystem.com/elements/motion/overview/) ·
[Carbon spacing](https://carbondesignsystem.com/elements/spacing/overview/) ·
[Atlassian elevation](https://atlassian.design/foundations/elevation) ·
[Atlassian typography](https://atlassian.design/foundations/typography) ·
[Atlassian flags](https://atlassian.design/components/flag/usage) ·
[Polaris Section](https://shopify.dev/docs/api/app-home/polaris-web-components/layout-and-structure/section) ·
[NN/g cards](https://www.nngroup.com/articles/cards-component/) ·
[NN/g confirmation dialogs](https://www.nngroup.com/articles/confirmation-dialog/) ·
[NN/g modal dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/) ·
[NN/g skeleton screens](https://www.nngroup.com/articles/skeleton-screens/) ·
[WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) ·
[WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) ·
[Android touch targets](https://support.google.com/accessibility/android/answer/7101858)
