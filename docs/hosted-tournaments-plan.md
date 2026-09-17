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
- **Search by username** — `GET …/organizers/search?q=`. Deliberately scoped
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
