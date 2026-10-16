# Design Principles

The single source for how Pokémon DraftZone should look and feel. When this doc, an old
plan, a review page or a memory disagree, this doc wins.

- **This doc** says what we want and why.
- **CLAUDE.md** says the rules the linters enforce, in the form a contributor needs while coding.
- **The Style Charter** (https://claude.ai/artifact/WtixaW4iUrG8FZkWZ22L1a) is the workbench
  for open questions: mockups side by side, with the owner's verdicts. Once a question is settled
  there, it moves into this doc.
- **`docs/client-refresh-plan.md`** is the history of the 2026-10 refresh: audits, phases and the
  original decision table. It's background reading, not the source of truth.

The goal: every area (drafts, planner, league and tournament, tools, replay) feels like one site,
not a set of separately built tools.

---

## 1. What We're Going For

Five principles, accepted 2026-10-01. Every other rule exists to serve one of these.

1. **The matchup is the hero.** DraftZone is about one team against another. The two-sided
   moments (scoreboard, versus strip, results) get the most care and the most color.
2. **Every screen says what's next.** Your next match, your pick, the action to take.
3. **Calm by default, loud for moments.** Most of the UI is neutral and quiet, so the few loud
   moments mean something.
4. **Built for draft night on a phone.** Dense where it has to be, but readable and tappable on
   a small screen.
5. **Color means something.** Primary and secondary each have a job. Neither is decoration.

### Who it's for

Accepted 2026-10-09 (F7). Each area has a primary audience and a primary device.

| Audience | Main surfaces | Designed for |
| --- | --- | --- |
| Coach on draft night | Draft room, my matchups, my team, score entry | Phone first |
| Organizer | Manage, settings workbench, results, stage builder | Desktop first, usable on phone |
| Spectator or visitor | Tournament landing, standings, brackets, matchups (often from a Discord link) | Phone first |
| Solo player | Planner, tools, Pokémon search, replay analyzer | Desktop first, usable on phone |

Phone first means it's designed at 375px, then widened. Desktop first means it's designed wide,
then checked at 375px for nothing broken.

### The tools come first

Stated by the owner 2026-10-09. The matchup breakdown, replay analyzer and planner are what
players know and love today, even though they sit somewhat apart from the newer league
features. No visual change may cost them a feature or their density. Personality reaches them
through the header, team identity (team 1 and team 2 washes) and sprites, never by taking room
from the data. Tools use compact density (F5).

### Our own look

Accepted 2026-10-09 (F12, option C): no reference apps. Decisions come from these principles,
not from matching Discord, Showdown, Linear or an esports platform. "App X does it this way" is
not a reason on its own.

### Personality: calm chrome, characterful content

Accepted 2026-10-09 (F1), then worked out setting by setting over seven rounds of the Style
Charter's Personality Lab the same day, because three bundled options made it hard to say what
the owner liked. The owner's worry was that calm reads washed out ("would need to shine
elsewhere"). The answer: the chrome stays quiet but not gray, and the personality lives in team
identity and the Pokémon. Every pass checks that the content layers below are actually present,
not just that the chrome is quiet.

**Chrome: quiet, not gray**

- Ground, surfaces and lines carry a faint tint of the theme's primary hue (F9).
- Flat 1px borders, no resting shadows, rounded corners, a neutral navbar.
- Nasalization on page titles and hero numbers only (F6).
- Subtle motion: a highlight that fades on arrival, 1px card lifts (F10).
- **Page headers get a faint diagonal-line backdrop that fades out below the title.** It is one
  switch (a single token), so it can go back to plain, or to another backdrop, in one change.
  Only page headers get it: never empty states, cards or buttons. Team pages use their roster
  pattern instead.
- Type labels stay color pills.

**Team identity**

- Strong team washes (about 28% in light, 40% in dark) on the matchup hero and your row, fading
  toward the middle (a soft fade, not a hard seam). Names stay ink.
- Team logos are uploaded images (the owner expects 80%+). A team without one shows the default
  DraftZone logo, never initials.

**The Pokémon are the art**

- **No ground shadows:** every sprite stands bare. The oval shadow (`grounded`) was removed
  from `pdz-sprite` on 2026-10-15 (owner's call).
- **Roster sprites:** every Pokémon on the team, bare, in draft order. The My Leagues team cards
  stand them in two tiers with the first picks bigger (with empty spots during a draft). Team
  pages don't show them: the league team page dropped its strip and roster pattern on
  2026-10-14 (owner's call, the strip repeated the roster table), and the external draft page
  followed on 10-15 when both pages moved onto one `pdz-team-roster`. Both headers are plain.
- **Season MVP** card on the team page.
- **Shiny sparkle:** faint sparkles behind a shiny sprite that twinkle once on arrival or hover.
  Never a tag.
- **Roster pattern:** a team page's header backdrop is its own roster tiled faintly.
- **Podium** for the top three when a season ends; a **Hall of Fame** shelf of past champions on
  the league page.
- **Pokémon actors** for screen states (F11): Ditto for empty, Slowpoke for waiting, Psyduck for
  errors, Snorlax blocking the way for no access. The message and action stay as F11 says.
- **Draft availability:** anything you can't pick goes gray with a corner badge that says why
  (team logo for taken, block icon for banned). Never a strike-through.
- **Fainted** (score entry, match rosters, replays): faded to about a third, still in color,
  still standing.

**Every sprite treatment must work in all three sprite styles** players pick in Settings: renders
(HOME, the default, plus SV, Serebii and official art), pixel sprites (BW, AFD, Animated) and PMD
headshots. Headshots are 40px portraits on an opaque square with no body, so shadows,
silhouettes, cut-outs and glows can't apply to them directly; each treatment says how it adapts
(for example, the fainted fade dims the whole portrait). Pixel-only ideas, such as crisp
nearest-neighbor scaling, must never touch renders.

**Place sprites by their visible body, not their image canvas.** Every set pads its images
differently, so compositions (face-offs, podiums) should measure each sprite's visible bounds
once and size and position by those. Renders need this most: placed by canvas they overlap and
bury each other. Roster sprites sidestep it by never overlapping: each sprite keeps its own
square, as drawn.

Visible-body sprite placement can't be measured in the browser for most players: Showdown (HOME,
BW and the other PS sets) and Serebii send no CORS headers, so their pixels can't be read. Bounds
have to be measured offline by a script and shipped as generated data. PMD and PokeAPI allow
CORS, but one offline path for every set is simpler.

Still open, to settle in the app's gallery later (none of them blocks the build): a speed
ladder for the matchup breakdown's speed tiers, a season trail (week cards, a results strip, or
folded into the team's schedule; the idea is liked, the first version wasn't), and idle sprite
motion. A weekly MVP on the tournament home is a natural follow-up to the season MVP.
Achievements beyond "winner" are wanted, but as a product feature planned elsewhere, not as part
of this visual work.

### Reference screens

These are candidates, to confirm with the owner. Lift patterns from these when designing
something new:

- Homepage hero: the full-width versus band with the brand lockup.
- Matchup page: the versus strip in `[pdz-page-header-center]`.
- Pokémon search: primary for what you do, secondary for what to notice.

---

## 2. Settled Rules

The owner has decided these and they're applied app-wide. CLAUDE.md has the enforceable detail.

| Rule | Why | Since |
| --- | --- | --- |
| **Surfaces rise, never sink.** ground → raised → raised-high → overlay → floating; only inputs, tracks and empty slots are `inset`. | Cards used to be darker than the page, and nested panels sank below their parent. Closer to the viewer should read as closer. | 10-01 |
| **Page headers sit on the page.** No box and no gradient behind them. The only backdrop is the faint line pattern (P1); `pdz-roster-pattern` stays available for `[pdz-page-header-backdrop]` but no page uses it since 10-15. | A boxed or washed header read as decoration and competed with content. | 10-03 |
| **Light ground is gray-50.** | Compared against gray-25 in the app. | 10-07 |
| **Boxes don't nest.** Inside a card, rows split with a line or space, and groups with space and a heading. | Bordered boxes inside bordered boxes made every screen look like a wireframe. | 10-07 |
| **Two colors, two teams.** Primary is team 1, secondary is team 2, and you are always team 1. Both sides get equal weight. | The theme pair *is* the versus identity. | 10-01 |
| **Do vs notice.** On single-focus pages, primary marks what you do and secondary marks what to notice. | The owner wants both colors across the whole site, not only on matchups. | 10-03 |
| **Status beats team color.** Win/loss/warning use status hues whichever side they're on. | A result has to read the same in every theme. | 10-01 |
| **Your row only.** In a list of many teams, only your row is tinted, with a You tag. | Coloring every row, or your next opponent's, made lists noisy. | 10-01 |
| **Whole-card tints are for alerts.** | A tinted card says "this whole block is the message". | 10-01 |
| **Filled icon when active.** | One active style for tabs, nav, menus, segments and chips. | 10-07 |
| **Calm hover.** Color changes and cards lift 1px; nothing scales. | Scaling made lists jumpy. | 10-01 |
| **Nunito body, Nasalization for moments.** | 13 alternatives were tried; none beat Nunito. | 10-01 |
| **Title Case labels.** Titles, headings, buttons, tabs, nav and menu items. Body text, hints, empty states and toasts stay sentence case. | They're names of things, not sentences. | 10-02 |
| **Every routed page opens with `pdz-page-header`**, and every control is a pdz primitive. | One way to do each thing. | 10-02 |
| **A primitive that's missing something gets extended.** Call sites don't get bespoke styles. | Per-feature styling is what made the site feel like separate tools. | 08-23 |
| **Themes tint surfaces by one formula (F9, P1).** Ground and inset take 6% of the theme's primary, raised rungs 2.5% (1.5% in dark, where the primary is lighter), `border-subtle` 16%; dark `floating` stays neutral to keep muted text above 4.5:1. Text stays neutral ink. Sunset's hand-tuned surfaces and text are gone. | Each theme feels like its own room without hand-tuning, and `check:contrast` verifies every theme. | 10-09 |
| **Strong team washes (P1).** `team1-wash` / `team2-wash` are 28% of the side's hue in light, 36% in dark. | The owner chose them over softer washes in the Personality Lab. | 10-09 |
| **Page-header line backdrop (P1).** Plain-tone page headers paint `header-backdrop`, faint diagonal lines fading below the title, set by one switch (`$-header-backdrop`: `lines` or `none`). Only page headers use it. | Lines were chosen with "an easy way out", so it's one line to change. Switched to `none` the same day: the owner was "not loving them on the header". | 10-09 |
| **Team logos are images (P2).** `pdz-team-logo` always renders an image; a missing or broken one shows the DraftZone logo (`DEFAULT_TEAM_LOGO`). No initials, no team color. | The owner expects 80%+ of teams to upload a logo, and the default logo is the site's own fallback. | 10-09 |
| **One look per sprite state (P4).** `pdz-sprite` owns shiny sparkles and `state`: `fainted` fades, `benched` (not brought to a match, 10-15) grays and dims with no badge, `taken` and `banned` gray out with a corner badge (the taking team's logo, or a block icon) sized to 40% of the sprite between 1rem and 1.5rem. The draft board (taken by team, Ban tier banned), score entry, league matchup games, the replay analyzer's KO timeline and the KO graph all use it; no page grays or fades a sprite by hand. | Each page had its own grayscale and opacity mix, and none said who took a Pokémon. | 10-09 |
| **Roster sprites, kept simple (P5).** `pdz-roster-sprites` shows every Pokémon as a bare sprite in draft order: no floor, shadow, fill or overlap. `layout="tiers"` is the My Leagues team card banner: two rows at a fixed height on a faint `team1-subtle` fade from the top (trial, 10-13: the owner asked for a subtle gradient back), the top row 1.4× bigger with fewer Pokémon so the rows even out (12 → 5 / 7), scaled to fit the card, with empty spots during a draft. The tournament Teams page uses the same card (10-14) with `tone="team2"` (a `team2-subtle` fade) for every team but yours, since the viewer is team 1 and everyone else is the other side (a neutral `state-hover` fade was tried first and swapped the same day); a card there is a link to the team page, with the record and points used, and hidden picks show as empty spots. Your own card is marked by its `team1` fade alone. You-tags are gone site-wide where color already marks you (owner, 10-14: "you tags are not necessary, colors show that anyway"): `pdz-team` lost its `you` input, and standings rows, matchup sides, trade sides and the Draft Pools card rely on the row tint or team 1 color. The default `wrap` is `md` sprites wrapping and centered; the team pages no longer open their Draft Roster card with it (league 10-14, draft 10-15). A page header never holds it. | The staggered team photo (6 / 7 / 6 on a shared floor) read as "fake and AI-slopish"; six rounds in the Team Photo Lab (10-12 to 10-13) ended with the owner choosing "simple and clean rather than complex": the legacy wrap for the roster, and the two tiers (the owner's own idea) for the card. | 10-13 |
| **A team's standout Pokémon (P6).** `pdz-season-mvp`: a bare sprite on a plain card (its `team1-wash` was dropped 10-15), with the eyebrow and hero KO count in `team1-accent` (10-15: it is the page's own team, so team 1, not "something to notice"); the Draft Roster card carries the team's color as a soft `team1-subtle` fade from its top (the table goes `data-surface="clear"` so the fade runs behind it), mirroring the schedule card's `team2-subtle` fade for the opponents (10-15; the Kills-column meters were tried and dropped the same day); most KOs, ties to fewer faints then fewer games; hidden until a Pokémon has a KO. Atop the roster on the league team page and the draft page (direct + indirect KOs there). Both pages render the MVP and the Draft Roster table through one `pdz-team-roster` (10-15), which owns the MVP rule, so the two pages can't drift: the page maps its Pokémon to `TeamRosterLine`s, costs add a points total and the MVP's points line, indirect KOs add a column and count toward the MVP. | A team page should be about the team's Pokémon, not a table of them. | 10-09 |
| **One result mark (P9).** `pdz-result-box` is the only way a result or score shows, and its color says one thing at a time. **Outcome** (`result`): green won, red lost, gray drew: `pdz-record` (`lg` in page headers), form letters and the standings Form column. On a team page a match's outcome is a wash instead of a box: each played match's header line is a rounded strip tinted from `success-container` (at 70%, so it matches the red) or `danger-container` on the left, easing to a fifth of that on the right so the scores sit on a lighter tint; the opened detail below stays on the plain card (10-15: tinting the whole match read heavy once opened), and each game line in it is a small pill with the same wash. `pdz-disclosure` takes the tint through `--pdz-disclosure-header-background` and `--pdz-disclosure-header-radius`. Unplayed matches and draws stay untinted. A low-alpha tint over the full-bleed rows was tried first and read gray and boxy (10-15). The form strip above the schedule was dropped the same day: the tiles already show every result. **Score** (`side`): each number in its side's tinted container, team 1 primary and team 2 secondary: `pdz-matchup` cards and rows, team page match and game lines. A two-sided card where neither team is yours (/schedule, bracket) gets no W/L: the loser's name is muted. Every schedule and bracket card carries a status at its top right in quiet meta text with a small icon (10-15): the match time (or "Due" and the round deadline, the full time in a tooltip), Completed, Advanced, Forfeit (warning ink, replacing the Forfeit chip), or Not Scheduled once both teams are known. Time strings come from `formatMatchTime` in `@pdz/shared/time`, shared with the team page schedule. The hero scoreboard keeps its display-font numerals in team colors as the loud moment, with a small W/L box under each. No trophies, no W/L chips, no hand-colored numbers. | Results were drawn five ways (W/L chip + text score, trophy + plain numbers, team-colored numerals, record boxes, the old tinted score chip). First unified as green/red score boxes (10-15), then split the same day at the owner's suggestion: green/red score boxes mixed "whose number" with "who won", and the two-color rule already gives scores to team colors. | 10-15 |
| **The podium at season end (P7).** `pdz-podium` on the standings page once `seasonEnd` has passed, from the overall standings order; each team's top scorer stands on its step, facing center; the champion's step is the loud one (secondary wash, Nasalization numeral). Known limit: with playoffs, the overall order can differ from who won the final. | Final results are one of the six loud moments, and a finished season had nothing to show for it. | 10-09 |
| **Standings tables fit their content.** The team and Pokémon tables size to their columns and sit side by side, wrapping to stacked when there isn't room (the legacy layout); the podium tops the team column. They never stretch to the page width. | At the full 96rem index width the columns spread apart and the GD/PD pills stretched across empty cells; the owner preferred the legacy layout (10-14). | 10-14 |
| **Pokémon actors for screen states (P8).** `pdz-empty-state` takes `kind`: `empty` (Ditto), `waiting` (Slowpoke), `error` (Psyduck), `no-access` (Snorlax), a bare sprite above the message at `md` and `lg`. `sm` stays an inline icon (the kind supplies one if none is given), so a section with several small empties doesn't repeat a Pokémon. Every full-size empty state sets a kind; the "all caught up" Results state and the organizer-invite confirmations keep icons because they aren't screen states. | The screen states were a wall of different Material icons; one cast of four reads as the same site everywhere and tells you which state you're in at a glance. | 10-09 |
| **Images dim in dark mode.** The `image-tone` token (`brightness(0.9) saturate(0.88)` in dark, identity in light) is applied by `pdz-sprite-image` and `pdz-team-logo`, so every sprite set and uploaded logo gets it. In dark, the navbar logo's plate turns dark (`gray-900`) and its core highlight drops to `gray-125`. | Pokémon art and logos are lit for light backgrounds and glared on dark cards. A wash reaching down to the floor and a spotlight behind the group were also tried; the owner picked dimming. A light gray logo plate blended into the cyan and orange lettering, so the plate went dark. The dark `versus-gradient` (the homepage band) mixes each side 60% toward `ground` and carries light text through `on-versus-gradient`; at full strength it was the brightest block on the site. 60% keeps every theme at AA (lowest 4.73). | 10-09 |
| **Five sprite sizes (S4).** `pdz-sprite`'s `size` is xs 24 · sm 32 · md 48 (the default) · lg 64 · xl 96, from the `pdz.sprite-size()` token; `fill` is the one escape, for layouts that compute the size (two-tier roster sprites, roster pattern, podium, shrinking header strips, fluid grids), and those size the host with the same tokens. Forme cycling is opt-in (`interactive`). Applied 2026-10-11: every sprite moved to the nearest step (28–36 → sm, 40–56 → md or lg by context, 80–128 → xl); the Pokémon search options went to sm to keep their 44px virtual-scroll rows, and the empty-state actors are lg (`md`) and xl (`lg`). | About a dozen ad-hoc sizes (1.75, 2.25, 2.5, 3.25, 3.5, 5.5, 8rem…) made the same Pokémon a slightly different size on every page. | 10-11 |
| **Seven page types (F2, F2a).** Every routed page declares one `type` on `pdz-page`, which sets its width, its section gap (`section-gap`) and its header: **hub** (64rem), **index** (96rem, compact header), **detail** (64rem), **workspace** (full width, fills the height, compact header), **tool** (64rem), **form** (40rem), **dashboard** (96rem). Pages no longer set their own max-width, padding or section gap. Inside the tournament shell the page drops its own padding (`PAGE_SHELL`); `flush` is only for a workspace that owns its edges (the planner). An explicit `compact` on the header still wins. Homepage, Landing, Not Found, External Link and the tournament draft redirect are exempt; `npm run lint` fails any other routed page without a type. Applied 2026-10-11, with these departures from the charter's map, agreed with the owner: the draft page is a dashboard and its header (sprite strip) moved from the drafts shell into the page, so the opponent form and score entry show one header; the draft form, the opponent form (same builder layout) and score entry are detail, not form; the matchup breakdown is a dashboard inside its split view, so the notes and teambuilder panel still slides in beside it; quick matchup is a dashboard (it is the breakdown); the tier list is a workspace (a board of tier columns), not detail. 10-14: the type follows what is on the page, not the area it sits in. My Leagues became a dashboard (feed, career strip, many team cards); a tournament's Draft Pools became a hub (one to four rich pool cards you read, each a way into its draft; at 96rem two pools filled half a row), while Teams, Standings and Trades stay index. | 36 of 57 pages set their own width (90rem by hand in five places, plus 60, 66, 84rem and 900px), so content jumped width and the title moved as you went between areas. | 10-11 |
| **Two densities, set by page type (F5).** Comfortable for hub, detail and form pages; compact for index, workspace, tool and dashboard pages. `pdz-page` sets `data-density` from its type, and the density switches the spacing tokens for everything inside: `section-gap` (24 → 16), `stack` (12 → 8), `card-pad` (16 → 12, the padding of a default `pdz-card` and its header and footer) and the table cells (`cell-block`, `cell-inline`, `cell-edge`). Controls, type and sprites keep their size, so compact never costs a tap target. `data-density` on any element switches its subtree; `pdz-page`'s `density` input is the page-level ask for the other one, and that's when the owner is asked. Tables lost their third (`relaxed`) density. Tools keep their own hand-set spacing; only token-based spacing moves. Applied 2026-10-11. Three comfortable pages already asked for compact tables and keep them: the league team roster, the coach report on the league matchup page, and the tier-list panel in settings. | Spacing was one size everywhere, so tables on index pages were as airy as a team page and dashboards lost a row of data to padding. | 10-11 |
| **Tabs, or a rail when large (F4).** Areas with a handful of sections use tabs under the page header (`pdz-tab-nav`, `pdz-tabs`); areas with many (tournament, with its Manage and Setup groups) use the grouped side rail. The planner keeps its own draft tab strip as a workspace, and tools stand alone. Where you are is neutral, never primary (changed 2026-10-14): `pdz.nav-current` gives ink text and a filled icon; the rail, menu links and section links add a `state-pressed` fill (`state-strong` read too dark), tabs add an ink underline (`pdz.nav-indicator()`), and the planner's active tab keeps its folder shape joined to the page. Primary stays for what you choose or do; on a tournament page `state-selected` is the same blue as your own team (`team1-subtle`), so a primary "you are here" read as "you". Every rail link shows its icon. The draft area needs no tabs: the draft page is already matches and stats together, so the duplicate Team Statistics page was retired for active drafts (`/drafts/:team/stats` redirects to the draft page, and My Leagues cards link straight to it); legacy archives keep it as their only view. Applied 2026-10-11. | Each area moved between its sections differently (buttons, a rail without icons, a bold planner tab), so the site's parts didn't read as one place. | 10-11 |
| **Jump links for one long page (F4a).** A page that is one scroll of named sections (Rules, a tournament's Teams with one section per pool) wraps them in `pdz-page-sections`: a sticky column of links on the left once its content is 768px wide, a sticky strip of links above the content when narrower, and the link for the section in view marked like the rail (`pdz.nav-current`), with an optional count. The page header sits in the content column, so the title lines up with the section headings and the nav column starts level with the title (owner: the title at the page edge with sections pushed over "looks strange being unaligned"); on narrow screens it is title, strip, content. When the page has room, `pdz-page` widens by the nav on both sides, so the content keeps its usual width and sits centered on the page with the nav in the left margin; when it doesn't, the empty right side gives way first and the content never gets narrower than without the nav (owner: centered "only when there's space for it"). It is a wrapper inside any page type, not a page type, because Rules (detail) and Teams (index) need different widths and densities. Teams shows every pool at once instead of a pool switcher. A page with only one section (one pool, a single block of rules) gets no links and no extra width. Applied 2026-10-14. | Rules had a hand-rolled side list that vanished on phones and never showed where you were; Teams hid all but one pool behind a switcher once its cards became compact. | 10-14 |
| **One treatment per screen state (F11).** Loading: `pdz-skeleton-layout` in the shape of what is coming (list, table, cards, form, text, board, chart), announcing "Loading" to screen readers; a spinner only inside a busy button (`pdz-loading` survives only on the tournament draft redirect). Empty: `pdz-empty-state` with the action that fills it. Waiting: says who and when; tournament pages end with the next milestone from the tournament's dates ("Sign-ups close Fri, Oct 17, 8:00 PM.", `waitingMessage()` in `tournament-milestones.ts`). Error: says what did not come back and offers Try Again through `retry="event"` (re-runs the page's load: matchup, manage Results, settings, team page, moves, admin) or `retry="reload"` (reloads the page where it loads once); never "refresh the page" in the copy. No access: says why and where to go. Applied 2026-10-11 (37 loading sites, 16 error states, 5 waiting states). The league team page used to spin forever when its team failed to load; it now shows the error. | Each page had its own spinner, its own error box and "refresh and try again" copy, and waiting screens never said when the wait ends. | 10-11 |
| **Seven type sizes, two weights (S2).** 12 · 14 · 16 · 18 · 24 · 32 · 40: `subtitle` moved 20 → 18, `meta` 13 → 14 (body size, muted), `label-caps` 11 → 12, and the 11px `2xs` size token is gone. Nunito roles are 400 or 600; 700 only on Nasalization (display, headline), and `lint:styles` (`bold-weight`) fails 700 anywhere else outside the display-font allowlist. Uppercase is for eyebrows and group labels; table heads are small muted Title Case (`label-strong`). Applied 2026-10-11 (29 bold weights moved to semibold). | Bold everywhere flattened the hierarchy, and 11/13/20px sizes sat between steps without a reason. | 10-11 |
| **Quiet text is a color, not opacity (S3).** `on-surface-muted` for muted text, `on-surface-disabled` for disabled text. Opacity is for states only: drag placeholders, archived rows, faded and taken sprites, disabled controls, the roster-pattern backdrop. Text on a color fill (a container or a primary block) may still soften with opacity, since the muted ink would not sit on the fill. Applied 2026-10-11 to the tier-list counts and empty text, the Pokémon search hint, the select's selected description, the matchup scoreboard copy and the league landing subtitle. | Opacity over a tinted surface reads as a different gray on every rung and theme. | 10-11 |
| **Status badges are soft tints (S6).** Container fill with on-container text: `pdz-badge` status uses, `pdz-score`, `pdz-record` (W/L boxes moved off the solid positive/negative fills) and the standings Form column (now round, matching the team page's form pips). Notification counts and dots in the navbar stay solid; they ask for attention rather than report a status. Applied 2026-10-11. | Solid green and red boxes were the loudest thing in every header. | 10-11 |
| **Six loud moments (F6).** Only these get solid color fills, gradients, Nasalization or hero-size (32–40px) numbers: the homepage band, the matchup scoreboard, "on the clock" in a live draft, final results and champions, the page title, and your own row or team in a list (tint only). "On the clock" is loud only when it is yours: the drafting room's header carries a solid "You're on the Clock" chip with the countdown, and your pick in the order turns solid primary with a Nasalization clock and "Your Pick"; another team's current pick is a neutral strong fill. `lint:styles` enforces it: `display-font` and `loud-type` (the display/headline roles and `font-size(2xl|3xl)`) fail outside `LOUD_MOMENTS` in `tools/lint-styles.mjs`, which maps each file to a one-line reason; the exceptions there are the tournament name in its rail, the season MVP's KO count, the landing hero, the wheel's pick, the drafts-v2 test page and the gallery. Applied 2026-10-11: the statistics cards' Nasalization headings became section titles and their usage bars lost a primary-to-info gradient; solid status pills (stage builder Live and round badges, chat Organizer badge, Pokémon dialog and search tier tags, league ad Approved and Denied) became soft tints. | Loud only works if little else is; and the one moment that matters most on draft night looked the same whether it was your pick or someone else's. | 10-11 |
| **An external draft looks like a hosted team; My Leagues holds both (D1).** The draft page (`/drafts/:team`) takes the league team page's layout: a plain header (coach · league · format · ruleset, the record at `lg`, and a ⋮ for Edit Team, Planner, Mark Season Completed and Delete; Edit Team moved into the ⋮ on both team pages 10-15; no logo, since external drafts have none), a Schedule card on `pdz-team-season` (`entries`; one section per match about the opponent, since the page's own team is in every match (10-15; the two-sided `pdz-matchup` cards stay on /schedule). Every match sits on the same columns: round, opponent, then the score boxes (played) or the date (unplayed), then actions. An unplayed match is open, with the opponent's whole roster under their name as `pdz-roster-sprites layout="tiers"`, the same two tiers as the My Leagues cards (10-15, replacing a one-line strip) but with `[fade]="false"`: a fade per roster stacked a second colored band under each match's result strip, so the opponent color is one soft `team2-subtle` fade from the top of the whole Schedule card instead. A played match collapses to its line and opens to their roster under their name, with what they brought lit, the rest `benched` and anything that fainted in every game it played `fainted`, and the games stacked on the right under the series score (score boxes, replay icon), then View Matchup. External drafts show no opponent logos (`showLogos` off), since their opponents never have one. On a phone the round, date and actions share the top line and the opponent drops below. The schedule sits in the left column (2fr) with the MVP over the Draft Roster on the right (3fr); a full-width schedule was tried on 10-15 and left a hole beside the short MVP card. The schedule's layout follows its own width (a `team-season` container query at 34rem), so in the side column every match stacks the round above the opponent; no "Next" tag or countdown since 10-15, because coaches often enter the whole season at once and the schedule can't tell which match comes next), and the season MVP over a roster card, the same `pdz-team-roster` as the league team page (the header roster pattern and the card's sprite strip went 10-15). Match actions live in both places the owner picked: a ⋮ on each schedule row and the breakdown page's header. On a phone the schedule comes before the roster, here and on the league team page. `/drafts` became **My Leagues**: a career strip (leagues, all-time record, titles, best finish), a **Feed** of what needs the coach (your pick, matches within three days, drafts within a week; the one loud row is your pick; "You're all caught up" names the next match when empty), two-tier roster cards for active seasons (hosted standing beside the record, form, and a bottom line that follows the phase; no phase chip, since that line already says it, except a solid "Your Pick" over the banner while you are on the clock, 10-13), and **Completed** grouped by year (hosted rows carry the stored outcome and placement, the champion row the one loud tint; external rows their record). My Leagues is a `dashboard` page (96rem, compact) since 10-14, the width and spacing of a tournament's Teams page, so the shared team card looks the same on both (it was a 64rem `hub`; the owner preferred the Teams width). Archive is legacy: seasons are marked **Completed** (owner per tournament, coach per own entry, external from the draft page). Chosen in the Drafts Lab, applied 2026-10-11; plan in `docs/my-leagues-plan.md`. | The draft page and My Drafts looked like a separate product from the league pages, and a finished season had nowhere to live. | 10-11 |
| **Accessibility floor: keep what's automated.** Contrast in every theme (`check:contrast`), the focus-ring mixin, reduced motion through the duration tokens, and whatever the linters already enforce. New accessibility work is not a priority right now. | Owner, F13: "accessibility is not a priority currently". The automated checks cost nothing to keep. | 10-09 |

---

## 3. Accepted, Not Yet Applied

The owner approved these in the Style Charter (S2–S7 on 2026-10-08; F2–F6, F2a, F8–F11 and S1
on 2026-10-09; P1–P8 from the Personality Lab on 2026-10-09). Apply each one app-wide in its own
pass, then move it to §2.

### Personality build order

P1–P8 apply §1's personality, in this order: each step depends on the ones before it. Every step
is built in the `/debug/components` gallery first, then on one real page, and is checked against
the matchup breakdown, replay analyzer and planner, which must keep every feature (§1, "The tools
come first").

| Code | Step |
| --- | --- |
| P1 | Applied 2026-10-09; now in §2 (tint formula, strong washes, header backdrop). |
| P2 | Applied 2026-10-09; now in §2 (logo fallback). |
| P3 | On hold (2026-10-09): sprites stay on their CDNs, and P4/P5 were built with whole-image placement first to see whether bounds are needed. Spacing is tuned per sprite kind (`SpriteService.kind`) instead. **Sprite bounds.** An offline script measures every sprite's visible bounds in each sprite set and writes them as generated data (Showdown and Serebii block browser pixel reads). `pdz-sprite` gains a mode that sizes and places by the body. |
| P4 | Applied 2026-10-09; now in §2 (sprite states). |
| P5 | Applied 2026-10-11 as team photos; replaced 2026-10-13 by roster sprites, now in §2. |
| P6 | Applied 2026-10-09; now in §2 (season MVP and roster pattern). |
| P7 | Podium applied 2026-10-09; now in §2. **Hall of Fame deferred** by the owner: nothing stores a champion yet, so it waits for the league statistics work (hosted-tournaments plan §15.4). |
| P8 | Applied 2026-10-09; now in §2 (screen-state actors). F11's other rules (skeleton loading, "waiting" copy that says who and when, retry on errors) are still to apply. |

### Other accepted rules

| Code | Rule |
| --- | --- |
| S1 | **Lines separate kinds, space separates items.** In image-led lists (rosters, team cards) one line separates the identity header from the rows, and the rows themselves have no lines; sprites mark them. Dense text and number tables keep their row lines. |
| F3 | Started 2026-10-09: `pdz-team` built (inline, row, card, hero; `align="end"` mirrors it) and swapped into team standings, the tournament landing's standings preview, the Teams page cards and trade cards. `pdz-matchup` built 2026-10-10 from two `pdz-team`s in three sizes: `hero` (the league matchup page's scoreboard: versus wash, team-colored numerals or "VS" before a game, both rosters standing grounded and facing each other), `card` (behind `pdz-matchup-card`, so the schedule widget and the bracket; only your side gets the team 1 wash, each side's score sits in a result box and the loser's name goes muted; the trophy was dropped 10-15) and `row` (manage Results, with the status chips and action beside it). The season schedule on the team pages shows one opponent per match (you are in every one), so it takes `pdz-team` rather than `pdz-matchup` (cards were tried for a day on 10-15 and repeated the page's team on every card). The drafts matchup page keeps its compact sprite strip (a tool), now grounded with both sides facing each other. `pdz-pokemon` built 2026-10-10 on top of `pdz-sprite` in the same four sizes on the S4 sprite scale (inline 32, row 48, card 64, hero 96; card stacks the name under a grounded sprite, hero grounds it beside a title-size name): the name, a muted detail line (tier, cost with a muted "pts", type icons; dropped at inline), captain marks after the name read from `capt` (tera, Z, Dynamax, with the types in a tooltip), `[pdz-pokemon-badge]` beside the name and `[pdz-pokemon-meta]` under it; the sprite always faces the name, `align="end"` mirrors it, and `state` passes through to the sprite and mutes the name. Swapped into the league team roster, Pokémon standings, power rankings, the manage-draft turn cards, the Teams page cards (inline; the Capt column folded into the name), trade cards and both trade pick lists, the drafting room's roster slots, the tier list's list view, draft stats and the season detail leaders. Left as they were on purpose: the drafting room's queued choices (rank eyebrow on a primary fill), sprite-only grids and strips, and the tools (planner, matchup breakdown, replay analyzer, quick draft, Pokémon search), which keep their own density. **One look per thing.** A team, a matchup and a Pokémon each get one shared component (`pdz-team`, `pdz-matchup`, `pdz-pokemon`) in a few sizes (inline, row, card, hero), built in the gallery first and then swapped in area by area. Today 8 templates each draw a matchup their own way. Score entry is the existing model: one widget behind draft scoring, coach reports and manage Results. |
| F8 | **Each color system owns one job.** Team color marks sides, actions and what to notice. Status color marks outcomes and problems. Pokémon type color appears only on `pdz-pokemon-type` chips and type-specific charts (type chart, coverage), never as a row fill, border, card tint or background. User-uploaded logos sit on neutral, never framed in team color. When two systems meet on one element, status beats team and team beats type. |
| F9 | Applied 2026-10-09 with P1; now in §2. New work is still reviewed in dark mode first and checked in light before it ships. |
| F10 | **One arrival treatment for live changes.** Motion only explains a change. Anything that arrives live (a pick, a posted score, a message, a status flip) gets a brief `state-selected` highlight that fades over `slow`; with reduced motion it shows without the fade. "You're on the clock" is the one state that stays loud until it ends. |
| S5 | **Numbers carry a muted unit**: "520 pts", "4m 32s". Tabular figures, right-aligned, a real minus sign. |
| S7 | **One chart theme**: no axis lines, faint horizontal gridlines, small muted labels, rounded bar tops, team 1/team 2 colors, tooltips on `floating`. |

---

## 4. Open Questions

Mock these up in the Style Charter before deciding. The **Foundations** group matters most for
"one site". Today the parts feel separate mostly because of page structure and duplicated
components, not because of tokens.

### Foundations

All decided 2026-10-09 and moved to §1–§3 and §6.

### Details

| Code | Question | Recommended |
| --- | --- | --- |
| H6 | Inside head-to-head views, do "notice" uses fall back to neutral so secondary only means team 2? | — |
| B4 | Flatten single-hue gradients on buttons and banners? | — |
| S8 | Corner radii and density, revisited at the end of the refresh | — |

---

## 5. Set Aside

These were rejected in a specific context. Each entry keeps the reason so it isn't pitched again on
its own. Any of them can come back as part of a coherent new direction that changes that context.

| Idea | Context and reason | What would reopen it |
| --- | --- | --- |
| Smaller corners | Shown in isolation while the font was still undecided | The end-of-refresh review (S8) |
| Gradient wash behind page headers | Tried on the drafts pages; read as decoration with no job | A header that is itself a brand moment (F6) |
| Team color on team names | Names in color hurt legibility next to colorful logos | — |
| Team color as edge bars, logo plates or rings | Team logos are already colorful, so a frame fights them | — |
| Secondary reserved only for team 2 | The owner wants both colors across the whole site | H6 may narrow it inside head-to-heads |
| Lists color you and your next opponent | Too busy; replaced by "your row only" | — |
| Patterned team 2 in charts | Not needed with team colors | — |
| Retuning themes for color-vision deficiency | Players who can't read a theme switch themes | Real user reports |
| Reference apps (Discord and Showdown, or esports platforms like start.gg) | F12: the owner chose to decide from DraftZone's own principles | — |
| Hand-tuned theme surfaces (Sunset's orange ground, borders and text) | F9: replaced by one tint formula shared by every theme, which is simpler to design and check | A theme whose identity can't come from the formula |
| Deep tint (a strong hue wash on every surface) | Personality Lab, 10-09: the owner preferred the faint Hue Tint | — |
| Diagonal line pattern across the whole page ground | Personality Lab, 10-09: rejected; header-only and grain variants are still open | — |
| Two-hue rules under the navbar and page titles | Personality Lab, 10-09: rejected as signature lines | — |
| Soft-lift shadows or a tactile bottom edge on cards | Personality Lab, 10-09: flat borders kept | — |
| Initials as a team-logo fallback | 10-09: teams upload images; the fallback is the default DraftZone logo | — |
| Battle Stage (the matchup hero as a games-style battle screen) | 10-09: no live battle view to host it, and doubles or triples need several platforms per side | The replay analyzer's turn-by-turn view |
| Dot-grid or contour-line header textures | Personality Lab, 10-09 | — |
| Other header backdrops (primary wash, two-hue glow, hex grid, Poké Ball arc) | Personality Lab, 10-09: lines chosen; P1 keeps the backdrop one switch so any of these can return | A change of heart, swapped in one line |
| Hard-seam versus split, VS badge | Personality Lab, 10-09: soft fade chosen | — |
| Showdown pixel type labels, dot-and-name type labels | Personality Lab, 10-09: color pills kept | — |
| PMD expression swaps, sprite markers on charts | Personality Lab, 10-09 | — |
| Cut-in band on KOs, pixel-crisp scaling, face-to-face rosters, sprite size by draft cost | Personality Lab, 10-09: not useful enough or didn't read well | — |
| Gray tipped-over fainted sprites, hidden-Pokémon silhouettes | 10-09: fainted looked awful; hidden had no real use | — |
| Oversized cropped aces, silhouette watermarks, type-color glow behind sprites | Personality Lab, 10-09: not loved; the Sprite Studio explores other directions | A sprite concept that needs one of them |
| A full keyboard-navigation audit | Out of scope for the visual refresh | — |
| Esports-broadcast look (team colors and scoreboard styling on most pages) | F1: tools and forms get noisy and team color stops meaning anything | — |
| Pokémon-playful look (rounder, brighter, type colors and illustration throughout) | F1: competes with the sprites and reads less like a competition platform | — |
| Team photo (the roster staggered 6 / 7 / 6 on a shared floor, grounded, aces front and center) | Shipped 10-11, removed 10-13: the ground, shadows and perspective felt "fake and AI-slopish" | — |
| Ground shadow under sprites (`grounded`) | Removed 10-15 everywhere (empty states, MVP, podium, scoreboard, `pdz-pokemon` card and hero): the owner didn't want it | — |
| "Next" tag and countdown on the season schedule | Removed 10-15: coaches enter whole seasons at once, so the guessed next match was often wrong | A reliable next-match signal |
| Team photo alternatives with a floor or staged group (Turntable, Spotlight, Huddle, Parade, Card Fan, Shelf) | Team Photo Lab, 10-12: same faux-realism problem | — |
| Free-form roster art (Mosaic, Prism, Lineup festival bill, Sticker Bomb, Poster) and slot grids (Party Grid, Pop-out, Honeycomb, Logo + Strip) | Team Photo Lab, 10-12: shapes and fills behind sprites, or "boring" uniform slots | — |
| Bento, rank-scaled Lineup, Select Screen (slanted type-wash panels), Slanted Tiers, Select Grid | Team Photo Lab, 10-13: Select Screen was liked for the roster, but the owner chose simple and clean over complex | A roster view that is itself a showcase |
| A page opting one width up from its type | F2a: reopens the per-page choice the page types remove; Dashboard covers the real cases | A page that fits no type, Dashboard included |

The original codes for these (A4, G2, F2 and so on) are in the decision table of
`docs/client-refresh-plan.md`. They are a different series from the Charter's F and S codes.

---

## 6. How Rules Change

- **Look before deciding.** A rule is decided after the owner sees it in the real app (gallery
  first, then one real page), not from a description.
- **Broad over local.** Prefer one rule applied app-wide to a one-off fix on one page.
- **Provisional first.** A new rule starts as guidance, or as a lint *warning* if it's mechanical.
  It becomes a lint error after it has held up in at least two areas.
- **Additive as well as subtractive.** Rules that remove things (no borders, no tints, no
  gradients) make the site consistent but flat. Each pass should also ask what it adds: a moment,
  a signature, a reason for color.
- **When this doc changes**, update CLAUDE.md and the `/debug/components` gallery in the same pass.

### One-site tests

Accepted 2026-10-09 (F14). Run these before calling an area done:

1. **Side by side:** screenshots of any two areas placed together read as one product.
2. **Squint:** blurred, every screen has one focal point, and it's the thing principle 2 says is next.
3. **Phone:** a coach can make a pick and report a score at 375px, one-handed.
4. **Themes:** every primitive in the gallery holds up in all five themes and both modes.
