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

- **Standing on the ground:** a soft oval shadow under each sprite.
- **Team photos:** the roster posed on a shared floor, staggered (see below). On cards: My Drafts,
  and opponent cards on the draft page (on the team 2 wash), with empty spots during a draft. Not
  in page headers: tried as the draft page's header banner and inside the header bar 2026-10-09,
  and the owner judged it wrong there. Instead the team stands in one row of grounded sprites
  in the header bar's center slot, between the title and the record, taking only the leftover
  space and shrinking to fit (no full-width strip row of its own).
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
(for example, a ground shadow sits under the portrait frame). Pixel-only ideas, such as crisp
nearest-neighbor scaling, must never touch renders.

**Place sprites by their visible body, not their image canvas.** Every set pads its images
differently, so compositions (team photos, face-offs, podiums) measure each sprite's visible
bounds once and size and position by those. Renders need this most: placed by canvas they
overlap and bury each other. Team photos are staggered so no Pokémon stands directly behind
another. A photo holds up to fourteen, in up to three rows that stand close together, each a
little smaller and higher than the one in front (twelve stand 5 / 4 / 3, fourteen 5 / 4 / 5). All
rows share one ground that fades out just behind the back row, so nobody stands in the sky. The first picks fill the front row from the center out, and each later
row stands in the gaps of the row in front. Sprites scale down to fit the card rather than crowd
it, and anything past fourteen goes in a "+N more" chip.

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
| **Page headers sit on the page.** No box and no gradient behind them. The only backdrop is the faint line pattern (P1) or a team page's roster pattern. | A boxed or washed header read as decoration and competed with content. | 10-03 |
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
| P4 | Built 2026-10-09 and in the gallery: `grounded`, automatic shiny sparkles, and `state` (`fainted`, `taken` with `takenLogo`/`takenBy`, `banned`). Not yet wired into the draft board, score entry or replays. **`pdz-sprite` treatments.** Ground shadow, shiny sparkle, the draft-availability badge, and the fainted fade, each adapting to renders, pixel sprites and headshots. |
| P5 | On My Drafts (2026-10-09): every draft and tournament card opens with a team photo of up to fourteen (in the order the team was entered) through a new `pdz-card-media` slot, plus a "+N more" chip whose tooltip names the rest. Raised from six to fourteen the same day at the owner's request. On the draft page (`/drafts/:slug`): each opponent card opens with the opponent's photo on `side="team2"`; your team is a row of grounded sprites inside the header bar (a header photo was tried and dropped; the old full-width strip wasted a row). League team page still to do. **`pdz-team-photo`.** The staggered team photo, with empty spots during a draft. Used on My Drafts cards and the team page banner. |
| P6 | Built 2026-10-09. `pdz-season-mvp` (shared): a grounded sprite, a `secondary-accent` eyebrow and a hero KO count; most KOs, ties to fewer faints then fewer games; hidden until a Pokémon has a KO. On the draft page's Stats column (direct + indirect KOs) and atop the league team page's roster (kills from each Pokémon's record). `pdz-roster-pattern` in the page header's new `[pdz-page-header-backdrop]` slot: the roster tiled faintly at a slight tilt, fading out toward the title; on the league team page. **Team page.** Roster-pattern header and the season MVP card. |
| P7 | **Season end.** The podium on final standings and the Hall of Fame on the league page. |
| P8 | **Pokémon actors** in `pdz-empty-state` and the other F11 screen states. |

### Other accepted rules

| Code | Rule |
| --- | --- |
| F2, F2a | **Seven page types.** Every routed page declares exactly one type through `pdz-page`, which sets its width, header style and section spacing: **Hub** (default width; My Drafts, league and tournament home), **Index** (wide; teams, schedule, standings, lists), **Detail** (default; one team, one matchup, one draft, settings workbench sections), **Workspace** (full, fills the height; planner, drafting room, editors), **Tool** (default, input first), **Form** (narrow; create, sign up), **Dashboard** (wide, a grid of panels; the matchup breakdown in drafts and tournaments, draft stats, the replay analyzer, Pokémon search). Homepage, Not Found and External Link keep their own layouts. The full page map is in the Style Charter under F2; 36 of 57 entries set their own width today. |
| F6 | **Six loud moments.** Only these get color fills, gradients, Nasalization or hero-size numbers: the homepage band, the matchup scoreboard, "on the clock" in a live draft, final results and champions, the page title, and your own row or team in a list (tint only). Exceptions are expected (owner note): each one goes on the `display-font` lint allowlist with a one-line reason, the same way the linters handle other one-offs. |
| S1 | **Lines separate kinds, space separates items.** In image-led lists (rosters, team cards) one line separates the identity header from the rows, and the rows themselves have no lines; sprites mark them. Dense text and number tables keep their row lines. |
| F3 | **One look per thing.** A team, a matchup and a Pokémon each get one shared component (`pdz-team`, `pdz-matchup`, `pdz-pokemon`) in a few sizes (inline, row, card, hero), built in the gallery first and then swapped in area by area. Today 8 templates each draw a matchup their own way. Score entry is the existing model: one widget behind draft scoring, coach reports and manage Results. |
| F4 | **Tabs, or a rail when large.** Areas with a handful of sections (a draft, a team) use tabs under the page header; areas with many (tournament, manage) use the grouped side rail. The planner keeps its own tab strip as a workspace, and tools stay standalone. All share one active style: primary text, filled icon, soft tint. |
| F5 | **Two densities, set by page type.** Comfortable for Hub, Detail and Form pages; compact for Index tables, Workspace, Tool and Dashboard pages. A page can ask for the other one, and that's when the owner is asked. |
| F8 | **Each color system owns one job.** Team color marks sides, actions and what to notice. Status color marks outcomes and problems. Pokémon type color appears only on `pdz-pokemon-type` chips and type-specific charts (type chart, coverage), never as a row fill, border, card tint or background. User-uploaded logos sit on neutral, never framed in team color. When two systems meet on one element, status beats team and team beats type. |
| F9 | Applied 2026-10-09 with P1; now in §2. New work is still reviewed in dark mode first and checked in light before it ships. |
| F10 | **One arrival treatment for live changes.** Motion only explains a change. Anything that arrives live (a pick, a posted score, a message, a status flip) gets a brief `state-selected` highlight that fades over `slow`; with reduced motion it shows without the fade. "You're on the clock" is the one state that stays loud until it ends. |
| F11 | **One treatment per screen state.** Loading: `pdz-skeleton` shaped like the content, a spinner only inside a busy button. Empty: `pdz-empty-state` with the action that fills it. Waiting: says who or what and when ("Draft starts Fri 8 PM"). Error: says what failed, with a retry. No access: says why and where to go. Every page designs all of them. |
| S2 | **Seven type sizes**: 12 · 14 · 16 · 18 · 24 · 32 · 40. Meta lines are body size in the muted color. Weights 400 and 600, with 700 only on Nasalization moments. Uppercase only for eyebrows; table heads become small muted Title Case. |
| S3 | **Quiet text is a color, not opacity.** `on-surface-muted` for muted text and `on-surface-disabled` for disabled text. Opacity only for states (drag placeholders, archived rows, faded sprites). |
| S4 | **Five sprite sizes**: xs 24 · sm 32 · md 48 · lg 64 · xl 96, through a `size` input on `pdz-sprite`. |
| S5 | **Numbers carry a muted unit**: "520 pts", "4m 32s". Tabular figures, right-aligned, a real minus sign. |
| S6 | **Status badges are soft tints**: container fill with on-container text. |
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
