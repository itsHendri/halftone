# Backlog

Durable, human- and agent-readable list of deferred work. Update when you defer or finish something.

_Last updated: 2026-10-15_

## Components
- **AI-UI next:** feedback on an answer (helpful / not, with a reason), regenerate, and a model or mode picker
  in the composer. (Landed: Sources + CitedText, FollowUpSuggestions, ChatThreadList, AttachmentChip +
  ChatComposer `accept`, ToolCallCard `stopped`. The native kit has the same set since 2026-10-13.)
- **Gap analysis vs. shadcn blocks and Halaska's AI patterns** has not been done for the web kit; the native
  kit's BACKLOG has the equivalent for native.
- **Not installed from shadcn:** resizable and sidebar (AppShell covers the common case). input-otp and carousel
  are covered by the kit's own OtpInput and HorizontalPager. Calendar, pagination, navigation-menu, drawer,
  hover-card, context-menu, menubar and aspect-ratio are in.
- **Parity with the native kit is complete:** every native component that isn't device- or touch-only has a web
  version with the same id. New native components should get one too, or a line here saying why not.

## Samples
- Five samples: Northwind as a dashboard, a landing page and an assistant; Shop; Habits. Shop, Habits and the
  dashboard share their data with the native kit's versions, so the docs' Screens page can pair them.
- The Northwind samples share one made-up product but not one store: the assistant's "sent reminders" does not
  change the dashboard's invoices. Fine for showing patterns; revisit if a client wants a joined-up demo.

## Tooling
- **Figma:** `npm run tokens:figma` pushes the tokens; Code Connect for the web components once they settle.
- **Lighthouse in CI** for the kit pages (the docs site is checked by hand today).
- **Releases need a nudge.** The "Version Packages" PR is opened by GitHub Actions' own token, so its checks don't
  start until someone pushes to it or closes and reopens it. A fine-grained token as a repo secret, used by
  `.github/workflows/release.yml`, would make releases hands-off.
