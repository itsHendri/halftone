---
name: transcript-to-prototype
description: Turn a client conversation (meeting transcript, notes, a brief, or a BRIEF.md from the Halftone brief wizard) into a first working web prototype inside this kit (dashboard, marketing page or AI product), built only from registry components. Use when given a transcript/brief and asked to "build a prototype", "make a first version", "turn this into pages", or "scaffold the app from this conversation".
---

# Transcript → prototype (web)

Input: a transcript or brief (pasted, or a file path), or a BRIEF.md from the Halftone brief wizard
(halftonedesignsystem.com/brief). Output: a browsable prototype in its own folder
under `app/`, mock data beside it, and a short brief that records the decisions.

Work in this order. Do not skip the brief: it is what the client sees first and what keeps the build honest.
The plan stops for the person's approval (step 3) before any code: changing a page list is cheaper than changing
pages.

## 1. Extract (no code yet)

Read the whole transcript. Write `app/<slug>/BRIEF.md` from `BRIEF.template.md` (beside this skill).

**From the brief wizard:** keep the person's answers in their words. Leave out anything marked "Does not
apply". Each item under "Not answered" becomes an Open question with the default you pick. Never invent proof,
numbers, customers or quotes. The wizard's "How to use this brief" section is for you; don't copy it in.

The template's fields:

- **One-line concept**: who it is for, what it does.
- **Kind**: app (logged-in, `AppShell`), marketing page, AI product, or a mix (say which pages are which).
- **Users & jobs**: 2–4 jobs-to-be-done, in the client's words where possible.
- **Pages**: a numbered list, each with purpose, key content, primary action, and the registry components it
  uses (exact names from `DESIGN_SYSTEM.md`). Aim for 3–6 pages for a first version.
- **Flows**: the 1–2 multi-step flows, as step lists. For AI products: what the assistant may do on its
  own, and what needs an `ApprovalCard`.
- **Navigation**: the sidebar destinations (4–8) or the marketing page's sections.
- **Mock data**: the entities and 5–10 realistic records each. Neutral placeholder names.
- **Open questions**: anything the transcript did not settle; pick a sensible default and mark it.
- **Not in v1**: mentioned but deferred.
- **Theme**: the theme code from the brief, or the kit default.
- **Voice & tone** and **Proof & constraints**: from the brief; real proof only.

Quote the transcript for any decision that could be contested.

## 2. Hallucination guard

List every component the pages will use. Each must exist in `DESIGN_SYSTEM.md › Component registry` with
that exact name. If something is missing: stop, add it to the brief under "Needs a component", and either
compose it from existing parts or run the `add-component` skill first.

## 3. Stop for approval

Show the person, in your reply: the one-line concept, the page list (each with its purpose and the components it
uses), the flows, and the open questions with your defaults. Then **stop and wait** for their go-ahead or their
changes; update `app/<slug>/BRIEF.md` with any changes before building. Skip this stop only when the person has said to
build without one.

## 4. Build

- Folder `app/<slug>/` with its own `layout.tsx`: `AppShell` for an app, a plain header/footer for a
  marketing page. Pages as `app/<slug>/<page>/page.tsx`. Link it from the kit home (`app/(kit)/page.tsx`).
  Start from the closest sample (`app/dashboard`, `app/landing`, `app/assistant`): copy its shape, not its
  copy. Put `KitChip` in the top bar.
- Data in `app/<slug>/data.ts` (typed, exported constants). No network calls; a route handler returning
  fixtures is fine if a flow needs one. AI answers are scripted: canned text through `StreamingText`,
  `ToolCallCard`s with plausible inputs and outputs, an `ApprovalCard` before anything consequential.
- Follow `DESIGN_SYSTEM.md › Patterns`: PageHeader first, one primary action, StatTiles over cards over
  tables, EmptyState for every list, AlertDialog for destructive actions.
- Copy: real, specific, short. No lorem ipsum. The client's vocabulary.
- Every page works in light and dark, at 375px and 1280px. No hex. Labels on every field and icon button.

## 5. Verify

Run the `qc-pass` skill. Then walk the primary flow end to end in the browser and take a screenshot of each
page at 1280px and 375px.

## 6. Hand over

Reply with: the brief (summarised), the page list with what each does, how to open it (`npm run dev`, the
route), and the open questions. Offer a deploy for a link. Update `BACKLOG.md` (create it) with what was
deferred.
