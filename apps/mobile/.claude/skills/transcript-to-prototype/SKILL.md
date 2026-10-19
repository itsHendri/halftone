---
name: transcript-to-prototype
description: Turn a client conversation (meeting transcript, notes, a brief, or a BRIEF.md from the Halftone brief wizard) into a first working prototype inside this kit, built only from registry components. Use when given a transcript/brief and asked to "build a prototype", "make a first version", "turn this into screens", or "scaffold the app from this conversation".
---

# Transcript → prototype

Input: a transcript or brief (pasted, or a file path), or a BRIEF.md from the Halftone brief wizard
(halftonedesignsystem.com/brief). Output: a browsable prototype as its own named
segment in `app/`, mock data beside it, and a short brief that records the decisions.

Work in this order. Do not skip the brief — it is what the client sees first and what keeps the build honest.
The plan stops for the person's approval (step 3) before any code: changing a screen list is cheaper than changing
screens.

## 1. Extract (no code yet)

Read the whole transcript. Write `prototype/<slug>/BRIEF.md` (create the folder) from `BRIEF.template.md` (beside this skill).

**From the brief wizard:** keep the person's answers in their words. Leave out anything marked "Does not
apply". Each item under "Not answered" becomes an Open question with the default you pick. Never invent proof,
numbers, customers or quotes. The wizard's "How to use this brief" section is for you; don't copy it in.

The template's fields:

- **One-line concept** — who it is for, what it does.
- **Users & jobs** — 2–4 jobs-to-be-done, in the client's words where possible.
- **Screens** — a numbered list, each with: purpose, key content, primary action, which registry
  components it uses (by exact name from `DESIGN_SYSTEM.md`). Aim for 4–8 screens for a first version.
- **Flows** — the 1–2 multi-step flows (onboarding, checkout, send, booking…), as step lists.
- **Navigation** — tabs (3–5) or a stack, and which screen is home.
- **Mock data** — the entities and 5–10 realistic sample records each. Use neutral placeholder names.
- **Open questions** — anything the transcript did not settle; pick a sensible default and mark it.
- **Not in v1** — things mentioned but deferred.
- **Theme** — the theme code from the brief, or the kit default.
- **Voice & tone** and **Proof & constraints** — from the brief; real proof only.

Quote the transcript for any decision that could be contested. If the transcript is thin, fill gaps
with the most conventional mobile pattern and say so in Open questions.

## 2. Hallucination guard

List every component the screens will use. Each must exist in `DESIGN_SYSTEM.md › Component registry`
with that exact name. If something is missing: stop, add it to the brief under "Needs a component",
and either compose it from existing parts or run the `add-component` skill first.

## 3. Stop for approval

Show the person, in your reply: the one-line concept, the screen list (each with its purpose and the components it
uses), the flows, and the open questions with your defaults. Then **stop and wait** for their go-ahead or their
changes; update `prototype/<slug>/BRIEF.md` with any changes before building. Skip this stop only when the person has said to
build without one.

## 4. Build

- Named segment `app/<slug>/` (not a route group, see `AGENTS.md` rule 1) with its own `_layout.tsx`
  (Tabs or Stack). Register it in the root `app/_layout.tsx` Stack. Add an "Open <name>" button on the kit home (or make it the initial route
  if the kit shell should be hidden).
- Data in `components/<slug>/data.ts` (typed, exported constants). No network calls.
- Screens follow the patterns in `DESIGN_SYSTEM.md`: screen skeleton, `SectionHeader` + `Card` of
  `ListRow`s, one `StickyBottomBar` for the primary action, `SuccessScreen` for every success,
  multi-step flows as one route with a `Step` state machine and a `Stepper`.
- Copy: real, specific, short. No lorem ipsum. Use the client's product vocabulary.
- Every screen works in light and dark. No hex. Tap targets ≥ 44pt. Icons have labels.
- Model the sample apps (`app/shop`, `app/habits`) for structure; do not copy their content. Add `<KitChip />` to the new root layout so the kit stays reachable.

## 5. Verify

Run the `qc-pass` skill. Then walk the primary flow end-to-end on the simulator and take a screenshot
of each screen; put them in `prototype/<slug>/screens/`.

## 6. Hand over

Reply with: the brief (summarised), the screen list with what each does, how to open it
(`npm run ios`, web URL if deployed), and the open questions. Offer `npm run share` / `eas deploy`
for a link. Update `BACKLOG.md` with what was deferred.
