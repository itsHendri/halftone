# Halftone as the home for brands: strategy notes

Written 2026-11-17. A proposal, not a decision. It asks whether Halftone should hold a brand's whole identity
(system, voice, visual rules and assets) and serve it to any agent, for Hendri's brands first and agencies after.
The roadmap entry is under "Ideas waiting for a decision" in the root `ROADMAP.md`.

## The idea

Every brand Hendri runs already has the same parts, in the Studio repo (`itsHendri/studio`): tokens, a voice guide, a
visual guide and a folder of assets. They're written by hand, read by agents from disk, and copied into a D1 table for
the dashboard. Halftone already does the hardest of those parts properly: a typed design system that builds into
working phone and web kits, with contrast checked. The proposal is to make the brand, not just the theme, the thing
Halftone holds, and to serve it to agents through an MCP server, so any session in any repo can ask "what does this
brand look and sound like, and where is its logo?"

Decided so far:
- **Identity only.** Tokens and system, voice, visual, assets. Posts, Buffer, uptime, reviews and to-dos stay in the
  Studio dashboard, which reads identity from Halftone instead of storing it.
- **Agencies first** as the paying customer: many brands, client guests, a starter to clone.
- **Light and dark only.** Lisbon Tag's limestone, navy and granite are a background, the brand colour and the
  neutrals, not three themes. The gap is naming, so an importer maps a brand's tokens onto Halftone's roles.
- **Voice improves itself, through one path.** Agents propose edits (as the Studio's `plan-posts` and `social-audit`
  already do) and a person accepts them. Nobody edits voice in a second place, so files first holds.
- **The package is part of Halftone.** It becomes its own spec only if other people start using it.

Two things make it more than a brand portal:
- **Any surface.** The same tokens should reach slides, social posts and charts with real components (a button, a
  chart, a card), not only apps. Most brands have colours and a font but no parts to build with.
- **Any agent.** A design system set up in Claude stays in Claude; Figma's stays in Figma. An open package behind one
  MCP works with whichever agent a person uses.

What it isn't: the studio OS, or a brand portal of PDFs. A portal is a crowded, cheap category (see Market). The case
for Halftone rests on the brand running as code.

## What exists today

| | Studio (the dashboard's repo) | Halftone |
|---|---|---|
| Tokens | `brands/<slug>/identity/tokens.json`: hand-written DTCG, a different shape per brand | `HalftoneSystem` (`packages/tokens/lib/system/schema.mjs`): a recipe plus overrides, built by `halftone-tokens` |
| Voice, visual | `identity/voice.md`, `identity/visual.md` for all 11 brands | Nothing |
| Assets | `assets/{logo,icon,font,image,video}/`, named `<slug>-<thing>-<variant>.<ext>` | `brand` in the system: logo, dark logo, mark, dark mark; the Studio zips app icons and favicons |
| Where it lives | Git on the Mac; `workspace/scripts/push.mjs` copies voice, visual and tokens as text into D1 (`brands` table, migrations 0007 and 0016) | The browser (Studio in IndexedDB), `.halftone.json` exports, theme codes |
| Agents | `workspace/dashboard/worker/mcp.ts`: reviews and to-dos only (`list_todos`, `get_review`, …), behind an Access service token | `DESIGN.md`, `llms.txt`, skills; a Studio MCP is an undecided roadmap idea |
| Accounts | Cloudflare Access, one owner, invited guests | None; Phase 7 (Worker, D1, Better Auth, R2) is planned |

## The gap test

Today's Halftone can't hold most of Hendri's brands without losing something. Taken from the 11 `tokens.json` files in
Studio:

- **Names that don't match.** Lisbon Tag's `limestone`, `navy` and `granite` look like three themes but are a
  background, the brand colour and the neutrals. Light and dark are enough; the importer has to map the names.
- **Roles the brand named itself.** SwissBorg's roles follow its own colour styles (`background-secondary`,
  `brand-text`, `on-brand`, `link`) and add a `gold` family for premium. Halftone has six fixed ramps
  (`COLOR_ROLES`) and its own role names. The `extras` escape hatch covers only `color`, `text`, `radius`, `shadow` and
  `border` (`EXTRA_KINDS`).
- **Tokens that aren't UI.** Lisbon Tag's `line-weight`, SwissBorg's `tap-target`, Tiny Pixel Town's `grid`, Mareel
  Icons' `icon`, `dot` and `icon-size`, and Halftone's own `halftone` group (dot spacing, a hue cycle). Mareel Icons and
  Shhhcribble have no theme at all.
- **Custom font files.** Lisbon Tag (`lisbon-tag.woff2`), Good Mood Club (`sorean-bold.otf`) and Hendri (Alpha Lyrae)
  use fonts that aren't on Google Fonts. Halftone loads Google Fonts only; uploads are in Phase 7.
- **Voice and visual.** No place in the system.
- **Assets beyond the logo.** Photos, icons, fonts and video have no manifest in Halftone.

So the system stays what it is, the part that builds kits, and becomes **one part of a brand**, not the whole of one.
The brand package needs room for what the kits don't use.

## The brand package (a draft)

A folder, the same shape as a Studio brand, so Hendri's brands are already almost valid:

```
<slug>/
  brand.md            name, slug, colour, timezone, relation (own or client), in front matter
  system.halftone.json   the HalftoneSystem: what builds the kits. Optional: an icon pack has none
  tokens.json         everything else, as plain DTCG: extra themes, line weights, grids. Optional
  voice.md            how it sounds, words, never, examples
  visual.md           how it looks, beyond the tokens: photography, layout, the logo's rules
  assets/             logo/ icon/ font/ image/ video/, named <slug>-<thing>-<variant>.<ext>
  assets.json         generated manifest: each file's path, kind, variant, size and checksum
```

`halftone-tokens brand check` would validate it: `brand.md` front matter, the system (already `validateSystem`),
`tokens.json` as DTCG, file names, the manifest up to date, the logo present in the slots the system names. It's
the same job Studio's `doctor.mjs` does today, moved into the open package. The format and the CLI are free and open.

## Source of truth: two options

**A. Files first, the cloud mirrors.** The package lives in git. `halftone brand push` uploads it (like `push.mjs`
today). The cloud serves it and the Studio edits it, writing back as a commit or a download.
- For: matches the Studio rules (files are the source, data portable, a home server later). Diffs and history for
  free. Works offline and with no account. An agency's brands can live in its own repo.
- Against: two-way sync. The Studio editing in a browser and a person editing in git conflict, and someone has to
  resolve it. Client guests don't use git.

**B. Cloud first, files are an export.** The brand lives in D1 and R2. The Studio edits it directly, and
`halftone brand pull` writes the folder for a repo or a backup.
- For: one place to edit, so no conflicts. Guests, roles and history are ordinary SaaS. Simplest to sell.
- Against: goes against "files are the source" and the home server. Without an account, nothing works. An agent offline
  has only a stale copy.

**Recommendation: A, with one writer per part.** Git owns `voice.md`, `visual.md`, `tokens.json` and the assets. The
Studio owns `system.halftone.json` and writes it back as a file (a download today, a commit through the GitHub App
later). The cloud is a read-mostly mirror that adds what files can't do: auth, guests, the MCP endpoint and asset
URLs. One writer per part means no merge to resolve. This is how `push.mjs` and the dashboard already work ("the files
are the source; the dashboard owns a post after its first push"). Revisit if agencies' clients want to edit voice in
the browser.

## The agent surface

One MCP server; each brand is a scope. Read tools first:
- `list_brands`, `get_brand` (`brand.md` plus a summary)
- `get_voice`, `get_visual`: the markdown, whole
- `get_tokens { target }`: built output for `css`, `tailwind`, `nativewind`, `ts`, `figma` or `design-md`, from the
  same `halftone-tokens` targets the kits use
- `get_system`: the `.halftone.json`, for `halftone-tokens theme apply`
- `list_assets { kind }`, `get_asset { path }`: a URL plus the manifest entry
- `get_components { kit }`: the registry, so an agent knows what exists before building

Writes come later and stay narrow: `propose_voice_edit` returns a diff for a person to accept, as the dashboard's
suggestions already do. An agent never changes a brand on its own.

Auth: a token per brand per person. A guest token is read-only and scoped to one brand.

Local before hosted: `halftone-tokens mcp ./brands` serves packages from disk over stdio. This is the
`studio connect` idea from the roadmap, but reading folders instead of a browser tab. It needs no account, proves the
tools on Hendri's 11 brands, and becomes the hosted server's spec.

## Market

Serving a design system to agents is now table stakes. Every incumbent shipped an MCP in 2025–26:
- **Supernova**: an official MCP since Relay (September 2025), now with write access (Editor MCP, beta) and scoped
  "contexts" per team. Needs the Builder+ role.
- **zeroheight**: a remote and a local MCP, read and write. Free and Starter are capped at 500 calls a month.
- **Knapsack**: an MCP per workspace, announced as a beta in July 2025.
- **Frontify**: an MCP in beta, with 52 tools in packs (guidelines, assets, templates). Switched on by a customer
  success manager, so enterprise only.
- **Figma**: the official MCP reads variables and Code Connect mappings and can write to the canvas.
- **Brandfetch**: an MCP and a 2026 "Brand Context API" (voice, positioning, audience), built from public brand data.
- Smaller ones aimed at exactly this pitch: SlideSpeak's Brand MCP (sub-brands, role scoping), Intentful's Brand MCP
  (agencies and franchisees), Sitecore's brand contexts (several per account).

Cautionary tales: Brand.ai became InVision's Design System Manager, which closed with InVision on 31 December 2024. A
design-system manager inside a bigger tool dies with it.

What that means:
- **An MCP isn't a moat.** Anyone can add one. Frontify and Supernova serve guidelines, assets and tokens today.
- **Halftone's edge is that the brand runs.** None of the above hands an agent a theme that builds into working phone
  and web components with contrast enforced, or lint rules that stop it inventing colours. Their agents read the
  brand; Halftone's agents build with it.
- **The gap is price and audience.** Frontify and Supernova sell to enterprise design-system teams. An agency with 10
  small clients, or a solo designer with five side brands, has nothing made for them that comes with working kits.

## The agency product

What an agency would pay for, in order of how sure we are:
1. **Many brands, one place,** each with its own MCP scope, and a starter kit per client (the existing kits, themed).
2. **Client guests** who read the brand, comment and download assets, without git.
3. **Hand-off:** give a client their brand package and kits when the work ends. The open format is the selling point
   here: no lock-in.

Pricing references: Cofounder charges per company ($40 a month with credits; `cofounder-research.md`). Per-brand
pricing fits agencies better than per-seat. Guests should be free, because they're the client.

This changes the ROADMAP's "Free, open, and run by your own agent." The proposal keeps the kits, the CLI, the
package format and the local MCP free and open. The paid part is hosting: accounts, guests, the hosted MCP, asset
storage, Studio sync.

## How the Studio dashboard changes

- `brands/<slug>/` becomes a brand package (it nearly is one already): `identity/tokens.json` splits into
  `system.halftone.json` and `tokens.json` where a brand has a kit, `identity/voice.md` and `visual.md` move up a
  level (or the package allows `identity/`), and `assets.json` is generated.
- `push.mjs` stops copying voice, visual and tokens into D1. The Identity tab reads them from Halftone.
- The dashboard's `/mcp` keeps reviews and to-dos. The brand tools come from Halftone's server. A session has both.
- Posts, Buffer, uptime, reviews, to-dos and guests on Calendar and Media stay where they are.

## Phases

Each needs its own plan first.
0. **Import.** Read a brand's existing DTCG tokens and map them onto Halftone's roles (Lisbon Tag: navy → brand,
   limestone → background, granite → neutral), with what the kits don't read kept in a `tokens.json` beside the
   system. The same job as "a theme from a URL". Proven on Lisbon Tag, SwissBorg and Mareel Icons.
1. **The brand package and `brand check`.** The format above, validated, with Hendri's 11 brands passing.
2. **The local MCP** over a folder of packages. Hendri's sessions use it instead of reading files by path.
3. **A surfaces kit:** slide layouts, social templates and chart parts drawn from the same tokens. The biggest phase:
   about as big as the web kit was.
4. **Phase 7, refocused:** accounts, brands in the cloud as mirrors, a hosted MCP, guests, R2 for assets and custom
   fonts. Only after two or three agencies or friends have used phases 0–2.
5. **The dashboard reads identity from Halftone,** and an agency trial on a clone of the Studio setup.

Phases 0–2 are useful to Hendri even if nobody else ever pays.

## What breaks

- **Slides and social are a third kit** (high): build them after the package proves itself.
- **One maintainer** (high): phases 0–2 only, until someone else needs it.
- **"Free and open"** (medium): the kits, the format and the local MCP stay free; only hosting costs money.
- **Claude or Figma ship a portable version** (medium): an open package still works beside theirs.
- **11 Studio brands to migrate** (low): the importer does it.

## Open questions

- Does the hosted part keep the Halftone name, or get its own? Agencies may not care that it began as a
  design-system kit.
- Slides and social: inside Halftone as a third kit, or a kit of their own on the same tokens?
- Which two or three agencies or friends try phases 0–2 first?
- How much of `visual.md` can become structured (logo clear space, photo rules) without turning into a form nobody
  fills in?
- Free-plan limits for the hosted version: D1's size, R2's free storage and egress for video. Video probably stays
  out.

## Sources

- Supernova: https://www.supernova.io/for-ai, https://learn.supernova.io/latest/design-systems/features/mcp-for-design-system-LIHAMhjr-LIHAMhjr,
  https://www.supernova.io/blog/introducing-supernova-editor-mcp, https://learn.supernova.io/latest/releases/september-2025/introducing-supernova-relay-lWfNcpwJ
- zeroheight: https://zeroheight.com/mcp/, https://help.zeroheight.com/hc/en-us/articles/43780251357979-Using-the-remote-zeroheight-MCP-server
- Knapsack: https://docs.knapsack.cloud/intelligent-tools/mcp-server, https://www.knapsack.cloud/blog/knapsacks-mcp-server-turns-design-systems-into-production-engines
- Frontify: https://help.frontify.com/en/articles/14787214-frontify-mcp-beta, https://www.frontify.com/en/kitchen/frontify-mcp-brand-work-at-the-speed-of-conversation
- Figma: https://help.figma.com/hc/en-us/articles/32132100833559
- Brandfetch: https://docs.brandfetch.com/mcp/overview, https://brandfetch.com/developers/brand-context-api.md
- SlideSpeak: https://slidespeak.co/de/features/onbrand · Intentful: https://intentful.ai/brand-mcp.html ·
  Sitecore: https://doc.sitecore.com/sai/en/users/sitecoreai/brand-context.html
- InVision and Brand.ai: https://www.fastcompany.com/90147982/from-invision-a-new-tool-to-manage-sprawling-design-systems,
  https://www.fastcompany.com/91069936/why-invision-failed
- Vendor pages are the vendors' own claims. Feature status (beta or not, call caps) was as listed on 2026-11-17.
