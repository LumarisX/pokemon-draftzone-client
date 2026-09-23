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
| 2 | Delete tournament-home's dashboard; redirect signed-up coaches to `/teams/:teamSlug` | **done** |
| 3 | Link the league landing page; decide what bare `/leagues` should be | **done** |
| 4 | Restructure the tournament nav around one link set | **done** |
| 5 | Fix or delete the dead socket chat | **done** — deleted |
| 6 | Organizer management + participant-drop flow | **done** |
| 7 | Sweep the orphaned components and dead routes | **done** |
| 8 | Smaller fixes: `tradeDeadline` enforcement, deadline editors, ~~nested anchor~~, N+1s, `archived` | **done** |
| 9 | Participation model, sign-up flexibility, invite-only sign-ups — see §11 | **mostly done** — §11.10 steps 1–10b landed 2026-09-22; step 11 and the multi-coach flows remain (§11.14) |
| 10 | Create leagues and tournaments through the product — see §12 | **not started** |
| 11 | Bug sweep from the 2026-09-23 review — see §13 | **done**; §13.7 script written, not yet run |
| 12 | Security, data-integrity and structure review — see §14 | **not started** — **priority**: §14.1 (P0) goes ahead of every other open step, then §14.2–14.3 |

---

## 1. Tournament landing page — done

`TournamentLandingComponent` now owns the `''` route under
`:leagueSlug/tournaments/:tournamentSlug`. It shows, for everyone including
logged-out visitors: identity and format, a phase banner with a live countdown,
the current round's matchups, a standings snapshot, and onward links.

`TournamentHomeComponent` was left unrouted by this step and deleted in step 2.

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
  old inline sign-up form on tournament-home went away with step 2.
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

## 2. Three overlapping "my team" surfaces — done

`/` (was tournament-home), `/teams/:teamSlug`, and `/coach` all rendered the same
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

`/teams/:teamSlug` survives as the only one. Both others are deleted —
`tournaments/tournament-home/` and `league-coach/`, plus the `coach` route. The
fake edit dialogs died with tournament-home; `league-team` keeps the real ones.

`coach-edit-dialog/` and `team-edit-dialog/` were **not** deleted with their
parent — `league-team` and `league-manage-signups` both import them. They moved to
`league-zone/dialogs/`, which is where a dialog shared by a coach page and an
organizer page belongs; neither had a relative import to repoint.

### Redirecting after sign-up

`LeagueSignUpComponent` sent both its paths — "you are already signed up" on init
and "sign-up succeeded" on submit — to the tournament root, which used to be the
dashboard. Both now go to `/teams/:teamSlug`.

The init path had the slug already (`getCoachData` returns `teamSlug`). The submit
path did not: `createSignup` returned `message` / `userId` / `tournamentId` only,
even though it creates the team and the schema fills `slug` from
`generateSlug` on create. It now also returns `teamId` and `teamSlug`. The client
type is `League.SignUpResult` with `teamSlug` optional, and `navigateToTeam`
falls back to the tournament root when it is absent, so an older server still
lands somewhere real rather than on `teams/undefined`.

A brand-new signup is `status: "pending"` with no draft and no stage, so it was
worth checking the destination renders in that state: `getTeam`'s no-stage branch
returns identity + empty roster + `matchups: []` and omits `record`, and the
template guards all three (`teamData.record?`, `@if (teamData.draft.length)`,
`@if (stageSlug)` → "No schedule yet."). It renders.

`LeagueSignUpComponent.embedded` went too — the input existed only so
tournament-home could host the form with its header and details table suppressed,
and `<pdz-league-sign-up [embedded]="true">` was its one caller.

## 3. Navigation — done

- `/leagues/:leagueSlug` (`LeagueLandingComponent`) is complete and **nothing
  links to it**. Every `routerLink` jumps straight to the tournament.
- Bare `/leagues` renders `DraftPreviewComponent` — a personal draft list, not a
  league directory.
- `/league-list` is the discovery surface; it merges `hosted/tournament-ads` with
  `external/tournament-ads` and links straight to tournaments.

The first bullet was already half-stale when it was written: step 1 gave the
tournament landing header a back-link to `/leagues/:leagueSlug`
(`landing-header__league`). What it did not cover is the surface new visitors
actually arrive on — `/league-list`.

### `/league-list` now links to both pages

A hosted ad's only link was `signupLink`, pointing at
`/leagues/:leagueSlug/tournaments/:tournamentSlug/sign-up` — past the league page,
past the tournament landing page, straight into an `AuthGuard`ed form. Someone
browsing the list could not look at a tournament without being asked to log in and
commit to it.

The hosted mapper now also emits `hostedLinks { leagueSlug, leagueName,
tournamentSlug }`, so the card builds real routes instead of re-parsing that URL.
The card title links to the tournament landing page, and a byline under it links
to the league page. The Sign Up button still points at `sign-up` — it is the
recruitment CTA, and that list exists to recruit.

`hostedLinks` is a new field rather than a correction to the existing ones because
`leagueName` on a hosted ad already carries the **tournament** name: the payload
maps a tournament into a shape named for a league, where "league" means "the
advertised thing". Renaming it would churn the external-ad path, which is the one
place the name is literally true. `hostedLinks` is optional on the client type, so
external ads and the manage view fall through to the plain unlinked title exactly
as before.

### Bare `/leagues` redirects to `/drafts`

It was mounting `DraftPreviewComponent` — not merely "a personal draft list, not a
league directory" but *the same component* `/drafts` mounts. The duplicate is now
an explicit `redirectTo`.

Worth knowing: `/drafts` carries `canActivate: [AuthGuard]` and bare `/leagues`
did not, so a logged-out visitor landing on `/leagues` now gets a login prompt
rather than an empty personal dashboard.

Rejected: making `/leagues` a public league directory. There is no endpoint for
one — `LeagueController`'s `GET /` is auth-guarded and returns only the caller's
own participating tournaments (`findByParticipant(sub)`), so a directory means new
server work. Still open if leagues ever deserve discovery of their own.

## 4. Routes unreachable from the tournament nav

`trades`, `coach`, `drafts`, `draft`, `drafts/:draftSlug`,
`drafts/:draftSlug/power-rankings`, `drafts/:draftSlug/tier-list`,
`stages/:stageSlug/trades`.

(`coach` is gone — step 2 deleted the route with the component.)

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

## 5. Manage IA — done (step 4)

Nav's Manage block and the hub list different sets. The two most-used organizer
screens in-season — **Matches** (stage builder) and **Match Results** — are the
two the nav omits. "Dashboard" is the last nav item and links to the hub you
would already be on.

- ~~`manage/drafts/:draftSlug` → `LeagueManageDashboardComponent`~~ — deleted in step 7.
- ~~`manage/stages/:stageSlug/trades/legacy` → `LeagueManageTradesComponent`~~ —
  deleted in step 7.
- The hub's per-draft Trades card and the nav's flat Trades are the same
  component on two URL shapes.
- No pending-report count anywhere. Report review works
  (`league-manage-schedule.component.ts`) but is undiscoverable.
- Commented-out "Playoffs" section at the bottom of the hub template.

### One link set, two renderers

`tournaments/tournament-links.ts` is now the single definition of where a
tournament can go. It exports plain builders — no service, no DI, nothing to
mock — returning `TournamentLinkGroup[]`, where each link carries `label`,
`route` (a `routerLink` array, not a string), `icon`, `description`, and
optionally `exact` and `status`.

Two surfaces render it:

- **The nav** (`tournamentLinkGroups`) renders every group as label + rows, and
  ignores `icon`/`description` — per-row icons were tried and removed in step 1,
  and that decision stands. Fourteen hand-written `<a>` blocks collapsed into two
  nested `@for`s.
- **The manage hub** (`manageLinkGroups`) renders the same manage groups as
  `nav-card`s, which is where `icon` and `description` are used, filtering out
  `manage-hub` because that is the page you are standing on.

They cannot drift again: adding an organizer screen in one place adds it to both.

The manage set is split into **Manage** (Dashboard, Matches, Match Results,
Sign-Ups, Trades — in-season operations) and **Setup** (Settings, Rules, Tier
List — configuration). The nav gains Matches and Match Results, which was the
whole complaint. The hub keeps meaningful section headings instead of one
undifferentiated grid of seven cards, which is why the split exists at all rather
than one flat "Manage" list.

### The per-draft Trades card is gone

Putting both surfaces on one definition surfaced the duplicate immediately: the
hub would have shown Trades twice on the same page, once tournament-level and
once per draft.

`TradeManagerComponent` resolves this itself and always did — given no
`draftSlug` it falls back to `info.drafts[0]`, and it renders a
`pdz-draft-switcher` whose `onDraftSelected` navigates to the draft-scoped URL.
So the flat `manage/trades` card plus that in-page switcher already reaches every
pool, and the per-draft card was a second door to the same room. The per-draft
block is now Draft Page + Draft Control, both of which genuinely require a slug
and have no switcher of their own.

The commented-out "Playoffs" section went with the rewrite.

Still open from this section: `manage/drafts/:draftSlug` and
`manage/stages/:stageSlug/trades/legacy` are still unlinked (step 7's sweep), and
there is still no pending-report count — that needs a server count before the
link set has anything to show, so `status` on `TournamentLink` is the hook for it
when it exists. The draft-status badge already uses that field.

## 6. Server built, client missing

| Endpoint / field | Note |
| --- | --- |
| ~~`DELETE /…/trades/:tradeId`~~ | **done** — `withdrawTrade`, called from `league-trade-widget` (found 2026-09-23) |
| ~~`DELETE /…/chat/messages/:messageId`~~ | **done** — `deleteChatMessage`, called from `league-chat` (found 2026-09-23) |
| ~~`round.tradeDeadline`~~ | **done in step 8** — editor in the stage builder, and now enforced |
| ~~`round.bestOf`~~ | **done in step 8** — editor in the stage builder |
| chat channels `tournament`, `spectator`, `draft` | full policy in `chat.policy.ts`, only `matchup` has UI |
| ~~`organizers[]`~~ | **done in step 6** — endpoints + `manage/organizers` page |
| `POST /…/stages`, `/stages/:slug/pools`, `/stages/:slug/current-round`, `GET /stages/:slug/schedule`, stage-scoped trades | intentional legacy, unreferenced |
| `updateBracket` / `deleteBracket` (stage-scoped) | in `league-manage.service.ts`, still zero callers as of 2026-09-23; `createBracket` is gone |

### Step 6: organizer management

`organizers[]` is `string[]` of Auth0 subs, which nobody can type into a form, so
the work was mostly about finding a handle a human can use. Both routes are
supported, because a co-host is often not a participant and a promoted captain
often is:

- **Promote a participant** — the signups payload already carries `coachId`, and
  the server resolves it to `coach.auth0Id` itself. No identity lookup, and no
  way to add a stranger by mistake.
- ~~**Search by username**~~ — **removed 2026-09-23.** Any signed-in user can own a
  tournament, so an owner-gated substring search was in effect a public user
  directory: two-character queries enumerate it, and each result carried
  `auth0Sub` and the join date. It was replaced by single-use organizer invite
  links (hashed tokens, 7-day expiry, at most 10 pending, consumed atomically,
  stored in `organizerinvites`) and per-tournament organizer names (§12.1).
  `searchByUsername` was deleted from `UserRepository`, and `AddOrganizerDto`
  now accepts only `coachId`. Original reasoning, kept for the record:
  `GET …/organizers/search?q=`. Deliberately scoped
  under the tournament and owner-gated rather than added as a general
  `/users/search`: it is a user-table read by username prefix, and that is a
  smaller surface to expose behind one owner's tournament than as a public
  endpoint. The query is regex-escaped before it reaches Mongo, capped at 10
  results, requires 2 characters client-side, and existing organizers are
  filtered out server-side.

Reading the list requires `organizer`; changing it requires `owner`
(`requireOwner`), so a co-organizer cannot add peers or remove the person who
added them. The owner is always included in the response, flagged `isOwner`, and
is rejected as both an add and a remove target — they are an organizer by
definition, and removing them would leave the tournament unmanageable.

The new page is `manage/organizers`, added to the **Setup** group in
`tournament-links.ts`. That one entry put it in both the sidebar and the manage
hub — which is the payoff step 4 was after.

`UserRepository` gained `findManyBySubs` (one query to label the whole list
rather than one per organizer) and `searchByUsername`, and `UserModule` now
exports the repository. No cycle: `UserModule` imports nothing but Mongoose.

## 7. Client built, server missing — dead UI

- ~~**The socket chat is dead.**~~ **Deleted in step 5.** `core/services/chat.service.ts`
  opened a socket.io connection in its constructor, emitted `joinRoom` /
  `sendMessage` and listened for `newMessage`. The only gateway is
  `draft.gateway.ts`, which handles one message: `"message"`. See below.
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

### Step 7: what was swept

Unrouted, nothing importing them: `league-new/`, `league-form/` (with
`league-form-new/` and `league-form-edit/`), `league-schedule/`,
`league-schedule-matchup/`, `league-auction/` + `auction.service.ts`.

Routed but unreachable, so the route went with the component:
`league-manage-dashboard/` (`manage/drafts/:draftSlug` — a 10-line empty
scaffold serving a live URL) and `league-manage-trades/`
(`manage/stages/:stageSlug/trades/legacy`). The commented-out auction route went
too.

**`league-form/` was a second name collision, not just an orphan.** Like
`league-schedule/`, it exported a class whose name is live elsewhere —
`LeagueFormComponent` is also `league-list/form/league-form.component.ts`, which
*is* routed. Both footguns are gone; the surviving class of each name is now the
only one.

**One thing could not simply be deleted.** `league-manage-trades.component.ts`
also exported `TradeData` (and its `SelectedTradePokemon`), which
`LeagueZoneService.sendTrade` imports — and `sendTrade` is live, called from
`trade-manager` and `league-team`. A payload type had been living in a legacy
component's file. Both types moved to `league.interface.ts` beside `TradeLog` and
`TradeStatus`, where the rest of the trade vocabulary already was.

This is the case the unrouted-components gotcha in `CLAUDE.md` warns about in
reverse: `ng build` caught this one only because the *importer* is routed.

Deleting these removed six failing spec files. The clean-tree baseline is now six
failing suites, not the ~10 NG0201 scaffolds plus `chat.component.spec.ts` that
`CLAUDE.md` used to quote; it has been updated with the current list.

### Step 5: deleted, not fixed

Deleted: `core/services/chat.service.ts` and the whole `shared/chat/` primitive
(component, template, stylesheet, spec). Nothing else referenced either.

Two details in the finding above were overstated, and both argue for deleting
rather than fixing:

- **It was not connecting at app boot for every visitor.** A `providedIn: 'root'`
  service is constructed on first injection, and the only injector was
  `ChatComponent`. The blast radius was one page, not the app.
- **The division dashboard was not rendering it.** The `<pdz-chat [roomId]>` tag
  sat inside an HTML comment spanning ~30 lines, and `ChatComponent` was not in
  that component's `imports` array either. So there were zero live call sites —
  this was not a broken feature, it was an abandoned one.

The reason it could never have worked is sharper than "the server has no
handler": `ChatService` called `io(environment.apiUrl)` with **no `path` option**,
so it targeted the default `/socket.io/`, while `DraftGateway` is declared
`@WebSocketGateway({ path: "/ws/" })`. The socket never completed a handshake at
all — it would have retried with backoff forever. `ws.service.ts`, the live
draft's transport, passes `{ path: '/ws/' }` and works; that one and
`league-auction`'s (orphaned, step 7) are the remaining `socket.io-client` users,
so the dependency stays.

Fixing was never the call: the product already has a working tournament chat —
`LeagueChatComponent`, REST-polled by design, with the four-channel policy table
on the server. A second chat on a second transport would have been the duplicate
surface problem from step 2 all over again.

Swept along with it: the ~30-line commented-out widget scaffold on the division
dashboard that held the tag (it also referenced `pdz-league-team-card` and
`pdz-coach-standings`, and hardcoded a team name). `CLAUDE.md` lost `chat` from
the shared-primitive inventory and the `chat.component.spec.ts` line from the
test baseline — that spec's `ngx-markdown` ESM failure is gone with the file.
`ngx-markdown` itself stays; four other components use it.

## 8. Missing on both sides

- ~~**Removing a participant.**~~ **Done in step 6.** No drop/withdraw.
  `DELETE /coaches/:coachId` deletes the coach and leaves `team.coach` dangling,
  which 500s every page in the tournament. No reassign flow. See below.

  **The orphaning was unconditional, not occasional.** `teamId` is
  `required: true` on `CoachEntity`, so *every* coach has a team and that
  endpoint could never be called safely — there was no input for which it did
  the right thing.

  `team.status` gained a fourth value, `dropped`. It was cheap because every
  read filter on that field is positive (`=== "approved"`, in `draft.service`
  and `getStandings`), so a dropped team falls out of rosters and standings on
  its own with no read path to update. It slots into the status `pdz-select`
  the signups page already had, and into `assignCoaches`, which already wrote
  status — the drop itself needed no new endpoint. Dropped signups collapse into
  their own `pdz-disclosure` beside Denied, and `signUpInDraft` excludes them so
  they stop occupying a pool column.

  Dropping is reversible and keeps match history, which is why it is the normal
  path. For an actual purge — a spam signup, a duplicate — there is now
  `DELETE /leagues/:leagueSlug/tournaments/:tournamentSlug/coaches/:coachId`,
  organizer-gated, which deletes team and coach **together** so nothing dangles.
  It refuses with `COACH_HAS_MATCHES` when the team appears in any matchup,
  because deleting a team out from under a played match is the same class of bug
  one level up. The Remove button only appears on denied or dropped cards, and
  confirms first.

  The old generic `deleteCoach` now refuses outright with `COACH_HAS_TEAM`.
  Pairing the two deletes there was not possible: `TeamModule` already imports
  `CoachModule`, so reaching `TeamRepository` from `CoachService` needs a
  `forwardRef` cycle. `HostedTournamentService` holds both repositories already,
  which is why removal lives there. Nothing called the old endpoint from the
  client, so no caller broke.
- ~~**`archived`**~~ **Done in step 8.** On `HostedTournamentEntity` it was
  written by nothing. But it was already *read*, in two places and correctly —
  `findByParticipant` and the hosted-ad query both filter
  `archived: { $ne: true }` — so only the write was missing, not the behaviour.
  It is now a settings toggle: `archived` on the settings DTO, on the domain and
  its mapper (so `getSettings` round-trips it), and a checkbox on the settings
  page. Flipping it drops the tournament out of coaches' lists and out of the ad
  list without touching its pages.
- **No tournament visibility flag.** Stages have `public`; tournaments don't.
- ~~**No capacity / max teams / waitlist**, and no open-close toggle independent
  of `signUpDeadline`.~~ **Done in §11.10 steps 6–10:** `maxTeams` gates
  approval, `waitlisted` is an application status, and `signUpAccess: "closed"`
  pauses intake without moving the published deadline.
- **No deadline reminders.** `agenda.service.ts` only defines draft pick-skip
  jobs. `matchDeadline` and `tradeDeadline` fire nothing. Separately,
  `cleanup-file-uploads` is defined but its `agenda.every(…)` is commented out —
  uploads are never GC'd. Still true 2026-09-23.
- ~~**`tradeDeadline` is never enforced.**~~ **Done in step 8.** Plumbed through
  `bracket-view.ts`, `stage-axis.ts` and `tournament-bracket.service.ts`;
  `tournament-trade.service.ts` never read it. (`tradePointLimit` *is* enforced.)
  `createTrade` now rejects with `STAGE.TRADE_DEADLINE_PASSED` (STG-008) once the
  target round's deadline has passed — **for coaches only**. Organizers bypass
  it, matching how they already bypass approval by filing trades straight to
  `APPROVED`; a TO fixing something after the deadline is the normal case, not
  an error.
- **Discord role grant is one-shot at signup**, in `notifySignup`, and fires
  regardless of approval status — a denied signup keeps the coach role. The
  signups page shows `inDiscordServer` / `hasDiscordRole` / `hasValidTeam` as
  read-only badges with no way to act on them.

  *Partly fixed in §11.10 step 6:* the grant moved to approval behind
  `autoGrantCoachRole`. Still open: the role is never revoked on drop or
  denial, the badges are still read-only, and `discordName` is still an
  unverified string (§11.11).

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

1. ~~**Nested anchors**~~ — `league-landing.component.html` put the Discord `<a>`
   inside the tournament-card `<a>`. Invalid HTML. **Fixed in step 3**, because
   that step is what starts sending traffic to the page. The card is now a
   `<div>`; the tournament name carries the link and stretches over the card with
   `&__link::after { position: absolute; inset: 0 }`, and the Discord anchor sits
   above that overlay via `position: relative`. The whole card stays clickable,
   the `(click)="$event.stopPropagation()"` workaround on the Discord link is
   gone, and `:focus-within` gives the card the same lift as `:hover` so keyboard
   users can see where they are.
2. ~~**`getLeagueSummary` reads `tierList.format.name`**~~ — **fixed in step 8.**
   Everything else reads `tournament.format`, which the decoupling moved onto the
   tournament and which `HostedTournament` already asserts matches. It also cost
   a `tierListRepo.findById` per tournament to read an already-loaded field.
   Reading the tournament's own fields fixed the bug and deleted the N+1 in the
   same edit — the fetch existed only to serve the wrong source.

   Two specs had encoded the bug, asserting that format comes from the tier list.
   They now assert the opposite, including that no tier list is fetched at all.
3. ~~**N+1 in both league queries**~~ — **fixed in step 8.** `getLeagues` did
   `leagueRepo.findById` + `tierListRepo.findById` inside a per-tournament
   `Promise.all`.

   The league fetch is gone entirely rather than batched: the repository already
   holds the `LeagueDocument` when it maps each tournament, so `TournamentLeague`
   gained `name` and the domain gained `leagueName` — the data was already in
   hand and was being re-fetched to read one string. The tier-list fetch is
   genuinely needed (for `getPokemonFormes`), so it became one batched
   `findManyByIds` returning a `Map`, de-duplicated by id.
4. **The stage-builder adapter can't clear a deadline** — *does not reproduce.*
   The adapter does spread `matchDeadline` only when truthy, but omitting it is
   what clears it: `updateBracket` maps the DTO into `nextRounds` and
   `setSchedule` `$set`s the whole `rounds` array, so a field absent from the
   payload is absent from the stored subdocument. `@IsOptional()` also accepts an
   explicit `null`, so both spellings clear. Pinned with a spec
   ("clears a deadline the payload leaves out, because rounds are replaced
   wholesale") rather than changed, since the behaviour was already correct and
   only undocumented.

## 10. Best-practice drift

Clean: `npm run lint:styles`, no native `<select>`, no Material, no raw
`<button>` without `pdz-button`, and the `!== false` conventions for
`matchSettings` and stage `public` are honoured.

Drift:

- **Anchors styled as controls.** `.link-button` (tournament nav), `.nav-card`
  (manage hub), `.tournament-card` (league landing), `.button--division`
  (tournament drafts), `.button` (coach page). `a[pdz-button]`, `pdz-card`,
  `pdz-badge` and `pdz-chip` already cover these. (The coach page is gone as of
  step 2. `.tournament-card` is no longer an anchor as of step 3, but it is still
  a hand-rolled card where `pdz-card` belongs.)
- **The nav is the `pdz-tab-link` problem again** — a bespoke link list with its
  own stylesheet where a shared primitive belongs. (Still bespoke after step 4,
  but now data-driven: the markup is one `@for` over `tournament-links.ts`, so
  swapping in a primitive later is a template change and not a re-audit of
  fourteen hand-written anchors. Its `profile` / `canManage` / `draftStatus` are
  signals now and the link set is a `computed`, so it no longer rebuilds every
  route array on every change-detection tick.)
- **Change detection.** Of 55 components under `league-zone/`: 34 use
  `implements OnInit` + `Subject` + manual `takeUntil`, 10 touch signals, 9 use
  `OnPush`. New work should be signals + `OnPush` + `takeUntilDestroyed`.
- **Fire-and-forget errors.** `console.error` and leave the view blank is the
  standard failure path. `LeagueNotificationService` wraps `ToastService` and is
  barely used.

---

## 11. Participation model and invite-only sign-ups — mostly done

Step 9. Designed 2026-09-21. Two features that look separate but share one
blocker: an invite hands out a *roster spot*, and a roster spot is not currently
a thing that can exist apart from the person who signed up for it.

### 11.1 The blocker

`Coach` and `Team` are a mutual, mandatory 1:1:

```ts
// team.schema.ts
@Prop({ ref: "CoachEntity", required: true, unique: true })
coach!: Types.ObjectId;

// coach.schema.ts
@Prop({ ref: "TeamEntity", required: true })
teamId!: Types.ObjectId;
```

`createSignup` (`hosted-tournament.service.ts`) pre-allocates both ObjectIds in
one breath so each can point at the other. Three consequences:

- **Two coaches on a team is impossible** — `coach` is a single-valued
  `required` field and every read path treats it as *the* coach. (An earlier
  draft of this section blamed `unique: true`. That is wrong and worth stating
  plainly, because it suggests a fix that does not work: `unique` on
  `team.coach` stops two *teams* sharing one coach document. The many-coaches-
  to-one-team direction is `CoachEntity.teamId`, which has never had a
  constraint on it at all. Dropping the unique index alone buys no multi-coach.)
- **Replacing a coach is impossible** — both sides are `required`, so there is no
  legal intermediate state and therefore no safe moment to swap.
- **Removing a coach is impossible** — `CoachService.deleteCoach` refuses
  outright when `coach.teamId` is set. There is no API path at all.

`CoachEntity.teamId` is already the real edge. `TeamEntity.coach` is a redundant
back-pointer kept for `.populate()` convenience, and it is the thing enforcing
1:1. Deleting it is most of the fix.

### 11.2 What sign-up conflates

One form currently creates three records with three different lifetimes and
calls them one thing:

| Thing | Fields | Lifetime |
| --- | --- | --- |
| A person's participation | `auth0Id, gameName, discordName, timezone, experience` | as long as they stay |
| A roster slot | `teamName, logo, picks, draftId, slug` | the whole season |
| A request to join | `status, confirmed, droppedBefore, droppedWhy` | dead once decided |

The slot outlives the people in it. Fusing the three is why coach churn breaks
everything downstream.

### 11.3 Target model

**Team is the slot.** Keeps `teamName`, `logo`, `picks`, `draftId`, `status`,
`slug`. Drops `coach`. Gains an optional primary designation:

```ts
@Prop({ type: SchemaTypes.ObjectId, ref: "CoachEntity" })
primaryCoach?: Types.ObjectId;
```

This is not the pointer being deleted. The deleted one is `required + unique` —
the membership *edge*, which forbids two coaches and forbids an empty slot. This
one is nullable and non-unique: a designation, which forbids nothing.

A pointer beats a `primary` boolean on each membership because exactly-one
becomes structural rather than conventional (a flag can drift to zero or two
primaries with nothing stopping it), and reassignment is a single atomic `$set`
rather than a two-document write wanting a transaction.

**Coach is a membership** — one row per person-in-a-team. Near enough to today's
schema: `teamId` + `auth0Id` + contact fields, plus `role` and `leftAt`. Many
rows may point at one team. Dropping a coach sets `leftAt` instead of deleting,
so `pickLog.picker` references and match history stay intact.

**Application is the request** — its own collection, since `CoachEntity.teamId`
is `required` and an application has no team yet:

```ts
auth0Id, name, gameName, discordName, timezone, experience,
droppedBefore, droppedWhy, confirmed,
preferredTeamName, preferredLogo,
intent: "team" | "sub",
status: "pending" | "waitlisted" | "approved" | "denied",
answers: { questionId: string; values: string[] }[],
joinTeamId?: Types.ObjectId,
resultingTeamId?: Types.ObjectId, resultingCoachId?: Types.ObjectId,
decidedBy?: string, decidedAt?: Date, submittedAt: Date
```

This is the shape as built (updated 2026-09-23). The first design also had an
`either` intent and a `withdrawn` status; both were cut, see the trim note
below.

`joinTeamId` is set when applying as a sub to a specific existing team. Nothing
sets it yet: there is no sub-for-a-specific-team flow in the sign-up form.

**Three status enums, not one.** Today `TeamStatus` does double duty: it is both
application state (`pending`, `denied`) and participation state (`approved`,
`dropped`). Once the records split, so must the enums —

| Object | States |
| --- | --- |
| Application | `pending`, `waitlisted`, `approved`, `denied` |
| Membership (Coach) | `active`, `left` |
| Team | `active`, `dropped` |

**Trimmed 2026-09-22.** The first cut of this carried three states nothing could
ever reach, found by asking what actually sets them:

- `withdrawn` was only ever *read*, by `findBlockingApplication`. No endpoint
  set it. Removing it makes that guard "any application blocks", which is
  simply the §11.12 decision stated directly.
- `either` intent existed only in its own enum declaration. Nothing produced
  it, and the `asSub` override on `DecideApplicationDto` that would have
  resolved it was never sent by the client. Both gone; intent is `team | sub`.
- **The sub pool is derived, not flagged.** It was `intent !== "team" && status
  in (approved, waitlisted)` — but "available to sub" is exactly "approved or
  waitlisted with no team yet", which the data already says. `intent` is now
  only a record of what the applicant asked for, and a waitlisted applicant
  correctly appears in the pool without needing a second field to say so.

Verified against production before cutting: `intent` was `team` on all 241
applications, and no application had ever been `withdrawn`.

Membership `left` means one coach departed and the team plays on. Team `dropped`
means the whole slot left the league. Both are needed and they are not the same
event.

**Teams are created at approval, not at sign-up.** Denied applicants stop
leaving ghost teams behind, and a team name can be corrected before it is ever
published.

### 11.4 Flows

**Approval branches on `intent`:**

- `team` — the server creates a Team from `preferredTeamName`/`preferredLogo`,
  creates a Coach membership pointing at it, and sets `primaryCoach` to that
  membership. Same end state as today, one step later.
- `sub` — no team is created. The application goes `approved` and the person
  enters the sub pool.
- ~~`either` — the TO picks which of the two at approval time.~~ Cut 2026-09-22
  (§11.3): nothing produced it.

**Normal sign-up (the 99% case)** is the `team` branch with nothing unusual
about it.

**The Discord coach role moves to approval** — another live bug. `notifySignup`
grants `coachRoleId` the moment someone submits, so anyone who signs up holds
the role whether or not they are ever approved, and denial never revokes it.
Worse, it resolves the member from the **self-reported `discordName` string**:
typing someone else's handle grants *them* the role in a server the applicant
has never joined. An unverified text field is driving a permission grant.

Moving the grant to approval fixes the first problem and narrows the blast
radius of the second to people the TO has actually vetted. It does not fix the
underlying identity problem — see §11.11.

Gate it behind an integration toggle rather than inferring intent from whether
the ids happen to be set:

```ts
@Prop({ default: true })
autoGrantCoachRole!: boolean;
```

On `discordSettings`, read as `!== false` to match the `matchSettings` and stage
`public` conventions. The timing change applies regardless of the toggle.

**Sub replacing a dropped coach.** No separate flow needed — the sub's preferred
team name is already on their application. The TO sets the outgoing membership's
`leftAt`, attaches the new one, and **the team is renamed to the sub's preferred
name**, mid-season or not. Logo follows the same rule. If the sub replaced the
primary, they inherit primary.

Decided deliberately: renaming mid-season is correct because the team is the
sub's team now. Two checks made this cheap —

- `generateSlug` (`core/slug.ts`) is random base62, not derived from `teamName`,
  so a rename does not touch the team's URL. No redirects needed.
- The archive schema snapshots its own `teamName`, so archived seasons keep the
  name they had.

Known and accepted: live in-season views read `team.teamName` fresh
(`stage.service.ts`, `tournament-bracket.service.ts`), so a week-4 replacement
retroactively relabels that team in weeks 1-3 results and in the bracket until
the season archives. If that ever needs to change, the fix is snapshotting
`teamName` onto the matchup at report time — not worth building up front.

Log every rename (old name, new name, round, reason). Cheap now; it is the
answer when someone asks why week 2 reads differently than they remember.

**Multiple coaches.** Two membership rows. Nothing else changes.

**Primary reassignment.** One `setPrimaryCoach(teamId, coachId)` owns the
invariants:

- the target must be an *active* membership of that team;
- when the primary drops, **auto-promote** the longest-tenured remaining active
  member rather than leaving it null. `draft-engine.service.ts` pings
  `coach.discordName` on every turn, and a null primary mid-draft is exactly the
  silent breakage this redesign exists to prevent.

### 11.5 Capacity, waitlist and the sub pool

There is no capacity concept anywhere in the server today — no `maxTeams`, no
`capacity`, no waitlist. Every draft league is a fixed size, so "we're full" is
currently handled by manually denying people.

```ts
@Prop()
maxTeams?: number;
```

Unset means unlimited.

**The cap gates approval, not submission.** Capping at submission depends on
arrival order, tells an applicant "full" before a TO has looked at anyone, and
turns an over-shared invite link into a race. Capping at approval keeps the
whole pool visible, and simply blocks approving past the limit — with an
explicit override, since a TO who wants a 13th team should be able to have one.
Approving past the cap offers `waitlisted` instead.

**The waitlist is the sub pool.** When a team drops or a coach leaves, the
replacement picker in §11.4 draws from applications that are `waitlisted`, plus
`approved` ones with no team yet (as built; the `either` intent this first
said was cut). This is what makes that flow
operable — without it the TO has a replacement UI and nobody to put in it.

Per-pool capacity in a multi-division tournament is deferred. Noting it because
a cap is genuinely per-pool once there is more than one, and `maxTeams` as a
single number will need to become a per-pool map rather than being reinterpreted.

### 11.6 Custom sign-up questions

`SignUpDto` is fixed today — name, gameName, discordName, teamName, timezone,
experience, droppedBefore/Why. Every league asks something beyond that, so each
one currently bends its questions to fit ours.

```ts
@Schema({ _id: false })
class SignUpQuestionEntity {
  id!: string;
  label!: string;
  help?: string;
  type!: "short" | "long" | "choice" | "multi" | "boolean";
  options?: string[];
  required!: boolean;
  maxLength?: number;
  archived?: boolean;
}
```

Rules that keep this from rotting:

- **The built-in fields stay built in.** Custom questions are purely additive.
  `timezone` drives scheduling, `discordName` drives the role grant and the
  embed, `droppedBefore` drives its own display — making them dynamic would
  break `notifySignup` and match scheduling for no gain.
- **Stable generated `id`s, never array indices.** Questions get edited while
  applications already exist; that is the normal case, not the edge case.
- **Never delete or repurpose a question — `archived: true` instead.** Answers
  on file have to keep rendering, and a reused id silently relabels historical
  answers.
- **`required` binds new submissions only.** Adding a required question
  mid-window would otherwise retroactively invalidate every application already
  received.
- **Discord embeds cap at 25 fields.** `notifySignup` uses 5 today. Custom
  answers appended to that embed need clamping, or a league with 20 questions
  silently drops the tail.

**Pool preference is a custom question**, not a schema field and not a special
question type. The TO reads the answer and assigns pools themselves, which is
what they already do.

### 11.7 The rule that partitions the read sites

> **Display and notification take the primary. Authorization takes any active
> membership.**

Roughly 25 sites do `await team.populate("coach")`. Under this rule:

- Draft turn pings, chat `authorName`, the standings coach column → become
  `populate("primaryCoach")` and behave exactly as they do today. Mechanical.
- Match reporting, draft pick auth, chat access → become "any active
  membership." These are the ones needing thought, and they are the same sites
  the `resolveMembership` work below already touches, so the two overlap rather
  than compound.

**Step 3 is done.** Four sites were deliberately left on `coach` because they are
about *who acted*, not *who is displayed* — each is wrong under multi-coach and
belongs to step 4 or 6, not to a mechanical swap:

| Site | Today | Why it is wrong later |
| --- | --- | --- |
| `team-summary.ts` `coachNames` map | built from `team.coach` only | a co-coach's pick would render a blank picker name; must enumerate all memberships |
| `stage.service.ts` `submittedByName` | the primary's name | `submittedBy` already holds the acting `sub`; the name should be resolved from that, not from the primary |
| `hosted-tournament.service.ts` coach listing `id` | `team.coach._id` | feeds `assignCoaches`; becomes a membership enumeration rather than one id per team |
| `draft-engine.service.ts` `picker` | `currentTeam.coach._id` | correctly the *acting* coach, so it must resolve from `sub`, never from the primary |

The general rule they share: **anything recording an action must resolve the
actor, and only labels may fall back to the primary.**

### 11.8 `resolveMembership`

`findSignupForTournament` answers "is this person a coach here" by looping every
coach doc for that sub and loading each team — an N+1 that gets worse once one
person can hold several memberships. It also becomes wrong the moment a coach
can leave, because "is a coach" has to start meaning "has an *active*
membership", and that check is scattered across the chat policy, draft pick
auth, matchup reporting and `getRoles`.

**What was actually built (step 4, done 2026-09-22), and why it differs.**

A tournament-level `resolveMembership(sub, tournamentId)` was written first and
then deleted, because it ended up with zero callers:

- Every real authorization site is *team*-scoped — `isCoachedBy(team, sub)` on a
  team already in memory. Routing those through a tournament-level resolver
  would re-query what the caller is holding.
- The one tournament-scoped consumer, `findSignupForTournament`, is better
  served by the repositories the service already injects. Reaching for
  `mongoose.model()` the way `tournament-access.ts` does made it untestable —
  the unit specs mock the repos, so the global-model lookup threw
  `MissingSchemaError`. The tests caught the coupling immediately.

Its N+1 is still fixed, with the injected repos: one `coachRepo.findByAuth0Id`
plus one `teamRepo.findManyByIds`, instead of one query per coach document. It
now also filters on `isActiveCoach`, so a departed coach stops resolving as a
signup.

What shipped is `@modules/tournament/membership.ts`, team-scoped:

```ts
seatsOnTeam(team, sub): Seat[]
canOnTeam(team, sub, capability): boolean
can(seat, capability): boolean
```

`seatsOnTeam` reads the `coaches` virtual when populated and falls back to the
team's own `coach` ref when not. **The repository does not populate `coaches`
yet** — until multi-coach exists at step 6 the fallback is exactly correct, and
`CoachDocument` already carries `leftAt`, so departures are honoured either way.
Adding the populate is a step-6 change that needs no call-site edits. A
tournament-level resolver can come back then, with an actual consumer.

Route every permission check through it. **Organizer-but-not-coach is the case
that breaks when code assumes those two sets overlap** — `dods/cup-1` is the
live example, and it works today only because `organizers: string[]` happens to
be independent of the coach collection. Making the shape explicit is what keeps
it working.

**Call sites ask for a capability, never for a role.** Co-coaches are co-equal
today (§11.12), but the decision is to keep tiers addable later without
reopening every authorization site. That means the check goes through one
function from the start:

```ts
export type Capability = "draft" | "report" | "chat" | "manageRoster";

export function can(seat: Seat, capability: Capability): boolean {
  return seat.active;
}
```

`capability` is deliberately unused in the body for now — every active seat can
do everything. Call sites read `if (!can(seat, "draft")) throw FORBIDDEN`, which
is the same sentence they will read after tiers exist. Introducing head/assistant
roles, or per-seat `canDraft`/`canReport` flags, then means editing `can` and
nothing else.

The seam only counts if it is on the path. `canOnTeam` calls `can`, and
`isCoachedBy(team, sub, capability)` takes a required capability so every caller
must state its intent — `report` for matchup schedule/notes/reporting,
`manageRoster` for trades and team edits, `chat` for participant display. A
`can` that no authorization site called would be decorative.

Without this indirection the co-equal decision bakes a bare `seat.active` check
into ~10 authorization sites, and adding tiers later means finding and rewriting
every one of them.

### 11.9 Invite-only sign-ups

Gates *entry*, not *viewing*. Those are separate axes and conflating them is
what makes this look expensive: listing already exists as
`adSettings.advertise`, entry is a field and a guard check, and gating viewing
would mean adding optional-JWT to the tournament route plus every child route.
Entry only, for now.

```ts
@Prop({ type: String, enum: ["open", "invite", "closed"], default: "open" })
signUpAccess!: "open" | "invite" | "closed";

@Prop()
signUpToken?: string;

@Prop()
signUpTokenRotatedAt?: Date;
```

Token is ~128 bits from the same generator as slugs, created lazily on first
switch to `invite`. `closed` is not redundant with `signUpDeadline` — it lets a
TO pause intake without moving a date that is published on the page.

**`signUpDeadline` is not enforced today — this is a live bug.** `createSignup`
validates `droppedWhy`, `confirm`, duplicates and the logo, then writes. Across
the whole module `signUpDeadline` is only ever read for display and for the
settings PATCH. Sign-ups never actually close. Fix it inside this same guard,
in order: `closed` → 403; past deadline → 403 unless the request carries a valid
invite; `invite` → token must match.

Endpoints:

- Gate lives on `POST :tournamentSlug/signup` only. `invite` requires a matching
  `?invite=`; `closed` always 403s; `open` is today's behaviour.
- `POST :tournamentSlug/signup-token/rotate`, owner/organizer only, returns the
  new token and invalidates every link already sent.
- `GET :tournamentSlug/signup` should report *why* it is blocked so the page can
  say "this league is invite-only" rather than failing generically.

No rate-limiting ceremony needed at 128 bits.

Three traps:

- **Do not let the token reach the public read.** `GET :tournamentSlug` has no
  guard. `HostedTournamentMapper.fromDatabase` maps field-by-field so it will
  not leak by accident — but the moment the token is added to the domain object
  for the settings page, it flows into that public DTO. Serve it only from the
  organizer-gated path (`/info` is already behind `JwtAuthGuard`).
- **The invite param must survive the Auth0 round trip.** Most people clicking
  the link are logged out: they hit `/signup?invite=...`, bounce to Auth0, and
  come back. If the param is not carried through `appState`/`returnTo`, every
  invite lands on a 403. This is the bug that would make the feature look broken
  on day one.
- **Copy the URL, not the token.** The settings control hands over the full
  `.../signup?invite=...` ready to paste into Discord.

Client: a new node in the `signup` section of `settings-schema.ts`, next to
`signup.listing` — access choice, read-only link with copy, rotate behind a
confirm (rotation silently kills outstanding links, so it cannot be a quiet
toggle). `invite` + `adAdvertise` is a contradiction worth surfacing in the
`<pdz-risk-banner>` already on that page: listed in Find a League, but nobody
who finds it can sign up.

### 11.10 Migration order

1. **done 2026-09-22** — Add `primaryCoach`, backfill `primaryCoach = coach` for
   every team. Applied to prod: 241 teams, 0 dangling, 0 conflicts. The
   assumption below was verified by `scripts/diagnose-coach-team-integrity.ts`
   before applying, not trusted.
2. **done 2026-09-22** — Add `leftAt`/`role` to `CoachEntity`; existing rows are
   active with no `leftAt`. No backfill needed. `role` is a free-form display
   label (§11.12).
3. **done 2026-09-22** — Swap the display/notification read sites to
   `primaryCoach`. `teamRepo.create` now writes it too, and `TeamSchema` gained
   a `coaches` reverse virtual (unpopulated until step 6).
   **Re-run `backfill-team-primary-coach.ts` immediately before deploying
   this.** The backfill and this deploy bracket a live window: `teamRepo.create`
   only started writing `primaryCoach` as part of step 3, so any signup between
   the first backfill and this deploy produces a team without it. Such a team
   throws `TypeError: cannot read 'name' of undefined` on read, which — per
   `scripts/complete/find-orphaned-team-coaches.ts` — 500s every endpoint for
   that whole tournament, not just one row. The backfill is idempotent, so the
   re-run is free and deterministic; that is why no `primaryCoach ?? coach`
   fallback was added to the repository. Keeping the invariant strict means
   nothing transitional has to be remembered and removed at step 5.
4. **done 2026-09-22** — Land the `can(seat, capability)` seam (§11.8) and move
   the authorization sites onto it. `resolveMembership` was built, found to have
   no callers, and removed; see §11.8 for why the team-scoped shape won.
5. **done 2026-09-22, revised in scope.** Drop the *constraints* on
   `TeamEntity.coach`: `required: true, unique: true` → a bare `@Prop`, plus
   `scripts/drop-team-coach-unique-index.ts` to drop `coach_1` in Mongo.
   Removing a Mongoose flag never drops an index that already exists, and the
   constraint would keep rejecting writes for a reason invisible in the code.

   **The field and its data stay.** Removing the `@Prop` outright — what this
   step originally said — turned out to be impossible before step 6: `coach` is
   still the source of truth for seven populates, `findByCoachId`,
   `createSignup`'s write, the `seatsOnTeam` fallback and the four "who acted"
   sites in §11.7. Step 6 is what replaces it. Dropping `required` is the part
   step 6 actually needs, since approval-time team creation and a team whose
   coaches have all left both require a team that exists without a coach ref.

   Field removal moves to step 10b, after step 6 has moved the readers.
6. Add the application collection with `intent`, the split status enums and
   `answers`; move team creation to approval. Move the Discord role grant to
   approval in the same step and add `autoGrantCoachRole`.

   **6a — done 2026-09-22.** `src/modules/tournament-application/` —
   `TournamentApplicationEntity` / `TournamentApplicationRepository` /
   `TournamentApplicationModule`, collection `tournamentapplications`, wired
   into `HostedTournamentModule`, plus
   `scripts/backfill-tournament-applications-from-teams.ts`. Purely additive:
   nothing reads applications yet, so it deploys safely on its own. The module
   is wired now rather than with 6b because a circular Nest dependency only
   surfaces at boot.

   Named **tournament application** throughout, not bare "application" — it
   matches the `tournamentmessages` collection precedent and the
   `Tournament*Entity` naming already used across the hosted-tournament schema,
   and it leaves the unqualified word free.

   **6b-6e server side — done 2026-09-22.**
   - `createSignup` writes a `pending` application and creates no team or coach.
     Its duplicate guard is now `findBlockingApplication`. It originally
     ignored `withdrawn` so a withdrawal could be re-submitted; once
     `withdrawn` was cut (§11.3), any existing application blocks, which is
     the §11.12 decision stated directly.
   - `PATCH :tournamentSlug/applications/:applicationId` decides one. Approving
     a `team`-intent application creates the Team + Coach + `primaryCoach`;
     approving a `sub` creates nothing; denying/waitlisting only moves status.
     Re-approving an already-approved application is a no-op rather than a
     second team.
   - The **Discord coach role moved to approval** and is gated on
     `discordSettings.autoGrantCoachRole` (`!== false`). It no longer fires at
     sign-up, which closes the hole where anyone who submitted the form got the
     role whether or not they were ever approved.
   - `getCoaches` is driven by applications, joined to teams via
     `resultingTeamId`. It emits `applicationId` (for the decide endpoint)
     alongside the existing `id` (the coach id, which `assignCoaches` still
     takes) — so pool assignment and status decisions stay on separate paths
     rather than one overloaded id.
   - `getSignup` falls back to the applicant's own undecided application, so a
     pending applicant can still see their sign-up. Without this, signing up
     and immediately reloading would have 404'd.
   - `maxTeams` pulled forward from step 7, since `assertRosterHasRoom` gates
     approval and the plan already said 6 and 7 must land together. Approving
     past the cap throws `LR-011 TOURNAMENT_FULL`.
   - Incidental fix: the public branch of `getCoaches` now filters to approved
     teams, closing the §11.13 leak where denied applicants' names sat on an
     unguarded endpoint.

   **6f — client, done 2026-09-22.**
   - **`applicationId` is now the identity key** across the applicants panel and
     the settings store — selection, tracking, status, `patchSignUp`,
     `dropSignUp`. The coach `id` became `string | null` and is kept only where
     a coach genuinely must exist: pool assignment, coach edit, logo upload,
     remove participant, add-organizer-by-coach. Each of those guards on null
     rather than assuming.
   - **Status changes route by which record they belong to.** An entry with no
     team is an *application* → `PATCH .../applications/:id`. An entry with a
     team is a *team* → `assignCoaches`, as before. This is the split from
     §11.3 surfacing in the UI: `dropped` is a team status and was never a
     valid application status, so offering it on a pending row would have sent
     an unaccepted enum value and 400'd. The per-row select now offers
     `DECIDABLE_STATUSES` for applications and `approved`/`dropped` for teams,
     and the bulk bar offers decisions only — a bulk "drop" over a mixed
     selection had no coherent meaning.
   - **Decisions are sent sequentially** (`concat`, not `forkJoin`). Each
     approval reads the team count and then creates a team, so parallel
     approvals could both pass a `maxTeams` check and overshoot the cap.
   - **The signup section reloads after saving**, because approving mints new
     team and coach ids that the local draft state cannot know.
   - Settings gained `signup.capacity` (`maxTeamsEnabled` + `maxTeams`, cleared
     with `null` like `pointTotal`) and a `Grant the coach role on approval`
     toggle under the Discord node, shown only when a coach role ID is set.

   Verified: `ng build --configuration development` clean, `lint:styles` clean,
   `league-zone` suites 162/162 passing (`power-rankings` is in the documented
   baseline).

   Not yet surfaced: the sign-up form has no `intent` control, so everything
   arrives as `team`. The sub-pool picker is step 7.

   **Deferred: narrowing `TEAM_STATUSES`.** The plan's table gives Team
   `active | dropped`, but the existing four-value enum is load-bearing in
   `assignCoaches`, `listTeams` and the client applicants panel. Applications
   now own the request lifecycle (`pending`/`waitlisted`/`denied`), and new
   teams only ever get `approved` or `dropped`, so the extra values are
   vestigial rather than wrong. Narrowing the enum moves to 10b, to keep step 6
   from growing a second blast radius.
7. **done 2026-09-22.** `maxTeams`, the approval-time cap and the `waitlisted`
   status all landed inside step 6, since the cap gates approval. What remained
   and is now done:

   - **`intent` is wired to the sub prompt that already existed.** The sign-up
     form already offered "Would you like to sign up as a sub?" when sign-ups
     were closed — it just had no data behind it. That flag now sets
     `intent: 'sub'` on the application, so the existing UI gained meaning
     rather than a second, parallel control being added beside it.
   - **Sub pool** is a `Subs` filter in the applicants panel: applications whose
     `intent` is not `team` and whose status is `approved` or `waitlisted`.
     That is the list step 8's replacement flow draws from.
   - Fixed a 6b regression: the sign-up form navigated to `response.teamSlug`
     on success, but there is no team until approval, so it sent every new
     applicant to a dead route. It now lands on the tournament page. The
     already-signed-up redirect on load keeps the conditional, since an
     approved coach does still have a team to go to.
8. **done 2026-09-22.** `POST :tournamentSlug/teams/:teamSlug/replace-coach`,
   organizer-only, taking the incoming sub's `applicationId`.

   In one call it sets the outgoing membership's `leftAt` (never deletes it, so
   `pickLog.picker` and match history stay intact), creates the incoming
   membership on the same team, renames the team and logo to the sub's
   preference, makes the incoming coach primary, and marks their application
   approved with `resultingTeamId`/`resultingCoachId`. The Discord role is
   granted through the same `grantCoachRole` path as approval, so the
   `autoGrantCoachRole` toggle covers it too.

   `TeamEntity.nameHistory` records `from`/`to`/`round`/`reason`/`changedBy`,
   and is only appended to when the name actually changes — a replacement that
   keeps the name logs nothing. The team keeps its `_id`, slug, roster and
   record, so standings and URLs are untouched; only the label moves.

   Which membership leaves: `outgoingCoachId` when given, otherwise the current
   primary, otherwise the first active member. A team with no active coach
   still accepts a replacement, which is what makes an abandoned team
   recoverable.

   Client: a "Replace coach" action on rows that have a team, opening a dialog
   that picks from the `Subs` pool, previews the resulting name, and takes an
   optional reason. Refuses an application that already produced a coach, so
   one sub cannot be spent twice.
9. **server done 2026-09-22.** `signUpQuestions[]` on the tournament, with
   `answers[]` on the application.

   **The two hard-coded questions were converted, not duplicated.** `experience`
   and `droppedBefore`/`droppedWhy` left `SignUpDto` and became the three
   seeded defaults in `signup-questions.ts`. Everything else the form asks —
   name, Showdown name, Discord, timezone, team name — drives logic and stays
   built in, per §11.6.

   That conversion forced one addition to the plan's question model:
   `dependsOn: { questionId, equals }`. "Why?" only appears when
   "Have you dropped before?" is yes, so the very questions being converted
   needed conditional support — which is a strong signal it was not
   speculative. `validateAnswers` skips a question whose dependency is unmet,
   so an unanswered conditional is not a missing required field.

   Validation rejects an answer to a question the tournament does not ask, a
   value outside a `choice`/`multi` question's options, multiple values on a
   single-value question, and anything over `maxLength`. Discord embed fields
   are capped at 25 (4 base + up to 21 answers), as §11.6 required.

   `scripts/seed-signup-questions.ts` seeds the three defaults onto every
   tournament with none, and copies each application's stored
   `experience`/`droppedBefore`/`droppedWhy` into `answers`. The original
   fields stay, so this is reversible. **Applied to prod 2026-09-22: 5
   tournaments seeded, 241 applications converted, none skipped.**

   **The applicants panel was rebuilt applicant-first, 2026-09-22.** It had
   stayed team-shaped, which is the shape §11.3 dismantled, and that produced
   real defects rather than just a wrong emphasis:

   - **Answers were never rendered.** The server sent `answers` with resolved
     labels; the client type did not even declare the field. The custom
     questions were invisible at the one moment they exist for — deciding an
     application.
   - **Three menu actions silently no-opped on pending rows.** `editCoach`,
     `pickLogo` and `remove` each guard `if (!coachId) return`, and a pending
     application has no coach. The items rendered, clicked, and did nothing.
   - The headline was `teamName`, which on a pending row is
     `preferredTeamName` — an aspiration shown as an entity.

   The rebuild: a row is a person (name, Showdown name, timezone, then what
   they asked for — a team name in quotes, or "Offering to sub", or a link once
   the team exists). The disclosure is the application itself, every question
   and answer, with booleans read back as Yes/No. **The action menu only
   renders when a coach exists**, and team-only actions only when a team does,
   so nothing inert is ever offered.

   Filter chips were replaced by four disjoint lifecycle groups — *Needs a
   decision* (pending), *On a roster* (approved with a team), *Available to sub*
   (approved or waitlisted without one), *Not participating* (denied or
   dropped). Grouping matches the order a TO actually works in, and it gives the
   sub pool a real home rather than a filter chip. The legacy `experience`
   field is gone from the view; it now appears once, as its answer.

   **Authoring UI done 2026-09-22** — a `signup-questions` custom slot in the
   sign-up settings section. Add a question, set its label, help, type,
   options (for `choice`/`multi`) and required flag, and point it at a
   yes/no question as its dependency.

   Two rules from §11.6 are enforced by the UI rather than left to discipline:

   - **Retire, never delete.** There is no delete control at all — only
     Retire/Restore, which flips `archived`. A retired question stops being
     asked and its existing answers keep rendering. Deleting would strand every
     answer already given.
   - **Ids are generated, never positional.** A new question gets a random id
     on creation and keeps it through every edit and reorder, so stored answers
     never re-point at a different question.

   Retiring a question also detaches anything that depended on it, so a
   conditional can never be stranded behind a trigger that is no longer asked.
   Only unarchived yes/no questions are offered as dependencies, and a question
   cannot depend on itself.

   Incidental fix: **`maxTeams` was never persisted.** Step 6 added the DTO
   field and step 6f added the settings control, but `updateSettings` never
   copied it — the team-limit control would have silently done nothing.

10. **server done 2026-09-22.** `signUpAccess` / `signUpToken` /
    `signUpTokenRotatedAt`, one guard, and `POST
    :tournamentSlug/signup-token/rotate`.

    `assertSignUpsOpen` runs in the order §11.9 specified: `closed` always
    403s; `invite` requires a matching token; a passed `signUpDeadline` 403s
    **unless** the request carries a valid invite. That last clause is the
    §11.12 decision — backfilling a dropped coach in week 3 should not require
    editing a published date.

    **`signUpDeadline` is now actually enforced.** It never was: `createSignup`
    validated everything else and wrote. Sign-ups have never closed on their
    own until this change.

    The token is generated lazily when a tournament first switches to `invite`,
    and is served only from the organizer-gated settings payload —
    `toClientPayload`, which the unguarded public read uses, does not carry it.

    **Client done 2026-09-22.**
    - The sign-up form renders `signUpQuestions` from `getInfo` into an
      `answers` FormGroup, one control per question, switching on type. The two
      hard-coded blocks are gone. Validators follow visibility: a question
      hidden by an unmet `dependsOn` is not required, and answers to hidden
      questions are dropped before submit, so the client and
      `validateAnswers` agree on what counts.
    - Access mode is a `signup.access` settings node with an `invite-link`
      custom slot: the full copyable URL, and Rotate behind a confirm that
      says outstanding links stop working.
    - `?invite=` is read from the URL and sent as a query param on sign-up.

    **§11.9's Auth0 trap was real, and wider than invites.** `login()` records
    `appState.target` with the full path and query, but *nothing read it back*
    — there was no `appState$` subscriber anywhere, and `redirect_uri` is the
    origin. Every deep link was being dropped at login, not just invites.
    `AuthService` now navigates to `appState.target` on callback, which fixes
    invites and every other deep link with them.
10b. **done 2026-09-22**, in a maintenance window. `TeamEntity.coach` is gone
    from the schema; its data stays in the documents, so restoring the
    decorator restores the field.

    The order that made this safe: **populate `coaches` everywhere first, then
    delete the field's type from `PopulatedTeam`.** Dropping `coach:
    CoachDocument` from that type turned every remaining reader into a compile
    error — 28 of them — which is what converted the silent-denial risk into
    something the compiler finds. Without that step a missed populate would
    have produced a 403 with no exception and no log, and the
    `as unknown as PopulatedTeam` casts mean nothing else would have caught it.

    What moved:
    - `seatsOnTeam` lost its `coach` fallback and reads memberships only. All
      seven repository populates, five inline ones in `draft-engine`, and the
      nested matchup populate now fetch `coaches`.
    - Auth sites (`team-summary`, `draft.service`, `stage.service`) go through
      `canOnTeam`. `isCoach` now populates `coaches`, and a coach with `leftAt`
      no longer matches — covered by a new test.
    - `findByCoachId` used to query `{ coach: coachId }`. Under strict mode
      that would have silently stopped matching rather than erroring, so it now
      resolves through the membership's own `teamId`.
    - `deleteTeam` deletes every membership, not just one.
    - `pickLog.picker` uses the primary via a `pickerFor` helper that throws if
      a team somehow has no coach at all, rather than writing an invalid
      document. `draftPokemon` has no `sub` in scope, so resolving the true
      actor stays the §11.7 item.
    - `teamRepo.create` and `replaceCoach` stopped writing the field.

    The spec fixtures caught the regression exactly as intended: 9 suites went
    red the moment auth stopped reading `coach`, which is the failure that
    would otherwise have reached production as "coaches can't open their own
    team".

    **What they did not catch, and why.** Six `.populate("coach")` calls stayed
    in `TeamRepository` after the field was gone. `GET /leagues` 500'd with
    `StrictPopulateError: Cannot populate path 'coach'`. Two blind spots lined
    up:

    - **`.populate()` path names are strings Mongoose resolves at runtime.**
      `.populate<{ coach: CoachDocument }>("coach")` type-checks against
      whatever type argument you hand it, not against the schema — so removing
      the field from `PopulatedTeam` did nothing to flag the calls.
    - **Every spec mocks `TeamRepository`**, so no test has ever executed a real
      populate. The whole repository query layer is untested by construction.

    Deleting a schema path therefore means grepping the populate strings, not
    trusting the compiler. The audit that matters:

    ```
    grep -rhoE '(populate[^)]*\(|path:)\s*"[a-zA-Z0-9._]+"' --include=*.ts src
    ```

    Valid paths after 10b: `aTeam._id`, `coaches`, `league`, `matchups`,
    `pickLog.picker`, `primaryCoach`, `side1.team`, `side2.team`,
    `teams.pickLog.picker`.
11. **Much later, on its own.** `$unset` the now-unused `coach` field from
    `leagueteams`. See below — this is the only irreversible act in the
    migration and there is no schedule pressure to perform it.

Every existing team has exactly one coach whose `teamId` already points back
correctly, so steps 1-2 were pure backfill with no ambiguity — confirmed against
production, not assumed.

**There is no staging database.** `src/config.ts` takes only `MONGODB_USER` and
`MONGODB_PASS`; the cluster host and the `draftzone` database name are hardcoded
literals in every script and in the app. Every script here runs against
production, dry runs included — those are read-only against prod, not against a
copy. State the blast radius and the rollback command before running any of them.

**Nothing in steps 1-10b is irreversible.** What looked like a one-way door was
three separate acts written as one:

| Act | Reversible? |
| --- | --- |
| Drop `required`/`unique` and the `coach_1` index (step 5) | Yes — restore the decorators and `createIndex` |
| Remove the `@Prop` and its last readers (step 10b) | Yes — the data is still in the documents |
| `$unset` `coach` from 241 documents (step 11) | **No** |

There is no reason to do them together. After step 5 the field is dead weight
costing ~12 bytes per row that nothing reads, and keeping it means every step
from 5 to 10 can be rolled back by restoring the `@Prop`. Delete the data only
once 6-10 have been live long enough to trust — weeks, not days. Until then the
door swings both ways.

Steps 6-7 should land together: a cap that gates approval is meaningless until
approval is the thing that creates a team.

### 11.11 Open decisions

- **Can the current primary hand off to a co-coach, or is that TO-only?**
  TO-only is safer; self-serve is friendlier.
- **Can one person hold two memberships in the same tournament?** Probably not.
  Cheap to guard early, painful to untangle later.
- **Is the Discord role revoked on drop or denial?** Granting at approval fixes
  the entry side and leaves the exit side untouched.
- **Does Discord identity ever get verified?** `discordName` is a typed string
  and nothing checks that the applicant owns it. Moving the grant to approval
  limits who can exploit it but does not close it. The real fix is linking a
  Discord account to `UserEntity` via OAuth, which is its own project.

### 11.12 Decided

Recorded so they are not relitigated:

- **Renaming on replacement is unconditional**, mid-season or not (§11.4).
- **Denied and dropped applicants cannot re-apply.** This is deliberate
  anti-spam, and it is safe because it is not a dead end: the applicants panel
  already renders a status `<pdz-select>` over every status plus bulk actions,
  so a TO can move `denied` back to `pending` whenever they want. The applicant
  has no retry; the TO has full reversal.
- **Pool preference is a custom question**, not a schema field (§11.6).
- **Team name uniqueness is TO-enforced**, not validated. One interaction to
  watch: §11.4's automatic rename on replacement can create a duplicate with no
  TO action at all, so warn at the rename step rather than blocking it.
- **The cap gates approval, not submission** (§11.5).
- **Co-coaches are co-equal.** `CoachEntity.role` is an optional free-form
  display label ("Coach", "Co-Coach", "Manager") with no permission meaning; any
  active seat can draft, report and chat. Left free-form rather than an enum so
  a league can label seats however it likes without a schema change. Tiers stay
  addable later through the `can(seat, capability)` seam in §11.8 — which is why
  that indirection exists from day one rather than being retrofitted.
- **`pickLog.picker` already refs a `CoachEntity`**, so once memberships are
  real it records *which* coach made each pick, under any role model.
- **Invited coaches land `pending`. They are never auto-approved.** The invite
  controls who may *apply*; approval controls who gets a *spot*. Keeping them
  separate means `maxTeams` stays the single authority on roster size — an
  over-shared link can flood the pending queue, but it can never push a league
  past its own cap. It also keeps one uniform review flow in the applicants
  panel instead of two tracks, and it removes the main reason to build per-invite
  use limits, since the cap already does that job.

### 11.13 Independent fixes

Real, but they block nothing above and can land on their own schedule.

- **Pending and denied applicants are publicly readable.** `GET
  :tournamentSlug/teams` has no guard and `listTeams` applies no status filter —
  it returns `teamName`, `coachName`, `logo` and `status` for every applicant,
  including denied ones. Someone you turned down has their name and their
  rejection on a public endpoint. Filter to approved for anonymous callers.
  (`listTeamsByDraft` documents itself as "every approved team"; `listTeams`
  does not do it.)

  **Done 2026-09-23 (§13).** Step 6b fixed only `getCoaches`; `listTeams` still
  leaked, because the backfilled pre-application teams keep their old
  `pending`/`denied` statuses. It now returns `approved` and `dropped` teams to
  everyone.
- **`assignCoaches` fails silently.** Invalid ObjectId, missing coach, wrong
  tournament, unknown pool — every failure path is a bare `continue`. The call
  returns 200 having done nothing and the TO gets a success toast. Collect the
  failures and report them. Pairs with the existing trap that an absent
  `divisionKey` means `draftId: null`, so a partial payload silently unassigns.

  **Done 2026-09-23 (§13).**
- **`countByTournament` counts every status**, so the Discord "Total sign ups"
  number includes denied and dropped — and that is the figure TOs quote at each
  other.

  **Done 2026-09-23 (§13).** Step 6b had already switched the embed to
  counting applications, but only `pending` ones.
- **Orphaned logo uploads.** Logos go to S3 at submission; denied applicants
  leave the object behind permanently. Teams-at-approval makes the cleanup point
  explicit. *Still open.*
- **Validation is split and unbounded.** `experience` is `@IsString()` with no
  length limit while the Discord embed clamps it to 1024, so a 50KB string is
  accepted, stored, and silently truncated in one view. `droppedWhy` is
  validated in the DTO and again by a manual trim in the service. Add
  `@MaxLength` at the DTO and pick one layer.

  **Done 2026-09-23 (§13).** By then `experience` and `droppedWhy` had become
  question answers (step 9), so the gap had moved rather than closed: every
  built-in sign-up field and any question without its own `maxLength` were
  unbounded. Limits now live in `SIGN_UP_LIMITS` at the DTO layer.

### 11.14 Modelled but not built

Added 2026-09-23. The schema has supported these since step 10b, but no endpoint
or UI reaches them:

- **Adding a co-coach.** The only path that creates a second membership on an
  existing team is `replace-coach`, which also retires the outgoing one. There
  is no "add coach to team" endpoint.
- **A coach leaving a team that plays on.** `leftAt` is only ever set by
  `replace-coach`. There is no drop-one-coach action.
- **`setPrimaryCoach` and auto-promotion** (§11.4). Neither exists; nothing
  reassigns `primaryCoach` except `replace-coach`.
- **Who-acted for picks.** `pickLog.picker` still comes from `pickerFor(team)`,
  i.e. the primary (§11.7). Harmless while every team has one coach, wrong the
  day a co-coach picks.
- **`joinTeamId`** on applications is stored but nothing sets it.
- **Duplicate team-name warning on replacement** (§11.12) is not in the
  replace-coach dialog.

---

## 12. Creating leagues and tournaments — not started

There is still no create flow (see §7): `league-new/` was swept in step 7, and
the server has no create endpoint for a league or a tournament. Draft pools
*can* be created now (`POST …/drafts`, from the settings Draft section). Record
requirements here as they are decided, so the form ships with them.

### 12.1 Required: the owner's organizer name

Organizers are shown by a **per-tournament organizer name**, never by their
account `username`, which is a real name for roughly 65% of users (Google
logins). Names live in `HostedTournament.organizerNames` (`{ sub, name }[]`,
alongside the plain `organizers` array). Decided 2026-09-23. A site-wide display
name was considered and deferred.

Invitees pick theirs on the accept page and promoted coaches get their sign-up
name, but **the owner has no step that sets theirs**. Until they rename
themselves on `manage/organizers` they show as "Tournament owner", and that page
prompts them to set it.

The create-tournament form must:

- Include a **required** "Your organizer name" field, validated with the same
  rules as everywhere else: 3–24 characters, a letter or number at both ends, no
  control characters. The client check is `isValidOrganizerName` in
  `league.util.ts`; the server check is `OrganizerNameDto` in
  `hosted-tournament.dto.ts`. Reuse both; do not write a third copy.
- Write it to `organizerNames` for the owner's sub in the same request that
  creates the tournament. Do not leave it to a follow-up call.
- Prefill it from the owner's entry on the league's most recent tournament. The
  owner is the **league** owner (`HostedTournamentMapper` sets `owner:
  league.owner`), so it is the same person for every tournament in the league,
  and retyping the name each time is friction. It stays per-tournament: the
  prefill is a default, not a link.
- Creating a league creates no tournament, so it needs no name field. Ask when
  the first tournament is created.

---

## 13. Bug sweep — 2026-09-23

Found by re-auditing §6–§11 against the code, after steps 1–10b had landed.
Nothing below is committed yet.

### 13.1 The team cap counted every team

`assertRosterHasRoom` called `teamRepo.countByTournament`, which was a bare
`countDocuments({ tournamentId })`. Dropped teams counted against `maxTeams`,
and so did every pre-application team the backfill left behind with its old
`pending` or `denied` status. A tournament could refuse approval as
`TOURNAMENT_FULL` with real room left.

The method is now `countApprovedByTournament`. It was renamed rather than given
a status parameter, because its only job is the cap, and a bare count is exactly
the mistake it made.

The same fix exposed a second hole: `assignCoaches` could move a `dropped` team
back to `approved` with no cap check at all. It now counts the teams a batch
would reinstate and checks them against the cap in one go
(`assertRosterHasRoom(tournament, incoming)`). Teams that are already approved
are not counted, so moving an approved team between pools never trips the cap.

### 13.2 `listTeams` still leaked rejected applicants

See §11.13. The fix filters to `approved` and `dropped` for **every** caller,
not only anonymous ones. All three consumers (trade manager, stage builder,
trade-propose dialog) either filter to `approved` themselves or key off pool
membership, and none needs pending or denied teams. Organizers review
applicants on the applicants panel, which reads `getCoaches`.

Dropped teams stay in the response: they have played matches, and the
trade-propose dialog relies on their rosters to mark Pokémon as taken.

### 13.3 `assignCoaches` validates before it writes

It was worse than §11.13 described. On top of the silent `continue`s, an unknown
pool threw **after** the earlier assignments in the loop had already been
written, which left the tournament half-updated.

It now resolves every assignment first (`findTournamentTeamByCoachId`). Unknown
pools throw `DRAFT.NOT_IN_LEAGUE`, and unresolvable coach ids throw the new
`LEAGUE.ASSIGNMENT_COACHES_NOT_FOUND` (LR-016), whose `details.coachIds` names
them. It writes only once all of that has passed, so a bad batch changes
nothing.

### 13.4 The sign-up embed count

`countByStatus(id, "pending")` → `countByStatuses(id, ["pending",
"waitlisted", "approved"])`: everything except `denied`. Dropped teams still
count, because their applications stay `approved`; that is a known and minor
overcount.

### 13.5 Length limits

`SIGN_UP_LIMITS` in `hosted-tournament.dto.ts`:

| Field | Limit |
| --- | --- |
| name, discordName, teamName, timezone | 64 |
| gameName | 32 |
| logo key | 256 |
| experience (coach edit), replace reason | 500 |
| each answer value | 2000 |
| answers per sign-up, values per answer | 50 |

Applied to `SignUpDto`, `UpdateCoachDetailsDto`, `ReplaceCoachDto` and
`DecideApplicationDto`. A question's own `maxLength` is capped at 2000 too.
`validateAnswers` is unchanged: the per-value ceiling at the DTO is the one
layer, and the question's `maxLength` narrows it.

The client mirrors the limits in `SIGN_UP_LIMITS` in `league.util.ts` as native
`maxlength` attributes on the sign-up form, so the browser stops input at the
limit before the server ever returns a 400. The question editor has no
`maxLength` control, so it cannot author a value over the cap.

Risk to existing data is narrower than it first looked. Both team-edit paths
send `teamName` only when it changed, so a long existing team name never blocks
an edit. The coach-edit dialog does resend all four coach fields, so only an
existing coach display name over 64 characters could trip it; Showdown names,
Discord handles and IANA timezones are shorter than their limits by nature.
The §13.7 script's dry run reports any team or coach name over 64 characters.

### 13.6 Organizers never saw server error messages

`BusinessExceptionFilter` responds with `{ error: { code, message, details } }`,
so an `HttpErrorResponse` carries the message at `err.error.error.message`.
The settings store, applicants panel, invite-link slot, logo field and stage
builder all read `err.error.message`, which is always `undefined`, so every
refusal fell through to the generic fallback. `TOURNAMENT_FULL`,
`COACH_HAS_MATCHES` and the pool-delete refusals had never reached a TO. The
stage builder's bracket-validation `details.reasons` had the same wrong nesting.

The fix is `apiErrorMessage(err, fallback)` in `core/services/api.service.ts`,
now used at every league-zone site. The organizer pages from step 6
(`league-organizers`, `organizer-invite`) already read the right path.

The same fix then went into `tier-list-browse` (whose `details.reason` read had
the same wrong nesting), `tier-list-create`, `upload-image` and
`pokemon-search-core`. The debug calculator was left alone as a dev-only page.

### 13.7 Legacy teams and their applications disagree — script written, not yet run

The step-6a backfill gave every pre-existing team an application with
`resultingTeamId` set, and carried the team's status onto it. From then on, the
two records can each be changed without the other:

- `decideApplication` on an application that already has a team only moves the
  **application** status. Approving a legacy `pending` application leaves the
  team `pending`, so it never shows up in rosters or standings.
- `assignCoaches` on that team moves the **team** status and leaves the
  application where it was. `getCoaches` shows the application status (unless
  the team is `dropped`), so the panel keeps showing the row as pending.
- In the panel it is worse than either: any row with a team is routed to
  `assignCoaches` and offered only `approved`/`dropped`, so a legacy pending
  sign-up **cannot be denied at all**, and approving it leaves it in *Needs a
  decision* after a reload.

**Decided 2026-09-23: retire them.** A pending or denied team is exactly the
state §11.3 says should not exist, since teams are created at approval.
Removing those teams makes a legacy sign-up behave like any new one. The
alternative, syncing both records in code, would keep `pending`/`denied`
valid team statuses forever and block narrowing `TEAM_STATUSES`.

`scripts/reconcile-legacy-team-applications.ts` walks every application that
has a `resultingTeamId` and handles each (team status, application status)
pair:

| Team | Application | Action |
| --- | --- | --- |
| pending/denied | approved | **PROMOTE** — team → `approved` (the TO approved it through `decideApplication`) |
| approved/dropped | not approved | **SYNC** — application → `approved` (the TO approved it through the team path) |
| pending/denied | pending/denied/waitlisted | **RETIRE** — see below |

Retiring a team:

1. copies the team, its coach documents and the application into
   `legacyteamreconciliations`;
2. refreshes the application's name, Showdown name, Discord, timezone,
   preferred team name and logo from the coach and team, since panel edits
   only ever wrote those;
3. unsets `resultingTeamId`/`resultingCoachId` on the application;
4. deletes the coach documents and the team.

The application keeps its own status, so a pending one lands in *Needs a
decision* and approving it creates a fresh team through the normal path (cap
included). A denied one lands in *Not participating*.

A team is **skipped and reported** rather than retired if it has picks, if more
than one application points at it, if any matchup, stage (seeds, legacy
pools, legacy trades), tournament trade, chat message or draft `teamOrder`
references it, or if its coach appears in another team's pick log. The dry
run also reports pending/denied teams with no application at all, and any team
or coach name over 64 characters (§13.5).

Every write is backed up first. Status changes record `from`/`to`; rollback
restores them only where the current value still equals `to`, and restores a
retired team only if its application has not since been linked to a new team.
Anything else is reported as a conflict and left alone.

```
npx ts-node scripts/reconcile-legacy-team-applications.ts                       # dry run
npx ts-node scripts/reconcile-legacy-team-applications.ts --apply               # write
npx ts-node scripts/reconcile-legacy-team-applications.ts --rollback            # rollback dry run
npx ts-node scripts/reconcile-legacy-team-applications.ts --rollback --apply    # rollback
```

Typechecked against the project's compiler flags. It has not been run, even as
a dry run.

Two code changes stop the drift from coming back:

- `decideApplication` refuses anything but `approved` for an application that
  already has a team (`LEAGUE.APPLICATION_HAS_TEAM`, LR-017). Once a team
  exists, leaving means dropping the team.
- `getCoaches` shows the **coach** document's name, Showdown name, Discord and
  timezone when there is one, and looks up Discord membership by that name.
  This was a live bug for every sign-up, not only legacy ones: coach edits in
  the panel write the coach document, the panel read the application, so every
  edit reverted on reload, and a corrected Discord typo still showed "not in
  server". `getCoaches` has no spec harness (it needs tier-list roster
  validation mocked), so this change is untested.

### 13.8 Cleanup — 2026-09-23

Removed, all verified to have no callers anywhere including specs:

- `LeagueManageService`: `setPick`, `generateBracket`, `updateBracket`,
  `deleteBracket`. The stage-scoped bracket endpoints on the server now have no
  client caller at all. They stay, per §6 ("intentional legacy").
- `LeagueZoneService`: `getPicks`, `setPicks`, `removeDraftPokemon`,
  `getTeamDetail`, `getDraftOrder`, `getDiscordJoinedStatus`,
  `getStageBracket`, plus three commented-out tier-list methods.
- `getTeamDetail` returned random mock data, and with it went `league-ghost.ts`
  (mock teams) and `getRandomPokemon` in `namedex.ts`.
- `getStageBracket` was the only consumer of `league-bracket/bracket-mapping.ts`,
  so that module and its spec are deleted too. The service's re-export of its
  types had no importers.

Deliberately **not** done yet:

- **Narrowing `TEAM_STATUSES` to `approved | dropped`.** It becomes possible
  once the §13.7 script has run, but has to wait for the dry-run output: every
  team the script *skips* keeps a `pending`/`denied` status, and a narrowed
  enum would make any `save()` on such a document fail validation. Deploy order
  matters too: the script must run before any narrowed build ships.
  `teamRepo.create`'s `"pending"` default goes in the same change.
- **Step 11, `$unset` of `leagueteams.coach`.** Step 10b landed 2026-09-22;
  §11.10 asks for weeks of it running live first, and this is the one
  irreversible act in the migration.

### Verification

- Server: `tsc --noEmit` clean. Tournament, team and application suites pass
  248/249, including 7 new tests (6 `assignCoaches`, 1 `listTeams`), plus an
  assertion on the embed count. The one failure is
  `external-tournament.controller.spec`, which none of this touches.
- Client: `ng build --configuration development` clean. `league-zone` and
  `core/services` pass 162/162; `power-rankings` is the documented baseline.
- After §13.7–13.8: server `tsc --noEmit` clean, hosted-tournament suites
  94/94 (one new test for LR-017). Client build clean; `league-zone`,
  `tier-lists` and `shared/data` pass 199/199, with `power-rankings` still the
  only failing suite.

---

## 14. Security, data integrity and structure review — 2026-09-23

A read-only review of everything hosted tournaments touch on the server:
tournament, stage, bracket, matchup, trade, draft, chat, team, coach,
application, upload and Discord. Nothing was run against a live server. Every
finding comes from reading the code, and the one marked *plausible* needs a
concurrency test before it is fixed.

The data here is handles and team names, not PII, so the threat model is
different: **the integrity of the competition** (who drafts, who reports, what
a roster is) and **not letting the shared Discord bot be used against other
communities**.

Paths below are in `pokemon-draftzone-server/src/modules/` unless stated.

### Tracker

| ID | Item | Priority | Status |
| --- | --- | --- | --- |
| S1 | Anyone can join any team as a coach | **P0** | open |
| S2 | Generic `/teams` and `/coaches` routes bypass the tournament | **P0** | open |
| S3 | Discord settings drive the shared bot in other servers | **P0** | open |
| S4 | Legacy stage-scoped writes aren't tied to the URL's tournament | **P0** | open |
| S5 | Replaced and dropped coaches keep chat access | **P0** | open |
| D1 | Multi-document writes without transactions | P1 | open |
| D2 | Trades: lost updates and check-then-act | P1 | open |
| D3 | Trades and name changes reference rounds by index | P1 | open |
| D4 | Races on sign-up uniqueness and the team cap | P1 | open |
| D5 | Settings validated against the patch, not the result | P1 | open |
| D6 | Matchup result fields can contradict each other | P1 | open |
| D7 | Draft pick checks read pre-transaction state | P1 | plausible |
| H1 | "Coach only" draft visibility is client-side only | P1 | needs a decision |
| H2 | The draft websocket is unauthenticated | P1 | open |
| H3 | Match result payloads are barely validated | P1 | open |
| H4 | Uploads: no size cap, keys not bound to uploader | P2 | open |
| H5 | Archived tournaments still accept writes | P2 | open |
| H6 | Cross-tournament references in reads and trades | P2 | open |
| H7 | Small hardening items | P3 | open |
| A1–A7 | Structure that limits future work | P2 | open |
| §14.5 | Smaller smells | P3 | open |

### 14.1 P0 — exploitable now

**S1. Anyone can join any team as a coach.**
`POST /coaches` (`coach/coach.controller.ts:28` → `coach/coach.service.ts:23`)
has no authorization check. It creates a `CoachEntity` with the caller's `sub`
on whatever `teamId` the body names. Every team permission comes from the
team's `coaches` virtual, meaning every coach record whose `teamId` matches.
`can()` in `tournament/membership.ts:15` returns `seat.active` for every
capability. Team ObjectIds are public: `GET …/tournaments/:slug/teams` needs no
session and returns `id`.

One request therefore makes any signed-in user an active co-coach of any team,
who can then:

- draft for it and edit its pick queue (`isCoach` → `canOnTeam(…, "draft")`),
- submit its match reports and set match times,
- file and withdraw its trades,
- post as the team in chat,
- rename it (`PATCH /teams/:id`),
- delete it and all its coaches (`DELETE /teams/:id`).

Fix: delete the route. Memberships are only created by `decideApplication` and
`replaceCoach`. §11.14's "add a co-coach" becomes an organizer action on the
tournament controller when it is built.

**S2. Generic `/teams` and `/coaches` routes bypass the tournament.**
The client calls only `PATCH /teams/:id` and `PATCH /coaches/:id`. The rest:

- `POST /teams` (`team/team.controller.ts:41`) creates a team in whatever
  `tournamentId` the body names. The only check is whether the caller owns the
  *coach*. It skips sign-up access, the deadline, `maxTeams` and approval.
- `DELETE /teams/:id` (`:81`) lets any active coach hard-delete their own team
  and its coaches. Unlike `removeParticipant`, it doesn't check for played
  matches, so mid-season it orphans matchups and trades.
- `DELETE /coaches/:id` is harmless today only because every coach has a
  `teamId`, which `deleteCoach` refuses.
- `GET /teams/:id`, `GET /teams?coachId=` and `GET /coaches/:id` return whole
  documents to any signed-in user: Auth0 subs, Discord and in-game names,
  experience, drop reasons. `getTeam` deliberately shows those only to the
  team's own coach.

Fix: delete all of them. The coach edit already exists as
`PATCH …/tournaments/:slug/coaches/:coachId`. Team name and logo move to a
tournament-scoped team route (see A6). Then delete both controllers.

**S3. Discord settings drive the shared bot in other servers.**
`discordSettings.guildId`, `coachRoleId` and `signUpChannelId` (set in
`updateSettings`, `hosted-tournament.service.ts:1498`) and a draft pool's
`channelId` are free text. Any organizer of any tournament can set them.
`DiscordService.grantRole` (`discord/discord.service.ts:109`) and `sendMessage`
(`:166`) act on whatever guild, role or channel they're given, as long as the
bot is in that server. An organizer can:

- point `guildId` and `coachRoleId` at another community's server and a role
  there, then approve an application carrying their own Discord name there. The
  bot grants them the role, limited only by the bot's own position in that
  server's role list.
- point `signUpChannelId` or a draft `channelId` at any channel the bot can
  post to, then use `settings/test-message` to post there on demand.

Nothing checks that the organizer controls that server.

Fix: bind a server to a tournament from inside Discord. A server admin runs a
bot slash command (e.g. `/draftzone link <code>`) that Discord only lets
Manage Server holders use, and that link is what stores `guildId`. On every
settings save, check:

- the channel belongs to the linked server;
- the role belongs to it, isn't managed, and carries no elevated permission
  (Administrator, Manage Server, Manage Roles, Manage Channels, Kick, Ban);
- the role sits below the bot's own role.

Interim, before linking exists: run those role and channel checks against
`guildId`, and gate `guildId` changes behind a site-admin allowlist.

**S4. Legacy stage-scoped writes aren't tied to the URL's tournament.**
Four methods authorize the caller as an organizer of the URL's tournament, then
load the stage by global slug without checking `stage.tournamentId`. The other
stage writes do check. The four:

- `setPools` (`stage/stage.service.ts:302`)
- `advanceCurrentRound` (`:350`)
- the stage-scoped `createTrade` (`:1558`)
- `setTradeStatus` (`:1720`)

The `assertStageOwnsItsSchedule` guard looks at the URL's tournament. A
tournament with no rounds yet counts as "legacy", so an organizer of any
not-yet-built tournament gets past it. Stage slugs are public through
`GET …/stages`.

The sharpest case is `setPools` on another tournament's stage that has no
`teamIds` yet. It writes `pools`, which `stageTeamIds()` falls back to, so an
outsider can inject teams into that stage's seeding.

The client no longer calls any stage-scoped route except `GET …/stages` (§13.8).
Fix: delete every `StageController` route except `GET /`. This reverses §6's
"intentional legacy" call on security grounds. It also removes
`DELETE …/stages/:slug/bracket`, which deletes matchups with recorded results;
the tournament-level bracket refuses to do that.

**S5. Replaced and dropped coaches keep chat access.**
`ChatService.findViewerTeam` (`chat/chat.service.ts:211`) takes any coach record
for the caller. It has no `isActiveCoach` filter and no team-status filter. So
a coach retired by `replaceCoach` (`leftAt` set), or one on a dropped or denied
team, still reads and posts in the tournament channel and their old team's
matchup rooms. Their messages are labelled with the *current* primary coach's
name (`authorName: team.primaryCoach.name`), so a co-coach is also mislabelled.

Fix:

- filter to active coaches on approved teams;
- take `authorName` from the caller's own coach record.

`getInfo`'s `canSeeAllDrafts` goes through `findSignupForTournament`, which
filters active coaches but not team status, so a denied legacy team's coach can
see private pools.

### 14.2 P1 — data integrity

**D1. Multi-document writes without transactions.**
Each of these writes several documents with nothing tying the writes together:

- `decideApplication`: team → coach → application
- `replaceCoach`: four writes
- `removeParticipant`
- `deletePool`: a per-team loop, then the delete
- `TournamentBracketService.updateBracket`: stages, schedule, matchups,
  advancement

The draft engine already uses transactions (`draft/draft-engine.service.ts:335`),
so the cluster supports them.

One of these already produces a stuck state without any crash:
`removeParticipant` deletes the team and coach but never touches the
application. That stays `approved`, with `resultingTeamId` pointing at nothing.

- The person can't re-apply: `findBlockingApplication` matches any status.
- The organizer can't deny them: `APPLICATION_HAS_TEAM`.
- Re-approving skips team creation, because `resultingTeamId` is set.

Fix: add a small `withTransaction(fn)` helper and pass `session` through the
repository methods. In the same transaction, have `removeParticipant` move the
application to a terminal status. A `diagnose-` script should list
applications whose `resultingTeamId` no longer exists.

**D2. Trades: lost updates and check-then-act.**
`createTrade`, `updateTrade` and `withdrawTrade`
(`stage/tournament-trade.service.ts:247, 319, 355`) read `tournament.trades`,
change the array in memory, and `$set` the whole array back. So:

- two coaches filing at once lose one of the trades;
- an approval racing a filing loses one of them;
- the trade-point limit and roster checks run on the stale array, so two
  concurrent approvals can together exceed the limit or trade the same Pokémon
  twice.

Fix: move trades to their own collection. They have their own lifecycle and
make the tournament document grow without limit. Short of that:

- `$push` to create;
- a positional update with `"trades.status": "PENDING"` in the filter to
  approve or withdraw;
- a version in the filter, so validation and the write see the same state.

**D3. Trades and name changes reference rounds by index.**
Matchups point at a round's `_id`. `TournamentTradeEntity.activeRound`
(`tournament/…/hosted-tournament.schema.ts:126`) and `nameHistory.round` store
its position instead. `TournamentBracketService.updateBracket` already re-finds
the current round by id, because edits shift positions, but it doesn't re-map
trades.

Insert a round ahead of an existing one, and every trade from that point on
takes effect one round earlier than it did. Past rosters, the trade-deadline
checks and the roster shown on each matchup all change after the fact.

Fix: store `activeRoundId` (and `roundId` on name changes). Add a backfill
script from index to id, with a rollback. Resolve the id to an index only when
reading.

**D4. Races on sign-up uniqueness and the team cap.**

- The applications index on `(tournamentId, auth0Id)` isn't unique
  (`tournament-application/tournament-application.schema.ts:125`). A
  double-submitted sign-up passes `findBlockingApplication` twice and is stored
  twice.
- `assertRosterHasRoom` counts approved teams, then creates one. Two
  simultaneous approvals can exceed `maxTeams`.

Fix: make the index unique. §11.12 already allows one application per person
per tournament, since denied applicants can't re-apply. Run a `diagnose-`
script for existing duplicates first, and map E11000 to `ALREADY_SIGNED_UP`.
For the cap, keep an `approvedTeamCount` on the tournament and `$inc` it with
`{ approvedTeamCount: { $lt: maxTeams } }` in the filter, inside the D1
transaction.

**D5. Settings validated against the patch, not the result.**
`updateSettings` (`hosted-tournament.service.ts:1407`) validates
`tierRequirements` only when the request includes them.

- Switching `tierListId` alone keeps requirements that point at the old list's
  tiers.
- Lowering `draftCount.max` alone skips the "required picks exceed roster size"
  check.

Fix: merge the patch into the current settings, validate the result, then write
it. Make the validation a method on the `HostedTournament` domain object so the
create flow (§12) reuses it.

**D6. Matchup result fields can contradict each other.**
`results`, `side1/2.score`, `winner`, `forfeit` and `status` are stored
separately and set from separate inputs.

- `updateMatchup` (`stage/stage.service.ts:1759`) never clears `forfeit`.
  Correcting `side1ffw` to `side1` leaves `forfeit: true`, and standings keep
  applying the forfeit differential.
- In `updateMatchup`, score, winner and the game list are independent, so a
  2–0 with `winner: side2` is accepted. Advancement only re-runs when the
  payload includes `winner`.
- A coach can re-report an already approved match: `submitMatchupReport` sets
  `status = "pending"` (`:1260`) over the approved results. Rejecting that
  report then sets `status` to `undefined`, and the approved results stay.
- `reviewMatchupReport` keeps the old `winner` when the report has none.

Fix:

- One function derives `score` and `winner` from `results` unless an explicit
  forfeit is given, and all three write paths use it.
- A coach report on an approved match is refused, or stored as a dispute
  without touching `status`.
- `status` becomes an explicit enum that includes `unplayed`.

**D7. Draft pick checks read pre-transaction state** *(plausible — needs a
concurrency test)*. `draftPokemon` (`draft/draft-engine.service.ts:325`)
starts its transaction after `loadContext` has already read the draft and every
team. `canTeamDraft` and `canBeDraftedWithReason` (`:365`) then check that
snapshot.

In sequential drafts, the `counter` write makes two overlapping picks conflict,
which covers the common case. It doesn't cover:

- non-sequential drafts, where two teams can take the same Pokémon;
- the timer's auto-pick racing a manual pick;
- a request that reads before another pick commits and writes after it.

Fix: turn on `optimisticConcurrency: true` for the Team and Draft schemas, so a
stale `save()` fails with `VersionError`; retry once. Make "already taken" a
database-level guarantee: inside the transaction, `$addToSet` the Pokémon onto
a `taken` list on the draft with `taken: { $ne: id }` in the filter.

### 14.3 Security hardening

**H1. "Coach only" draft visibility is client-side only.**
The draft settings label `visibility: "SELF"` as "Coach only", but only the
client acts on it, by disabling the team switcher. `getDraftDetails` and
`getTeams` still return every team's drafted Pokémon to every viewer. The
websocket also broadcasts each pick with the picking team's full roster.
Decide what "Coach only" is meant to hide. If it's other teams' picks, the
server has to filter them and the socket must not broadcast them.

**H2. The draft websocket is unauthenticated.**
`DraftGateway` (`draft/draft.gateway.ts:64`) joins any socket to any room name
the client sends. Rooms are tournament slugs, which are public, and events
carry `draftSlug`. For a draft with `public: false`, the slug is the only
protection: the HTTP routes check nothing else. Subscribing to a tournament
therefore leaks every private draft's slug and its live picks.

Fix:

- check the JWT during the socket handshake;
- on `league.subscribe`, check the viewer may see that tournament;
- key rooms by draft and authorize per draft, or keep private drafts' events
  away from viewers who aren't organizers or coaches in that draft;
- reject room names that aren't slugs.

**H3. Match result payloads are barely validated.**
`MatchTeamResultDto.pokemon` (`stage/stage.dto.ts:32`) is only checked with
`@IsObject()`.

- Per-Pokémon `status` and `kills` aren't validated. A bad value reaches
  Mongoose and becomes a 500.
- Keys aren't checked against either roster, so a coach can credit kills to
  Pokémon not on the team. Those feed the Pokémon standings.
- `matches` and the map have no size limit.
- `link` isn't checked to be a replay URL.

Fix:

- nested DTOs with `@IsIn` and `@IsInt @Min(0)`;
- `@ArrayMaxSize` on `matches`;
- `@IsUrl({ protocols: ["https"] })` on `link`;
- a service check that every key is on that side's roster at the matchup's
  round.

**H4. Uploads.**

- Presigned PUTs have no size limit; `core/storage/s3.service.ts` admits this
  in a comment. Switch to a presigned POST with `content-length-range`.
- Logo keys accepted by sign-up, `setCoachLogo` and settings are only checked
  for existence. Bind them to the uploader and folder through
  `FileUploadEntity.uploadedBy` and `uploadType`.
- Call `confirmUpload`. Orphan cleanup is switched off in
  `agenda/agenda.service.ts` because nothing confirms uploads.

**H5. Archived tournaments still accept writes.**
`archived` only hides a tournament from `findByParticipant`. Sign-ups, reports,
trades, draft picks and chat all keep working. Enforce it in the A1 guard.

**H6. Cross-tournament references in reads and trades.**

- `getTeam` loads the team by global slug (`hosted-tournament.service.ts:135`)
  and renders it against the URL tournament's tier list and stages.
- `resolveStage` does the same with stage slugs.
- Trade sides accept any team ObjectId, so a coach can file a trade with a team
  from another tournament and it reaches the organizer as pending.
- `decideApplication` and `replaceCoach` answer a foreign application or team
  with FORBIDDEN, which confirms it exists elsewhere. They should return
  NOT_FOUND.

Fixed properly by A2.

**H7. Small items.**

- `WebhookGuard` compares the secret with `!==`. Use `crypto.timingSafeEqual`.
- The Auth0 audience is still the Management API, deferred 2026-08-06.
- Sign-up, chat post and match report share the global 300/min per-IP limit.
  Give them a tighter per-user limit.
- Outside hosted tournaments, noted for completeness: the ad-review Discord
  buttons don't check who clicked, and rely on the review channel's
  permissions.

### 14.4 P2 — structure that limits future work

**A1. Permission checks are written in eight places.**
There's a private `isOrganizer` in the stage, bracket, schedule, trade, draft
and chat services, plus `HostedTournament.isOrganizer` and
`isOrganizerOrOwner`. Every method reloads the tournament and checks inline.
`tournament/tournament-access.ts` gets its models from global `mongoose.model()`
lookups, bypassing dependency injection. Owners exist only at the league level.
Organizers are a list of subs with a separate parallel list of names, which
takes two writes to rename one. Roles are strings.

Adding a scorekeeper role, or staff shared across a league's seasons, would mean
editing every service. Fix: one guard that loads the tournament and the caller's
roles once per request, one policy function (`can(actor, action)`), and
organizers stored as `{ sub, name, role }[]`. The guard is also the natural home
for H5 and H6.

**A2. Lookups aren't scoped to the tournament in the URL.**
Teams, stages and matchups are loaded by global slug or id. Matchups don't
store a tournament id, so every access check goes through the stage first; a
comment in `setMatchupAdvancement` says so. Repository methods should take the
tournament id (`findBySlugInTournament`), and matchups should store
`tournamentId`.

**A3. Old and new data shapes are both still supported.**
The sections-to-stages migration sits in `scripts/complete`, but all of this is
still live:

- the helpers in `stage/domain/stage-axis.ts` that pick between the two shapes;
- the deprecated stage fields;
- `getTeam`'s branch for unmigrated tournaments;
- the stage-scoped trade implementation in `StageService`;
- every stage-scoped controller route (see S4).

Run `verify-sections-to-stages.ts` against prod, then delete the old path. Keep
the rollback script, and keep the deprecated fields only until the rollback
window closes.

**A4. Every request loads the entire tournament.**
`findBySlug` runs a league query, the tournament query, one query per stage
(`resolveStages` doesn't batch them) and a tier-list query, even for
`getRules`. There are two loaders (`tournamentRepo.findBySlug` and
`draftRepo.findTournament`), and `getCoaches` builds the with-tier-list object
by hand. The domain object holds raw `StageDocument`s. Trades are stored inside
the tournament document, so it grows with every trade (see D2).

**A5. Side effects run inside the request.**
`getCoaches` calls Discord `findMember` once per applicant on every panel load.
Sign-up notifications and role grants are awaited inside the request.
`EventEmitter2` is already set up. Emitting events such as
`application.approved` makes role removal on drop (§11.11), email and an audit
log straightforward to add, and moves Discord's latency and rate limits off the
request path.

**A6. Team data is edited through coach ids.**

- `PATCH …/coaches/:coachId` renames the team, and `…/logo` sets the team logo.
- `assignCoaches` moves teams by coach id.
- There are three ways to rename a team.

With several coaches per team, which coach's id to use is arbitrary. Match
reports record `primaryCoach.name` as the submitter even when a co-coach
submitted (`stage/stage.service.ts:1249`), and so does chat (S5). That's the
same problem as §11.14's `pickLog.picker`. Fix: tournament-scoped team routes
keyed by team slug, and the acting coach recorded from the caller's own seat.

**A7. Scoring rules are hardcoded.**

- Standings always sort wins, then game difference, then Pokémon difference,
  ignoring the tournament's `diffMode` setting (`stage/domain/standings.ts:462`).
- `calculateTeamScore` works out `diffMode` from whether a matchup has more
  than one game (`:491`), not from the setting.
- Draws are never counted.
- There's no head-to-head tiebreaker, and no strength of schedule for Swiss.

Fix: an ordered tiebreaker list on the tournament or stage, and one scoring
module that uses it.

### 14.5 P3 — smaller smells

- **Response shapes:** built inline with `unknown[]` types, and the roster-row
  mapping is copied four times in `hosted-tournament.service.ts`. Success
  responses are sometimes `{ message }` and sometimes `{ success: true }`.
  Response DTOs would have caught §8's standings mismatch.
- **Swallowed errors:** there are 13 `.catch(() => null)` calls on `findById`,
  which turn database failures into 404s. Give `CoachRepository` a
  `findByIdOrNull`.
- **Error codes:** tournament errors live under `LEAGUE`, including "Division
  not found in this league" for a draft pool; `TOURNAMENT` has two leaves.
- **Module wiring:** `HostedTournamentCoreModule` imports the full
  `StageModule`, `TeamModule` and `CoachModule` and registers the tier-list
  schema itself. That breaks the server CLAUDE.md rule that a core module is
  schema + repository only.
- **Naming:** division, draft and pool all mean the same thing, and
  `divisionKey` is a draft slug.
- **Rules endpoint:** `POST …/rules` replaces the whole list, so it should be
  `PUT`. `updateRules` filters by tournament slug alone.

### 14.6 Checked and sound

Recorded so these aren't re-audited:

- **Global setup:** helmet, `ValidationPipe({ whitelist: true })`, RS256 JWT
  with issuer and audience checks, a global throttle, and Express 5's simple
  query parser, which rules out `?x[$ne]=` operator injection. Slug lookups use
  `$eq`, and the error filter returns no stack traces.
- **Organizer invites:** hashed tokens, a TTL, an atomic `claim` with `release`
  on failure, and a revoke scoped to the tournament. This is the pattern for
  any future token.
- **Tournament-level matchup routes** (`resolveMatchup`, `updateMatchup`,
  `setMatchupAdvancement`) check `stage.tournamentId` against the URL. Hidden
  stages return 404, not 403.
- **Draft routes:** the draft is scoped to the tournament (`findDraft`) and the
  team to the draft (`findTeamInDraftOrThrow`). Pick queues are returned only
  to the team's own coaches.
- **Tournament-level `updateBracket`** refuses to delete played matchups or
  orphan stages, and resolves seeding before it writes anything.
- **Sign-up token:** stored in plain text on purpose, because organizers need to
  see and re-share the link. Only `getSettings` returns it.
- **Chat deletion** is scoped to the tournament, and limited to the author or an
  organizer.

### 14.7 Order

1. **S1, S2, S4:** route deletions only, one change, no migration. **S5:** a
   filter and a name source.
2. **S3:** the interim role and channel checks plus the admin allowlist now;
   server linking after.
3. **D1** (the helper, plus the `removeParticipant` fix and its diagnose
   script), **D2**, then **D4** (diagnose duplicates, then the index), then
   **D3** (backfill script plus rollback). Per the migration conventions, the
   scripts are written and reviewed, and the user runs them.
4. **A1**, which absorbs H5 and H6, then **A2**.
5. **D5–D7**, **H1–H4**, then the rest of §14.4–14.5.
