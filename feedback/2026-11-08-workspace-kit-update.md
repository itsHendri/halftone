# Halftone web kit: feedback from updating the workspace dashboard to the 2026-11-08 release

2026-11-08. The workspace dashboard (React 19 and React Router on Vite, a Cloudflare Worker, see
`2026-11-06-workspace-install.md`) moved to the kit release from itsHendri/halftone#106. Re-added with
`npx shadcn add @halftone-web/<name> --overwrite` (shadcn 4.23.0): `lib-link`, `app-shell`, `list-row`, `list-group`,
`section-header` and `alert-dialog`. Then the app wrapped its root in `KitLinkProvider`, deleted its `next/link` and
`next/navigation` adapters and aliases, and swapped four truncate overrides for `ListRow wrap`.

The update did what it said. What follows is what's left, most important first. Each item has what happened, why
it matters, and a suggested fix.

## Issues

### 1. `ListRow wrap` misaligns the leading and trailing slots with the text
- What happened: `wrap` switches the row from `items-center` to `items-start`, so every slot starts at the top of the
  row. The slots aren't the height of a line of text, so they don't line up with the first line. Measured on a to-do
  row (title line 24px, from the top of the row's content):
  - Checkbox (16px): 0 to 16, centre at 8. The text's first line has its centre at 12, so the checkbox sits 4px high.
  - Icon buttons (`size="icon-sm"`, 40px): 0 to 40, centre at 20, 8px below the first line's centre.
  - On one-line rows this is the most visible. Before, everything was centred. Now the checkbox sits high, the text
    sits in the middle, and the buttons hang low.
  - Social rows (a time as leading, a badge and a chevron as trailing) move their badge and chevron to the top. That
    is the right idea, but the badge also doesn't share the text's first-line centre.
- Why it matters: `wrap` is for rows whose text is the point (to-dos, notes), and those rows almost always have a
  checkbox, an icon or row actions. A row that looks a little off on every line is the main use case, not an edge
  case.
- Suggested fix: centre the leading and trailing slots on the first line, not the top of the row. One way is to wrap
  each slot in a box one line tall that centres its child and lets it overflow:
  `<span className="flex h-[1lh] items-center">{leading}</span>` (or `h-6` to match the title's line height). Then
  `items-start` keeps the slots at the top of tall rows, and one-line rows look the same as without `wrap`. The 40px
  icon buttons overflow the 24px box evenly, so the row's height stays the same. Check the result with a Checkbox,
  an Avatar, a Badge and `icon-sm` buttons, with one-line and three-line titles.

### 2. The Checkbox border is hard to see, in light and dark
- What happened: the unchecked Checkbox uses `border-input`. In the kit's default theme that's
  `oklch(0.9197 0.004 286.32)` on a white card in light mode, and `oklch(0.2739 0.0055 286.03)` on a
  `oklch(0.2103 …)` card in dark mode. Both work out to roughly 1.2 to 1.3:1. On the to-do list in dark mode the boxes
  are close to invisible, and the rows look like they have no checkbox at all.
- Why it matters: WCAG 1.4.11 asks for 3:1 for the parts you need to see to use a control. An unchecked checkbox is
  only its border. Stock shadcn has the same problem, but Halftone's contrast check ("contrast AA ✓") suggests the
  theme already covers this, and it doesn't.
- Suggested fix: give the Checkbox (and the Radio and Switch track) their own border token at 3:1 against the card
  and the background, such as `--control-border` built from the ramp's mid-step. Add that pair to the
  `halftone-tokens build` contrast check, so a theme that drops below 3:1 gets flagged.

### 3. ListGroup still clones `last` onto its children, now that CSS does the job
- What happened: ListGroup now drops the last divider in CSS (`*:last:border-b-0`), and it still clones every child to
  set `last: true` on the final one. The clone lands on whatever the child is. In the dashboard that's `TodoRow`, which
  has its own `last` prop with its own meaning ("this to-do can't move down"). It worked out because the meanings
  agree, but a wrapper whose `last` means something else, or that spreads props onto a DOM element, gets a prop it
  never asked for.
- Suggested fix: drop the clone and rely on the CSS. Keep `last` on ListRow for rows used outside a ListGroup. Then the
  doc comment can drop "forward `last` to it: the prop only reaches direct children".

### 4. `lib-link`: say where to define the link and the path hook
- What happened: the doc comment's React Router example is right, but it doesn't say where the two values live. If an
  app writes them inline (`<KitLinkProvider link={({ href, ...p }) => <Link to={href} {...p} />} usePathname={() =>
  useLocation().pathname}>`), both are new every render. The provider's `useMemo` then makes a new context value every
  time, and every `KitLink` re-renders. `usePathname` is also a hook passed as a prop, which the hooks lint can't
  check.
- Suggested fix: one line in the comment and in llms.txt: "Define the link and the path hook once, at module level, not
  inside a component." The dashboard does this in `src/app.tsx`: `const RouterLink = ({ href, ...props }:
  KitLinkProps) => <Link to={href} {...props} />` and `const useRouterPathname = () => useLocation().pathname`.

### 5. "Skipped … use --overwrite" while passing `--overwrite`
- What happened: `npx shadcn add … --overwrite` said "Skipped 4 files: (files might be identical, use --overwrite to
  overwrite)" for `button`, `card`, `sheet` and `alert-dialog`. They were already current. The only difference from
  the registry is the `"use client"` line that shadcn removes when `rsc` is false. The message reads like the update
  didn't apply, and it took a diff against the registry JSON to be sure.
- Suggested fix: the message is shadcn's, but install.md's update section (or `halftone-tokens doctor`) could say:
  "Skipped as identical with `--overwrite` means the file is already current." A doctor check that compares each kit
  file with the registry, ignoring `"use client"`, and prints "up to date" or "differs" would answer the question
  directly.

## What worked well
- `lib-link` fixed the problem the right way. The app sets the router once, in its own code. The kit files stay as the
  registry ships them, and the next `--overwrite` can't undo the setup. Deleting the adapters and the Vite and
  tsconfig aliases took a few minutes.
- AppShell's closest-match rule works: `/brands/halftone` lights Brands only, and Home stays unlit.
- Client-side navigation through `KitLink` works in the sidebar and in the mobile sheet. The sheet closes on a tap, and
  the page doesn't reload.
- `ListRow wrap` and the CSS divider rule removed every workaround from the first install. The four className
  overrides and the hand-forwarded `last` are gone.
- `alert-dialog` now depends on the kit's button, so the kit's `button.tsx` survives the add.
