# Pokemon DraftZone — Client

Angular 21 SPA (standalone components, signals). The API lives in the sibling repo
`pokemon-draftzone-server`.

## Commands

| Task | Command |
| --- | --- |
| Dev server | `npm run local-dev` |
| Dev server against deployed API | `npm run api-dev` |
| Production build | `npm run build` |
| Deploy to prod (build, S3, CloudFront) | `npm run deploy` — `-- --dry-run` to preview; only when the user asks |
| Typecheck / compile check | `npx ng build --configuration development` |
| All linters + contrast | `npm run lint` |
| Style token linter | `npm run lint:styles` |
| Template linter | `npm run lint:templates` |
| TypeScript linter | `npm run lint:ts` |
| Theme contrast check | `npm run check:contrast` |
| Per-component audit | `npm run audit` (`-- --code=hdr` to filter, `-- --json` for data) |
| Regenerate color ramps | `npm run gen:colors` |

Run `npm run lint` before you finish. It must stay clean: the styles linter enforces
the token rules below, the template and TS linters enforce the hard rules, an audit
gate fails on any routed page without a page header, and the contrast check fails if a
theme change drops any text/fill pair below AA. Genuine one-offs go on the allowlist
at the top of the relevant linter, not in a lint-disable comment.

### Testing

**Never run bare `jest` or `npm test`.** Unbounded Jest spawns ~23 workers on this
machine and exhausts RAM. A PreToolUse hook blocks it. Use one of:

```
npm run test:safe            # --runInBand --silent, whole suite
npx jest --runInBand src/pdz/shared/menu    # targeted, preferred
```

The whole suite passes on a clean tree. A failure is yours.

- `provideAuthStub()` from `@pdz/core/testing/auth-stub` stands in for Auth0.
- jsdom lacks `showModal` and `ResizeObserver`; `setup-jest.ts` polyfills both.
- `jest.config.ts` transforms the ESM-only `d3*` and `marked` packages.

## Layout

```
src/pdz/
  core/       services, guards, interceptors, utils, testing, /debug routes
  layout/     app shell — top navbar, nav context
  shared/     the pdz design system (see below)
  features/   admin, drafts, league-list, league-zone, pages,
              planner, statistics, teambuilder, tier-lists, tools
src/styles/   tokens, tools, mixins, themes, component classes
tools/        linters, audit, contrast check, color generator, deploy
```

Import via path aliases, never deep relative paths:
`@pdz/core/*`, `@pdz/shared/*`, `@pdz/features/*`, `@pdz/layout/*`, `@pdz/environments/*`.

`strict` and `strictTemplates` are on.

## The pdz design system

**Read `docs/design-principles.md` before any visual or styling work.** It is the
single source for what the site should look like and why: settled rules, accepted
rules not yet applied, open questions, and ideas set aside. This section holds the
enforceable form of the settled rules.

`src/pdz/shared/` holds the primitives. **Prefer an existing primitive over
hand-rolled markup.** Current inventory: buttons, data (badge, card, chip, record,
score, skeleton, sort, pokemon-type), dialogs, dropdowns (select, pokemon-search,
format, ruleset), feedback (empty-state, toast), images (icon, sprite, team-logo,
loading), inputs (field, choice, segmented, slide-toggle, slider), layout (page,
page-header, tabs, tab-nav, widget, disclosure, masonry), menu, pipes, time,
tooltip, widgets.

Every routed page opens with `<pdz-page-header>` — never a hand-rolled title bar.
It carries `title`/`eyebrow`/`subtitle`/`logo`/`backLink`/`backLabel`/`compact`,
and projects `[pdz-page-header-detail]` (meta line under the title),
`[pdz-page-header-meta]` (status chips, records), `[pdz-page-header-actions]`
(buttons), `[pdz-page-header-center]` (fills the bar between title and actions, e.g.
the matchup versus strip), and default content below the bar (tab navs, switchers). The page root
then owns its own vertical rhythm with `gap: pdz.layout(section-gap)`, not
per-section padding. A page with no data shows `<pdz-empty-state>`, never a bare
sentence or an endless spinner.

Pages inside the tournament shell get **no back button** — the nav does that. The
one exception is the tournament landing page, whose `backLink`/`backLabel` render
the eyebrow as a link up to the league. Sub-pages inside the drafts shell (opponent
form, score entry) use a `compact` header with a back link to the draft.

`homepage`, `not-found` and `external-link` are deliberate exceptions with their own
hero or interstitial layout. The planner is a full-height workspace with a tab strip
and no page header.

### Hard rules

- **No Angular Material.** Removed 2026-08-22, package uninstalled. Do not reintroduce it.
- **No Tailwind.** Not installed; do not add utility classes.
- **No explanatory code comments, in either repo.** Write code that reads without them.
  Keep lint/tool directives such as `eslint-disable-next-line` and `@ts-`.
  `npm run lint:ts` and `lint:templates` fail on comments. The generated
  `_color.scss` keeps its "do not hand-edit" header.
- **`@angular/cdk` is allowed only for drag-drop, table, scrolling, clipboard, and
  coercion.** All overlay/popover work goes through pdz primitives on the native
  popover API.
- **No `::ng-deep`, no `!important`.** Project content or pass an input. For
  third-party DOM (d3 axes), use `ViewEncapsulation.None` and scope every selector
  under the host element name.
- **No blocking browser dialogs** (`alert`, `confirm`, `prompt`). Use
  `DialogService.confirm(...)` or a toast. A route that guards unsaved work uses
  `unsavedChangesGuard` from `@pdz/core/guards/unsaved-changes`; the component's
  `canDeactivate()` may return a promise from `DialogService.confirm`.
- **Storage goes through `safeStorage`** (`@pdz/core/utils/storage`), never raw
  `localStorage`; it survives private mode and blocked storage.

### Controls

| Instead of | Use |
| --- | --- |
| `<button>` | `<button pdz-button>` (attribute selector; also `a[pdz-button]`, `label[pdz-button]`) |
| a button that navigates | `<a pdz-button [routerLink]>` — never `<button routerLink>` |
| `<input>` / `<textarea>` | `<input pdz-input>` inside `label[pdz-field]` or `div[pdz-field]` |
| `<select>` | `<pdz-select>` + `<pdz-option>` — **the only dropdown primitive** |
| checkbox / radio | `<input pdz-checkbox>` / `<input pdz-radio>`, or `label[pdz-check]` |
| a 2–5 way choice | `<pdz-segmented>` + `<pdz-segmented-option>` |
| icons | `<pdz-icon name="...">` — always, never a raw glyph or `<img>`; buttons take `icon="..."` |
| a team or league logo | `<pdz-team-logo [src] [name]>` — a missing or broken image shows the DraftZone logo (`DEFAULT_TEAM_LOGO`), never initials; no ring, plate or team color |
| W-L or W-D-L | `<pdz-record [wins] [losses] [draws]>` |
| a Pokémon type | `<pdz-pokemon-type [type]>` |
| a tabular list | `<table class="pdz-table">` (`data-density`, `data-sticky`, `pdzSort`) |

`pdz-select` notes: `searchable` adds a filter box (use it for long lists);
`showGroupInTrigger` (default true) prefixes the trigger with the option's group;
`disabled` is a `model()` so it needs `[disabled]="true"`, not a bare attribute.

`pdz-icon` has no `svgIcon` input. Icon-only buttons need an `aria-label`.

When a control replaces a native one that a `<label for="...">` pointed at, remove
the now-dangling `for` and give the control an explicit `aria-label` — pdz controls
generate their own internal ids.

### Styles

Every component stylesheet starts `@use "pdz-theming" as pdz;` and uses token
functions, never literals:

```scss
padding: pdz.space(md);                 // not 12px
gap: pdz.layout(section-gap);           // page-gap, section-gap, card-pad, stack, inline
max-width: pdz.content-width(default);  // narrow, default, wide
height: pdz.control-height(sm);         // xs, sm, md, lg
color: pdz.color(on-surface);           // not #ccc
border-radius: pdz.shape(corner-sm);
@include pdz.text(body-sm);             // typography roles, see below
font-weight: pdz.font-weight(semibold); // when you need weight alone
font-family: pdz.font(mono);            // display, body, mono
@include pdz.numeric;                   // tabular figures for numbers
@include pdz.focus-ring;                // every custom :focus-visible
@include pdz.respond-above(medium);     // never a raw @media width query
transition: color pdz.duration(fast) pdz.easing(standard);
```

Type roles: `display`, `headline`, `title`, `subtitle`, `section-title` (panel and
card headings), `card-title`, `body`, `body-sm`, `body-sm-strong`, `meta` (secondary
lines, timestamps), `field-label`, `label`, `label-strong`, `label-caps` (eyebrows,
table heads, group labels). The display font (Nasalization) is for page titles and
hero numbers only. Page titles, section and card headings, buttons, tabs, nav items and
menu items are Title Case ("My Drafts", "New Draft", "View Matchup"). Body text, hints,
empty-state messages and toasts stay sentence case. The brand is "Pokémon DraftZone".

- `src/styles/tokens/_color.scss` is **generated** — edit the generator and run
  `npm run gen:colors`, never the file.
- Color ramp steps are semantic roles shared across hues (`soft`/`accent`/`strong`
  are roles, not lightness levels).
- SCSS `font-size` on `pdz-icon` does nothing — size it via the `size`/`width`/`height` inputs.
- Selection and active states use `state-selected` and the primary accent, not
  hardcoded highlights.
- **Surfaces rise, they never sink.** The ladder is `ground` (page, sticky page
  headers) → `raised` (panels, cards) → `raised-high` (a card inside a card) →
  `overlay` (dialogs, drawers, the save bar) → `floating` (menus, popovers,
  toasts, chart tooltips). Only `inset` sinks: inputs, tracks, code, empty slots.
  The old `surface*` / `surface-container*` / `background` / `outline-variant`
  roles and the `--pdz-level-*` shadows are deleted; the linter rejects them.
- **Surfaces carry a faint tint of the theme's primary** by one formula in
  `themes/_defaults.scss` (`-tint()`: ground and inset 6%, raised rungs 2.5% light /
  1.5% dark, dark `floating` untinted, `border-subtle` 16%). Themes set hues only; never
  hand-tune a theme's surfaces or text.
- **Page headers (plain tone) paint `header-backdrop`**: faint diagonal lines that fade
  below the title. The style is one switch, `$-header-backdrop` in `themes/_defaults.scss`
  (`lines` or `none`). Nothing else uses this backdrop: not cards, empty states or buttons.
- **Panels and cards are defined by a border, not a shadow**: `raised`,
  `1px solid border-subtle`, `corner-lg`, no resting `box-shadow`. Controls
  (outlined buttons, segmented tracks, dashed drop zones) use `border-control`.
  `var(--pdz-elevation-1..3)` is for things that genuinely float, drag previews,
  and hover lifts on interactive cards. A card should use `<pdz-card>` rather than
  restating those values. Whole-card tints are only for alerts
  (`<pdz-card color="danger|warning|info|success">`).
- **Boxes don't nest.** A card or panel is the box; inside it, rows are split with
  `@include pdz.row-divider` and groups with space and a `label-caps` heading, never
  another bordered box. Repeated tiles inside a card take a fill (`state-hover`), not a
  border. A selected row is `state-selected`, not a colored border. Exceptions: draggable
  objects, board slots, and dashed empty drop zones (`border-control`). Drag previews use
  `@include pdz.drag-lift`. `lint:styles` fails on a bordered `raised-high` block.
- **Hover, pressed and neutral fills are state layers** (`state-hover`,
  `state-pressed`, `state-strong`): translucent, so they work on any rung. Never
  hover to a darker fill; interactive cards lift instead.

### Two colors, two teams

Primary and secondary are side A and side B, never decoration.

- Anything with two sides uses the team aliases: `team1`, `on-team1`,
  `team1-accent`, `team1-soft`, `team1-subtle`, `team1-border`, `team1-container`,
  `team1-container-low`, `on-team1-container`, `team1-wash` (and the same for
  `team2`), plus `versus-wash`, `versus-wash-vertical` and `versus-gradient`.
- The viewer is always team 1. Order sides with `orderForViewer()` from
  `@pdz/core/utils/versus` (score entry uses `scoreEntryOrder()`); mark the
  viewer's row or side with `.pdz-you-tag` and `.pdz-table__row--you`.
- Team names stay ink. Color goes on half washes, score numerals and value chips.
- No edge bars or rings for team color. Status beats team color: a pending or
  forfeit state wins over the side's hue.
- Buttons are primary or neutral, never secondary (`lint:templates` enforces it).
  Decorative accents that are not a side are neutral.
- Single-focus pages (Pokémon search, planner, tools): **primary marks what you do**
  (buttons, active tab, filters you set, selection, locks); **secondary marks what you
  should notice** (result counts, bookmarks, the stat you sorted by, points remaining).
  A page about one team still makes that team team 1, so its data charts stay primary.
  Status beats both: a blocked or over-budget state uses warning or danger.

### Change detection

The app is zone-based. New components use signals and `OnPush`, with two
exceptions that stay on Default: router-outlet hosts (layouts, shells) and any
component that renders reactive-form state mutated from outside, or hosts a child
that still uses mutable fields (`pdz-pokemon-search`, score entry).

## Verification

`src/pdz/core/debug/` serves a component gallery at `/debug/components` (and a sprite
browser at `/debug/sprites`) — the reference for every primitive's variants,
including the two-color patterns. When you add or change a primitive, update the
gallery in the same pass; it is what visual sweeps get checked against.

Route paths are constants in `src/pdz/core/route-paths.ts`, not string literals.

There is no Playwright in this repo (it has been driven via an MCP server in the
past). If it is unavailable, say so rather than implying a visual check happened.

## Gotchas

- Unrouted components are not compiled by `ng build`, so a clean build does not prove
  an orphaned component still typechecks.
- Prettier is a dependency but does not run on save; output may not be Prettier-clean.
- A feature area can take over the global navbar's mobile hamburger via
  `NavContextService` instead of shipping its own drawer.
- `pdz-card`'s body is not a flex container; wrap multi-part content in your own
  element and give it the `gap`.
- A `pdz-button` with a `.disabled` class is still clickable. Render a disabled
  `<button>` or nothing instead.
