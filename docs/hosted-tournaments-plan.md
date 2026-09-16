# Hosted Tournaments — audit and roadmap

Audit run 2026-09-15 across `pokemon-draftzone-client/src/pdz/features/league-zone/**`
and `pokemon-draftzone-server/src/modules/{tournament,stage,league,coach,team,draft,chat}`.

Tick items off as they land. Keep the findings below even once fixed — they are
the reasoning behind the step.

---

## Roadmap

| # | Step | Status |
| --- | --- | --- |
| 1 | Real tournament landing page at `/` | **done** — `tournaments/tournament-landing/` |
| 2 | Delete tournament-home's dashboard; redirect signed-up coaches to `/teams/:teamSlug` | todo |
| 3 | Link the league landing page; decide what bare `/leagues` should be | todo |
| 4 | Restructure the tournament nav around one link set | partial — hero trimmed, link set untouched |
| 5 | Fix or delete the dead socket chat | todo |
| 6 | Organizer management + participant-drop flow | todo |
| 7 | Sweep the orphaned components and dead routes | todo |
| 8 | Smaller fixes: `tradeDeadline` enforcement, deadline editors, nested anchor, N+1s, `archived` | todo |

---

## 1. Tournament landing page — done

`TournamentLandingComponent` now owns the `''` route under
`:leagueSlug/tournaments/:tournamentSlug`. It shows, for everyone including
logged-out visitors: identity and format, a phase banner with a live countdown,
the current round's matchups, a standings snapshot, and onward links.

`TournamentHomeComponent` is now **unrouted** — step 2 deletes it. Until then it
is not compiled by `ng build` (see the unrouted-components gotcha in CLAUDE.md).

The "This Round" section renders through `LeagueScheduleWidgetComponent` rather
than its own card list. The first cut reused only `MatchupCardComponent` and the
`scheduleMatchupToCard` adapter and laid the cards out itself, which cost two
bugs: a `flex-wrap` row let each card size to its content (ragged widths on
mobile, where the widget uses `grid-template-columns: minmax(0, 1fr)` plus
`width: 100%`), and `flatMap`ing the stages away dropped the widget's per-stage
heading, so two stages' matches ran together with duplicate "Match 17" labels.

The widget gained two small inputs/outputs to serve a host that has its own
heading: `showRoundTitle` (the landing section header already names the round) and
a `roundsLoaded` output (the landing page needs the round name and match deadline
for its section header and phase banner). One fetch, one grouping implementation.

The hero is a card (`surface-container-low`, `corner-lg`, `outline-variant`
border) rather than the full-bleed `pdz-league-page-header-large` mixin the team
and standings pages use. That mixin is square and edge-to-edge, which was fine
while the nav was bare text on the page background but became the only non-card
element once the nav was a panel; the section panels were given the same border
and radius so the page reads as one family.

Its right side carries the phase chip and countdown, tournament facts (Teams /
Picks / Points), and a Sign Up button when sign-ups are open and the viewer has
not signed up. It previously held My Team, Draft and Discord buttons plus the
round name — all four duplicated the nav panel or the schedule section header.
The Teams count comes from the standings payload, so it is omitted before any
stage exists.

Follow-ups deliberately left out of step 1:

- The landing page's "Sign Up" CTA points at the existing `sign-up` route. The
  old inline sign-up form on tournament-home goes away with step 2.
- No "recent results" section. The current-round matchup cards already show
  scores as they land, and a second schedule fetch was not worth it.
### "This Round" scales to many stages

Bounded by `max-height` + internal scroll (32rem, or `calc(100vh - 20rem)` above
1024px), matching how `league-team` bounds its sections, so the standings snapshot
stays reachable on mobile where the body is a single column.

On top of that, the widget takes a `highlightTeamSlug` input: the stage holding
that team is sorted to the front of the round, that team's match to the front of
the stage, and the card gets a `primary-accent` outline. The full list still shows
in full — an earlier attempt pinned the match above a collapsed `pdz-disclosure`
and was rejected for hiding the other matches.

No extra request: `MatchupCardSlot` gained a `slug` field (the adapter already had
`side.slug`; `match-card.component` fills it from `team.teamSlug`), so the
reorder runs over data the widget already holds.

Rendering stage headings also exposed a latent widget bug: `matchup-stage__group`
had **no stylesheet rule at all**, so the `<h5>` sat in the
`repeat(auto-fill, minmax(...))` grid as an ordinary grid item — one stage name
occupied a single card cell and the cards flowed around it. It now carries
`grid-column: 1 / -1` plus label typography. The bug only ever appeared on a round
with more than one stage, which is why it survived this long; it affected the team
page and division dashboard too.

The widget's `scheduleRounds` had to become a `computed` over a `loadedRounds`
signal rather than a field assigned in `ngOnInit`. `highlightTeamSlug` comes from
the coach profile, which is a separate request that usually resolves *after* the
schedule — an imperative one-shot mapping would never re-sort when it landed.

## 2. Three overlapping "my team" surfaces

`/` (was tournament-home), `/teams/:teamSlug`, and `/coach` all render the same
coach's team.

- The roster table in tournament-home is a verbatim copy of the one in
  `league-team.component.html` — same columns, same `pdz-table` classes, same
  tfoot totals.
- **tournament-home's edit dialogs are fake.** `openCoachEdit` / `openTeamEdit`
  mutate local state and drop the change on navigation. Their TODOs are stale:
  `PATCH /coaches/:coachId`, `PATCH /teams/:teamId` and
  `PATCH /leagues/…/coaches/:coachId/logo` all exist, and `league-team.component.ts`
  already calls them correctly via `saveTeamEdit`.
- `/coach` (`LeagueCoachComponent`) is a third dashboard, reachable only by URL.

## 3. Navigation

- `/leagues/:leagueSlug` (`LeagueLandingComponent`) is complete and **nothing
  links to it**. Every `routerLink` jumps straight to the tournament.
- Bare `/leagues` renders `DraftPreviewComponent` — a personal draft list, not a
  league directory.
- `/league-list` is the discovery surface; it merges `hosted/tournament-ads` with
  `external/tournament-ads` and links straight to tournaments.

## 4. Routes unreachable from the tournament nav

`trades`, `coach`, `drafts`, `draft`, `drafts/:draftSlug`,
`drafts/:draftSlug/power-rankings`, `drafts/:draftSlug/tier-list`,
`stages/:stageSlug/trades`.

Trades now sits in the nav's Tournament group. The landing page briefly carried a
duplicate onward-links row; it was removed once the nav became a proper panel,
because on desktop it sat at the same eye level as the sidebar listing the same
six destinations. Everything else in that list is still unreachable from the nav.

### Nav hero and link styling (part of step 4)

The sidebar hero used to render logo, league name, tournament name, description,
Format and Ruleset — all six of which the landing header now also renders, so on
the landing page they appeared twice side by side. The hero is now a compact
identity strip: logo, league name, tournament name, still linking to the landing
page. Description, Format and Ruleset belong to the landing header now.

Two earlier attempts at "make the nav less plain" failed because they only
adjusted per-row tokens — muting the resting colour, shrinking the type, adding a
rail. The list still read as bare text because of two things neither attempt
touched:

1. **There was no panel.** On desktop `layout__nav` was
   `background: transparent; padding: 0`, so the links were text floating on the
   page background, separated from content only by a 4px `layout__divider`
   column.
2. **All fourteen rows were in the Nasalization display face.** A display font
   used for every row gives every row equal emphasis, which reads as flat.

What landed instead:

- The nav column is a real panel above 768px — `surface-container-low`,
  `outline-variant` border, `corner-lg`, its own padding. `layout__divider` is
  deleted (the panel edge does that job) and the grid is now two columns with a
  `space(md)` gap.
- Link labels moved to the body font at `body-sm-strong`. Nasalization is now
  reserved for the hero title and the group labels, which is where the hierarchy
  comes from.
- Every group is labelled — Your Team / Tournament / Reference / Manage —
  replacing one labelled group and an unlabelled pile of eight. The `<hr>`
  dividers are gone; group spacing separates them.
- The active row is a filled `primary-container` pill rather than a colour
  change, per the theme-colours-for-selection rule.
- Discord moved out of the link list to an outlined box at the bottom of the
  panel: it is an external link, not a route, and the "Not Joined" warning now
  has somewhere to sit.
- Dashboard leads the Manage group — it is the hub the others hang off.

Mobile drawer: the close control was a fixed `close` button overlaying the
drawer's top-right corner, which covered the tail of the league name (the name
was obscured, not truncated — `line-clamp` never saw a narrower box). It is now a
`chevron_left` tab centred on the drawer's outside edge. The drawer width lives
in a `--drawer-width` custom property so the panel and the tab offset cannot
drift apart, and it is `min(18rem, 78vw)` rather than `85vw` so the tab always
clears the viewport on a small phone.

The tab animates in with the drawer (slide + fade + scale) instead of popping via
`display`. Every duration token is zeroed under `prefers-reduced-motion` in
`styles/core/_init.scss`, so using `pdz.duration()` handles that automatically —
no per-component guard needed.

Per-row icons were tried and removed. In a sidebar of short, unambiguous,
always-visible labels they are decorative, and three things cheapened them: the
`discord` asset is the full-colour brand mark (`discord-mark-blue.svg`), the one
saturated thing in a monochrome column; Rules and Tier List each appear twice
with an identical glyph; and a generic Material Symbols set sits awkwardly next
to the display face. Icons stay where they work — the landing page's
onward-links row and the manage hub's nav-cards.

The sidebar itself stays: it is the only lateral navigation on the other ~15
tournament pages, it carries My Team / Draft status / Discord-join warning / the
organizer Manage block, and below 768px it is an off-canvas drawer that never
coexists with the landing page's link row.

## 5. Manage IA

Nav's Manage block and the hub list different sets. The two most-used organizer
screens in-season — **Matches** (stage builder) and **Match Results** — are the
two the nav omits. "Dashboard" is the last nav item and links to the hub you
would already be on.

- `manage/drafts/:draftSlug` → `LeagueManageDashboardComponent`, nothing links to it.
- `manage/stages/:stageSlug/trades/legacy` → `LeagueManageTradesComponent`,
  superseded by `TradeManagerComponent`.
- The hub's per-draft Trades card and the nav's flat Trades are the same
  component on two URL shapes.
- No pending-report count anywhere. Report review works
  (`league-manage-schedule.component.ts`) but is undiscoverable.
- Commented-out "Playoffs" section at the bottom of the hub template.

## 6. Server built, client missing

| Endpoint / field | Note |
| --- | --- |
| `DELETE /…/trades/:tradeId` | no client call — trades can't be cancelled |
| `DELETE /…/chat/messages/:messageId` | no chat moderation |
| `round.tradeDeadline` | round-trips through the bracket adapter, no editor |
| `round.bestOf` | read path only, no editor |
| chat channels `tournament`, `spectator`, `draft` | full policy in `chat.policy.ts`, only `matchup` has UI |
| `organizers[]` | drives every permission check; no endpoint and no UI to add/remove |
| `POST /…/stages`, `/stages/:slug/pools`, `/stages/:slug/current-round`, `GET /stages/:slug/schedule`, stage-scoped trades | intentional legacy, unreferenced |
| `createBracket` / `updateBracket` / `deleteBracket` (stage-scoped) | in `league-manage.service.ts`, zero callers |

## 7. Client built, server missing — dead UI

- **The socket chat is dead.** `core/services/chat.service.ts` opens a socket.io
  connection in its constructor, at app boot, for every visitor on every page
  (`providedIn: 'root'`). It emits `joinRoom` / `sendMessage` and listens for
  `newMessage`. The only gateway is `draft.gateway.ts`, which handles one
  message: `"message"`. `<pdz-chat [roomId]>` on the division dashboard does
  nothing and `console.log`s messages it never receives.
- **`league-new/`** is a 234-line tournament creation form with no route, no
  service call, and no submit handler. The server has no create endpoint either —
  `LeagueController` is two `@Get`s, and `draft.controller.ts` has no `POST`.
  **You cannot create a league, tournament or draft through the product.**
- **`league-form/`, `league-form-new/`, `league-form-edit/`** — three 9-line
  scaffolds with 1-line templates. Likely part of the NG0201 spec baseline.
- Also orphaned: `league-schedule/` (exports a *second* class named
  `LeagueScheduleComponent`; the routes import the one from
  `league-stage-builder/stage-builder-page.component.ts` — a real footgun),
  `league-schedule-matchup/`, `league-auction/` + `auction.service.ts`.

## 8. Missing on both sides

- **Removing a participant.** No drop/withdraw. `DELETE /coaches/:coachId`
  deletes the coach and leaves `team.coach` dangling, which 500s every page in
  the tournament. No reassign flow.
- **`archived`** on `HostedTournamentEntity` is written and read by nothing.
  Archiving works only for external (personal) tournaments.
- **No tournament visibility flag.** Stages have `public`; tournaments don't.
- **No capacity / max teams / waitlist**, and no open-close toggle independent of
  `signUpDeadline`.
- **No deadline reminders.** `agenda.service.ts` only defines draft pick-skip
  jobs. `matchDeadline` and `tradeDeadline` fire nothing. Separately,
  `cleanup-file-uploads` is defined but its `agenda.every(…)` is commented out —
  uploads are never GC'd.
- **`tradeDeadline` is never enforced.** Plumbed through `bracket-view.ts`,
  `stage-axis.ts` and `tournament-bracket.service.ts`;
  `tournament-trade.service.ts` never reads it. (`tradePointLimit` *is* enforced.)
- **Discord role grant is one-shot at signup**, in `notifySignup`, and fires
  regardless of approval status — a denied signup keeps the coach role. The
  signups page shows `inDiscordServer` / `hasDiscordRole` / `hasValidTeam` as
  read-only badges with no way to act on them.

### The standings payload did not match its client type

`League.TeamStandingData` declared `teamId: string` and `teamSlug: string`. The
server sends **neither**: the final projection in
`calculateDivisionTeamStandings` emits the id as `id` and drops `teamSlug`
entirely — even though `TeamStanding` carries it and its own comment says it is
"for the link to the team's page".

Nothing caught this because `apiService.get<T>()` casts rather than validates, and
the only existing consumer (`team-standings.component`) reads neither field and
tracks by object identity. The landing page's standings snapshot was the first
code to use them, and both `track row.teamSlug` and then `track row.teamId`
produced empty keys — NG0955, every key `""`.

Fixed on both sides: the interface now declares `id` with `teamSlug` optional, the
landing page tracks by `id`, and the server projection passes `teamSlug` through.
The team name still renders as plain text rather than a link when the slug is
absent, so an older server keeps working.

(An earlier note here blamed an un-run team-slug backfill. That was wrong — the
field was never sent, so the payload says nothing about whether slugs exist in the
database.)

## 9. Correctness bugs

1. **Nested anchors** — `league-landing.component.html` puts the Discord `<a>`
   inside the tournament-card `<a>`. Invalid HTML.
2. **`getLeagueSummary` reads `tierList.format.name`** while everything else
   reads `tournament.format`, which the decoupling moved onto the tournament and
   which `HostedTournament` already asserts matches. It also costs a
   `tierListRepo.findById` per tournament to read an already-loaded field.
3. **N+1 in both league queries** — `getLeagues` does `leagueRepo.findById` +
   `tierListRepo.findById` inside a per-tournament `Promise.all`;
   `getLeagueSummary` does a tier-list fetch per tournament.
4. **The stage-builder adapter can't clear a deadline** —
   `stage-builder.adapter.ts` spreads `matchDeadline` only when truthy.

## 10. Best-practice drift

Clean: `npm run lint:styles`, no native `<select>`, no Material, no raw
`<button>` without `pdz-button`, and the `!== false` conventions for
`matchSettings` and stage `public` are honoured.

Drift:

- **Anchors styled as controls.** `.link-button` (tournament nav), `.nav-card`
  (manage hub), `.tournament-card` (league landing), `.button--division`
  (tournament drafts), `.button` (coach page). `a[pdz-button]`, `pdz-card`,
  `pdz-badge` and `pdz-chip` already cover these.
- **The nav is the `pdz-tab-link` problem again** — a bespoke link list with its
  own stylesheet where a shared primitive belongs.
- **Change detection.** Of 55 components under `league-zone/`: 34 use
  `implements OnInit` + `Subject` + manual `takeUntil`, 10 touch signals, 9 use
  `OnPush`. New work should be signals + `OnPush` + `takeUntilDestroyed`.
- **Fire-and-forget errors.** `console.error` and leave the view blank is the
  standard failure path. `LeagueNotificationService` wraps `ToastService` and is
  barely used.
