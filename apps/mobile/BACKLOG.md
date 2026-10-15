# Backlog

Durable, human- and agent-readable list of deferred work. Update when you defer or finish something.

_Last updated: 2026-10-15_

## Deferred by decision
- **Scenario system** (several prototypes in one install with a picker and web `/scenarios` index). One prototype per
  clone for now; the kit shell is a route group so it can be hidden later.
- **`publish` skill** (push latest build + web link, incl. group vs channel link rules) and **`figma-web-export`
  skill**: decide after using `npm run share` / `eas deploy` a few times.
- **Ports still not done** from the old kit: Lightbox, ProfileHeader, ChipInput, TimeRangePicker, CountrySelect (needs
  country data), Drawer, Coachmark. (Since covered: Timeline for StatusTimeline, Rating for StarRating, AvatarGroup
  for AvatarStack, HorizontalPager + PagerDots for Carousel and OnboardingSlide, PermissionPrimer for
  PermissionPrompt, ListGroup for SettingsGroup. DataTable, Breadcrumb and Pagination stay web-only by design.)
- **Figma:** `halftone-tokens figma` (`npm run tokens:figma`) pushes the tokens one way as Variables with code syntax;
  Code Connect once the component set is stable.

## Component gaps (vs. Material 3, HIG, gluestack, HeroUI, refreshed 2026-10-15)
Present: 101 components across 11 categories, including the AI set (chat, composer, sources, tool calls,
approvals) and the pricing card that the web kit has too. Still missing, roughly in order of how often prototypes
need them:
- **Collapsing large-title and search headers**: a navigation setting rather than a component (native-stack
  `headerLargeTitle` / `headerSearchBarOptions` on iOS). Worth a documented pattern plus a demo screen.
- **Time picker** (Calendar covers dates) and **range slider** (two thumbs).
- **Phone field** with country code, **chip input** (tags).
- **Banner** (full-width, persistent, above content; Alert is inline) and **snackbar with an action** (Toast has
  none yet).
- **Pull-to-refresh** wrapper, **infinite list** footer loader, **section list** with sticky headers.
- **Lightbox**, **image upload tile**, **video and audio placeholders**.
- **Countdown**, **copyable field**, **QR code** (generating one; scanning exists).
- **Drawer / side menu**, **coachmark / tooltip tour**.

## Upgrades to schedule
- **Expo SDK 58.** Still on the `next` tag (58.0.8 on 2026-10-15; `latest` is 57). The upgrade is prepared on
  branch `chore/sdk-58` (it predates the monorepo: replay with `git format-patch` and `git am --directory=apps/mobile`,
  and redo the install without `--legacy-peer-deps`). Brings native tabs at the stable path, data loaders, SSR.
- **NativeWind 5 + Tailwind 4** when NativeWind 5 reaches `latest` (RC since 2026-09-13). The tokens layer survives it.
- **`@expo/ui`** (SwiftUI/Compose controls) and **`expo-glass-effect`**: evaluate for native-feel controls after SDK 58.

## Tooling
- **An axe sweep of the whole kit in CI.** The docs site's a11y gate only checks the frames it embeds. A sweep of
  every Components page category, Foundations and the three samples, light and dark, was clean on 2026-10-15 (run by
  hand against the docs build's `/m`); making it a CI step would keep it that way.

## Known rough edges
- **VoiceOver and labels.** `RadioGroupItem` and `Switch` are named by their `Label` through `aria-labelledby`, which
  web and Android honour; on iOS, VoiceOver reads the Label as its own element. Give the control its own
  `accessibilityLabel` where it matters (the samples' settings rows do).
- `Sheet` exit is a plain fade (RN Modal); a slide-out needs a mounted-state dance the React Compiler rules dislike.
- Haptics/blur only verified on the simulator; feel on a physical device still to confirm.
- Web `Select`/`DropdownMenu` positioning relies on rn-primitives portals; check on narrow viewports.
- Dev builds and Expo Go draw a draggable "Tools" gear at the top right whose touch area (gear + 10pt) covers the
  `SearchField` clear button and part of the header theme toggle on the Components page. Dev tooling only, not in
  production; drag the gear away when testing those controls.
- One iOS session (2026-10-06) had the top two-thirds of the Components page search field ignore taps until a Fast
  Refresh cleared it. Not reproduced after cold launch, simulator reboot or `expo start -c`. If it comes back, log
  `onTouchStart` on the root view to see whether the tap reaches React Native at all.

## Fixed (2026-10-15), kept so nobody re-reports them
- TabBar items without a `tablist` parent (the Components page demo), the Progress bar without a name, the chat
  composer's placeholder at 2.5:1 on web, PagerDots' label on a role-less div, scroll rows with nothing focusable.
- A destructive menu item on its red focus tint (4.14:1): destructive items now take the neutral `accent` highlight,
  in both kits' dropdown, context and menubar menus.
