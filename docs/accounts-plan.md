# Accounts Plan

Written 2026-11-14. Nothing here is built yet.

Leagues put people's names in front of strangers, and today the site has no account
identity of its own. This plan gives every account a display name the user can change,
moves the profile out of Auth0 and into our database, and fixes the weak spots found
while reviewing the sign-in stack.

**Handles removed (owner, 2026-11-17).** The handle and the Welcome page were built
(Phases 1 to 4 and 7) and never deployed. They are taken out before release: a verified
Discord name does the handle's job of proving who someone is, and a default display name
from the sign-in removes the need for a first-sign-in step. Sections below are updated;
the phase notes keep what was built for the record.

Auth0 stays. It keeps doing one job: proving who signed in. Everything about who that
person is on DraftZone lives in the `users` collection.

## 1. What exists today

- **Sign-in.** Auth0 Universal Login on `login.pokemondraftzone.com`, redirect flow,
  refresh tokens kept in browser storage. Google is about 65% of accounts, Discord 25%,
  email and password 9% (export of 2026-08-12).
- **Server.** A request's token is checked and reduced to the account id (`sub`). All
  permissions are ownership checks against that id.
- **User row.** Created and updated by a webhook that Auth0 calls on sign-in
  (`POST /webhooks/...`, shared secret). It overwrites `username` every time.
- **Names on screen.** The navbar reads `username` from the Auth0 token. Every public
  name is typed per context: the coach name at sign-up, `ownerName` and staff names on a
  tournament, league admin names. Nothing ties them to an account a stranger can verify.
- **Settings.** A dialog from the navbar menu with light/dark, theme and sprite set.
  There is no account page.

## 2. Problems found

| # | Problem | Effect |
| --- | --- | --- |
| 1 | `username` is whatever the provider sends | Google accounts show a real name |
| 2 | No unique, verifiable identity | Anyone can sign up to a league as any name; an organizer cannot tell two people apart |
| 3 | The name has two sources (Auth0 token on the client, Mongo on the server) | They can disagree, and a name the user picks would be overwritten at the next sign-in |
| 4 | The user row only exists once the webhook lands | Until then `GET users/me` fails and the client silently treats the user as having no profile. The webhook also rejects a payload with no `username` or `settings`, so some accounts may never get a row |
| 5 | Sign-up asks for Discord name, Showdown name and timezone every time | Retyped for every league; nothing is remembered |
| 6 | Settings fall back to a `settings` claim on the Auth0 token | A leftover from when settings lived in Auth0 |
| 7 | The token audience is Auth0's Management API, not the DraftZone API | Works, but blocks per-endpoint permissions later. Deferred 2026-08-06 because fixing it signs everyone out once |
| 8 | The token asks for `email` and `profile` | Real name and email are pulled into the browser for no use we know of |
| 9 | Logging out leaves account data in the browser | On a shared computer the next person inherits the theme, and the planner sync uploads the previous person's unsynced plans to the new account |
| 10 | One person can be two accounts (Google one day, Discord the next) | Split history; the second account cannot connect the Discord the first one holds |
| 11 | No way to delete an account, and no admin tool to clear a bad name or suspend an account | Needed once names are public |
| 12 | Site roles (admin, tournament creator) are copied from Auth0 at sign-in | A change only takes effect when the person next signs in |

## 3. The identity model

| Field | Rules | Shown |
| --- | --- | --- |
| `displayName` | Any letters, 2 to 24 characters, not unique, change any time | Everywhere a person is named |
| Verified Discord name (Phase 6) | Unique, proven by Discord, one Discord per account | A coach's: organizers and coaches in the same tournament. An applicant's: organizers. Never strangers |
| Coach name (exists) | Per tournament, prefilled from `displayName` | Inside that tournament, like a Discord server nickname |
| Profile id | The user row's `_id`, opaque | Only in profile links: `/profile/:id` |

- **The default display name is the sign-in's own name** (owner, 2026-11-17): the Google
  name, the email account's username or the Discord name, cleaned to the display name
  rules. A name that cleans to nothing valid gets `Coach` and four digits. The user
  changes it freely on the settings page.
- **What proves who someone is** is the verified Discord name, not the display name.
  Discord sign-ins are verified by the sign-in itself; everyone else connects Discord
  (Phase 6). Until then a Google or email account has only its display name, and inside
  a tournament the coach name and team tell people apart.
- **No directory.** Nothing is a search key for browsing people. User search was removed
  as a leak and stays removed. Admin tools find an account by its profile id, taken from
  the person's profile link.
- **League defaults on the profile** (decided 2026-11-14), so a sign-up form arrives
  filled in:
  - **Discord name: one per account.** The sign-up form shows it but does not take a
    different one; it is changed in settings. A change carries to the person's running
    seasons and leaves completed ones as they were.
  - **Showdown name and timezone: a default you can override.** The sign-up form
    prefills them and the coach can type something else for that tournament. The
    sign-up keeps its own copy, so editing the profile never rewrites a season.
- **No avatar** (decided 2026-11-15, replacing the 2026-11-14 logo avatar): every league
  team already carries its own identity, so an account picture adds nothing. The
  provider's photo is never used. The navbar shows a plain account icon beside the
  display name.

## 4. First sign-in

Decided 2026-11-17: no first-sign-in step. The 2026-11-14 Welcome page (pick a handle
and display name before anything else) was built and removed with the handle.

1. The user signs in through Auth0 as today.
2. The app loads `GET users/me`. The server creates the row if it is missing, with the
   default display name from the sign-in.
3. The user goes straight to the page they asked for.

Existing accounts with no display name get the same default the first time their row is
read, and a one-off script fills the rest so other people's names never come back
empty. The provider name has to keep reaching the server (the webhook's `username`, or
the token's `name` claim), so Phase 5's scope trim keeps whatever carries it.

## 5. Phases

Each phase can ship on its own, in this order.

### Phase 0. Look at the Auth0 tenant (owner, no code)

The review covered both repos but not the tenant. Before Phase 1, confirm:

- what the sign-in Action sends to the webhook and which claims it adds to the token
- that refresh token rotation is on
- that the DraftZone API (`https://api.pokemondraftzone.com`) has Allow Offline Access on
- whether email and password accounts must verify their email before signing in

### Phase 1. The server owns the profile

Built 2026-11-14, uncommitted. What differs from the list below: the handle is stored
already lower-cased in `handle` (no `handleLower`); the first handle does not start the
30-day clock, so one correction is free; the guard exists but is attached to no route
until Welcome ships with it. Production needs three indexes if Mongoose does not create
them: `users.handle` unique sparse, `heldhandles.handle` unique, `heldhandles.expiresAt`
expiring.

- Add `handle`, `handleLower` (unique index), `handleChangedAt`, `displayName`
  and a `profile` block (Discord name, Showdown name, timezone) to the user schema.
- `GET users/me` creates the row when it is missing and returns handle, display name,
  profile, roles and settings.
- New endpoints: check a handle, set or change the handle, update display name and
  profile.
- Held handles: a small collection of released handles with an expiry.
- The webhook stops writing `username` and stops requiring it; it keeps `lastLogin` and
  roles. The old `username` field stays as the prefill suggestion.
- A guard that refuses public actions from an account with no handle.

### Phase 1b. Account ids (proposed 2026-11-14, awaiting the owner's go)

Today the Auth0 id is the account: about 18 collections store it (26 fields found, likely
a few more), and it carries the provider's own id for the person, such as their Discord
user id. This phase gives every account an id of its own and re-keys the data to it,
before leagues bring more data.

- **The id** is the user row's existing `_id`, stored as a string wherever an Auth0 id is
  stored now. Field types do not change.
- **A sign-ins table** maps each Auth0 id to an account, with a blocked flag. Phase 6
  (connect, transfer, lock) is then edits to this table and needs nothing else.
- **One swap point.** The token check looks the Auth0 id up (cached) and hands the
  account id to the rest of the server. The 164 places that read the signed-in user all
  get it from that one decorator and treat it as an opaque string, so they do not
  change. A first-time sign-in creates the user row and its sign-in row there.
- **The two places that read the provider out of the id** (league sign-up's Discord
  prefill, the admin provider counts) read the sign-ins table instead.
- **Client.** Anything using the id from the Auth0 token takes it from `users/me`.
- **The migration** is one script: build the old id → new id map, rewrite every listed
  field, keep the map so it can be run backwards. Labelled backup first, run by the
  owner, in a short maintenance window with the server deploy, since old and new ids
  cannot be mixed. Nobody is signed out.
- **Before writing it:** a full inventory of every field and every embedded copy
  (organizer and staff lists, invites, logs, chat authors, uploads), and of anything
  outside Mongo keyed by the id (cache keys, upload paths).

**State (2026-11-14).** The owner said go.

- **A local test database exists.** `scripts/refresh-dev-database.ts` dumps production
  (read only) into a Docker MongoDB as `draftzone_dev` and keeps the dump under
  `scripts/backups/`. The server's `.env` now sets `MONGODB_URI` to it. Before this the
  local server ran on the production database, which is how an empty `heldhandles`
  collection and a `users.handle` index reached production ahead of any deploy.
- **The migration script is written and rehearsed on the copy**
  (`scripts/migrate-account-ids.ts`): 11,958 values in 11,851 documents across 17
  collections, about two seconds, then reversed back to the original with nothing left
  over. It is a dry run unless `--apply` is passed, refuses production without
  `--production`, and writes the list of rewritten paths that `--reverse` needs.
- **The live scan** found no id without a user row, none used as an object key, and ten
  places the code no longer describes (leftover tournament fields, the two backup
  collections, one old chat message, 101 old `pdbl2` sign-ups). The script rewrites them
  all.
- **The server swap is built behind a switch** (`ACCOUNT_ID_MODE`, off by default;
  `internal` turns it on), uncommitted. `scripts/rehearse-account-ids.ts` ran the whole
  sequence on the local copy: migrate, resolve all 11,961 accounts through the real
  token check in the new mode, compare what each owns before and after across six
  collections, create a first-time account, then reverse. It passed. Not yet done: a
  signed-in browser session against a local server with the switch on. The switch must
  only ever change with a restart, because cached ids from the other mode would linger.
- **Keep the paths file from the first `--apply`.** A second run finds nothing and
  writes an empty paths file, which reverses nothing. The run must use
  `-r tsconfig-paths/register` only for the rehearsal script, not the migration.
  Re-rehearsed 2026-11-17 on current code: passed, and the paths now include
  `adminaudits.actor`, `chatreports.reporter` and `chatreports.messageAuthor`.
- **With the switch off** the code can deploy ahead with no change in behaviour. The window is
  then: stop the server, labelled backup, run the script, turn the switch on, start.
  Undoing it is the reverse script and the switch off, with no redeploy.
- **The sign-ins table waits for Phase 6.** Until an account can have two sign-ins, the
  user row's own `auth0Sub` is the mapping, so 1b adds no collection. That also means
  the admin provider counts, the sign-up Discord prefill and the planner sync marker
  keep working unchanged: they read the Auth0 id from the user row or the token, which
  both still have it.

**Inventory (2026-11-14, read from the code; the live database was not looked at).**

36 fields in 23 collections store the Auth0 id:

| Collection | Fields |
| --- | --- |
| users | `auth0Sub` |
| leaguecoaches | `auth0Id` |
| tournamentapplications | `auth0Id`, `decidedBy` |
| tournamentmessages | `author`, `deletedBy` |
| leagues | `owner`, `admins[].sub` |
| leagueadmininvites | `createdBy`, `acceptedBy` |
| leaguetournaments | `ownerName.sub`, `staff[].sub`, `trades[].submittedBy`, `trades[].resolvedBy`, `discordLinkCode.createdBy` |
| organizerinvites | `createdBy`, `acceptedBy` |
| leaguematchups | `report.submittedBy` |
| leaguestages | `seedingLog[].seededBy` |
| leagueteams | `nameHistory[].changedBy`, `nameLockedBy` |
| teamidentities | `owner` |
| teambuilderteams | `userSub` |
| tierlistimportaliases | `owner` |
| tierlistinvites | `createdBy`, `acceptedBy[]` |
| tierlistrevisions | `actor` |
| leaguetierlists | `createdBy`, `members[].sub`, `collaborators[]` (legacy, still merged in) |
| leagueads | `owner` |
| drafts | `owner` |
| archives | `owner` |
| plannerplans | `owner` |
| fileuploads | `uploadedBy` |
| tournamentlogs | `actor` |

Not an Auth0 id, leave alone: `discordSettings.linkedBy` (a Discord user id) and
`teams.picker` (a coach id). A hosted tournament stores no owner of its own; it reads
`league.owner`.

What else the swap touches:

- **Old data with no schema.** Earlier migrations left fields in place
  (`leaguetournaments.organizers`, `organizerNames`, `owner`, old `submittedBy` /
  `resolvedBy` fields) and two backup collections hold copies of coach and application
  rows (`legacyteamreconciliations`, `legacyteamrepairs`). Only a scan of the live
  database shows what is really there.
- **A base for the script exists.** `scripts/swap-user-sub.ts` already walks every
  collection and replaces one id at any path, flagging unique-index clashes. The
  migration is that walker driven by the full old → new map, which also catches the
  schema-less leftovers.
- **Every unique index that includes the id** (applications, team identities, import
  aliases, drafts, planner plans) stays valid, since the map is one-to-one.
- **Tier list member ids** are a hash of the account id, so they change. Harmless except
  for a page left open across the migration.
- **Planner sync** stores the id in the browser beside each saved plan set. After the
  swap it will not match, and the sync treats local plans as new. Check that path merges
  cleanly and does not duplicate plans.
- **Two places read the provider out of the id** and would fail silently: the admin
  provider counts and the sign-up Discord prefill. The sign-ins table has to carry the
  provider.
- **Where other people's ids reach a browser today:** only the league admins list and
  the tournament organizers list (the organizers list includes the owner's). Those ids
  also go into request URLs, and a failed request's URL is forwarded to the error
  report channel on Discord. Every "is this me" check is already computed on the server.
- **First request.** The token check will need the user row on every request, so it
  must create the row and sign-in entry itself; the webhook cannot be relied on to have
  run.
- **Specs** on both sides use provider-shaped ids throughout and need no change, since
  the id is opaque; only tests of the two provider-shape readers do.

Rejected: keeping the id in Auth0 (`app_metadata` plus a custom token claim). The
mapping would live in Auth0 again, a lock would not apply until the token expired, and it
depends on the audience move in Phase 5.

### Phase 2. Welcome, and one source for the name

Built 2026-11-14, uncommitted. Run in a browser 2026-11-15 against a local server on the
`draftzone_dev` copy, with locally minted tokens in place of Auth0: a new account and an
existing one with no handle both land on Welcome, return to the page they asked for, and
the handle check reports taken, reserved and available.

- `Me` (from `users/me`) becomes the only source for the signed-in user's name. The
  navbar and quick-draft export stop reading the Auth0 token.
- The Welcome page and its guard.
- Drop the token `settings` fallback (problem 6).

### Phase 3. Account settings page

Built 2026-11-15, uncommitted. The owner has seen the `/settings` page locally (Profile,
League Defaults, Appearance, Account) and approved it. Appearance saves on its own as
each control changes; Profile and League Defaults share a save bar, now in
`shared/feedback/save-bar`. Built after that viewing and not yet seen in a browser: the
fixed Discord name on sign-up with its write-back, a Discord name change carrying to
running sign-ups (`DiscordNameSyncService`), the handle check switched on for the seven
public-action routes, and the client sending people to Welcome on that refusal
(`USR-008`). The 2026-11-15 browser pass covered the handle change confirm and its
30-day lock, Private Profile, the fixed Discord name on sign-up and Log Out clearing
account storage. The avatar picker opened empty for everyone (`teamidentities` has no
rows), which led to dropping the avatar altogether the same day: `PUT users/avatar`, the
`avatar` field and the picker are gone.

Open: organizers and coaches can still edit the Discord name on a coach row directly
(`UpdateCoachDetailsDto.discordName`), which goes around "one per account" and is
overwritten by the next profile change. Needs the owner's call: remove the field, or
keep it for organizers only.

- A routed `/settings` page replaces the dialog: Profile (handle, display name, Private
  Profile), League Defaults (Discord, Showdown, timezone), Appearance (today's dialog
  contents), Account (how you sign in, Log Out).
- League sign-up prefills Showdown name and timezone from the profile and shows the
  account's Discord name as fixed, with a link to settings. A coach with no Discord name
  saved types it once on the form and it is saved to the profile.
- Changing the Discord name updates the coach rows of running seasons.
- Tournament and league forms that ask for the organizer's name prefill from the display
  name.

### Phase 4. Show the handle, and moderate it

Revised 2026-11-17: the handle comes off every surface below. Chat reports stay. Clear
Account Names becomes Reset Display Name (back to `Coach` and four digits, since the
provider name may be the problem), found by profile id; lock and transfer are found by
profile id too.

Server half built 2026-11-15, uncommitted: handles in the listed payloads (one batched
lookup each, `UserService.handlesFor`); chat reports (`chatreports` collection; a report
about a tournament's own staff is escalated to site admins and hidden from organizers);
admin Clear Account Names (`blockedhandles`, `adminaudits`). Suspending an account was
left for Phase 6, where it is the same mechanism as Lock. Chat deletions are not written
to the tournament log today, so removing a reported message is not either. Client half
built, uncommitted, and run in a browser 2026-11-15: handles on the coach line,
organizers, sign-ups and chat; a coach's report reaches the organizers, a report about an
organizer reaches only the admin Chat Reports page; Clear Account Names sends the person
back to Welcome and their old handle reads as reserved.

- Server responses for applicants, organizers, league admins, team coaches and chat
  authors carry the handle.
- The client shows the handle on those surfaces.
- Admin page: clear an account's handle and display name (the user is sent back to
  Welcome), and suspend an account.

### Phase 5. Sign-in housekeeping (signs everyone out once)

Decided 2026-11-14: this ships in the same release as Welcome (Phase 2), so people are
interrupted once.

- Move the audience to the DraftZone API: server accepts both, deploy server, deploy
  client, drop the old one a day later.
- Trim the token scope to what is used.
- On Log Out, clear account-bound browser data (settings, planner sync markers, synced
  plans) so the next person on a shared computer starts clean (problem 9). **Built
  2026-11-15, uncommitted:** every storage key is declared in
  `core/utils/account-storage.ts`; Log Out asks before removing planner changes that
  never reached the server; and the planner sync discards plans whose marker belongs to
  another account, so an expired session cannot leak plans either. Unsaved teambuilder
  edits are treated as the browser's and are left alone.

### Phase 6. Connect Discord

With handles gone (2026-11-17), the verified Discord name is the one thing that proves
who someone is. Release 6a built 2026-11-17, uncommitted; Connect and Disconnect work in
a browser (owner, 2026-11-19). It needs `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` and `DISCORD_OAUTH_REDIRECT_URI` in the
server's `.env`. Before release: start the server once so the unique `discord.id` index
exists, then run `scripts/backfill-discord-ids.ts`. Also built beyond the list below:
`PATCH users/profile` ignores a typed Discord name while connected, and a coach's own
Edit Coach Info saves with the unchanged Discord name.

**What it fixes beyond trust.** The bot finds a coach on Discord by matching the typed
name against the server's member list (`DiscordService.findMember`), for draft-clock
pings, match reminders and the coach role. A typo or a renamed Discord account means no
ping and no role, silently. A connected Discord gives the bot the account id, and
`mention()` already turns an id into a `<@id>` ping without any lookup.

**Connections only (owner, 2026-11-17, after the first merge test).** There is no typed
Discord name anywhere any more: not in settings, not on the sign-up form, not in the
organizer's or coach's edit dialog. A Discord name exists only through a connection.
A coach who has not connected has no Discord name; the bot never pings them and never
grants them the coach role, and writes their coach name as plain text instead of a
mention. Discord names already stored on past coach rows and applications stay as plain
text. This replaces the typed field, the name-matching fallback, `DISCORD_NAME_CONNECTED`
and the Phase 3 rule "a coach with no Discord name saved types it once on the form".

#### What the person sees

- **Settings, League Defaults.** The Discord row shows the typed name and a **Connect
  Discord** button. After connecting, it shows the Discord username (not typed) and a
  **Disconnect** action.
- **Discord sign-ins** are connected already: their Discord id is in the sign-in itself.
  They see their Discord username and no Disconnect, since Discord is how they sign in.
- **League sign-up** shows a connected Discord as fixed. A tournament with **Require
  Discord** on (a Sign-Up setting) shows Connect Discord in place of the field, and
  returns to the form afterwards. **Off by default** (owner, 2026-11-19, after Merge
  Accounts worked; this settles the 2026-11-17 wish for on by default).
- **No verified mark** (owner, 2026-11-17). Connected or typed, a Discord name looks the
  same; with Require Discord on by default, nearly every coach's name is connected.
- **Who sees a coach's Discord name** (owner, 2026-11-17): the tournament's organizers
  and the other coaches seated in the same tournament, so coaches know who to message.
  Applicants' Discord names stay organizer-only. Strangers and public profiles never see
  it. Today only the two sides of a matchup and organizers see it (matchup page); the
  team page coach line gains it for those viewers.
- No toast after connecting: the name appearing is the confirmation. Words only for a
  failure or a conflict.

#### How it works

1. Connect Discord calls `POST users/discord/connect`. The server makes a one-time
   `state` (random, bound to the account, ten minutes, single use, in the app cache) and
   returns Discord's approval address, asking only for `identify` (no email, servers or
   messages).
2. Discord sends the person back to a client page, `/settings/discord`, with `code` and
   `state`. That page posts both to `POST users/discord/callback` with the person's own
   token, so the approval is tied to the signed-in account twice (state and token).
3. The server trades the code for a Discord token, reads `/users/@me` (id and username)
   and throws the token away. Nothing from Discord is stored but the id, the username and
   the time.
4. It saves `discord: { id, username, connectedAt }` on the user row (unique sparse index
   on `discord.id`) and sets `profile.discordName` to the username. The existing
   `DiscordNameSyncService` carries the name, and now the id, to running sign-ups and
   coach rows; completed seasons stay as they were.
5. Cancelling at Discord returns to settings with nothing changed and no message.

**Keeping the name current.** Discord usernames change. The bot can read any user by id,
so the stored username refreshes when the person opens settings or signs up for a league,
and the bot pings by id, so a rename never breaks a ping.

As built: at most once a day, when the person's own account loads (`reconcile`). A coach
who renames and stops visiting keeps the old name on running seasons. Later, if that
shows: a bot listener for username changes (the bot already has the `GuildMembers`
intent) that updates the account and its running coach rows, keeping the daily check for
people outside the bot's servers. Not a live lookup on every page (owner, 2026-11-19).

**Disconnect** clears `discord`, leaves the last username as a typed name, and removes
the id from running coach rows.

**Coach-row Discord edits** (open item from Phase 3): organizers keep the edit only for
coaches without a connected Discord. A connected coach's Discord name cannot be typed
over.

**Existing Discord sign-ins** (about a quarter of accounts) get `discord.id` from their
sign-in by a one-off script before release, so the one-Discord-per-account rule holds from
day one. Their username comes from the bot.

#### When that Discord already belongs to another account

The usual case: someone signed up with Discord, later signs in with Google by mistake, and
tries to connect the same Discord. They have just proven both.

- **Release 6a (works with account ids as they are today):** refuse, and say which way of
  signing in holds that Discord, so they sign in that way instead. An admin can still
  Transfer.
- **Release 6b, Merge Accounts** (owner, 2026-11-17, replacing "only when one account
  is empty"): many people have used both a Google and a Discord account, so both hold
  data. Needs the Phase 1b account ids switched on, because two sign-ins can only share
  an account through the sign-ins table.

#### Merge Accounts (6b)

Built 2026-11-17, uncommitted. The owner merged their Discord account into their Google
account in a browser on 2026-11-19 and it worked, against `draftzone_dev` with
`ACCOUNT_ID_MODE=internal`, which also covers Phase 1b's signed-in browser session and the
dev-copy run of `AccountMergeRepository`. As built: `keep` names the
account that survives (its id, display name and settings); old profile links follow
merges. A planner that would hold more than 9 plans after the merge is a blocker
(the planner keeps 9 and would drop the rest). The raw Mongo queries
(`AccountMergeRepository`) have no spec. Undo is
`POST admin/accounts/merge/undo`; it ran on `draftzone_dev` 2026-11-19 against the owner's
merge and put back the removed account, its sign-in, the rewritten documents and the
combined applications, with nothing left unreversed. The Undo Merge button is deferred
(owner, 2026-11-19): a wrong merge is a rare support case, so the endpoint is enough. An
admin cannot undo a merge into their own account through it (`CANNOT_ACT_ON_SELF`).

**When it is offered.** Only at the moment of proof: the person is signed in to one
account and has just approved, at Discord, as the Discord that the other account holds.
The callback answers with a short-lived merge offer (in the app cache, ten minutes,
bound to both accounts) instead of a dead end. No other way in for now; an admin merge
by two profile ids can come later.

**What the person sees** (on the Connect Discord page):

- Both accounts side by side: display name, joined date, and what each holds (teams
  coached, leagues and tournaments run, external drafts, tier lists, planner plans).
- A choice of which account's **display name and settings** to keep. Everything else
  from both accounts is combined.
- A **Merge Accounts** button with a confirm that says it cannot be undone by them, only
  by an admin, and that both ways of signing in will open the merged account.

**What the server does** (one `POST users/merge` with the offer and the choice):

1. **Check for collisions first** and refuse, naming them, before writing anything:
   both accounts coach or applied to the same tournament, or both hold a staff seat in
   the same tournament. Those need a person to decide.
2. **Combine what can be combined:**
   - planner plans for the same key (the free planner, or the same tournament): one
     document whose plans are both sets, the source's renamed only on a clashing name
   - external drafts with the same slug: the source's draft gets a suffix
   - tier-list import aliases with the same text: keep the kept account's
   - roles: the union; profile fields (Showdown name, timezone, Discord name) blank on
     the kept account filled from the other; the connected Discord moves to the kept
     account
3. **Move every account id** from the merged-away account to the kept one, with the same
   walker the Phase 1b migration uses (every collection, every string field), so
   nothing a schema forgot is missed. Every changed document and path is recorded.
4. **Point the merged-away account's sign-in** (and any sign-in already pointing at it) at
   the kept account in the sign-ins table, clear both from the caches, and remove the
   merged-away user row, keeping a snapshot in the audit record.
5. **Old profile links** to the merged-away account redirect to the kept one.

**Undo is admin-only** (Undo Merge on the admin account page): put back the recorded
documents and paths, restore the user row from the snapshot, and un-point the sign-in.
Anything created after the merge stays with the kept account. Every merge and undo is in
`adminaudits` with both accounts, the person's choice and the time.

**Not covered:** a merge while either account is on the clock in a live draft is
refused, to avoid writing under a running pick.

#### Needs from the owner

- In the Discord application the bot already uses (OAuth2 page): the **client secret**
  for the server's `.env` (`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`), and two
  **redirect addresses**: the local dev one (`http://localhost:4200/settings/discord`)
  and the live one (`/settings/discord` on the site's own address).

**Admin: Transfer Account** (for a hacked or lost sign-in). Built 2026-11-15, uncommitted
at the time; needs Phase 1b's account ids switched on to run. The sign-ins table, with
one addition: a sign-in can be blocked.

- **Lock** comes first and is its own button: the stolen sign-in is blocked at once, so
  whoever holds it is refused on their next request, even with a token already issued.
  The account's data is untouched.
- **Transfer** then points the person's new sign-in at the old account. The person signs
  in the new way first (which makes an empty account); the admin picks the old account
  and the new one by profile id. The new account must be empty, the same rule as above.
- The old account's connected Discord is cleared, so the person connects their new one.
- Every lock and transfer is recorded with the admin, the time and a required note, and
  can be undone: no data is rewritten, only which sign-in reaches the account.
- Owner and admin roles only. Deciding that the person asking is the real owner stays a
  human judgment; the tool only makes the change safe to reverse if that judgment was
  wrong.
- It does not merge two accounts that both hold data. That is still a re-keying script.

### Later

- **Delete account.** Needs a rule for what happens to past seasons (keep the season,
  replace the name with "Deleted Account").
- **Roles in our database**, edited from the admin page, so a change applies at once.
- **A signed-out explanation** on guarded pages in place of an instant bounce to Auth0.

## 5b. Also noted (second review pass, 2026-11-14)

Owner's calls of 2026-11-14 are marked.

**Gaps**

- **No privacy policy or terms page** was found in the client. Once the site stores
  public names, Discord names and chat between strangers, it needs both, plus a stated
  minimum age given the audience. Plan: draft both from what the site actually collects,
  the owner reviews, and a lawyer looks them over before public leagues open if the
  budget allows. Pages at `/privacy` and `/terms`, linked from the footer and from
  Welcome. A privacy policy promises deletion on request, so **Delete Account moves up
  from Later** to ship with them.
- **Report a chat message** (owner: important). A Report action on every message with a
  short reason. Reports go to that tournament's organizers in a list under Manage; a
  report about an organizer goes to site admins. The reported message stays visible until
  someone acts; organizers can delete it, admins can also suspend the account. Goes in
  Phase 4.
- **Display names stay free** (owner, 2026-11-14): two people can both be Ash. The
  verified Discord name is the protection.
- **Organizer and league admin pages put the account id in the browser and in URLs**
  (remove and rename calls). Harmless once Phase 1b makes the id opaque; another reason
  for it.

**What accounts make possible for leagues**

- **Real history on an applicant.** Sign-up asks "have you dropped before?" and trusts
  the answer. With one account per person the site knows: seasons finished, seasons
  left. Show organizers that beside the application.
- **Require a connected Discord to sign up** (owner: yes), as a tournament setting in the
  Sign-Up section, off by default (confirmed 2026-11-19). A coach without one sees
  Connect Discord on the sign-up form. Ships with Phase 6.
- **A league block list** keyed by account, so a removed coach cannot re-apply under a
  new coach name. Not decided.
- **Public profiles** (owner: important). Phase 7 below.
- **Notification preferences**: later. There is no email or push sending yet, so there
  is nothing to set preferences for.

### Phase 7. Public profiles

Built 2026-11-15, uncommitted, run in a browser the same day: `GET profiles/:handle`
(public, 60 a minute per address) and the page at `/profile/:handle`; the Private Profile
switch on the settings page; every rendered handle links to its profile except in the
report lists. What a stranger sees is narrower than this list says: only seasons from
tournaments the organizer completed through Final Results, with the career strip and
achievements recomputed from those alone. External drafts and archives are never shown to
anyone but their owner, and a season a coach completed themselves in a tournament still
running is hidden, because its record includes stages not yet public. The owner always
sees their full profile at their own handle. Open: redirecting an old handle while it is
held, and whether self-completed seasons should show with a public-stages-only record.

Revised 2026-11-17: profiles move from `/profile/:handle` to `/profile/:id` (the user
row's `_id`), and payloads that carried `handle` carry `profileId` for the link.

- A public page per account at `/profile/:id`: display name, the career strip,
  achievements and completed seasons that `/profile` shows its owner today.
- A person's name on a team page, standings, organizer list or chat links to it.
- A **Private Profile** switch on the settings page. A private profile shows only the
  display name.
- It never shows the Discord name, Showdown name or timezone unless a later decision
  adds a switch for each.
- Reaching a profile needs its link. There is still no list or search of people.

## 6. Open decisions

| Decision | Recommendation |
| --- | --- |
| Coach name stays editable per tournament, or locks to the display name | Stays editable; the verified Discord name is what identifies the person |
| Whether a public profile shows the verified Discord name | No by default; a per-person switch later |
| Where the Discord name shows | Decided 2026-11-17: organizers and coaches in the same tournament; no verified mark (Phase 6) |
| Minimum age stated in the terms | 13, matching Discord's and Google's own minimum |
| Tournament and league forms keep asking for the organizer's name | Keep the field, prefilled |

## 7. Risks

- **Google names are real names.** About 65% of accounts will show their Google name
  until they change it. Accepted by the owner (2026-11-17); the settings page is one click
  from the navbar.
- **Phase 5 can stop refresh tokens entirely** if Allow Offline Access is off on the
  DraftZone API. Phase 0 checks it.
