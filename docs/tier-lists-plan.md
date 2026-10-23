# Tier Lists Plan

Started 2026-10-22. Tier lists become things people keep, share and reuse, not just the
inside of one tournament. Today a new tournament can only take a list from another tournament
in the same league at creation (`tierListFrom` in `tournament-creation.service.ts`), and the
settings page's Replace and Start from a Template buttons do nothing. This plan finishes the
standalone tier list area (`/tier-lists`), connects it to tournaments in both directions, and
adds the **tournament action log**, a record coaches can read to see what organizers changed.

**Status (2026-10-23): steps 1–9 built, uncommitted, in both repos.** Step 10 (more log events,
§8.4) is not started. `scripts/migrate-tier-list-tournament-copies.ts` (server) is written and
not run: the dry run lists what it would do, `--apply` writes, `--rollback --apply` reverses it
from the `tierlistcopymigrations` record. Until it runs, existing tournament lists are treated as
presets owned by whoever created them, so co-organizers still can't edit them (today's
behavior). `migrate-tier-names-to-ids.ts` is in `scripts/complete/`, so it has run. See §12 for
where the build differs from the plan below.

**Decided (owner, 2026-10-22):**

- A tournament's list can be **swapped after sign-ups open**. Once its draft starts, the swap
  sits behind the Draft Rules lock like any other draft setting.
- A **public list can be forked by anyone without asking**. The fork records where it came
  from (`copiedFrom`) and shows it, which is the credit and the record.
- A tournament's copy of a list is **edited by that tournament's organizers only**. A preset's
  collaborators get no access to copies made from it.
- The action log belongs in this plan, as its own section (§8), because a swap or a repricing is
  the change people will most want to check.

Earlier decisions this builds on (2026-09-18, memory `project_tier_list_standalone`):
**copy-on-attach**, so a tournament always owns a private copy and an upstream edit never
reprices a running draft; the **tier list owns costs and legality** (format, ruleset, tiers,
Pokémon, bans) and the **tournament owns roster rules** (draft count, point total, tier
requirements); **soft locks**, every lock can be unlocked through a confirm, and an unlock is
its own logged event; **globally unique slugs**.

---

## 1. What Exists

| Area | State |
| --- | --- |
| Routes | `/tier-lists` (browse, Browse/Mine segmented), `/tier-lists/new`, `/tier-lists/:slug`, `/tier-lists/:slug/edit` |
| Endpoints | `GET tier-lists` (name regex, format, ruleset, mine/public), `POST` create, `POST :slug/fork`, `GET :slug`, `PATCH :slug`, `DELETE :slug` (blocked while a tournament uses it), `GET/PATCH :slug/settings` (name, description) |
| Schema | `createdBy`, `collaborators`, `settings.isPublic`, `settings.shareToken`, `copiedFrom`, `forkCount`, tier `_id`s; indexes on public+format+ruleset, `createdBy`, `collaborators` |
| Import | CSV only, one tier per column, mapped in `ImportDialogComponent`; names matched by exact lowercase name; unmatched names dropped with a count in the toast (`tier-list-form.component.ts` `applyCsvImport`) |
| Export | CSV (`exportCsv()` in the form) |
| Tournaments | Creation copies a list from a tournament in the same league; the settings Tier List panel shows the list and its requirements; Replace and Start from a Template have no handlers |
| Format and ruleset | Already read through the list; `HostedTournament` no longer carries them |

Found while reading the code, fixed in step 1:

- **Private lists are readable by anyone with the slug.** `getTierList` checks permissions
  only for `edit=true`. Slugs are random, so this behaves as "unlisted", but a private list
  should 404 for strangers.
- **A tournament's copy belongs to the person who created the tournament**, not the tournament:
  `copyTierList` sets `createdBy` to the creator's `sub`. A co-organizer can't edit it through
  `/tier-lists/:slug/edit`, a removed organizer still can, and the copy shows up in the creator's
  Mine list as if it were a preset.
- **Lists shared between tournaments.** `findOrphanedRequirements` and `remove` look for
  *every* tournament on a list, which only makes sense if lists created before copy-on-attach are
  still shared. A diagnose script finds them; each extra tournament gets its own copy.
- `migrate-tier-names-to-ids.ts` is still in `scripts/`, not `scripts/complete/`. Its dry run
  says whether it has been applied. Everything here relies on tier ids.

---

## 2. The Model

### Presets and tournament copies

One collection, two kinds of list, told apart by a new `tournament` field:

| | Preset | Tournament copy |
| --- | --- | --- |
| `tournament` | absent | the tournament's `_id` |
| Who edits | owner (`createdBy`) and editors | that tournament's organizers (A1 staff policy), nobody else |
| Shows in | My Tier Lists, search when public | the tournament's Tier List page and settings, never in My Tier Lists or search |
| Visibility | private, unlisted, public | follows the tournament's own visibility |
| Deleted | by its owner, any time (tournament copies don't depend on it) | only with its tournament |
| Logged | its own history (§6) | its own history, **and** each change as a tournament log event (§8) |

`canEdit` branches on `tournament`: a preset checks owner and editors, a copy asks the
tournament's staff policy. A copy's `createdBy` stays as who made it, for the record only.

### Visibility

`settings.isPublic` becomes `visibility: "private" | "unlisted" | "public"`.

- **Private**: owner and collaborators only. Everyone else gets a 404, not a 403.
- **Unlisted**: anyone with the link can view and fork; not in search.
- **Public**: in search, viewable and forkable by anyone.

`shareToken` is reused for collaborator invites (§6), not for viewing.

### Roles

`collaborators: string[]` becomes `collaborators: { sub, name, role: "editor" | "viewer" }[]`.
Viewers matter for private lists: a league can review a draft list before it goes public. The
owner is `createdBy` and can't be removed; ownership transfer is an open question (§11).

### Lineage

`copiedFrom` already exists. The list page shows "Forked from *X* by *owner*" with a link, or
"Forked from a list that was deleted" when the source is gone. `forkCount` stays and a
`usedBy` count (tournament copies made from it, counted in a query, not stored) joins it in search.

### Discovery fields

`tags: string[]` (free text, lowercase, at most 8, e.g. "singles", "vgc", "monotype", "draft
league"), a text index on name, description and tags, and a `featured` flag that only site
admins set.

---

## 3. Pages

All are `pdz-page` routes with path constants in `route-paths.ts`.

| Route | Type | What it is |
| --- | --- | --- |
| `/tier-lists` | index | **Find Tier Lists.** Featured row, then search results. Filters: text, format, ruleset, tags, **contains Pokémon** (a `pdz-pokemon-search`), sort by updated / forks / used. Each card: name, owner, format · ruleset, Pokémon count, tier count, forks, a `pdz-roster-sprites` strip of its top tier |
| `/tier-lists/mine` | index | **My Tier Lists.** Lists I own, then lists shared with me (with my role). Actions per row: Open, Edit, Duplicate, Start a Tournament, Delete. Replaces today's Mine segment |
| `/tier-lists/new` | form | **New Tier List**, three choice cards (`pdz-choice-cards`): Start from Scratch (format + ruleset), Copy a List (search, then fork), Import from a Sheet (§4) |
| `/tier-lists/:slug` | detail | The list, read-only. Header actions: Edit (if allowed), Fork, Start a Tournament, Export (menu: CSV, JSON, image). Lineage line under the title |
| `/tier-lists/:slug/edit` | workspace | Today's editor, plus Import, the legality panel (§5) and, for presets, Share |
| `/tier-lists/:slug/history` | index | Revision list (§6): who, when, a summary ("moved 4, repriced S tier 18 → 20"), Compare and Revert |
| `/tier-lists/:slug/compare` | detail | Diff against another list or an older revision (`?with=slug` or `?rev=n`): added, removed, moved, repriced, bans changed, grouped by tier |

The tournament side lives on the existing pages:

- **Create tournament** gains "Tier list: none / from a past season / from my lists or search".
  The search is the same component as Find Tier Lists in a dialog.
- **Settings → Tier List panel**: Replace and Start from a Template open that dialog (§7).
  Edit Costs goes to the copy's editor, which now admits organizers.
- **Tier List page in the tournament** gains Export and "Save as Preset" for organizers.

---

## 4. Import

The importer is a server endpoint, so the matcher uses the ruleset's species and Showdown's
alias table (`@pkmn/dex` ships it; `landot` → Landorus-Therian), and the client stays a review screen.

`POST tier-lists/import/preview` takes `{ text | url, format, ruleset, layout? }` and returns
the detected layout, the tiers it found, and a match result per name. Nothing is written until
the client sends the reviewed result to the normal create or update endpoint.

### 4.1 Input

- **Paste** (the common case): copying cells from Google Sheets or Excel gives tab-separated
  text, which the parser handles alongside CSV.
- **File**: `.csv` and `.tsv`. `.xlsx` is a later addition (one sheet picked by name), since it
  needs a parser dependency.
- **Google Sheets link**: a link to a sheet published or shared as "anyone with the link" is
  fetched as CSV through the export URL. A private sheet gets a clear message to publish it or
  paste the cells instead. The server fetches only `docs.google.com` URLs, with a size cap.

### 4.2 Layouts

The parser scores each layout and picks the best. The review screen shows what it chose and
lets the user switch.

| Layout | Looks like | Read as |
| --- | --- | --- |
| Tier columns | header row of tier names, Pokémon down each column | today's import |
| Name + tier rows | `Pokémon, Tier` per row | tier from the second column |
| Name + cost rows | `Pokémon, Points` per row | one tier per distinct cost, named by the cost ("20 pts") |
| Tier blocks | a tier name on its own row (often with a cost: "S Tier (20)"), names under it until the next heading | tier from the last heading |
| Cost columns | header row of numbers | like tier columns, cost from the header |

Common extras are recognized in any layout: a "Banned" column or block goes to Banned; an extra
column of notes ("Tera Captain only", "no Shell Smash") goes to the Pokémon's notes; a
column with Y/N or ✓ marks next to a header like "Tera" or "Captain" becomes an addon. Blank
rows, title rows above the header and totals rows are skipped.

A cost in a tier name ("A (15)", "15 pts", "Tier 3 — 12") becomes the tier's cost.

### 4.3 Matching names

Each cell goes through, in order:

1. **Clean**: trim, drop footnote marks (`*`, `†`, `^`, trailing digits on a name), drop
   bracketed notes that aren't formes ("(C)", "(Tera)", "(banned in Ubers)"), drop a leading
   label ("Tera Captain:").
2. **Exact**: the ruleset's species by id (`toID`), then the alias table.
3. **Forme spelling**: rewrite the usual community spellings before trying again: `X-T` / `X-Therian`
   / `Therian X`, `X (Forme)` / `Forme X`, `Rapid Strike X`, `Alolan X` / `X-A` / `A-X`, `Galarian`,
   `Hisuian`, `Paldean`, `Mega X` / `X-Mega`, `X (Wellspring Mask)`.
4. **League memory**: names this owner (or this tournament's organizers) confirmed in an earlier
   import (§4.4).
5. **Close spelling**: edit distance against every species in the ruleset. A clear winner
   within two edits is a **suggestion**, never applied on its own.

Each result is one of:

| Result | Example | Review screen |
| --- | --- | --- |
| Matched | `Garchomp`, `Lando-T` | counted, collapsed |
| Suggested | `Goldengo` → Gholdengo | Accept / Change |
| Ambiguous | `Urshifu` (Single Strike, Rapid Strike), `Ogerpon` | pick one, or **All Formes** (adds each, same tier) |
| Not in ruleset | `Walking Wake` under a ruleset without it | Skip / Pick Another |
| No match | `Missingno` | Pick Pokémon / Skip |
| Duplicate | the same Pokémon in two tiers | pick which tier wins |

The screen opens on what needs a person and puts a count line on top ("142 matched · 4
suggested · 2 need you · 1 not in this ruleset"). Apply stays enabled; anything left
unresolved is skipped and listed in the result, so nothing disappears without a name.

### 4.4 Remembered names

A choice on the review screen is saved as `importAliases: { text, pokemonId }[]` on the
user (presets) or the tournament (copies), and step 4 checks it next time. A league that
writes "Lando-T" every season answers once. The user can clear them from the import screen.

### 4.5 Into an existing list

Importing into a list that already has Pokémon asks: **Replace** (the import becomes the
list) or **Merge** (imported Pokémon move to their imported tiers, the rest stay). Both show
the compare view (§3) before saving.

---

## 5. Legality

The editor gets a Legality panel, also shown before an import is applied and before a
tournament swap:

- Pokémon on the list the ruleset doesn't allow (after a ruleset change, or an import).
- Pokémon the ruleset allows that are on no tier and not banned ("left off", shown as a count
  with a list, since many lists leave out hundreds on purpose).
- Banned moves and abilities that no Pokémon on the list can use (likely typos).
- Tiers with no Pokémon, and tiers with no cost on a points list.

It warns and never blocks. Changing the ruleset re-runs it. This is the user-facing version of
the server's `diagnose-ruleset-legality.ts` sweep.

---

## 6. Sharing and Collaboration

### 6.1 Invites

Invites are links, because user search was removed as a directory leak (2026-09). The owner
makes an invite link for a role (editor or viewer). It can be used a set number of times and
expires after 7 days. Accepting it asks the invitee's display name for this list (as organizer
invites do). The Share dialog lists collaborators with role changes and Remove, and the
visibility choice (`pdz-choice-cards`, three options with a plain description each).

### 6.2 Revisions

Every save writes a **revision**: `{ list, version, actor, at, changes }`, where `changes`
lists what moved, was repriced, added, removed, banned or renamed, not a whole snapshot. Every
50th revision also stores a full snapshot so a revert doesn't replay hundreds of changes.

- **History page** (§3) reads them; **Revert** writes a new revision that restores an old
  state, so history never loses a step.
- **No lost edits**: the list carries a `version`; a save sends the version it started from,
  and a stale one is refused with "Someone else saved this list. Review their changes" and the
  compare view, the same versioned-write pattern trades use (D2).
- Presence ("Alex is editing") and live merging are out of scope. Two editors at once is rare
  for a tier list; refusing a stale save is enough.

### 6.3 Forking

Anyone can fork a list they can view. The fork is private by default, copies tiers, Pokémon and
bans but no collaborators or history, and records `copiedFrom`.

---

## 7. Tournaments

### 7.1 Creating from a list

`CreateTournamentDto.tierListFrom` today names a tournament in the same league. It gains a
second form, `tierListSlug`: any list the creator can view (their own, shared with them,
unlisted with the link, or public). The server copies it into the new tournament as a copy
(`tournament` set, `copiedFrom` the source). "Start a Tournament" on a list goes to the create
page with it preselected, and then the league picker if the user admins more than one.

### 7.2 Swapping in settings

Settings → Tier List → Replace opens the list picker. The swap:

- is allowed before and after sign-ups open; once the draft starts it is part of Draft Rules,
  so it needs the section unlocked (confirm dialog, logged as its own event);
- runs Legality (§5) on the incoming list and shows the compare view against the current copy;
- **remaps tier requirements** by tier name (case-insensitive), lists the ones it couldn't
  match, and clears those; the confirm says which;
- after the draft has started, also lists **drafted Pokémon whose cost or legality changes**
  ("Kingambit 18 → 20 pts, on Cinnabar Blaze"); it doesn't reprice picks, it shows the
  change so the organizer decides with the facts and the log records what they saw;
- makes a fresh copy, points the tournament at it, and keeps the old copy (no longer
  current) so its history and the log's links stay valid;
- writes a `tier-list.swapped` log event (§8).

### 7.3 Updates from the source

A copy knows its source. When the source has revisions after the copy was made, the Tier List
panel shows "The source list changed since you copied it" with Compare and Pull Changes. Pulling
applies the source's changes to the copy as one revision (a merge, so the organizer's own edits
to the copy survive; a conflict on the same Pokémon asks which wins). The same lock rules
apply after the draft starts, and it is logged as `tier-list.pulled`.

### 7.4 Save as Preset

Organizers can save a tournament's copy as a new preset they own (private, `copiedFrom` the
copy). Next season starts from it.

---

## 8. Tournament Action Log

### 8.1 What it is for

Coaches and the public (when the tournament allows it) can see what organizers changed and
when, so a coach can check that nobody repriced a Pokémon after a rival drafted it or quietly
rewrote a result. It records actions; it never judges them.

### 8.2 Rules

- **Append-only.** The server writes entries inside the same transaction as the change.
  No endpoint edits or deletes one; organizers can't hide entries.
- **Each entry**: `tournament`, `seq` (per-tournament counter), `at`, `actor` (sub + the
  organizer name they use in this tournament), `type`, `target` (pool, team, matchup, tier),
  `before`, `after`, and an optional `reason` the organizer typed.
- **Who reads it**: the tournament's coaches and organizers always; the public when a new
  setting, `logVisibility: "participants" | "public"`, says so (default participants).
- **Where**: a **Log** page in the tournament shell (rail item under the public group), as a
  `pdz-table` with type filters and a search on team or Pokémon; each tier-list entry links to
  the compare view for that change. Tier-list and lock events also appear inline under the
  Tier List page's header as "Last changed 2 days ago by …".
- **Not a chat or a feed**: no comments, no reactions. Disputes go to the tournament's chat.
- **Integrity limit**: someone with database access can still alter entries. Hash-chaining
  each entry to the previous one would make that detectable; it is set aside unless it is
  ever needed (§10).

### 8.3 Events, phase 1 (with this plan)

| Type | When |
| --- | --- |
| `tier-list.attached` | A list is attached for the first time |
| `tier-list.swapped` | §7.2; before/after list, requirements remapped and cleared, picks affected |
| `tier-list.edited` | A save on the tournament's copy after sign-ups open; the revision's changes |
| `tier-list.pulled` | §7.3 |
| `settings.unlocked` / `settings.relocked` | A locked section is unlocked or relocks; section and phase |
| `settings.changed` | A save that changes a locked or lockable setting (draft rules, standings rules); the nodes that changed |

The settings save already sends changed nodes rather than the whole document, so
`settings.changed` reads the change set without a diff.

### 8.4 Events, later passes

Each is a separate step after this plan lands, using the same writer:

| Area | Events |
| --- | --- |
| Draft | pick undone or replaced by an organizer, pick made for a team, draft paused/resumed, timer or order changed mid-draft, skip |
| Results | result entered or overridden by an organizer, forfeit applied, coach report approved or rejected |
| Trades | trade approved, rejected or forced by an organizer |
| Teams | coach replaced, team dropped, team renamed, applicant approved or rejected after the deadline |
| Schedule | matchup moved, regenerated, seeds confirmed or changed |
| Staff | organizer added or removed |

---

## 9. Export

- **CSV**: today's export, checked so that importing it gives the same list back.
- **JSON**: the whole list (tiers with costs, Pokémon with notes and addons, bans), and
  importable, for a lossless copy between sites or a backup.
- **Image**: a PNG of the list as tier rows of sprites with costs and the list name, sized for
  Discord. Built in the browser from the list page (canvas from the rendered sprites, which
  needs the sprite CDNs to send CORS headers; checked first, and the server renders it if they don't).

---

## 10. Set Aside

| Idea | Reason |
| --- | --- |
| Live references from tournaments to presets | Reprices running drafts from outside the tournament (2026-09-18) |
| Hash-chained log | Only protects against the database owner; revisit if anyone asks |
| Live co-editing (presence, merged keystrokes) | Rare for a tier list; a refused stale save is enough |
| Comments on lists, ratings, stars | Forks and use counts already rank; moderation cost |
| An importer that guesses formes on its own | A wrong forme silently changes a draft; the review step asks instead |

---

## 11. Steps

Each step ends with `npm run lint`, targeted specs, and the gallery updated if a primitive
changed. Migrations are scripts the owner runs: dry run by default, `--apply` to write,
`--rollback` where it applies.

1. **Groundwork.** Confirm the tier-id migration's run status. Add `tournament` to
   `TierListEntity`; a diagnose script finds tournament lists, lists shared by more than one
   tournament, and lists no tournament uses; a migration sets `tournament` on copies and splits
   shared ones. `canEdit` branches on `tournament` (organizers for copies). `getTierList` hides
   private lists from strangers. Mine leaves out tournament copies.
2. **Visibility and roles.** `visibility` replaces `isPublic` (migration), collaborators get
   roles (migration), Share dialog, invite links, lineage line.
3. **My Tier Lists and Find Tier Lists.** The two index pages, tags, text index, contains-Pokémon
   filter, sort, featured row, Start from Scratch / Copy a List on New.
4. **Revisions.** `version`, the revision writer on every save, stale-save refusal, History,
   Compare, Revert.
5. **Import.** Preview endpoint, layouts, matcher, review screen, remembered names, Replace or
   Merge, Google Sheets link. Golden fixtures from real league sheets (PDBL S3's list first).
6. **Legality panel.**
7. **Tournament action log**, phase 1 events (§8.3), the Log page, `logVisibility`.
8. **Tournaments.** Create from any list, Replace and Start from a Template in settings with
   requirement remapping and the affected-picks list, Save as Preset, source changes and Pull.
   Each writes its log events.
9. **Export**: JSON, image, CSV round trip check.
10. **Log, later passes** (§8.4), one area at a time.

Steps 2–6 can ship before the log. Step 8 waits on the log so swaps are recorded from the
first one.

---

## 12. As Built (2026-10-23)

Departures from the plan above, each made while building:

- **Author name instead of account names.** Usernames are real names for most Google logins,
  so a list shows `authorName`, which its owner types, and it is required before a list goes
  unlisted or public. Collaborators choose their own name when they accept an invite, as
  organizer invites do. Member ids sent to the client are hashes, never Auth0 subs.
- **Visibility needed no migration.** `settings.visibility` is read with a fallback to
  `isPublic` (true → public, false → private), and every write keeps `isPublic` in step, so the
  existing index and browse query still work. Legacy `collaborators` are read as editors; new
  members go in `members`.
- **Every revision stores a full snapshot**, not one in fifty. Lists are a few hundred entries;
  this keeps revert, compare and the three-way pull simple. A list's state before its first
  tracked save is kept as version 0.
- **Remembered import names are per user**, not per tournament.
- **Search uses a case-insensitive match** on name, description and tags, not a text index.
- **`settings.relocked` was dropped.** An unlock is logged with the save that used it; an unlock
  that saved nothing changed nothing.
- **Settings changes are logged once the tournament is live** (sign-ups open, or any approved
  team), for the fields that change how it is played: roster size, point total, tier
  requirements, trade limit, standings rules, forfeits, differential, team cap, dates, sign-up
  access, match settings and log visibility. Attaching or swapping a list is always logged.
- **Copies point at the preset upstream.** A tournament copied from last season's copy records
  that copy's own source as `copiedFrom` (or the copy itself when it has none), so Pull keeps
  working season after season.
- **`PATCH settings` refuses `tierListId`.** It used to point the tournament at any list by id
  with no permission check and no copy, a live reference to someone else's list. Swaps go
  through `tier-list/attach` only.
- **Image export** draws on a canvas in the browser; when a sprite CDN blocks cross-origin
  reads it draws names instead of sprites.
- **`.xlsx` upload was not built.** Paste, CSV/TSV upload and a shared Google Sheets link
  cover it.
- **Open questions settled with the recommended answer:** ownership can be handed to an
  editor; only site admins (owner/admin role) feature lists; log entries are kept forever; a
  tournament's copy is readable by anyone who can see the tournament.

Where it lives: server `modules/tier-list/` (lists, revisions, invites, import, tournament
side) and `modules/tournament-log/`; client `features/tier-lists/` (Find, Mine, New, Import,
view, editor, History, Compare, Share, invite) and `features/league-zone/tournament-log/` plus
the settings panel dialogs in `tournament-settings/`.

## 13. Open Questions

Each was built with the recommended answer (§12); change any of them on review.

- **Ownership transfer** for presets: allow the owner to hand a list to an editor? Useful when
  a league changes hands.
- **Who sets `featured`**: site admins only, or league owners for their own league's page?
- **Log retention after Completed**: keep forever (recommended, it's small), or archive with
  the season?
- **`.xlsx` upload**: worth a parser dependency, or is paste enough?
- **Visibility of a tournament's copy**: follow the tournament's visibility (recommended), or
  always public once the draft starts so anyone can check costs?
