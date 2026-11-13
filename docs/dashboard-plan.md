# Dashboard Plan

Started 2026-11-12. `/leagues` was trying to be both "my leagues" and the public home of
leagues. This plan splits the two and replaces My Drafts, My Leagues and `drafts-v2` with one
personal dashboard.

## The Four Areas

| Area | URL | Who | Job |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | Signed in | What needs me, and where my things are |
| External tournaments | `/dashboard/external-tournaments/:team` | Signed in | A league played off-site: its draft page and sub-pages |
| Profile | `/profile` | Signed in (private first) | What I've done: career, Completed by year, achievements, team identities |
| League directory | `/leagues` | Everyone | Leagues hosted on DraftZone, with league pages beneath |

`/drafts` stays the live path and the navbar tab until cutover, then redirects and is deleted.

## Decisions (owner, 2026-11-12)

- The dashboard is a **launchpad**, not a list with a detail pane. Each team card carries its
  next action (Make Your Pick, Open Draft, Prep Matchup).
- The dashboard is **built fresh**: new page and feature-level parts, keeping the ideas from My
  Leagues and `drafts-v2` and the design-system primitives.
- **The client only displays.** Phase, record, rank, next match, order and Up Next items come
  from the server.
- The directory lists **hosted leagues only**, one card per league with its current tournament
  on the card (most leagues run one at a time). Off-site recruiting ads are not folded in and
  are planned to be retired.
- **Tools stay usable signed out** (planner, quick matchup, replay analyzer). An account is only
  needed to take part in something shared.
- **Planner plans get cloud saving** for signed-in users, with the browser copy kept as a
  fallback; the dashboard's Planner Plans section waits for that.
- `/` sends signed-in users to `/dashboard` at cutover, with a news strip there.
- **Standings get stored** when a score changes instead of computed per page load. Wanted, not
  urgent.

## Order

1. **Server** (done 11-12): `GET /dashboard`; `MySeasonsService` shared with `GET /leagues`, so
   the live My Drafts list is faster too; one phase rule (`seasonPhase`).
2. **Dashboard** (done 11-12, URL only): Up Next, Your Teams, Organizing, Leagues You Run, My
   Tier Lists.
3. **External tournament pages** at the new URL (done 11-12; the route moved, the pages are
   unchanged).
4. **Minimal profile** (done 11-13, `/profile`): career, achievements from completed hosted
   seasons, Completed by year. The dashboard links to it with the completed count. `drafts-v2`
   and the old My Leagues are deleted.
5. **Cutover** (not done, waiting on the owner's review): navbar tab, `/` redirect, `/drafts`
   redirects, delete legacy, point Find a League at `/leagues`.
6. **Planner cloud saving** (done 11-13) and the dashboard's Planner Plans section.
7. **`/leagues` directory** (done 11-13).

## How Planner Cloud Saving Works

Signed out, nothing changes: plans live in the browser. Signed in, each planner (the free one, and
one per tournament) is also saved to the account as a whole, with a revision number.

- A resolver on the planner routes reconciles before the planner opens (`PlannerSyncService`),
  so the planner still just reads browser storage. It gives up after four seconds and opens on
  the browser copy.
- First sign-in on a device uploads that browser's plans. A device with none takes the account's.
- If both have plans, both are kept. A plan with the same name but different contents is kept
  twice, the device's copy renamed "(This Device)". Nothing is discarded short of the nine-plan cap.
- Each autosave is sent with the revision it was based on. The server refuses a stale one; the
  client then merges as above, reloads the open planner and says so in a toast.
- A failed account save shows one toast per session; the browser copy is still saved.

## Still Open

- The directory is owner opt-in for now ("List in the League Directory" on Edit League, off by
  default). Automatic listing once a league has a public tournament is the alternative.
- Whether the profile ever becomes public (display names are the blocker).
- Achievements on the profile come from completed seasons only; in-progress ones are not counted.
- Whether one person can coach two teams in one tournament. The server now lists both either way.

## Server Follow-Ups

Done 11-13:

- **Stored ranks** (`SeasonRanksService`). Scores are saved from many places by editing a matchup
  and calling `save`, so there is no single write to hook. Each tournament's ranks are kept in
  memory with a fingerprint: per public stage, the matchup count and the latest `updatedAt`, plus
  the scoring rules and rounds. One cheap aggregate checks the fingerprint; ranks are recomputed
  only when it moves. It cannot go stale as long as matchup writes go through Mongoose (which
  stamps `updatedAt`, `bulkWrite` included). The store is per process and empties on restart.
- The dashboard's next match comes from the coach's own matchups, so a page load no longer reads
  every matchup in the league unless the ranks need recomputing.
- Roster formes come from a narrow tier-list query (`findRosterFormes`), not whole tier lists.
- The league page reads `phase` and `signUpOpen` from the server; its date-based `statusOf` is
  gone, so a tournament past its `seasonEnd` no longer shows as Completed on its own.
- The standings page loads its matchups once instead of once per stage plus once more.

Left, with the reason:

- **External tournaments still load every matchup** for the list and the profile. The score reads
  per-game stats, so a trimmed query gives wrong scores; a stored summary would need a hook on
  every score save. The cost is bounded by one person's own drafts. Measure before doing it.
- **The teams list, pool page and bracket** each load every matchup of one tournament once per
  view, with teams and coaches attached. That is one tournament's worth of work for a page about
  that whole tournament; nothing stood out as wasteful. The same fingerprint could store their
  tables if they prove slow.
- `findByRoundsInStage` and `findByParticipant` are no longer called outside tests.
- The ranks store is in memory, which is right for one server process. A second process would
  need it moved to the database.
