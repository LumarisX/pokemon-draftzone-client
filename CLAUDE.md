# Pokemon DraftZone — Client

Angular 21 SPA (standalone components, signals). The API lives in the sibling repo
`pokemon-draftzone-server`.

## Commands

| Task | Command |
| --- | --- |
| Dev server | `npm run local-dev` |
| Dev server against deployed API | `npm run api-dev` |
| Production build | `npm run build` |
| Typecheck / compile check | `npx ng build --configuration development` |
| Style token linter | `npm run lint:styles` |
| Regenerate color ramps | `npm run gen:colors` |

Run `npm run lint:styles` after touching any `.scss` — it enforces the token rules below.

### Testing

**Never run bare `jest` or `npm test`.** Unbounded Jest spawns ~23 workers on this
machine and exhausts RAM. A PreToolUse hook blocks it. Use one of:

```
npm run test:safe            # --runInBand --silent, whole suite
npx jest --runInBand src/pdz/shared/menu    # targeted, preferred
```

Roughly 10 scaffolded suites fail with NG0201 on a clean tree, plus
`chat.component.spec.ts` (an `ngx-markdown` ESM transform error). That is the
baseline, not a regression you introduced.

## Layout

```
src/pdz/
  core/       services, guards, interceptors, /debug routes
  layout/     app shell — top navbar, nav context
  shared/     the pdz design system (see below)
  features/   admin, drafts, league-list, league-zone, pages,
              planner, statistics, tier-lists, tools
src/styles/   tokens, tools, mixins, themes, component classes
```

Import via path aliases, never deep relative paths:
`@pdz/core/*`, `@pdz/shared/*`, `@pdz/features/*`, `@pdz/layout/*`, `@pdz/environments/*`.

`strict` and `strictTemplates` are on.

## The pdz design system

`src/pdz/shared/` holds the primitives. **Prefer an existing primitive over
hand-rolled markup.** Current inventory: buttons, chat, data (badge, card, score,
skeleton, sort), dialogs, dropdowns (select, pokemon-search, format, ruleset),
feedback (empty-state, toast), images (icon, sprite, loading), inputs (field,
choice, segmented, slide-toggle, slider), layout (page, tabs, tab-nav, widget,
disclosure, masonry), menu, pipes, tooltip, widgets.

### Hard rules

- **No Angular Material.** Removed 2026-08-22, package uninstalled. Do not reintroduce it.
- **No Tailwind.** Not installed; do not add utility classes.
- **No explanatory code comments.** Write code that reads without them. (Some older
  files still carry comments — leave those alone unless you are rewriting the block.)
- **`@angular/cdk` is allowed only for drag-drop, table, scrolling, clipboard, and
  coercion.** All overlay/popover work goes through pdz primitives on the native
  popover API. There are no `cdk/overlay` usages left; do not add one.

### Controls

| Instead of | Use |
| --- | --- |
| `<button>` | `<button pdz-button>` (attribute selector; also `a[pdz-button]`, `label[pdz-button]`) |
| `<input>` / `<textarea>` | `<input pdz-input>` inside `label[pdz-field]` or `div[pdz-field]` |
| `<select>` | `<pdz-select>` + `<pdz-option>` — **the only dropdown primitive** |
| checkbox / radio | `<input pdz-checkbox>` / `<input pdz-radio>`, or `label[pdz-check]` |
| icons | `<pdz-icon name="...">` — always, never a raw glyph or `<img>` |

There are zero native `<select>` elements left in `src/pdz`. Keep it that way.

`pdz-select` notes: `searchable` adds a filter box (use it for long lists);
`showGroupInTrigger` (default true) prefixes the trigger with the option's group;
`disabled` is a `model()` so it needs `[disabled]="true"`, not a bare attribute.

When a control replaces a native one that a `<label for="...">` pointed at, remove
the now-dangling `for` and give the control an explicit `aria-label` — pdz controls
generate their own internal ids.

### Styles

Every component stylesheet starts `@use "pdz-theming" as pdz;` and uses token
functions, never literals:

```scss
padding: pdz.space(md);              // not 12px
color: pdz.color(on-surface);        // not #ccc
border-radius: pdz.shape(corner-sm);
@include pdz.text(body-sm);          // typography; @include pdz.caps for small-caps
font-size: pdz.font-size(sm);        // when you need size alone
transition: color pdz.duration(fast) pdz.easing(standard);
```

- `src/styles/tokens/_color.scss` is **generated** — edit the generator and run
  `npm run gen:colors`, never the file.
- Color ramp steps are semantic roles shared across hues (`soft`/`accent`/`strong`
  are roles, not lightness levels).
- SCSS `font-size` on `pdz-icon` does nothing — size it via the `size`/`width`/`height` inputs.
- Selection and active states use theme colors, not hardcoded highlights.

## Verification

`src/pdz/core/debug/` serves a component gallery at `/debug/components` (and a sprite
browser at `/debug/sprites`) — the reference for every primitive's variants. When you
add or change a primitive, update the gallery in the same pass; it is what visual
sweeps get checked against.

Route paths are constants in `src/pdz/core/route-paths.ts`, not string literals.

There is no Playwright in this repo (it has been driven via an MCP server in the
past). If it is unavailable, say so rather than implying a visual check happened.

## Gotchas

- Unrouted components are not compiled by `ng build`, so a clean build does not prove
  an orphaned component still typechecks.
- Prettier is a dependency but does not run on save; output may not be Prettier-clean.
- A feature area can take over the global navbar's mobile hamburger via
  `NavContextService` instead of shipping its own drawer.
