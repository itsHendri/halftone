# Plan: import a brand's tokens into a Halftone system

2026-11-27. Phase 0 of "Halftone as the home for brands" (`apps/docs/design/brand-home.md`). A plan only: nothing is
built until Hendri agrees it.

## In plain words

Most brands already have tokens, written by hand in their own words. Hendri's 11 Studio brands each have a
`tokens.json` in DTCG format, and no two share a shape: Lisbon Tag says `limestone`, `navy` and `granite`; SwissBorg
says `background-secondary`, `brand-text` and `on-brand`. Halftone can't read any of them, so today a brand has to be
rebuilt by hand in the Studio before it reaches the kits.

The fix: **`halftone-tokens import`** reads a brand's `tokens.json` and writes a Halftone system
(`.halftone.json`) that `theme apply` already knows how to commit. It maps what it can, keeps what it can't as
extras, and says what it guessed, one plain line per guess, so a person (or their agent) can check each one. It's
the same job as the roadmap's "a theme from a URL", starting from a file instead of a site.

Three things make it work:

1. **The system already takes hand-picked colours.** A role in a HalftoneSystem can be a `'ramp.step'` or a hex, per
   mode (`roles` in `packages/tokens/lib/system/schema.mjs`). So a brand's own background, text and brand colours go
   in as they are, not rounded to the nearest ramp step.
2. **Hand-picked roles are never moved.** The contrast fixer (`lib/theme/fix.mjs`) locks roles mapped by hand and
   reports a failing pair in `warnings` instead of nudging it. The importer keeps the brand's colours and hands
   those warnings on, which is honest: the brand chose them.
3. **Extras already exist.** Colours, text styles, radii, shadows and borders the kits don't draw go into
   `extras` and come out in `tokens.json` as `extra.*`. Nothing the brand had is dropped without a note.

## How it maps

Steps in order. Each guess becomes a note.

| The brand's file has | Becomes | Note when |
|---|---|---|
| Theme modes (`theme.light`, `theme.dark`, or named ones) | The lightest `background` is light, the darkest is dark | A mode is named, not `light`/`dark`; a third mode (its colours become extras) |
| `brand`, `primary`, `accent` | The brand ramp's seed, and `primary` per mode | It picks one of several |
| `background`, `card`, `foreground`, `muted`, `border` | The roles of the same name, per mode, as hex | The name only nearly matches (`background-secondary` → `muted`) |
| `on-brand`, `brand-foreground` | `primary-foreground` | |
| `error`/`danger`, `success`, `warning`, `info` | The status ramps' seeds | |
| A ramp (`50` … `900` under one family) | That ramp's `steps`, where it is brand, neutral or a status | Steps are missing (generated around the ones given) |
| Any other colour | An extra colour, named after its path | Always, so a person can promote it |
| `font` families | `fonts.heading` / `body` / `mono` when on Google Fonts | Not on Google Fonts (kept as a name, for the upload step later) |
| `radius` | `radius.sm` … `2xl`, nearest steps | Values were snapped |
| `space`, `line-weight`, `tap-target`, `grid`, `motion` … | The system's `tokens` section | Always |

Anything that is neither a colour, a font, a radius, a shadow nor a border goes into a new **`tokens` section of
the system**, aliases resolved and otherwise unchanged, so one file carries the whole brand. The kits never draw it.

## Steps

1. **`systemFromTokens(dtcg, { name, google }) → { system, notes }`** in `packages/tokens/lib/system/import.mjs`.
   - Pure ESM with no Node APIs, the same rule as `lib/theme/shadcn.mjs`, so the Studio can run it in the browser
     later. Its shape copies `recipeFromShadcn(preset) → { recipe, notes }`.
   - Its own small alias resolver (`{palette.navy}`), since `lib/resolve.mjs` needs Style Dictionary and Node.
   - It accepts both colour forms: a hex string and the 2025.10 object (`{ colorSpace, components, hex }`).
   - It ends with `createSystem()` and `validateSystem()`, so what it writes is a valid system or it throws.
   - It is exported from `@halftone-ds/tokens/system` next to `migrate`.
2. **`halftone-tokens import <tokens.json> [--name <name>] [--out <file>.halftone.json] [--json]`** in
   `lib/theme-cli.mjs` and `cli.mjs`.
   - It writes the system, then prints the notes and the contrast
     warnings from a dry `generateSystem()` run.
   - `--json` prints `{ file, system, notes, warnings }` for an agent.
   - It asks Google Fonts about each family the file names (`--offline` skips that; `--google "A,B"` vouches).
   - It never touches the app's own `tokens.json`. Applying stays a separate, deliberate `theme apply ./x.halftone.json`.
3. **The `apply-theme` skill, in both kits:** a short "Import a brand" section. Run `import`, show the person the
   notes as questions ("navy → brand?", "limestone → background?"), adjust, then `theme apply`.
4. **Tests** in `packages/tokens/test/import.test.mjs`, with synthetic fixtures only.
   - Shapes taken from the Studio brands, with made-up names and colours: three named modes, own role names, a
     partial ramp, a custom font, tokens that aren't UI, aliases, both colour forms.
   - No client brand's real tokens go into this public repo (SwissBorg and Lisbon Tag are clients).
   - Round trip: an imported system passes `validateSystem`, applies with `applySystem`, and `generateSystem` keeps
     every hand-picked role exactly.
5. **A dry run on Hendri's 11 brands,** locally, from the Studio checkout. I report per brand what mapped, what became
   extras and which contrast pairs fail. Nothing from it is committed.

## How it ships

- A minor changeset for `@halftone-ds/tokens` (a new command and export). One PR.
- A docs page section under the theme docs: "Bring your own tokens", next to the shadcn paste.

## Not in this plan

- The brand package, `brand check` and the MCP (phases 1 and 2).
- A Studio UI for it: a "paste your tokens" box beside the shadcn one comes after the command has proved itself.
- Importing from a URL, Figma variables or Tokens Studio files. The same mapping can take them later; DTCG first.
- Uploaded fonts (Phase 7 of the roadmap): a custom font is kept as a name and noted.

## Decided (2026-11-27)

- **Primary wins.** When a brand gives both `brand` and `primary`, `primary` is the role and seeds the brand ramp;
  `brand` becomes an extra colour.
- **No dark set: generate it.** Dark comes from the ramps, as it does for every recipe, and the import says so.
- **Leftovers live inside the system** (`tokens`), so one `.halftone.json` carries the whole brand. A system with
  them has no theme code.
