# Client refresh — audit and plan

Audit run 2026-10-01 across `src/styles/**` and `src/pdz/**` (237 components with at
least one finding). It builds on the 2026-09-27 style audit
(https://claude.ai/artifact/9Qb5MNjKqmjaeeARzeNHiP) and replaces the reverted
`style-preview` / `font-preview` experiments.

The goal is one coordinated pass: new foundations, then primitives, then every feature
area, with each kind of bad practice either fixed or blocked by a lint rule before the
pass ends. The appendix lists every component with its open findings. Work it down to
empty.

Tick items off as they land. Keep the findings once fixed, because they explain why each step exists.

---

## Roadmap

| # | Phase | Status |
| --- | --- | --- |
| 0 | Prune: delete duplicate v1/v2 pages, dead code, comments; commit the audit script | done 2026-10-03. The v2 pages are kept as the owner's test pages; the bracket canvas is deleted |
| 1 | Foundations: elevation ladder, state layers, borders, text colors, type roles, spacing aliases, shadows, breakpoints, gray tint | done 2026-10-02 |
| 2 | Primitives: move every `shared/` primitive onto the new roles; add `pdz-team-logo`; gallery updated | done 2026-10-02; `pdz-team-logo` and `pdz-record` added, gallery has a "Two colors" section |
| 3 | Feature sweep, one area at a time (§7), with the per-file touch checklist (§6) | Style and template hygiene done 2026-10-02 (second pass): zero raw weights, media queries, radii, hover scaling, route literals, deep imports, `CommonModule`, raw `localStorage`, missing page headers. Still open, by design: composite native `<button>`s (toggles, row pickers), `card` look-alikes for nested rows, the wheel's shading literals, and the TS modernization columns (`dec`, `sub`, `bs`, `push`, `any`) |
| 4 | Lock-in: delete the old surface roles, turn every rule in §8 to an error, rewrite CLAUDE.md | done 2026-10-02. Every §8 rule is now an error in `npm run lint` (styles, templates, TS, an audit gate for page headers, and contrast). The first pass claimed this before the style rules existed; the second pass added them |

Owner review, 2026-10-02 (after phase 4): likes rise-not-sink and the standard page
header; found pages too gray (an overcorrection) and wanted Title Case back. Done the
same day, in this order: Title Case sweep; homepage hero restored as a full-width
`versus-gradient` band with "POKÉMON [logo] DRAFTZONE" (text and logo in `on-primary`,
which the contrast check now guards on the secondary end too); a
`[pdz-page-header-center]` slot carrying a versus strip of both rosters on the matchup
page; a team-color pass on the drafts pages (header `wash` on My Drafts and the draft
page, a team-1 fade behind your roster, opponent initials tinted team 2 via the new
`pdz-team-logo` `team` input); and a gray-50 vs gray-25 ground comparison in the
gallery. H1 is still waiting on a look in the gallery's Two Colors section.

2026-10-03: the header `wash` was reverted. A primary/secondary gradient behind page
headers read as decoration, not a job. Page headers are plain on the ground again
(A2), and the `wash` input is gone. Team color stays inside the header only where it
marks two sides, such as the matchup versus strip in `[pdz-page-header-center]`.

Decisions already made:

- **Nunito stays for now.** 13 alternatives were tried 2026-09-29 → 10-01 and none beat it. Its
  digits are tabular by default, so no global `tabular-nums` change is needed. The font
  may be revisited at the end (see A4).
- **Surfaces rise, they don't sink** (§1). This is the core of the refresh.
- **Team 1 vs team 2** (§5): primary is team 1, secondary is team 2, and you are always team 1.
- **Ship it together.** Do the work on one branch and merge `main` into it regularly. Don't toggle it behind a
  preview flag, because that doubles every primitive (the reverted `style-preview`
  service showed the cost).

---

## Design review decisions (2026-10-01)

Each proposal from the design review (https://claude.ai/artifact/8g1fSrSQKUFxmEJAvHSjhr)
was answered by the owner. Rejected items stay listed so they aren't proposed again.

| # | Proposal | Decision | Where it lands |
| --- | --- | --- | --- |
| A1 | Surfaces rise; only inputs sink | **Accepted** | §1 |
| A2 | Page headers sit on the page | **Accepted** | §2, phase 2 |
| A3 | More space between groups than inside them | Unsure | §4: no blanket loosening; decide per component and **ask the owner** when a spacing call comes up |
| A4 | Smaller corners, four steps | **Rejected** | Radii unchanged. Revisit at the end of the refresh, after the font question settles |
| B1 | Spend the accent on fewer things | **Accepted** | §5. Owner: "color should be used deliberately, with rules for both primary and secondary, so the theme can shine" |
| B2 | Don't tint whole cards | **Accepted** | §5. Alerts (error, warning, info banners) are the exception and stay fully tinted |
| B3 | Status as soft badges | Unsure | §11. Compare in the gallery during phase 2 |
| B4 | Flat fills; one two-sided gradient | Unsure (gradient half settled) | `versus-gradient` for brand moments is in, via the secondary-color answer. Flattening single-hue gradients on buttons and banners is still open (§11) |
| B5 | Themes swap the accent pair, not the neutrals | Unsure | §11. Sunset's orange-tinted surfaces wait on this |
| B6 | Retire the `menu-*` palette | **Accepted** | §5, phase 1 |
| C1 | Hierarchy: color, then weight, then case | **Accepted** | §3 |
| C2 | Fewer text sizes, each with a job | Undecided | §11. The §3 role sizes are a draft until then |
| C3 | Nasalization only for big moments | **Accepted** | §3 |
| C4 | Icons filled when active | **Accepted**, done 2026-10-07 | Active state sets `--pdz-icon-fill: 1`: tabs, tab-nav, tournament nav, checked segmented option, selected chip, and `pdz-menu-item[aria-current="page"]` (the navbar menus now mark the current page) |
| A5 | Boxes don't nest: inside a card, rows split by hairlines and groups by space, not bordered sub-boxes | **Accepted** and applied 2026-10-07 | `pdz.row-divider` / `pdz.drag-lift` mixins; ~25 nested boxes removed (settings workbench, manage draft, drafting room, trades, score entry, chat, teambuilder, time converter, bookmarks, replay tiles); `nested-box` lint error. Kept: drag objects, board slots, dashed drop zones, v2 test pages |
| D1 | Quieter tables | **Accepted** | Phase 2 (`_table.scss`) |
| D2 | Calm hover, no scaling | **Accepted** | §1 state layers; phase 3 sweep (23 stylesheets) |
| E1 | Different kinds of tokens, not more | **Accepted** | §5a |
| F1 | Team 1 primary, team 2 secondary, you are team 1 | **Accepted** | §5 |
| F2 | Secondary means team 2 and nothing else | **Rejected** | Owner wants a real mix of both colors so the theme shines, including on single-focus pages (planner, Pokémon search) that aren't team vs team. Secondary's job outside head-to-heads is being chosen in H1–H6 on the review page |
| F3 | Equal weight in a head-to-head | **Accepted** | §5 |
| F4 | Lists color only you and your next opponent | **Rejected** | Replaced: lists highlight **your row only** (§5) |
| F5 | Team color on rings; names in ink | **Rejected** | Team logos are colorful themselves, so a ring fights them. Placement options in review (G group on the review page) |
| F6 | Results use status colors | **Accepted** | §5; Shiny's warning moves off mint |
| F7 | Charts: team 2 patterned | **Rejected** | Charts keep team 1 / team 2 colors with no pattern rule |
| F8 | Never color alone; retune Shiny and Fern | **Rejected** | Owner: a player who can't read a theme switches themes. No CVD retune |
| H1 | Single-focus pages: primary for doing, secondary for noticing | **Accepted** (2026-10-03, after seeing it on Pokémon search) | §5 rule 4, CLAUDE.md. H2–H5 not chosen. Applied to Pokémon search and the planner |
| H6 | Secondary is only team 2 inside head-to-head views | Not answered | §11 |
| G1 | Team color as half washes | **Accepted** | §5 rule 7 |
| G2 | Team color on name text | **Rejected** | Names stay ink |
| G3 | Team color on score numerals | **Accepted** | §5 rule 7 |
| G4 | Team color as edge bars | **Rejected** | |
| G5 | Team color as a logo plate | **Rejected** | |
| F9 | Name the roles in code | Unsure | §5: `team1-*` / `team2-*` aliases plus `versus-gradient`. Any lint allowlist must cover brand-moment components as well as versus components |

---

## 1. The elevation model: rise, don't sink

### What is wrong today

The surface roles are the Material 3 container ladder (`surface-container-lowest`
→ `-highest`). Those names say nothing about direction, so they get used in both directions:

| Mode | Page | Card (`-low`) | Nested (`-lowest`, per CLAUDE.md) | Menu / popover / dialog |
| --- | --- | --- | --- | --- |
| Light | white | gray-25, **darker than the page** | white | gray-25, same as the card |
| Dark | gray-875 | gray-825, lighter ✓ | gray-900, **darker than the page** | gray-825, same as the card |

- In light mode every card is a well (1.06:1 darker than the page).
- In both modes a nested panel sinks below its parent. CLAUDE.md prescribes this
  ("`-lowest` when nested").
- A menu or select panel opened over a card has the card's exact fill. In dark mode only
  a shadow separates them, and shadows barely read on dark.
- Card hover moves `-low` → `container`, which in light mode makes the card *darker*
  on hover. A hover should lift a card, not push it down.
- 44 rules in 34 components paint `surface-container-lowest` or `background` to make
  wells, and 33 hand-rolled card blocks in 31 components pick fills ad hoc.

### The rule

> Anything closer to the viewer is lighter in dark mode, and carries a border and a
> shadow in light mode. Nothing is ever darker than the thing it sits on, except an
> **inset**, which deliberately cuts down to the page ground.

Insets are the only sinking surfaces. They are inputs, slider and toggle tracks, code
blocks, empty draft slots and the segmented-control track. Everything else either sits on
its parent or rises above it.

### The ladder

New semantic roles, defined per theme and mode in `themes/_defaults.scss`:

| Role | Used for | Light | Dark |
| --- | --- | --- | --- |
| `ground` | page canvas, navbar, unboxed page headers and section titles | gray-50 (tinted, §1.5) | gray-875 |
| `raised` | cards, panels, widgets, tables | white | gray-825 |
| `raised-high` | a card inside a card, sticky toolbars over content | white + `elevation-1` shadow | gray-775 |
| `overlay` | dialogs, drawers, the save bar | white + `elevation-3` | gray-750 |
| `floating` | menus, select/popover panels, toasts | white + `elevation-2` | gray-725 |
| `inset` | inputs, tracks, wells | gray-50 (= ground) | gray-875 (= ground) |
| `surface-inverse` | tooltips | unchanged | unchanged |

`floating` sits above `overlay` because a select opened inside a dialog must rise above
the dialog.

Contrast, checked against the generated ramp (light / dark):

| Pair | Light | Dark |
| --- | --- | --- |
| raised vs ground | 1.12 | 1.17 |
| floating vs ground | 1.12 + shadow | 1.76 |
| `on-surface` on floating | 19.9 | 8.20 |
| `on-surface-variant` on floating | 8.73 (gray-700) | 5.61 (gray-225) |
| `on-surface-muted` on floating | 5.84 (gray-600) | 4.61 (gray-300) ¹ |
| `border-subtle` on raised | 1.35 (gray-125) | 1.28 (white 8%) |
| `outline` on raised | 4.52 (gray-550, unchanged) | 3.08 (gray-550) ² |

¹ gray-350, the value the 2026-09 review settled on, fails on `overlay` (4.38) and
`floating` (3.92). Use gray-300.
² Today's dark `outline` is gray-600 at 2.53:1, a WCAG 1.4.11 failure for input borders.

### State layers, not "next container up"

Hover, pressed and selected become translucent layers over whatever surface the element sits
on. This replaces stepping to the next container token:

```scss
--pdz-state-hover:    color-mix(in srgb, on-surface 4%, transparent);
--pdz-state-pressed:  color-mix(in srgb, on-surface 8%, transparent);
--pdz-state-selected: primary-subtle;
```

`_table.scss` already does this for row hover (`on-surface 4%`). It works on any rung of
the ladder, so rows, menu items, tabs and segmented buttons stop needing a
per-surface hover token. **Interactive cards lift on hover**: `elevation-1` plus a
`border-control` border, with the fill unchanged.

**Motion (D2):** hover changes color and border; clickable cards may lift 1px. Nothing
scales on hover. Today 23 stylesheets use `scale()` (up to 1.15) or large
`translateY` (up to −10px). Route changes keep a 120ms fade and drop the 8px slide in
`.pdz-route-enter`.

### Shadows as part of the ladder

Shadows are currently five Material-era levels at 30% and 15% opacity, plus five inset levels (one use, in
`debug.component`). Replace them with per-mode elevation tokens bundled with the ladder:

| Token | Light | Dark |
| --- | --- | --- |
| `elevation-1` | `0 1px 2px rgb(shadow / .06), 0 1px 3px rgb(shadow / .04)` | `none` + 1px top highlight |
| `elevation-2` | `0 2px 4px -1px rgb(shadow / .06), 0 6px 16px -4px rgb(shadow / .10)` | `0 8px 24px rgb(0 0 0 / .4)` |
| `elevation-3` | `0 4px 8px -2px rgb(shadow / .08), 0 16px 32px -8px rgb(shadow / .16)` | `0 16px 48px rgb(0 0 0 / .5)` |

In dark mode depth comes mostly from the fill. The shadow is only there to separate floating panels from
busy content. Delete the `inset-*` levels. An inset is now a fill, not a shadow.

### Gray tint

`tools/gen-color-ramps.mjs` tints grays toward hue 264 only below L 0.6, so gray-25 to
gray-500 have zero chroma. Floor it (`Math.max(0.3, …)`) so the light ground reads as
deliberate, then `npm run gen:colors`. The tint is what makes white cards on a gray-50 ground look
designed rather than unfinished.

### Migration map

| Old role | New role |
| --- | --- |
| `background`, `surface` | `ground` |
| `surface-container-low` on a card or panel | `raised` |
| `surface-container-low` on a menu, select panel or popover | `floating` |
| `surface-container-low` on a dialog | `overlay` |
| `surface-container-lowest` used as a well | `inset` |
| `surface-container-lowest` used as a nested panel | `raised-high` |
| `surface-container` on an input | `inset` |
| `surface-container` / `-high` / `-highest` as hover or selected | state layer |
| `surface-container-high` / `-highest` on a skeleton or table header | `raised-high` |
| `surface-variant` (3 background uses) | `inset` |
| `outline-variant` on a panel edge or divider | `border-subtle` |
| `outline-variant` on an outlined button, segmented track or chip | `border-control` |

Every `surface-container*` use has to be classified by hand: 243 occurrences in 103
components (column `srf` in the appendix). The old roles stay as aliases until phase 4
and are then deleted, so anything missed fails the build.

---

## 2. Borders and boxes

- `outline-variant` is gray-200 (1.54:1 on a card) in light and gray-700 (1.69:1) in
  dark: wireframe weight, used 248 times in 106 files. Split it into `border-subtle` (hairline) and
  `border-control` (keeps today's weight for outlined buttons and the segmented track).
  The 2026-09 review found that one hairline value erases outlined buttons. That's why
  there are two roles.
- **Box content, not structure.** `<pdz-page-header>` defaults to `tone="panel"` (a
  bordered box). Flip the default to `plain` (the CSS already exists) so the header sits
  on the ground. 38 call sites inherit the change.
- **Drop the accent underlines.** 22 section headers in 21 components use a 2px accent
  `border-bottom` (47 2px borders overall, in 33 components). Side A's color is being spent on
  decoration.
- **Hairlines inside cards, not nested wells.** Rows inside a card are divided by a 1px
  `border-subtle`. They aren't each wrapped in their own `-lowest` box.
- **33 hand-rolled card blocks** (column `card`) become `<pdz-card>` or are
  unboxed.

---

## 3. Text and type

### Color

| Role | Light | Dark |
| --- | --- | --- |
| `on-surface` | gray-950 | gray-75 |
| `on-surface-variant` | **gray-700** (today gray-900, 1.09:1 against primary text) | gray-225 |
| `on-surface-muted` (new) | gray-600 | gray-300 |
| `on-surface-placeholder` | gray-600 (gray-550 is 4.29 on the inset) | gray-400 |

Light-mode secondary text is the same color as primary text today. That one value is the
biggest reason the light theme reads flat, and why bold spread everywhere to compensate.
Sunset overrides `on-surface-variant` to orange-900, so give it the orange equivalent.

### Roles

Every role in `tokens/_typography.scss` will have its weight set through
`var(--pdz-font-weight-*)` so the weights can be retuned in one place.

| Role | Size / weight | Change |
| --- | --- | --- |
| `display` / `headline` | Nasalization | Page titles and hero numbers (scores, countdowns, records) only |
| `title` | 24 / 700 | Today section titles use this, making them as loud as page titles |
| `section-title` (new) | 18 / 700 | Unboxed section headings |
| `card-title` | 16 / 600 | unchanged |
| `meta` (new) | 13 / 400, variant color | Coach names, dates, the "16 teams · 2 pools" line |
| `label` | 12 / **400** (today 600) | Stops making every meta line bold |
| `label-caps` (new) | 11 / 700, muted, `pdz.caps` | Eyebrows, table group headers |

The sizes are a draft until C2 (fewer text sizes) is decided. Tune them in the gallery.

- **Hierarchy order (C1):** color first, weight second, case last. Three text colors
  (ink, variant, muted), mostly two weights (400 and 700). Uppercase only for tiny eyebrows and table
  headers. **Title Case** for page titles, section and card headings, buttons, tabs, nav
  and menu items ("My Drafts", "Sign Up"); sentence case only for body text, hints and
  messages. (The first pass applied sentence case everywhere; the owner reversed that on
  2026-10-02.)
- **98 raw `font-weight` declarations** in 41 components (61× 600, 30× 700, 3× 650,
  2× 500, 2× 800). 650 and 800 aren't on the scale. Each one becomes a role or
  `pdz.font-weight()`.
- Delete the `4xs` (8px) and `3xs` (10px) font sizes. Nunito's small x-height makes
  anything under 11px unreadable, and `3xs` has three callers.
- **Nasalization (C3)** is for the logo, page titles, and big numbers (scores,
  countdowns, records in hero spots). Today it's set in 49 stylesheets, including widget
  labels (`pdz-widget__label`), tool list labels, the standings header and draft pick names. Everything else
  moves to Nunito.

---

## 4. Spacing, shape, breakpoints

- **Spacing is decided per component, not loosened across the board (A3).** About 67% of `pdz.space()` calls are ≤ 8px and 4% are ≥ 24px.
  Some places need more room between groups; others (dense tools, tables, draft boards) should stay tight.
  During the sweep, **ask the owner** before changing the density of a screen.
  The aliases below are still useful so pages stop choosing between `sm` and `md` for a section gap:

  ```scss
  $layout: (
    page-gap:    space(xl) → space(2xl) at ≥ medium,
    section-gap: space(xl),
    card-pad:    space(lg) → space(xl) at ≥ medium,
    stack:       space(md),
    inline:      space(sm),
  );
  ```

  Add a 4rem step. Today `4xl` jumps from 3rem straight to 5rem.
- **334 raw lengths in margin/padding/gap/inset** across 101 components (column `sp`),
  plus 20 raw `border-radius` values (`rad`). Some are genuine sizes (a 3.5rem navbar
  offset). The rest are spacing that skipped the scale.
- **Radius values stay as they are (A4 rejected).** Raw `border-radius` literals still move onto
  `pdz.shape()` tokens, which is hygiene rather than a style change. Revisit corner sizes at the end of the
  refresh, once the font question is settled.
- **Only `respond-above` exists**, so 52 raw `max-width` media queries in 21 components
  hand-type pixel values, six of them off the scale (480, 600, 640, 680, 960, 992). Add
  `respond-below` and snap each one to `small`/`medium`/`large`/`desktop`. Components
  that adapt to their own width rather than the window (widgets in a grid, the score
  entry) should use `@container` queries.
- `tokens/_breakpoints.scss` also exports `$screen-size-medium/large` and the matching
  `--pdz-screen-size-*` custom properties. Check for callers and fold them into
  `$breakpoints`.

---

## 5. Color: team 1 vs team 2

The site is built around team 1 vs team 2, and every theme is a pair: primary is team 1,
secondary is team 2. Color is used deliberately (B1). Each of the two colors has a
defined job, so the theme reads as a pair instead of one color with orange sprinkled in.
These rules go into CLAUDE.md:

1. **Every pairing is team 1 (primary, left or top) vs team 2 (secondary, right or
   bottom)**, for every viewer (F1).
   - **You're in it:** the page swaps so your team is team 1, with a "You" tag.
   - **You're watching:** keep the stored order, with both teams colored.
   - **A page about one team** (anyone's): that team is team 1. Opponents in its
     matchup list are team 2.
2. **Equal weight (F3).** Whatever team 1 gets, team 2 gets: the same element at the same strength,
   mirrored. Only the neutral middle (score separator, labels) stays uncolored.
3. **Primary's jobs:** team 1, actions (buttons, links, focus, selected tabs and nav), and
   your own row in a list. Buttons are always primary.
4. **Secondary's jobs:** team 2, **brand moments paired with primary** (the logo
   split, homepage hero, share images, `versus-gradient`; not page headers, which stay plain),
   and **a defined job on single-focus pages** (H1, provisional). The owner wants both colors present across
   the site, not just on matchups. On single-focus pages, **primary marks what you do**
   (buttons, the active tab, filters you've set, the selected row) and **secondary marks
   what you should notice** (suggestions, bookmarks and favorites, result counts, the
   standout stat, "new" markers). Before locking this in, build it into the gallery and
   one real page (planner or Pokémon search) and show the owner.
   Whether secondary is reserved for team 2 inside head-to-head views is H6 (open).
5. **Lists of many teams** (standings, team lists): only **your row** is highlighted, with a
   primary tint and a "You" tag. No next-opponent marker. Schedules and brackets draw
   each match as its own pair.
6. **Status beats team color (F6).** Win/loss stay green/red whichever team won.
   Warnings are amber. A status hue must differ from both team hues in every theme.
7. **Where team color goes in a head-to-head (G1 + G3):** a soft **half wash** of each
   team's color behind its half, fading to neutral in the middle, plus **score numerals**
   in each team's color (Nasalization). Logos are never ringed or plated, since they're
   colorful themselves, and names stay ink. On an upcoming match the wash carries the color alone.
8. **Whole-card tints only for alerts (B2).** `pdz-card color=…` (83 uses: 41 danger,
   23 primary, 19 secondary) becomes neutral, with color on the specific control or badge.
   Error, warning and info banners keep their full tint, because the whole block *is* the message.
9. **Retire `menu-*` (B6).** Thirteen tokens form a second neutral palette (light
   `menu` is gray-550 with white text), used in 15 stylesheets. Fold them into the ladder and state layers.

What's wrong today:

- **Colors follow stored order even when the viewer is a participant.** The matchup page knows
  `viewer.side` and doesn't reorder. Score entry hard-codes `{ side1: 'primary', side2:
  'secondary' }`. A coach stored as team 2 sees their own team in orange.
- **One-color head-to-heads.** The matchup scoreboard sits on a full-width
  `primary-gradient`, and the drafts match row, tournament landing "This Round" and
  schedule widget use primary only.
- **Secondary as decoration.** Standings coach names (`secondary-accent`), the chat
  "participant" badge, the matchup page's Schedule button (`color="secondary"`), the
  Tera type on trade cards, and decorative uses in `league-ad`, `landing`, `news-core`,
  `statistics`, `filter-drawer`, `wheel`, `tier-list-form`, `replay` and
  `pokemon-dialog`. 91 uses in 35 components (column `B`). Each is classified as team 2,
  brand moment, or a mistake.
- **Accent overuse.** `primary` appears 387 times in 110 stylesheets; 61 rules color text
  `primary-accent`. Some views have 3–4 filled primary buttons (tournament create, news,
  quick-draft results, trade manager). Target: one filled primary action per view.
- Shiny's `warning` is mint, the same hue as its team 1. Move it to amber.
- **Bug, fixed 2026-10-01:** `league.mixins.scss` record box put `on-menu` (white) on
  `positive` (mint-175) in light mode, 1.45:1. It now uses `on-positive` / `on-negative`.

In code (F9, still open): add `team1-*` / `team2-*` aliases (fill, soft, ink) matching
the `team1`/`team2` names the data already uses, plus `versus-gradient`. Add one helper that
orders a pairing for the viewer (it swaps on `viewer.side === 'side2'` and sets the "You" flag).
Any lint allowlist for secondary must include brand-moment components as well as versus components.

### 5a. Token kinds (E1)

The fix isn't more tokens. Each token should answer a design question.

| Add | Tokens |
| --- | --- |
| Surface ladder | ground, raised, raised-high, overlay, floating, inset |
| State layers | hover, pressed, selected |
| Text tiers | on-surface-muted |
| Border tiers | border-subtle, border-control |
| Elevation per mode | elevation-1, -2, -3 |
| Focus ring | focus-ring |
| Control heights | 24 / 28 / 36 / 44 (today hard-coded in `pdz-button`) |
| Icon sizes | 16 / 20 / 24 |
| Content widths | narrow / default / wide (today rem literals in `pdz-page`) |
| Layout spacing | page-gap, section-gap, card-pad, stack, inline |
| Type roles | section-title, meta, caption |
| Team and brand | team1-*, team2-*, versus-gradient |

| Remove | Tokens |
| --- | --- |
| Container ladder | background, surface, surface-variant, surface-container-* |
| Menu palette | menu-* (13) |
| Inset shadows | inset-1 … inset-5 (one use) |
| Tiny font sizes | 4xs, 3xs |
| Pending B4 | primary-, secondary-, menu-gradient (single-hue) |
| Pending B5 | per-theme neutral overrides (Sunset) |

Components use semantic tokens only, never ramp steps (`pdz.color()` already enforces this).

---

## 6. Per-file touch checklist

Run this on every file opened during the phase 3 sweep, so each file is visited once
rather than once per concern:

**Styles**
- [ ] Surfaces mapped to the §1 ladder; nothing sinks except a deliberate `inset`
- [ ] Hover uses a state layer, or a lift for interactive cards; no darker fill
- [ ] No resting `box-shadow` on a card or panel; shadows only on floating things and hover lifts
- [ ] `outline-variant` → `border-subtle` / `border-control`; no 2px accent underlines
- [ ] Hand-rolled card → `<pdz-card>`, or unboxed
- [ ] Every text block uses a role; no raw `font-weight`; secondary text uses `variant` / `muted`; Nasalization only for titles and big numbers
- [ ] Primary and secondary each used for a §5 job (team 1 / team 2, actions, brand moment, the chosen single-focus job), never as decoration; at most one filled primary action per view
- [ ] Hover never scales; at most a 1px lift
- [ ] Spacing from the scale or layout aliases (ask before changing a screen's density); radius from `pdz.shape()`
- [ ] Media queries through `respond-above` / `respond-below`, or a container query
- [ ] No hex/rgb literals, `!important` or `::ng-deep`
- [ ] Comments stripped; empty `:host { display: block }`-only stylesheets deleted along with their `styleUrl`

**Templates**
- [ ] Routed page opens with `<pdz-page-header>`
- [ ] Controls are primitives (`pdz-button`, `pdz-input` in `pdz-field`, `pdz-select`, `pdz-checkbox`)
- [ ] Nothing clickable is a `div`/`span`/`li`/`img`; navigation is an `<a>`, actions are a `<button>`
- [ ] Team and tournament logos through `pdz-team-logo`; every `<img>` has `alt`
- [ ] Tables use `pdz-table`
- [ ] `routerLink` / `navigate` use `route-paths.ts` constants
- [ ] `[ngClass]` → `[class.x]`; no HTML comments

**TypeScript**
- [ ] `@pdz/*` aliases, no `../../` imports
- [ ] No `CommonModule` (built-in control flow is used everywhere already)
- [ ] `input()` / `output()` / `model()` / `viewChild()` / `host: {}` instead of decorators
- [ ] `takeUntilDestroyed()` or `toSignal()` instead of `destroy$` + `ngOnDestroy`
- [ ] Component state in signals, not `BehaviorSubject`
- [ ] `ChangeDetectionStrategy.OnPush`
- [ ] No `any`, no `console.log`, no comments

---

## 7. Phases in detail

### Phase 0: prune before restyling

Anything deleted here doesn't have to be restyled.

- [x] **Decide the duplicate pages.** `drafts-v2` and `opponent/score-v2` are the owner's
      test pages (2026-10-03). Both stay routed alongside the originals; leave them alone.
- [x] Orphaned `league-bracket-canvas` deleted (2026-10-03). `bracket-layout.ts`, which the
      stage builder's match card uses, moved up to `league-bracket/`.
- [x] Commented-out `SetAnalyzerComponent` route in `tools.routes.ts`.
- [x] `news.data.ts`: ~380 lines of commented-out news entries.
- [x] `core/_base.scss`: `.cdk-overlay-container` rules. No CDK overlay is left.
- [x] `styles/global.scss`: legacy `pdz-*` forward with zero callers.
- [x] `styles.scss`: commented `.pdz-types` block; global `input[type="text"]`
      background rule that fights `pdz-input`.
- [x] `shared/layout/section/`: empty directory.
- [x] `.fancy-font` in `league-drafting.component.html` (7 uses, no style defines it,
      left over from `--pdz-font-fancy`).
- [x] Empty stylesheets: `draft-form`, `opponent-form`, `tournament-draft`, planner
      `summary`, `format-select`, `ruleset-select`, `typechart-core`. (`draft-form` and
      `opponent-form` turned out to carry a loading wrapper and were kept.)
- [x] `console.log` in `owner.guard`, `quick-draft-final`, `quick-matchup-base`, and
      `settings.service`, which logs the user's settings payload.
- [x] Comments: 994 lines in 82 components (column `cmt`), led by the bracket
      generator and canvas, `pokemon-search.types`, `tier-list-form`, `team-editor` and
      `pokemon-dialog`.
- [x] Commit the audit script as `tools/audit-client.mjs` so the appendix can be
      regenerated and tracked to zero.

### Phase 1: foundations

All token work, done in one sitting so the gallery shows the whole system at once.

- [x] Ladder roles, state layers, `border-subtle` / `border-control` / `outline`, text
      roles (§1–3) in `_defaults.scss`, then per-theme overrides. Sunset tints its light
      surfaces orange: either it gets an orange version of every rung or it moves to the
      neutral ladder (B5, open).
- [x] Fold `menu-*` into the ladder and state layers (B6). Tokens deleted 2026-10-01.
- [x] `team1-*` / `team2-*` aliases and the viewer-ordering helper (`orderForViewer`
      in `@pdz/core/utils/versus`).
- [x] Elevation shadow tokens replace `$shadows`; delete `inset-*`.
- [x] Gray chroma floor in the ramp generator; `npm run gen:colors`.
- [x] Type roles; delete `4xs` / `3xs`; weight tokens only 400 / 600 / 700.
- [x] Layout spacing aliases and the 4rem step.
- [x] `respond-below` mixin.
- [x] `versus-gradient`; Shiny warning hue (Shiny no longer overrides `warning`, so it
      is amber); record-box contrast bug.
- [x] **Contrast check script** (`tools/check-contrast.mjs`): compile `styles.scss`,
      read each `[pdz-theme][pdz-theme-mode]` block, and assert every text role ≥ 4.5 on
      every ladder rung, `outline` ≥ 3, and that every rung is lighter than the one
      below it in dark mode. Five themes × two modes is too many combinations to check by eye.
- [x] Gallery: an **Elevation** section showing ground → raised → raised-high →
      overlay → floating, with an inset on each, in every theme.
- [x] Gallery: a **Two colors** section showing the H1 do/notice split and a head-to-head
      with half washes and colored scores, in every theme. H1 accepted 2026-10-03.

### Phase 2: primitives

| Primitive | Change |
| --- | --- |
| `pdz-card` (+ `_card.scss`) | `raised`; `tone` maps onto the ladder; hover = lift; `elevated` input → `raised-high` (today it is a resting level-2 shadow) |
| `pdz-page-header` | default `tone="plain"`, no wash (reverted 2026-10-03); title in `headline` |
| `pdz-widget`, `pdz-disclosure` | `raised`; header divider `border-subtle` |
| `pdz-menu`, `pdz-select` panel, `pokemon-search` panel | `floating` + `elevation-2` |
| `pdz-dialog`, confirm dialog, `pokemon-dialog` | `overlay` + `elevation-3` |
| `pdz-toast` | `floating` |
| `pdz-tooltip` | keep `surface-inverse`; `elevation-2` |
| `_input.scss`, `pdz-select` trigger, segmented track, slide-toggle, slider | `inset`; borders `border-control`; focus ring unchanged |
| `pdz-button` | outlined variant `border-control`; hover via state layer; no scale on hover |
| `pdz-icon` | idle icons muted; active/selected icons `FILL 1` in primary (C4, 3 of 375 uses set `fill` today). Fix or delete the dead `opticalSize` input: it writes the axis tag `'OPSZ'`, but the real tag is lowercase `opsz` |
| `pdz-tabs`, `pdz-tab-nav`, tournament nav | state layers; active item is primary with a filled icon and a soft tint |
| `_table.scss` (D1) | drop the `primary` header tone (5 tables) and zebra (5 tables); muted small header text; hairline row dividers; numbers right-aligned and tabular; row hover via state layer; your own row tinted primary with a "You" tag |
| `pdz-chip`, `pdz-badge`, `pdz-score` | pending B3: soft tinted badges (container + on-container) vs today's solid fills. The record-box contrast bug is fixed either way |
| matchup scoreboard, score entry, matchup card, trade card | viewer-ordered team 1 / team 2; equal weight; half washes + colored score numerals (§5 rule 7); the scoreboard's full-width `primary-gradient` goes |
| `pdz-skeleton` | shimmer between `raised` and `raised-high` |
| top navbar | `ground` + bottom `border-subtle`; drop `--pdz-level-2`. A blur does nothing because `<main>` is the scroll container and content never passes under the bar |
| score-entry widgets | wells → `inset`; nested blocks → `raised-high` |
| **new** `pdz-team-logo` | One logo primitive with size and an initials fallback. No team-color ring (F5 rejected). It replaces 12 raw `<img>` team and tournament logos (`match-row`, `season-detail`, `league-landing`, `league-matchup`, `team-standings`, `league-team-card`, `matchup-card`, `tournament-landing`, `tournament-nav`, `trade-card`, `opponent-preview`, `team-edit-dialog`). This is the audit's "let the sprites and logos do the decorating" |

Update `/debug/components` in the same pass, and check every primitive in all five themes, both modes.

### Phase 3: feature sweep

Go one area at a time with the §6 checklist. The order puts the most-seen pages first:

| # | Area | Components with findings | Notes |
| --- | --- | --- | --- |
| 3.1 | `layout` + `pdz.component` | 7 | navbar, error page, settings dialog |
| 3.2 | `features/league-zone` | 66 | The tournament landing mockup from the audit is the reference page. `league-drafting` is the worst file in the repo (28 raw lengths, 11 side-B uses, 10 manual unsubscribes, 4 `!important`, 5 2px borders). `tournament-settings` has 9 hand-rolled card or well blocks |
| 3.3 | `features/pages` | 10 | **Homepage rebuild** on tokens: one signature hero (versus gradient, large logo, Nasalization title); news panels lose their level-2 shadows. `<button routerLink="/about">` → `<a pdz-button>`; `about`'s `<span routerLink>` → `<a>`; relative `../../../assets` paths |
| 3.4 | `features/drafts` | 35 | after the phase 0 v1/v2 decision; matchup overview is the reference for side A/B |
| 3.5 | `features/tools` | 21 | `wheel` has 17 color literals (its segment palette should come from the type or theme ramps); `binder` has 11 native buttons |
| 3.6 | `features/tier-lists` | 10 | `tier-list-form`: 41 comment lines, 5 2px borders, 5 decorator APIs |
| 3.7 | `features/planner` | 10 | |
| 3.8 | `features/league-list`, `statistics`, `teambuilder`, `admin` | 15 | |
| 3.9 | `shared/` leftovers | 49 | `pokemon-dialog` (8 raw weights, 5 clickable spans), `summary-core`, `movechart-core`, `typechart-core` / `typestats-core` (raw `<table>`, BehaviorSubject state) |
| 3.10 | `core/debug` | 14 | Last, because it documents everything else |

Missing `<pdz-page-header>` on 30 routed pages: `drafts`, `drafts-v2`, draft
new/edit/stats, matchup overview, opponent form/preview/score/score-v2, `league-form`,
`league-manage`, `planner`, `teambuilder`, `statistics`, `tools` and every tool page
(quick-draft, quick-matchup, random-draft, replay, time converter, wheel, pokemon
search), `tournament-draft`, `about`, `supporters`, `admin-dashboard`, and the three debug
pages. `homepage`, `landing`, `not-found` and `external-link` are deliberate exceptions.

### Phase 4: lock-in

- [x] Delete `surface-container*`, `surface-variant`, `background`, `surface` and
      `outline-variant` from the theme maps. **Done 2026-10-01**: all ~385 callers
      (SCSS, Sass tone maps, d3 charts, the bracket canvas theme reader) were
      reclassified and every legacy role deleted from `_defaults` and Sunset. Added
      `state-strong` for the neutral filled button. Dark `outline` moved to gray-550.
- [x] CLAUDE.md "-lowest when nested" line replaced with the ladder rules. `pdz.color()` validates at compile time,
      so any missed caller fails the build.
- [x] Every rule in §8 becomes an error; `npm run lint` runs all three linters plus the
      audit gate and the contrast check (2026-10-02, second pass).
- [x] Rewrite CLAUDE.md "Styles": the ladder, insets, state layers, the
      `border-subtle` / `border-control` split, and the §5 team 1 / team 2 rules. **Remove "`-lowest`
      when nested"**, since that line is what codified the sinking.
- [x] Regenerate the appendix (2026-10-02). It is not empty: what remains is the TS
      modernization columns and the deliberate exceptions listed under §8.

---

## 8. Enforcement

There's no ESLint in the repo; `tools/lint-styles.mjs` is the only guard, and it covers
font size, duration, easing and z-index. Each phase ends by adding the rule for what it
just fixed, so nothing regresses while the rest of the sweep runs.

Status as of 2026-10-02 (second pass). Every rule marked "error" fails `npm run lint`.
Declaration rules in `lint-styles` read whole declarations, so multi-line `transition:`
and `box-shadow:` values are checked too (the old line-by-line check missed them).

| Rule | Linter | Status |
| --- | --- | --- |
| `raw-font-weight` (keywords `normal`/`bolder`/`lighter` allowed) | styles | error |
| `raw-color` (hex/rgb/hsl outside `tokens/`, `themes/`, `tools/`) | styles | error; wheel allowlisted for its drum shading |
| `raw-radius` | styles | error |
| `raw-shadow` (`none`, `var(--pdz-…)`, or a `0 0 0 <w>` ring; `@keyframes` exempt) | styles | error |
| `raw-media` (`@media` width query → `respond-above/below`) | styles | error |
| `raw-spacing` (margin/padding/gap/inset lengths other than 0 and 1px; `calc()` geometry allowed) | styles | error; homepage hero allowlisted (`em` word gap) |
| `display-font` (Nasalization outside titles and big numbers) | styles | error; page header, homepage, pick clock, tournament nav title allowlisted |
| `raw-duration` / `raw-easing` (now multi-line aware) | styles | error |
| `legacy-role`, `legacy-shadow` | styles | error, by deletion |
| `important`, `ng-deep` | styles | error |
| native text field / checkbox / radio / range / textarea without the primitive | templates | error; inline editors (planner tab rename and value cells, chip input, wheel) allowlisted |
| native `<button>` without `pdz-button` | — | **not enforced.** Composite controls (type toggles, row pickers, slot buttons, sort headers) are correctly bare buttons |
| `(click)` on a non-interactive element without role / tabindex / `aria-hidden` backdrop | templates | error; team-editor header (mirrors its expand button) and the tier-list drag editor allowlisted |
| `routerLink` on a non-anchor | templates | error |
| raw `<img>` for logos; `<img>` without `alt` | templates | error; logo upload previews allowlisted |
| `[ngClass]` | templates | error |
| routed component without `<pdz-page-header>` (follows child components and parent shells) | audit gate | error |
| `routerLink="/…"` and `navigate(['/…'])` literals | templates, ts | error |
| HTML comments, TS comments, `console.log` | templates, ts | error |
| `../../` imports (specs included), `CommonModule`, raw `localStorage` | ts | error |
| decorator APIs, manual unsubscribe, `BehaviorSubject` state, no `OnPush`, `any` | — | not enforced yet; tracked in the appendix (§9) |

---

## 9. TypeScript drift

This rides along with the sweep (§6) instead of being its own pass, because each fix is
small and touches the same files. Totals, excluding specs:

| Practice | Count | Components |
| --- | --- | --- |
| Deep relative imports (`../../`) — CLAUDE.md requires `@pdz/*` | 119 | 55 |
| `CommonModule` imported, though control flow is built-in | 36 | 36 |
| `@Input` / `@Output` / `@ViewChild` / `@HostListener` | 94 | 48 |
| `takeUntil(this.destroy$)` + `ngOnDestroy` | 99 | 33 |
| `new BehaviorSubject` for component state | 25 | 17 |
| No `OnPush` | 123 of 223 components | |
| `any` | 37 | 14 |
| Route string literals instead of `route-paths.ts` | 17 | 12 |
| Direct `localStorage` without a shared safe wrapper | 32 | 16 |

The `localStorage` calls should go through one wrapper that catches the
private-mode / blocked-storage throw. `wheel` already has a `wheel-storage.service`
that can be generalized.

---

## 10. Already right — keep

- Tokens for every value, with compile-time validation in `pdz.color()`
- An OKLCH lightness ladder shared across hues, generated by one tool
- A style linter that blocks raw literals, ready to extend
- Zero native `<select>`, zero Angular Material, zero CDK overlay, zero `*ngIf`/`*ngFor`
- Visible focus rings with offset; reduced-motion zeroed at the token level; forced-colors handling
- Tabular numerals on tables and records
- A component gallery to verify against
- Themes built as side A / side B pairs; a two-tone logo that already states the versus identity

---

## 11. Open decisions

1. **Duplicate pages:** settled 2026-10-03. The v2 pages are the owner's test pages and stay.
2. **Role names:** `ground` / `raised` / `raised-high` / `overlay` / `floating` / `inset`
   as proposed, or a numbered `surface-0…4`? Named roles say what they're for;
   numbers make the order obvious.
3. **Light ground:** settled 2026-10-07 on **gray-50** (Sunset orange-50). The temporary
   "Lighter Page Background" toggle, its `pdz-ground` theme block and the gallery's gray-25
   comparison are deleted.
4. **B5: themes swap only the accent pair?** Sunset's light surfaces are orange-tinted
   today. Keep a tinted ladder, or move to the neutral ladder and let the pair carry the theme?
5. **Secondary on single-focus pages:** H1 accepted 2026-10-03. Pokémon search: filter
   pills and the filter being edited are primary; the result count, the bookmark toggle
   (filled when saved), the saved-searches panel icon and the sorted-by stat (a value
   under each grid card, a ring on the list view's stat cube) are secondary. Planner:
   Points Remaining is a secondary numeral (danger when over budget); the move-pool chart
   stays primary because a page about one team makes it team 1; the finder's "No open
   slot" message is now warning, not success. The other secondary uses were classified
   the same day: buttons set to secondary became neutral (now a lint error, v2 test pages
   allowlisted), speed-tier filter chips went primary, replay chart lines use
   `team1`/`team2`. What the audit's `B` column still lists is classified (notice, brand,
   charts, the v2 test pages). Still open: H6, whether "notice" uses fall back to neutral
   inside head-to-head views. Also decide H6:
   inside head-to-head views, should H1's "notice" uses fall back to neutral so secondary only means team 2?
6. **B3: status badges.** Soft tints or today's solid fills? Compare real components in the gallery.
7. **B4: single-hue gradients.** Flatten `primary-gradient` / `menu-gradient` / `hero` on
   buttons and banners? (`versus-gradient` for brand moments is already in.)
8. **C2: type scale.** Seven sizes tied to roles (12 / 13 / 14 / 16 / 18 / 24 / 32+), or keep today's ten?
9. **F9: team aliases in code.** `team1-*` / `team2-*` + viewer-ordering helper + a lint
   allowlist that covers versus and brand-moment components.
10. **A4 at the end:** corner radii, once the font question is settled.
11. **A3 during the sweep:** density is decided screen by screen, so ask before changing it.

---

## Appendix: per-component inventory (current)

Generated 2026-10-02 by `node tools/audit-client.mjs` (rerun it for a fresh copy; `--code=<code>`
lists one column, `--json` dumps everything). Columns not shown are at zero and gated in
`npm run lint`. What is left, and why:

- `ctl`: composite controls that are correctly bare `<button>`s (type toggles, row and slot
  pickers, sort headers), the bespoke wheel and binder, and the allowlisted inline editors.
- `card`: nested rows that restate a card's fill, border and radius. Many are deliberate
  `raised-high` blocks inside a card; each needs a look before it becomes `<pdz-card>`.
- `img`: content images (screenshots, news art, move and tera icons, the 404 art, logo
  upload previews). Team logos all go through `pdz-team-logo` now.
- `a11y`: aria-hidden dismiss backdrops, keyboard-reachable rows, and the allowlisted
  pointer shortcuts.
- `lit`: the wheel's drum shading. `2px`: drawn lines, rings and dashed drop zones.
- `nasa`: the pick clock and the tournament title (allowed big moments).
- `B`, `tint`: wait on H1/H6.
- `dec`, `sub`, `bs`, `push`, `any`: the §9 TypeScript modernization, not started.

| Code | Total | Units |
| --- | --- | --- |
| `ctl` | 44 | 20 |
| `a11y` | 11 | 8 |
| `img` | 11 | 9 |
| `tbl` | 3 | 3 |
| `card` | 75 | 53 |
| `shadow` | 4 | 2 |
| `2px` | 10 | 10 |
| `sp` | 4 | 4 |
| `lit` | 16 | 1 |
| `nasa` | 2 | 2 |
| `tint` | 1 | 1 |
| `B` | 13 | 8 |
| `dec` | 58 | 31 |
| `sub` | 25 | 13 |
| `bs` | 20 | 12 |
| `push` | 77 | 77 |
| `any` | 27 | 7 |

Zero and gated: `hdr`, `lvl`, `w`, `mq`, `rad`, `imp`, `hov`, `rel`, `cm`, `log`, `route`, `cmt`.

---

## Appendix: baseline inventory (2026-10-01)

Kept so the fixed findings still explain why each step exists. Generated 2026-10-01. Codes and counts:

`hdr` routed page without `<pdz-page-header>` · `ctl` native control · `a11y` click
handler or `routerLink` on a non-interactive element · `img` raw `<img>` · `tbl` raw
`<table>` · `card` hand-rolled card block · `well` `surface-container-lowest`/`background`
fill · `srf` `surface-container*` uses to classify · `shadow` shadow to review · `w` raw
font-weight · `2px` 2px border · `mq` raw media query · `sp` raw length in
spacing/position · `rad` raw radius · `lit` color literal · `imp` `!important`/`::ng-deep`
· `B` secondary (side B) color to classify · `rel` deep relative import · `cm`
`CommonModule` · `dec` decorator API · `sub` manual unsubscribe · `bs` BehaviorSubject ·
`push` no OnPush · `any` · `log` console.log · `route` route literal · `cmt` comment lines

Heuristic counts. `srf` and `B` aren't errors on their own; each use needs
classifying against §1 and §5.

### `core` (14)

| Component | Findings |
| --- | --- |
| `debug/calculator/calc-charts.component` | srf 1 · sp 1 · dec 4 · push |
| `debug/calculator/debug-calculator.component` | hdr · tbl 1 · card 1 · srf 2 · sp 2 · push |
| `debug/components/debug-components.component` | card 1 · srf 1 · sp 1 · push · route 2 |
| `debug/debug.component` | hdr · card 2 · well 1 · srf 2 · shadow 2 · w 1 · push · any 6 · route 3 · cmt 3 |
| `debug/sprites/debug-sprites.component` | hdr · srf 1 · w 1 |
| `guards/admin/admin.guard` | cmt 1 |
| `guards/owner/owner.guard` | log 1 |
| `guards/owner/ownership.service` | cmt 1 |
| `services/api.service` | any 1 |
| `services/data.service` | cmt 2 |
| `services/sw-update.service` | cmt 1 |
| `utils/index` | any 6 |
| `utils/pokemon` | any 1 |
| `utils/styling` | cmt 1 |

### `features/admin` (4)

| Component | Findings |
| --- | --- |
| `admin-dashboard/admin-dashboard.component` | hdr · srf 2 · mq 1 · push · cmt 16 |
| `charts/bar-chart.component` | dec 1 · push · cmt 3 |
| `charts/pie-chart.component` | w 1 · dec 1 · push · cmt 2 |
| `charts/time-series-chart.component` | srf 1 · shadow 1 · lit 1 · dec 2 · push · cmt 16 |

### `features/drafts` (35)

| Component | Findings |
| --- | --- |
| `draft-overview/archive.model` | cmt 1 |
| `draft-overview/draft-form/components/chip-input/chip-input.component` | ctl 1 · a11y 1 · push |
| `draft-overview/draft-form/components/team-editor/team-editor.component` | ctl 4 · a11y 2 · img 2 · card 1 · well 1 · srf 3 · w 2 · mq 1 · sp 1 · dec 1 · push · cmt 25 |
| `draft-overview/draft-form/draft-form-core/draft-form-core.component` | well 1 · shadow 1 · mq 2 · sp 1 · rel 1 · dec 1 · sub 1 · bs 1 · push · cmt 14 |
| `draft-overview/draft-form/draft-form-edit/draft-form-edit.component` | hdr · rel 2 · push |
| `draft-overview/draft-form/draft-form-new/draft-form-new.component` | hdr · rel 2 · push |
| `draft-overview/draft-form/draft-form.component` | sp 1 |
| `draft-overview/draft-preview/draft-preview.component` | hdr · rel 3 · cm · push · route 1 |
| `draft-overview/draft-stats/draft-stats.component` | hdr · shadow 1 · mq 1 · sp 3 · cm · bs 1 · push |
| `drafts-v2/drafts-v2.component` | hdr · card 1 · srf 2 |
| `drafts-v2/match-row/match-row.component` | ctl 1 · img 1 · well 1 · srf 5 |
| `drafts-v2/season-card/season-card.component` | well 1 · srf 3 |
| `drafts-v2/season-detail/season-detail.component` | img 1 · card 1 · well 1 · srf 5 |
| `matchup-overview/matchup-overview.component` | hdr · card 1 · well 1 · srf 2 · shadow 4 · sp 1 · dec 2 · push |
| `matchup-overview/matchup.service` | cmt 5 |
| `matchup-overview/matchup/coveragechart/coverage/coverage.component` | ctl 2 · img 2 · shadow 4 · w 1 · mq 6 · sp 8 · rel 2 · dec 1 · push |
| `matchup-overview/matchup/coveragechart/coverage/effectiveness-chart/effectiveness-chart.component` | push · any 4 · cmt 3 |
| `matchup-overview/matchup/coveragechart/coveragechart.component` | sp 1 · B 3 · rel 1 · dec 1 · push |
| `matchup-overview/matchup/matchup.component` | push · cmt 1 |
| `matchup-overview/matchup/speedchart/speedchart.component` | ctl 1 · w 2 · B 5 · rel 2 · dec 1 |
| `matchup-overview/matchup/speedchart/speedtier/speedtier.component` | rel 1 |
| `matchup-overview/matchup/speedchart/tier-group/speedtier-group.component` | 2px 1 · sp 2 · B 4 · rel 2 |
| `matchup-overview/notes/matchup-notes.component` | ctl 1 · card 1 · well 3 · srf 3 · sp 2 · dec 1 |
| `matchup-overview/share-dialog/share-dialog.component` | shadow 1 · w 1 · mq 2 · sp 5 · B 2 · cmt 1 |
| `matchup-overview/widgets/movechart/movechart.component` | B 4 · rel 1 · push |
| `matchup-overview/widgets/overview/overview.component` | a11y 4 · w 2 · mq 2 · sp 4 · B 2 · rel 2 · cm · dec 1 · bs 1 · push |
| `matchup-overview/widgets/summary/summary.component` | B 1 · rel 1 · push |
| `matchup-overview/widgets/typechart/typechart.component` | B 2 · rel 1 · dec 1 · push |
| `opponent-overview/opponent-form/opponent-form-core/opponent-form-core.component` | card 1 · well 1 · srf 1 · shadow 1 · w 1 · mq 2 · sp 1 · rel 3 · dec 1 · bs 1 · push · cmt 14 |
| `opponent-overview/opponent-form/opponent-form.component` | hdr · sp 1 · rel 2 · push |
| `opponent-overview/opponent-overview.component` | 2px 1 · mq 3 · sp 9 · rad 1 · lit 2 · imp 1 · cm · push |
| `opponent-overview/opponent-preview/opponent-preview.component` | hdr · img 1 · shadow 1 · w 1 · 2px 1 · sp 7 · B 2 · rel 1 · cm · bs 1 · push |
| `opponent-overview/opponent-score-v2/ko-graph.component` | well 1 · srf 5 · shadow 2 · 2px 1 · sp 1 · B 6 |
| `opponent-overview/opponent-score-v2/opponent-score-v2.component` | hdr · sp 1 · rel 2 · sub 4 |
| `opponent-overview/opponent-score/opponent-score.component` | hdr · sp 1 · rel 3 · sub 4 · push |

### `features/league-list` (5)

| Component | Findings |
| --- | --- |
| `form/league-form.component` | hdr · w 1 · sp 2 · push · route 2 · cmt 17 |
| `league-ad/league-ad.component` | shadow 3 · sp 1 · B 1 · cm · dec 1 · push · cmt 1 |
| `league-ads.service` | cmt 1 |
| `league-list.component` | a11y 4 · shadow 1 · sp 1 · dec 1 · push |
| `manage/league-manage.component` | hdr · sp 1 · push |

### `features/league-zone` (66)

| Component | Findings |
| --- | --- |
| `dialogs/replace-coach-dialog/replace-coach-dialog.component` | rel 1 |
| `dialogs/team-edit-dialog/team-edit-dialog.component` | img 1 |
| `league` | sp 1 |
| `league-bracket/bracket-generator` | cmt 37 |
| `league-bracket/bracket.model` | cmt 23 |
| `league-bracket/league-bracket-canvas/bracket-canvas-renderer` | cmt 31 |
| `league-bracket/league-bracket-canvas/bracket-hit-test` | cmt 8 |
| `league-bracket/league-bracket-canvas/bracket-theme-colors` | cmt 4 |
| `league-bracket/league-bracket-canvas/bracket-transform` | cmt 2 |
| `league-bracket/league-bracket-canvas/league-bracket-canvas.component` | ctl 3 · a11y 1 · srf 5 · sp 1 · lit 1 · rel 1 · cm · dec 13 · any 1 · cmt 41 |
| `league-bracket/league-bracket.component` | cm · push |
| `league-bracket/tournament-bracket.model` | cmt 25 |
| `league-chat/league-chat.component` | ctl 1 · srf 5 · sp 4 · cm · dec 1 · sub 3 · push · cmt 1 |
| `league-drafting/league-drafting.component` | ctl 4 · a11y 1 · srf 1 · shadow 3 · w 5 · 2px 5 · mq 1 · sp 28 · rad 1 · imp 4 · B 11 · rel 1 · cm · dec 1 · sub 10 · push · route 1 · cmt 8 |
| `league-landing/league-landing.component` | img 1 · well 1 · srf 2 · shadow 1 · w 7 · 2px 1 · sp 4 · lit 3 · cm · sub 1 · push |
| `league-manage/league-manage-draft/league-manage-draft.component` | ctl 2 · well 1 · srf 8 · shadow 1 · w 3 · 2px 1 · rad 2 · B 3 · rel 7 · sub 14 · bs 1 · push · route 1 · cmt 13 |
| `league-manage/league-manage-results/league-manage-results.component` | sp 1 · rel 4 · push |
| `league-manage/league-organizers/league-organizers.component` | srf 2 · rel 3 · push |
| `league-manage/trade-manager/trade-manager.component` | ctl 1 · srf 1 · w 7 · 2px 1 · sp 2 · rel 4 · sub 5 · bs 1 · push · route 1 |
| `league-matchup/league-matchup.component` | img 1 · card 1 · srf 8 · shadow 1 · sp 1 · lit 2 · cm · sub 4 · push |
| `league-matchup/league-matchup.model` | cmt 3 |
| `league-matchup/matchup-report/matchup-report.component` | srf 2 · sp 4 · rel 1 · dec 1 · sub 2 · push |
| `league-role.guard` | route 2 · cmt 1 |
| `league-rules-overview/league-rules-form/league-rules-form.component` | ctl 2 · card 1 · srf 2 · shadow 2 · w 2 · 2px 1 · sp 2 · rel 2 · cm · sub 2 · push |
| `league-rules-overview/league-rules-overview.component` | srf 1 · w 1 · 2px 1 · sp 2 · sub 1 · push · cmt 2 |
| `league-sign-up/league-sign-up.component` | tbl 1 · srf 1 · w 3 · 2px 3 · sp 4 · rad 2 · cm · sub 6 · push · any 1 · cmt 10 |
| `league-stage-builder/match-card/match-card.component` | rel 4 · dec 3 |
| `league-stage-builder/stage-builder-page.component` | ctl 2 · srf 4 · cm · push |
| `league-stage-builder/stage-builder.component` | srf 5 · shadow 6 · sp 5 · cm · dec 4 |
| `league-standings/league-standings.component` | sp 4 · cm · push · cmt 2 |
| `league-standings/pokemon-standings/pokemon-standings.component` | a11y 4 · srf 3 · 2px 1 · sp 6 · B 2 · rel 1 · push |
| `league-standings/team-standings/team-standings.component` | img 1 · srf 1 · 2px 1 · sp 8 · B 1 · rel 2 · cm · push |
| `league-team/league-team.component` | srf 2 · w 5 · 2px 1 · sp 1 · B 2 · cm · dec 1 · sub 9 · push |
| `league-team/trade-propose-dialog/trade-propose-dialog.component` | w 5 · 2px 1 · sp 2 · B 1 · rel 2 · bs 2 · push |
| `league-teams/league-team-card/league-team-card.component` | img 1 · sp 5 · B 3 · rel 2 · cm · push |
| `league-teams/league-teams.component` | sp 1 · push |
| `league-trades/league-trades.component` | push |
| `league-widgets/league-schedule-widget/league-schedule-widget.component` | 2px 1 · sp 1 · rel 4 · sub 1 · push |
| `league-widgets/league-trade-widget/league-trade-widget.component` | rel 3 · sub 2 · push |
| `league-widgets/pool-switcher/pool-switcher.component` | rel 1 · dec 1 · sub 1 · push |
| `league-widgets/stage-switcher/stage-switcher.component` | rel 2 · cm · dec 1 · sub 1 · push · cmt 1 |
| `league.mixins` | srf 1 · B 1 · cmt 1 |
| `logo-field/logo-field.component` | card 1 · well 1 · srf 1 |
| `matchup-card/matchup-card.component` | ctl 1 · img 1 · srf 6 · shadow 1 · sp 3 · dec 3 |
| `matchup-card/matchup-card.model` | cmt 1 |
| `organizer-invite/organizer-invite.component` | push |
| `pools/pool-dashboard/pool-dashboard.component` | srf 1 · 2px 1 · sp 1 · rel 6 · sub 2 · push · route 1 |
| `pools/power-rankings/power-rankings.component` | ctl 1 · card 1 · srf 1 · w 2 · mq 2 · sp 11 · rad 2 · B 1 · rel 7 · sub 2 · push |
| `tournament-settings/applicants-panel.component` | card 1 · well 1 · srf 3 · sp 1 |
| `tournament-settings/artifact-card.component` | card 1 · well 1 · srf 2 |
| `tournament-settings/custom-slot.component` | card 1 · well 1 · srf 1 |
| `tournament-settings/draft-settings-page.component` | sp 2 · rad 1 |
| `tournament-settings/launch-checklist.component` | srf 1 |
| `tournament-settings/pool-order.component` | card 1 · well 1 · srf 1 · shadow 1 · sp 1 |
| `tournament-settings/risk-banner.component` | card 1 · srf 1 · sp 1 |
| `tournament-settings/save-bar.component` | card 1 · srf 1 · shadow 1 |
| `tournament-settings/settings-dashboard.component` | srf 3 · shadow 1 · rad 1 |
| `tournament-settings/settings-node.component` | card 1 · well 1 · srf 1 · sp 2 |
| `tournament-settings/signup-settings-page.component` | sp 1 |
| `tournament-settings/tier-list-panel.component` | tbl 1 · card 1 · well 1 · srf 1 · w 1 · mq 1 · sp 2 |
| `tournaments/tournament-draft/tournament-draft.component` | hdr · rel 2 · sub 1 · push |
| `tournaments/tournament-landing/tournament-landing.component` | img 1 · srf 3 · w 2 · 2px 1 · sp 1 · rel 4 |
| `tournaments/tournament-layout/tournament-layout.component` | a11y 1 · card 1 · srf 2 · shadow 2 · push |
| `tournaments/tournament-nav/tournament-nav.component` | img 1 · srf 2 · w 2 · sp 1 · rel 4 · cm · sub 5 · push |
| `tournaments/tournament-pools/tournament-pools.component` | srf 2 · rel 2 · cm · sub 1 · push |
| `trade-card/trade-card.component` | img 1 · srf 3 · sp 1 · B 2 |

### `features/pages` (10)

| Component | Findings |
| --- | --- |
| `about/about.component` | hdr · a11y 1 · img 4 · card 1 · srf 1 · push · route 1 |
| `external-link/external-link.component` | w 1 · push |
| `homepage/changelog-core/changelog-core.component` | sp 9 · push |
| `homepage/homepage.component` | ctl 1 · well 2 · srf 1 · shadow 1 · 2px 1 · mq 2 · sp 14 · push · route 1 · cmt 1 |
| `homepage/news-core/news-core.component` | img 1 · sp 13 · imp 1 · B 1 · cm · push |
| `homepage/news-core/news.data` | cmt 384 |
| `homepage/unread.service` | bs 2 · cmt 8 |
| `landing/landing.component` | well 1 · srf 1 · sp 1 · B 1 |
| `not-found/not-found.component` | img 1 · push |
| `supporters/supporters.component` | hdr · img 1 · srf 3 · shadow 1 · w 2 · push |

### `features/planner` (10)

| Component | Findings |
| --- | --- |
| `coverage/charts/coverage-chart.component` | rel 1 · push · any 9 · cmt 9 |
| `coverage/charts/coverage-team-chart.component` | dec 1 · push · cmt 8 |
| `coverage/move-coverage.component` | ctl 1 · srf 1 · mq 2 · B 1 · rel 1 · dec 1 · push |
| `coverage/team-coverage.component` | rel 1 · dec 1 · sub 2 · push |
| `moves/moves.component` | rel 1 · push |
| `planner.component` | hdr · ctl 1 · a11y 2 · well 2 · srf 4 · shadow 1 · mq 3 · sp 3 · lit 1 · dec 6 · push · any 3 · cmt 7 |
| `settings/settings.component` | card 1 · srf 1 · w 1 · push |
| `summary/summary.component` | rel 1 · push |
| `team/team.component` | ctl 2 · card 1 · well 1 · srf 4 · shadow 1 · dec 1 · push |
| `typechart/typechart.component` | rel 1 · push |

### `features/statistics` (2)

| Component | Findings |
| --- | --- |
| `statistics.service` | cmt 2 |
| `statistics/statistics.component` | hdr · sp 3 · rad 1 · B 4 · sub 1 · push |

### `features/teambuilder` (4)

| Component | Findings |
| --- | --- |
| `ui/set-moves.component` | ctl 1 · srf 2 · sp 2 |
| `ui/set-speed.component` | card 1 · well 1 · srf 1 |
| `ui/set-stats.component` | ctl 1 · well 1 · srf 2 · shadow 1 · w 2 |
| `ui/teambuilder.component` | hdr · well 1 · srf 1 · sp 4 · bs 1 |

### `features/tier-lists` (10)

| Component | Findings |
| --- | --- |
| `tier-list-browse/tier-list-browse.component` | w 1 · cmt 1 |
| `tier-list-shell.component` | cmt 1 |
| `tier-list.model` | cmt 3 |
| `tier-list/_tier-list-shared` | srf 2 · 2px 2 · sp 3 · cmt 5 |
| `tier-list/tier-list-form/import-dialog/import-dialog.component` | card 1 · srf 1 · sp 7 · push |
| `tier-list/tier-list-form/pokemon-edit-dialog/pokemon-edit-dialog.component` | rel 1 · cmt 5 |
| `tier-list/tier-list-form/tier-list-form.component` | a11y 3 · srf 2 · shadow 3 · w 1 · 2px 5 · sp 3 · B 3 · rel 2 · cm · dec 5 · sub 3 · cmt 41 |
| `tier-list/tier-list-settings-dialog/tier-list-settings-dialog.component` | rel 1 |
| `tier-list/tier-list.component` | a11y 2 · srf 1 · shadow 1 · w 1 · 2px 1 · sp 6 · rel 1 · cm · dec 1 · sub 1 · push · cmt 5 |
| `tier-list/tier-list.utils` | cmt 4 |

### `features/tools` (21)

| Component | Findings |
| --- | --- |
| `binder/binder-store` | cmt 2 |
| `binder/binder.component` | ctl 11 · srf 7 · shadow 3 |
| `pokemon-search/filter-drawer/filter-drawer.component` | ctl 3 · srf 3 · sp 1 · B 1 · dec 3 · push · cmt 5 |
| `pokemon-search/pokemon-search-core/pokemon-search-core.component` | ctl 1 · card 2 · srf 4 · shadow 3 · w 7 · mq 3 · sp 1 · dec 1 · sub 1 · push · cmt 3 |
| `pokemon-search/pokemon-search.component` | hdr · a11y 1 · srf 4 · shadow 1 · w 1 · sp 2 · cm · push · cmt 2 |
| `pokemon-search/pokemon-search.types` | cmt 56 |
| `pokemon-search/save-searches.service` | cmt 2 |
| `quick-draft/quick-draft-final/quick-draft-final.component` | 2px 1 · sp 1 · rad 1 · dec 1 · push · log 1 · cmt 1 |
| `quick-draft/quick-draft-picks/quick-draft-picks.component` | shadow 1 · w 1 · 2px 1 · mq 5 · sp 14 · rad 1 · cm · dec 1 · push |
| `quick-draft/quick-draft-setting/quick-draft-setting.component` | a11y 1 · 2px 2 · mq 4 · sp 7 · imp 2 · cm · dec 1 · push |
| `quick-draft/quick-draft.component` | hdr · mq 6 · sp 9 · push · cmt 2 |
| `quick-matchup/form/quick-matchup-form.component` | ctl 2 · well 1 · shadow 1 · mq 2 · sp 1 · dec 1 · sub 1 · bs 1 · push · cmt 12 |
| `quick-matchup/quick-matchup-base.component` | hdr · B 1 · rel 3 · push · log 1 |
| `random-draft/random-draft.component` | hdr · ctl 1 · card 1 · srf 1 · rel 1 · push |
| `replay_analyzer/replay-chart/replay-chart.component` | imp 1 · push |
| `replay_analyzer/replay.component` | hdr · srf 3 · 2px 2 · sp 9 · B 4 |
| `time_converter/time_converter.component` | hdr · card 1 · srf 1 · push |
| `tools.component` | hdr · push |
| `tools.routes` | cmt 4 |
| `wheel/wheel-options/wheel-options.component` | ctl 1 · card 1 · well 1 · srf 2 · shadow 1 · lit 1 · dec 3 · push |
| `wheel/wheel.component` | hdr · ctl 5 · a11y 1 · well 3 · srf 9 · shadow 3 · w 3 · 2px 1 · sp 4 · lit 17 · B 1 · push · cmt 2 |

### `layout` (6)

| Component | Findings |
| --- | --- |
| `error/error.component` | srf 4 · shadow 1 · w 3 · mq 1 · sp 2 · cm · sub 2 · push · cmt 6 |
| `error/error.service` | bs 1 · any 1 · cmt 4 |
| `top-navbar/login-button/login-button.component` | img 1 · push |
| `top-navbar/settings-dialog/settings-dialog.component` | ctl 1 · shadow 1 · w 1 · lit 2 |
| `top-navbar/settings.service` | bs 1 · log 1 · cmt 1 |
| `top-navbar/top-navbar.component` | shadow 1 · push · route 1 · cmt 3 |

### `pdz.component` (1)

| Component | Findings |
| --- | --- |
| `pdz.component` | well 1 · push |

### `shared` (49)

| Component | Findings |
| --- | --- |
| `buttons/button/button.component` | srf 4 · 2px 1 · sp 1 · rad 1 |
| `buttons/swap-opponent/swap-opponent.component` | cm · dec 1 · push · any 1 |
| `data/badge/badge.component` | well 1 · srf 1 · shadow 1 |
| `data/card/card.component` | shadow 1 · cmt 2 |
| `data/chip/chip.component` | srf 2 · shadow 1 · sp 1 |
| `data/pokemon-type/pokemon-type.component` | sp 1 · cmt 5 |
| `data/score/score.component` | srf 2 |
| `data/skeleton/skeleton.component` | srf 2 |
| `dialogs/dialog/dialog-host.component` | push |
| `dialogs/dialog/dialog.component` | srf 2 · shadow 1 · sp 2 |
| `dialogs/dialog/dialog.service` | cmt 1 |
| `dialogs/pokemon-dialog/pokemon-dialog.component` | ctl 2 · a11y 5 · img 1 · srf 8 · w 8 · sp 9 · lit 1 · B 2 · rel 2 · push · cmt 23 |
| `dropdowns/format-select/format.component` | push · any 1 |
| `dropdowns/pokemon-search/pokemon-search.component` | ctl 2 · a11y 1 · srf 1 · shadow 1 · sp 1 · dec 6 · sub 1 · bs 1 · push · cmt 3 |
| `dropdowns/ruleset-select/ruleset.component` | push · any 1 |
| `dropdowns/select/select.component` | srf 3 · shadow 1 · sp 1 |
| `dropdowns/timezone-select/timezone-select.component` | push |
| `feedback/toast/toast.component` | srf 1 · shadow 1 · sp 1 |
| `images/hosted-image/hosted-image.component` | cmt 1 |
| `images/icon/icon.component` | cm · dec 2 · push |
| `images/loading/loading.component` | push |
| `images/sprite-image/sprite-image.component` | img 1 |
| `images/sprite/sprite.component` | a11y 1 |
| `images/svg-components/ball.component` | push |
| `images/svg-components/pokecoin.component` | push |
| `inputs/segmented/segmented.component` | srf 1 · sp 1 |
| `inputs/slide-toggle/slide-toggle.component` | srf 1 |
| `inputs/slider/slider.component` | shadow 6 · 2px 2 · sp 2 · rad 6 · lit 2 · dec 1 · push · cmt 3 |
| `layout/disclosure/disclosure.component` | srf 2 |
| `layout/page-header/page-header.component` | srf 1 |
| `layout/tab-nav/tab-nav-link.component` | srf 1 · 2px 1 · sp 1 · cmt 1 |
| `layout/tabs/tab.component` | dec 1 |
| `layout/tabs/tabs.component` | srf 1 · 2px 1 · sp 2 |
| `layout/widget/widget.component` | sp 1 · cmt 5 |
| `menu/menu-item.component` | srf 1 |
| `menu/menu.component` | srf 1 · shadow 1 |
| `time/countdown/countdown.component` | w 2 |
| `time/discord-timestamp/discord-timestamp.component` | srf 1 |
| `time/time-converter/time-converter.component` | srf 1 · w 1 |
| `tooltip/tooltip.component` | shadow 1 |
| `widgets/movechart-core/moves.component` | ctl 3 · 2px 1 · sp 8 · cm · cmt 13 |
| `widgets/score-entry/score-entry-game.component` | well 1 · srf 1 · sp 1 · B 3 · push |
| `widgets/score-entry/score-entry-match.component` | well 4 · srf 6 · shadow 1 · B 6 · push |
| `widgets/score-entry/score-entry-roster.component` | well 2 · srf 3 · shadow 1 · sp 1 · B 3 · push |
| `widgets/score-entry/score-entry-warnings-dialog.component` | srf 1 · sp 1 |
| `widgets/summary-core/summary-core.component` | a11y 2 · w 3 · 2px 1 · sp 4 · B 1 · cm · dec 1 · bs 2 · push · any 1 · cmt 4 |
| `widgets/typechart/_typechart-core.shared` | sp 2 · cmt 1 |
| `widgets/typechart/typechart-core/typechart-core.component` | tbl 1 · cm · dec 3 · sub 3 · bs 4 · push |
| `widgets/typechart/typestats-core/typestats-core.component` | tbl 1 · cm · dec 2 · sub 2 · bs 3 · push |
