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
hand-rolled markup.** Current inventory: buttons, data (badge, card, chip, meter, record,
podium, score, season-mvp, skeleton, sort, pokemon-type, pokemon, team, matchup), dialogs, dropdowns (select, pokemon-search,
format, ruleset), feedback (empty-state, toast), images (icon, sprite, team-logo,
roster-sprites, roster-pattern, loading), inputs (field, choice, segmented, slide-toggle, slider), layout (page,
page-header, page-sections, tabs, tab-nav, widget, disclosure, masonry), menu, pipes, time,
tooltip, widgets.

Every routed page is wrapped in `<pdz-page type="hub|index|detail|workspace|tool|form|dashboard">`,
in the routed component's own template. The type sets the width (hub, detail and tool 64rem;
index and dashboard 96rem; form 40rem; workspace full width and full height), the
density, and the header (index and workspace default to `compact`). Hub, detail and
form are comfortable; index, workspace, tool and dashboard are compact. The density
switches `section-gap`, `stack`, `card-pad` and the table cell padding for everything
inside the page, so never hardcode a table's `data-density` to match its page; the
`density` input (or `data-density` on a subtree) asks for the other one, and that is an
owner call. The page never sets its own max-width, padding or section gap; its `:host`
is just `display: block` (plus `height: 100%` for a workspace). Inside the tournament
shell the page drops its padding on its own (`PAGE_SHELL`); `flush` is only for a
workspace that owns its edges. `npm run lint` fails a routed page without a type.

Every routed page opens with `<pdz-page-header>` — never a hand-rolled title bar.
It carries `title`/`eyebrow`/`subtitle`/`logo`/`backLink`/`backLabel`/`compact`,
and projects `[pdz-page-header-detail]` (meta line under the title),
`[pdz-page-header-meta]` (status chips, records), `[pdz-page-header-actions]`
(buttons), `[pdz-page-header-center]` (fills the bar between title and actions, e.g.
the matchup versus strip, or a team's sprite row), `[pdz-page-header-backdrop]` (a faint
layer behind the header that fades out toward the title: an external draft page's
`<pdz-roster-pattern [pokemon]>`; the league team page dropped it 2026-10-14), and default
content below the bar (tab navs, switchers).
A page with no data shows `<pdz-empty-state>`, never a bare
sentence or an endless spinner. Give every `md`/`lg` empty state a `kind`
(`empty` | `waiting` | `error` | `no-access`); it stands Ditto, Slowpoke, Psyduck or
Snorlax above the message. `sm` keeps an inline icon. An `error` state says what did
not come back and offers Try Again: `retry="event"` + `(retried)` to re-run the page's
load, or `retry="reload"` when the page only loads once; never write "refresh the page".
A `waiting` state says who and when; tournament pages use `waitingMessage()` from
`@pdz/features/league-zone/tournament-milestones` to append the next milestone.

Pages inside the tournament shell get **no back button** — the nav does that. The
exceptions, each rendering the eyebrow as a link through `backLink`/`backLabel`: the
tournament landing page (up to the league), a pool's draft board (back to Draft Pools,
`/pools`, when the tournament has more than one pool), and a team page (back to Teams).

`/drafts` is **My Leagues**: hosted and external leagues on one page (career strip, a
Feed of what needs the coach, roster-sprite cards for active seasons, Completed grouped by
year). An external draft's page (`/drafts/:team`) is laid out like the league team page:
roster-pattern header with no logo, a Schedule card on `pdz-team-season` (`entries` plus
a `rowActions` ⋮ menu), and the season MVP over a roster card. Per-match actions live in
that row menu and in the breakdown page header (`manage` in `MatchupPageConfig`). Its
sub-pages (opponent form, score entry) are their own pages with a `compact` header and a
back link to the draft. Seasons end by being marked **Completed** (archive is legacy):
an owner completes a hosted tournament in settings, a coach can complete their own entry,
and an external draft is completed from its page menu.

`homepage`, `not-found` and `external-link` are deliberate exceptions with their own
hero or interstitial layout. The planner is a `flush` workspace with a tab strip
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
| a roster shown as a group | `<pdz-roster-sprites [pokemon] [spots] [name] layout="wrap\|tiers">` — every Pokémon as a bare sprite, in draft order, no floor, shadow or fill. `wrap` (default) is the roster card's strip: `md` sprites wrapping and centered. `tiers` is the team card banner: two rows at a fixed height on a faint `team1-subtle` fade (`tone="team2"` for a team that isn't the viewer's), the first picks 1.4× bigger (`TIER_STEP`) with fewer in the top row so the rows even out, sized to fit. `spots` adds empty places while a draft runs (only pass it when the pick count is known, or a finished team shows empty places). As a card banner, put it in `pdz-card`'s `[pdz-card-media]` slot. Single sprites standing on a card take `<pdz-sprite grounded>` |
| a team's standout Pokémon | `<pdz-season-mvp [pokemon] [knockouts] [detail] [types] [stats]>` — most KOs, ties to fewer faints then fewer games; the page picks the Pokémon and builds `stats` (`SeasonMvpStat[]`: games, fainted, KOs/game, share of team KOs), the card owns the look (sprite faces right; stats sit inline when the card is 40rem+, under the name when narrower). Hide it until something has a KO |
| a season's top three | `<pdz-podium [places]>` (`PodiumPlace[]` in finishing order: name, logo, coach, record, the team's top scorer as `pokemon`, `link`, `you`). Show it only once the season has ended |
| a Pokémon you can't pick, or one that fainted | `<pdz-sprite state="taken" [takenLogo] [takenBy]>`, `state="banned"`, `state="fainted"` — never a hand-rolled grayscale or strike-through. Shiny sparkles are automatic |
| a team shown by name (logo + name + coach) | `<pdz-team [name] [logo] [coach] [link] size="inline\|row\|card\|hero" align="start\|end">` — never a hand-rolled logo-and-name lockup; extra lines go in `[pdz-team-meta]`; `align="end"` for the far side of a versus layout; `[headingLevel]` when the name is the card's heading |
| two teams facing off (scoreboard, schedule or bracket card, a matchup row) | `<pdz-matchup [team1] [team2] size="hero\|card\|row" [label]>` with `MatchupTeam` sides (name, logo, coach, link, you, score, result, pending, selectable, pokemon); order the sides with `orderForViewer()` first. `hero` is the scoreboard: the versus wash, display-font score numerals in team colors (or "VS" while `score` is null) and the rosters facing each other. Slots: `[pdz-matchup-status]` (header chip or actions), `[pdz-matchup-center]` (under the score), `[pdz-matchup-team1]`/`[pdz-matchup-team2]` (per-side lines), `[pdz-matchup-actions]` (footer). A pending `selectable` side emits `(sideSelect)` |
| a Pokémon shown by name (sprite + name + tier/cost/types) | `<pdz-pokemon [pokemon] size="inline\|row\|card\|hero" [tier] [cost] [types] align="start\|end">` — never a hand-rolled sprite-and-name lockup; captain marks come from `pokemon.capt`; `[pdz-pokemon-badge]` beside the name, `[pdz-pokemon-meta]` under it; `state`/`takenLogo`/`takenBy` pass through to the sprite. Sprite-only strips and grids stay `pdz-sprite` |
| a team or league logo | `<pdz-team-logo [src] [name]>` — a missing or broken image shows the DraftZone logo (`DEFAULT_TEAM_LOGO`), never initials; no ring, plate or team color |
| W-L or W-D-L | `<pdz-record [wins] [losses] [draws]>` |
| a progress or share bar | `<pdz-meter [value] [max] [label] [segments] tone="secondary\|primary\|neutral\|warning" size="md\|sm">` — secondary by default (what to notice); primary when it is yours; `segments` splits it into equal steps (a draft's rounds) |
| a Pokémon type | `<pdz-pokemon-type [type]>` |
| a page or panel that is loading | `<pdz-skeleton-layout layout="list\|table\|cards\|form\|text\|board\|chart" [count]>` shaped like what is coming — never `pdz-loading` or a bare spinner; a spinner belongs only inside a busy button |
| a tabular list | `<table class="pdz-table">` (`data-sticky`, `pdzSort`; padding follows the page's density) |
| a long page of named sections with jump links | `<pdz-page-sections [sections] heading="...">` around the sections (`PageSection[]`: `id`, `label`, optional `count`; each projected section carries that `id`) — a sticky left column at 768px+ of its own width, a sticky strip above when narrower, the section in view selected. It wraps the whole page body, `pdz-page-header` included, so the title lines up with the content column and the nav starts beside it (narrow: title, strip, content); fewer than two `sections` drops the nav and its column. `pdz-page` sees it and widens by the nav on both sides, so the content stays centered at its usual width when there is room. A wrapper inside any page type, never a hand-rolled side list |

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
gap: pdz.layout(section-gap);           // page-gap, section-gap, card-pad, stack, inline, cell-*
max-width: pdz.content-width(default);  // narrow, default, wide
height: pdz.control-height(sm);         // xs, sm, md, lg
width: pdz.sprite-size(md);             // xs 24, sm 32, md 48, lg 64, xl 96
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
lines, timestamps), `field-label`, `label`, `label-strong` (table heads, muted Title
Case), `label-caps` (eyebrows and group labels, the only uppercase). The display font (Nasalization) is for page titles and
hero numbers only, and is the only text that takes weight 700 (`bold`); everything
else is 400 or 600, and `lint:styles` fails `font-weight(bold)` elsewhere. Muted text
uses `on-surface-muted`, never opacity. Solid fills, gradients, Nasalization and 32–40px
numbers belong to the six loud moments (homepage band, matchup scoreboard, your pick on
the clock, final results, page title, your own row as a tint); a genuine exception goes
in `LOUD_MOMENTS` in `tools/lint-styles.mjs` with a one-line reason. Page titles, section and card headings, buttons, tabs, nav items and
menu items are Title Case ("My Leagues", "New Draft", "View Matchup"). Body text, hints,
empty-state messages and toasts stay sentence case. The brand is "Pokémon DraftZone".

- `src/styles/tokens/_color.scss` is **generated** — edit the generator and run
  `npm run gen:colors`, never the file.
- Color ramp steps are semantic roles shared across hues (`soft`/`accent`/`strong`
  are roles, not lightness levels).
- SCSS `font-size` on `pdz-icon` does nothing — size it via the `size`/`width`/`height` inputs.
- `pdz-sprite` takes `size="xs|sm|md|lg|xl"` (default `md`), never a length. Use `size="fill"`
  only when the layout computes the size, and size the host from `pdz.sprite-size()`. Forme
  cycling is opt-in with `interactive`.
- Images dim in dark mode through `filter: pdz.color(image-tone)`. `pdz-sprite-image` and
  `pdz-team-logo` already apply it; any other art or uploaded image takes it too.
- Selection states (an option, a row, a filter you set) use `state-selected` and the
  primary accent, not hardcoded highlights. Navigation location (the current tab,
  rail link, menu link, section link, planner tab) is not a selection and never takes
  primary: `@include pdz.nav-current` (neutral `state-pressed` fill, ink text, filled
  icon; `$fill: false` for tabs) and `pdz.nav-indicator()` for a tab underline.
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
- **Page headers (plain tone) paint `header-backdrop`**, one switch, `$-header-backdrop` in
  `themes/_defaults.scss`: `none` (current, since 2026-10-09) or `lines` (faint diagonal lines
  fading below the title). Nothing else uses this backdrop: not cards, empty states or buttons.
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
  viewer's row with `.pdz-table__row--you` and their side or card with team 1
  color. No "You" tag: the color already says it (owner, 2026-10-14).
- Team names stay ink. Color goes on half washes, score numerals and value chips.
- No edge bars or rings for team color. Status beats team color: a pending or
  forfeit state wins over the side's hue.
- Buttons are primary or neutral, never secondary (`lint:templates` enforces it).
  Decorative accents that are not a side are neutral.
- Single-focus pages (Pokémon search, planner, tools): **primary marks what you do**
  (buttons, filters you set, selection, locks); **secondary marks what you
  should notice** (result counts, bookmarks, the stat you sorted by, points remaining).
  A page about one team still makes that team team 1, so its data charts stay primary.
  Status beats both: a blocked or over-budget state uses warning or danger.

### Change detection

The app is zone-based. New components use signals and `OnPush`, with two
exceptions that stay on Default: router-outlet hosts (layouts, shells) and any
component that renders reactive-form state mutated from outside, or hosts a child
that still uses mutable fields (`pdz-pokemon-search`, score entry).

## API errors

- `ApiService` throws `ApiError` (`@pdz/core/services/api-error`), never a raw
  `HttpErrorResponse`. Its `message` is the server's text for a 4xx or a coded 5xx
  (a `details.reason` or `details.reasons` wins), and empty for a generic 5xx or a
  network failure. Show it with `apiErrorMessage(err, 'Could not …')`, which falls back
  when it is empty. Read `status`, `code` and `details` off the error; never dig into
  the response body.
- Every `error:` callback and `catchError` either shows the failure (toast, inline
  message, `pdz-empty-state kind="error"`) or is a deliberate fallback for secondary
  data. A callback that only resets a spinner swallows the error.
- An error nobody handles reaches `PdzErrorHandler` and the global error panel. The
  panel is the last resort; a handler that shows the failure itself must not also call
  `ErrorService.reportError`.
- `ApiService` sends every failure to RUM. `suppressStatuses` and
  `suppressErrorReporting` only keep expected failures (a 404 for "not signed up") out
  of telemetry.

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
