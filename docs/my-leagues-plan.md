# My Leagues Plan

Started 2026-10-11. My Drafts becomes **My Leagues**: one page for every league a player is
in, hosted on DraftZone or played elsewhere, holding the whole story of each season and not
just the next match. The visual direction comes from the Drafts Lab (`/debug/drafts-lab`,
concepts L1 Rows and L2 Matchday); the design rule it follows is D1 in
`docs/design-principles.md` §3 (an external draft looks like a hosted team).

**Status (2026-10-11): built, uncommitted.** My Leagues at `/drafts`, the new draft page,
Completed for hosted (owner and per-coach) and external, stored hosted outcomes, the rename,
and migration scripts (`pokemon-draftzone-server/scripts/migrate-archived-to-completed.ts` and
`rollback-completed-to-archived.ts`, dry run by default, `--apply` to write). Departures from
the steps below: the summary endpoint became richer existing lists (hosted `GET leagues`,
external `GET external/tournaments`, `GET archive/teams`), three calls in all; the legacy
`archives` documents are not migrated (half have no opponent rosters) and show under
Completed as they are. Still to do: Feed items for trade offers, unread chat and sign-up
deadlines (need per-user server data); outcomes for tournaments archived before the migration
(the owner reopens and completes them, or a backfill script). Legacy archives can't be
reopened; they only link to their old stats page.

**Archive is legacy; Completed replaces it** (owner, 2026-10-11). That covers the hosted
tournament's `archived` flag (the settings workbench's "Archive this tournament" toggle), the
external draft's Archive action (`archivedAt`), and the old `archives` collection.

---

## 1. What an Entry Should Say

An entry follows its league through the season. What it shows depends on where the season is:

| Phase | Hosted | External | What the entry shows |
| --- | --- | --- | --- |
| Signing up | From `signUpDeadline` | — | Sign-up status and when the draft starts |
| Drafting | From `draftStart`, live draft state | — | Pick progress; "You're on the Clock" when it's yours (a loud moment) |
| In season | From `seasonStart` | Until completed | Next match, form, record; hosted adds **current standing (3rd of 12)** |
| Playoffs | An elimination stage is live | — | Bracket round ("Semifinal vs Cinnabar Blaze"), alive or out |
| Completed | The tournament owner marks it **Completed** | The coach marks it **Completed** | Hosted: **final record, final placement, outcome**, season MVP, dates. External: **record** |
| Completed for you | The coach marks their own entry Completed | — | Whatever the entry has so far |

**When a hosted season is Completed** (owner, 2026-10-11): when the tournament owner marks it
Completed. `seasonEnd` passing does not move it, since seasons run late. A coach can also mark
their own entry Completed, for example when they dropped out or the owner never marks the
tournament; that changes only their own My Leagues, and they can undo it. For an external draft
the coach's Completed is the only one, so both kinds have the same action.

**External entries carry their record and nothing more** (owner, 2026-10-11). The record comes
from the scored matches. There is no placement, outcome, league size or playoff marking for
external leagues, and nothing asks the coach for them.

**The outcome** (hosted only) is one label per completed season: Champion, Runner-Up,
Semifinalist, Quarterfinalist, Made Playoffs, Missed Playoffs, or Regular Season (a league with
no playoffs), plus the placement ("2nd of 12"). Champion is a loud moment (§1 "final results
and champions"): a trophy and the secondary wash. Every other outcome stays calm.

**Highlights** on a completed hosted entry: season MVP (most KOs, as on the team page), point or
game diff, and the biggest win. They come from data hosted tournaments already have.

## 2. The Page

- **Career strip** under the title: leagues played, all-time record (both kinds), and titles
  and best finish (hosted only, since only hosted seasons have outcomes).
- **Up Next:** one feed of what needs the coach across every league, most urgent first:
  your pick (the one loud row, "You're on the Clock" with the time left), matches in the next
  three days, drafts starting within a week, trade offers, unread chat and organizer
  announcements, sign-up deadlines. Each row says what, where and when, with one action
  (Make Your Pick, Prep Matchup, Review Trade, Open Chat). It shows the first few and folds the
  rest. Lab: L3 (2026-10-11), owner liked it as the place for notifications.
- **Your Teams:** the two-tier roster cards for everything not completed (drafting, in season,
  upcoming), soonest match first. Each card shows its hosted standing beside the record, form, and
  one bottom line that follows the phase (picks progress, next opponent and countdown, or the
  draft countdown). No phase chip, since that line says it; only "Your Pick" overlays the
  banner while you are on the clock (2026-10-13).
- **Completed:** completed seasons of both kinds, newest first, grouped by year. Hosted entries
  show their outcome and final record; external ones show their record. Champions are easy to
  spot when scrolling.

Hosted and external entries look the same everywhere; only the link differs (league team page
or draft page).

## 3. Data: What Exists and What's Missing

| Field | Hosted | External | Legacy `archives` collection |
| --- | --- | --- | --- |
| Record, diff | In the list payload | In the list payload, from the scores | Stored |
| Phase and dates | On the tournament (`signUpDeadline`, `draftStart`, `seasonStart`, `seasonEnd`), not in the list | Active, or archived (`archivedAt`, legacy) | Always done |
| Next match, form | Schedule endpoint (one call per league today) | Matchups endpoint (one call per league today) | n/a |
| Current standing | Computed by standings, not in the list | Not wanted | Not wanted |
| Playoffs | Elimination stages exist | Not wanted | Not wanted |
| Final placement, outcome | **Missing:** derivable from standings and the elimination bracket, but nothing stores it (the reason the Hall of Fame is deferred) | Not wanted | Not wanted |
| Completed | **Missing.** Today's `archived` flag (legacy) makes the tournament read-only, and the coach list query (`archived: { $ne: true }`) drops it, so it vanishes from My Drafts | **Missing:** replaces `archivedAt` | Treated as completed |
| Completed for one coach | **Missing:** a per-coach flag on the coach seat | Same as Completed | n/a |
| Season MVP | Team endpoint has per-Pokémon records | Stats endpoint (shown on the draft page, not the entry) | n/a |

## 4. Steps

1. **One season summary from the server.** A single endpoint (for example `GET users/me/leagues`)
   returns every entry in one shape: kind, team, league, tournament, format, ruleset, phase,
   dates, record, form (last five), next match (round, opponent, time, link), completed, and
   for hosted entries standing, outcome and MVP. It replaces the two list calls and the lab's
   one-call-per-league fetches. Built first from the data that already exists; outcome comes
   back empty until step 2.
2. **Completed replaces archive.**
   - **Hosted:** the settings workbench's Archive toggle becomes **Mark Completed**
     (`completedAt` on the tournament). Marking it computes and **stores** each team's final
     placement and outcome on the team; unmarking clears them. This stored record is what the
     Hall of Fame and the league statistics (hosted-tournaments plan §15.4 step 5, "a champions
     list") are waiting for, so it unblocks both. Completed tournaments stay in the coach list,
     under Completed, instead of vanishing.
   - **External:** the draft's Archive action becomes **Mark Completed** (`completedAt`).
   - **Coaches** can mark their own hosted entry Completed and undo it, stored on their coach
     seat, so it touches no one else's view.
   - **Migration** (scripts the owner runs, reversible, with `--check`): `archived: true` →
     `completedAt`, external `archivedAt` → `completedAt`, and the legacy `archives` documents
     into completed external drafts (record and team). Then the `archived` field, the archive
     endpoints and the guard go.
3. **The page.** Build My Leagues from the lab concept the owner picks, with the phase sections
   and the career strip, on the summary endpoint.
   - **Up Next sources.** Picks, matches and draft starts come from the summary. Trade offers,
     unread chat and sign-up deadlines need the server to report them per user (today the only
     unread counts are news and league listings, and `LeagueNotificationService` is just
     toasts), so those join the feed in a later pass.
4. **The rename.** Navbar, page title, back links ("My Drafts" appears on the draft page and
   elsewhere), empty states and the homepage. The `/drafts` URL can stay.

Steps 1 and 3 can ship before 2; completed hosted seasons show their final record without an
outcome until then.

### Later: Importing Seasons That Ran Off-Site

PDBL S1 and S2 were run in spreadsheets before hosted tournaments existed. The database keeps
only their sign-ups (`pdbls`, 52 docs, S1, January 2025; `pdbl2`, 101 docs) and their tier
lists and bans (`src/core/data/pdbldetails s1.json`, `pdbldetails.json` on the server); no
rosters, matches or results. S3 Singles' playoffs also ran off-site, so its Playoffs stage has
its 24 teams and no matchups (found 2026-10-13 by `scripts/diagnose-completed-outcomes.ts` and
`diagnose-league-history.ts`).

The plan, when the owner gets to it: aggregate each season's data from the spreadsheets plus
what the database still holds, then convert it with one-off scripts into completed hosted
tournaments (teams, rosters, matchups, coach links to existing users where they can be
matched, stored outcomes). These are one-off conversions for DraftZone's own history, not an
import feature and not a normal practice. The usual script rules apply: dry run by default,
reversible, the owner runs them. Spreadsheets may link others through `IMPORTRANGE` (the S3
Speed division sheet pulls its all-division table from another workbook), so gather the
linked workbooks too.

## 5. Open Questions

- **Is a completed tournament read-only?** Today's `archived` blocks every write (the
  `AllowWhileArchived` guard). Recommended: Completed stays editable, so a late score correction
  still works and recomputes the outcomes; Completed is about where the season shows, not a
  lock.
- **Hosted placement with playoffs:** final placement from the bracket (champion is 1st even
  if they were 4th in the table), with the regular-season rank shown beside it? The podium has
  the same known limit today.
- **Legacy archives:** migrate them into completed external drafts (step 2), or leave them out
  of My Leagues?
- **Achievements overlap:** titles, best finish and the career strip sit close to the
  achievements idea, which was meant to be its own plan. Fold them in, or keep this page to
  plain records?
- **L1 or L2** as the base for the in-season list.
