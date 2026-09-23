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
| 9 | Participation model, sign-up flexibility, invite-only sign-ups — see §11 | **planned** |
| 10 | Create leagues and tournaments through the product — see §12 | **not started** |

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
| `DELETE /…/trades/:tradeId` | no client call — trades can't be cancelled |
| `DELETE /…/chat/messages/:messageId` | no chat moderation |
| ~~`round.tradeDeadline`~~ | **done in step 8** — editor in the stage builder, and now enforced |
| ~~`round.bestOf`~~ | **done in step 8** — editor in the stage builder |
| chat channels `tournament`, `spectator`, `draft` | full policy in `chat.policy.ts`, only `matchup` has UI |
| ~~`organizers[]`~~ | **done in step 6** — endpoints + `manage/organizers` page |
| `POST /…/stages`, `/stages/:slug/pools`, `/stages/:slug/current-round`, `GET /stages/:slug/schedule`, stage-scoped trades | intentional legacy, unreferenced |
| `createBracket` / `updateBracket` / `deleteBracket` (stage-scoped) | in `league-manage.service.ts`, zero callers |

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
- **No capacity / max teams / waitlist**, and no open-close toggle independent of
  `signUpDeadline`.
- **No deadline reminders.** `agenda.service.ts` only defines draft pick-skip
  jobs. `matchDeadline` and `tradeDeadline` fire nothing. Separately,
  `cleanup-file-uploads` is defined but its `agenda.every(…)` is commented out —
  uploads are never GC'd.
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

## 11. Participation model and invite-only sign-ups — planned

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
intent: "team" | "sub" | "either",
status: "pending" | "waitlisted" | "approved" | "denied" | "withdrawn",
answers: { questionId: string; value: string | string[] }[],
joinTeamId?: Types.ObjectId
```

`joinTeamId` is set when applying as a sub to a specific existing team.

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
- `either` — the TO picks which of the two at approval time.

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
`approved` ones with `intent` of `sub` or `either`. This is what makes that flow
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
     Its duplicate guard is now `findBlockingApplication`, which ignores
     `withdrawn` so a withdrawal can be re-submitted while a denial still
     cannot (§11.12).
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
10. Add `signUpAccess` / `signUpToken`, the invite gate, **and `signUpDeadline`
    enforcement** — one guard, built once.
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
- **`assignCoaches` fails silently.** Invalid ObjectId, missing coach, wrong
  tournament, unknown pool — every failure path is a bare `continue`. The call
  returns 200 having done nothing and the TO gets a success toast. Collect the
  failures and report them. Pairs with the existing trap that an absent
  `divisionKey` means `draftId: null`, so a partial payload silently unassigns.
- **`countByTournament` counts every status**, so the Discord "Total sign ups"
  number includes denied and dropped — and that is the figure TOs quote at each
  other.
- **Orphaned logo uploads.** Logos go to S3 at submission; denied applicants
  leave the object behind permanently. Teams-at-approval makes the cleanup point
  explicit.
- **Validation is split and unbounded.** `experience` is `@IsString()` with no
  length limit while the Discord embed clamps it to 1024, so a 50KB string is
  accepted, stored, and silently truncated in one view. `droppedWhy` is
  validated in the DTO and again by a manual trim in the service. Add
  `@MaxLength` at the DTO and pick one layer.

---

## 12. Creating leagues and tournaments — not started

There is still no create flow (see §7): `league-new/` was swept in step 7, and
the server has no create endpoint for a league, a tournament or a draft. Record
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
