# Cofounder (cofounder.co): research notes

Researched 2026-11-03. What it is, where it touches Halftone, and what Halftone could take from it. The roadmap
proposals that came out of it are under "Ideas waiting for a decision" in the root `ROADMAP.md`; none is decided.

## What it is

Cofounder, by The General Intelligence Company of New York, sells "infrastructure for the one-person billion-dollar
company": one manager agent that hands work to specialist agents for engineering, sales, marketing, design, finance
and ops. It claims over 10,000 companies (their own count) and raised a $2M pre-seed in April 2025 (Compound, Acrew).

- **Flow:** Launch (positioning, a logo and brand spec, a marketing site), Grow (research, outreach, newsletters),
  Operate (forming an LLC, analytics, support, recurring workflows).
- **Cofounder 2 is agent-first.** The person's own agent (Claude Code, Codex, Cursor, ChatGPT) does the work through
  a remote MCP server or a CLI; the web dashboard is where they follow along and approve. Every operation exists as
  an MCP tool, a CLI command and a REST endpoint, documented side by side.
- **Keeping the agent in line:**
  - Onboarding is one prompt pasted into the agent: add the server, sign in, follow a `skill.md`.
  - Guides are skills the agent reads before acting.
  - Approval gates: it never spends money or provisions anything unasked. Steps only the person can do come back as
    a link.
  - Responses carry `next_steps`. Long jobs return at once, and the agent checks their status before saying done.
  - A shared event log carries progress across sessions and agents.
  - "What should I work on next?" answers with 2–3 options and recommends one.
- **Pricing:** $40 a month per company, with $40 of credits that roll over. A comparison table frames it as
  replacing an $11,000+ a month stack, including "design systems and landing pages, ~$3,000 a project".
- **Site:** a pixel-art hero ("should feel like a video game"), off-white, a custom font, a floating pill nav,
  numbered chapters (1.0 Launch, 1.1 …) and a free founder guide as content marketing.

## Where it touches Halftone

- **It has shipped Halftone's "a theme from a URL".** `cofounder design extract <url>` saves a JSON of colours,
  type, surfaces, components and layout, and a guide applies it to a Next.js app. Shallow next to Halftone (no
  ramps, no contrast, no editor, web only), but founders get "a design system" as a side effect of a $40 tool.
- **Brand is one step in its launch checklist.** Halftone is the deep version of that one step, on phone and web.

## What Halftone could take

1. **Halftone as a tool for other people's agents.** A Studio MCP server (already under "Later: agent reach")
   exposing systems, `.halftone.json`, apply and the catalogue. The catch: systems live in the browser
   (IndexedDB), so before accounts it needs a local bridge, for example `halftone-tokens studio connect` linking an
   agent session to the open Studio tab. That choice comes before accounts, not after.
2. **A theme from a URL, done properly:** extract a site into a full editable system (ramps from its colours,
   contrast fixed, both kits), opened in the Studio. A clear edge over a JSON dump.
3. **Agent conventions for the CLI and the skills:** `next_steps` in every command's output, `--json` everywhere,
   steps only the person can do handed back as a link, "suggest 2–3 next tasks, recommend one", and a one-prompt
   install that points at a `skill.md`.
4. **Marketing frames:** a "what it replaces" table (a design-system project from an agency vs. free and open),
   numbered chapters on the home page, a free guide such as "Brand a prototype in an afternoon".
5. **For accounts, later:** per-company pricing with rolling credits is a reference for per-system plans.

Not worth copying: the breadth. Design is a footnote in its 30-guide product; Halftone's edge is being the best at
that one step.

## Sources

- https://cofounder.co/, https://cofounder.co/pricing, https://cofounder.co/resources/introducing-cofounder-2
- https://docs.cofounder.co/introduction, https://docs.cofounder.co/guide/design,
  https://docs.cofounder.co/get-started/how-your-agent-works
- Funding: https://alleywatch.com/2025/04/the-alleywatch-startup-daily-funding-report-4-15-2025/ (later seed
  figures conflict between sources)
