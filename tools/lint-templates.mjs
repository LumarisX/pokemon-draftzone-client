import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SCAN = join(ROOT, "src", "pdz");

const PRIMITIVE_SOURCES = [
  "src/pdz/shared/inputs/",
  "src/pdz/shared/dropdowns/",
  "src/pdz/shared/data/",
  "src/pdz/shared/images/",
  "src/pdz/shared/layout/",
];

const INLINE_EDITORS = [
  "src/pdz/features/drafts/draft-overview/draft-form/components/chip-input/",
  "src/pdz/features/planner/planner.component.html",
  "src/pdz/features/planner/team/team.component.html",
  "src/pdz/features/tools/wheel/",
];

const POINTER_ENHANCEMENTS = [
  "src/pdz/features/drafts/draft-overview/draft-form/components/team-editor/team-editor.component.html",
  "src/pdz/features/tier-lists/tier-list/tier-list-form/tier-list-form.component.html",
];

const IMAGE_EDITORS = [
  "src/pdz/features/league-zone/logo-field/",
  "src/pdz/features/league-zone/dialogs/team-edit-dialog/",
];

const OWNER_TEST_PAGES = [
  "src/pdz/features/drafts/drafts-v2/",
  "src/pdz/features/drafts/opponent-overview/opponent-score-v2/",
];

const LEGACY_DRAFT_PAGES = ["src/pdz/features/drafts/legacy/"];

const ALLOW_BY_RULE = {
  "secondary-button": [...OWNER_TEST_PAGES, ...LEGACY_DRAFT_PAGES],
  "click-non-interactive": [...PRIMITIVE_SOURCES, ...POINTER_ENHANCEMENTS],
  "text-input-primitive": [...PRIMITIVE_SOURCES, ...INLINE_EDITORS],
  "logo-img": [...PRIMITIVE_SOURCES, ...IMAGE_EDITORS],
};

const NON_INTERACTIVE = new Set([
  "div", "span", "li", "ul", "img", "pdz-icon", "td", "tr", "p",
  "section", "article", "header", "footer", "aside",
]);

const TEXT_TYPES = /^(text|search|email|url|tel|password|number|range|checkbox|radio)$/;

const RULES = [
  {
    id: "native-select",
    test: (el) => el.name === "select",
    msg: "use <pdz-select> with <pdz-option>; it is the only dropdown primitive",
  },
  {
    id: "button-router-link",
    test: (el) => el.name === "button" && /\brouterLink\b/.test(el.attrs),
    msg: "navigation belongs on <a pdz-button [routerLink]>, not a button",
  },
  {
    id: "router-link-non-anchor",
    test: (el) => !["a", "area", "button"].includes(el.name) && /\[?routerLink\]?=/.test(el.attrs),
    msg: "routerLink belongs on an <a>; anything else is not reachable as a link",
  },
  {
    id: "route-literal",
    test: (el) => /\brouterLink="\/[^"]/.test(el.attrs),
    msg: "absolute route literal; use a constant from @pdz/core/route-paths or a relative link",
  },
  {
    id: "ng-class",
    test: (el) => /\[ngClass\]=/.test(el.attrs),
    msg: "use [class.name]=\"…\" or [class]=\"…\" instead of [ngClass]",
  },
  {
    id: "html-comment",
    test: (el) => el.name === "!--",
    msg: "no comments in templates; delete dead markup instead of commenting it out",
  },
  {
    id: "angular-material",
    test: (el) => /^mat-/.test(el.name) || /\bmatTooltip\b|\bmat-icon\b|\bmat-button\b/.test(el.attrs),
    msg: "Angular Material was removed; use the pdz primitive",
  },
  {
    id: "secondary-button",
    test: (el) => /\bpdz-button\b/.test(el.attrs) && /(^|\s)(color="secondary"|\[color\]="'secondary'")/.test(el.attrs),
    msg: "buttons are primary or neutral; secondary is team 2 or something to notice, never an action",
  },
  {
    id: "svg-icon-input",
    test: (el) => el.name === "pdz-icon" && /\bsvgIcon\b/.test(el.attrs),
    msg: "pdz-icon has no svgIcon input; use name",
  },
  {
    id: "click-non-interactive",
    test: (el) =>
      NON_INTERACTIVE.has(el.name) &&
      /\(click\)=/.test(el.attrs) &&
      !/\brole="|\[attr\.role\]|\btabindex=|\[tabindex\]|aria-hidden="true"/.test(el.attrs),
    msg: "(click) on a non-interactive element; use a <button> (or <a> to navigate), or mark a dismiss backdrop aria-hidden=\"true\"",
  },
  {
    id: "text-input-primitive",
    test: (el) => {
      if (el.name === "textarea") return !/\bpdz-input\b/.test(el.attrs);
      if (el.name !== "input") return false;
      if (/\bpdz-(input|checkbox|radio)\b/.test(el.attrs)) return false;
      const type = (el.attrs.match(/\btype="([\w-]+)"/) || [, "text"])[1];
      return TEXT_TYPES.test(type);
    },
    msg: "native field without the primitive; use <input pdz-input> in label[pdz-field], pdz-checkbox / pdz-radio, or pdz-slider",
  },
  {
    id: "logo-img",
    test: (el) => el.name === "img" && /class="[^"]*logo/.test(el.attrs),
    msg: "team and league logos go through <pdz-team-logo [src] [name]>",
  },
  {
    id: "img-alt",
    test: (el) => el.name === "img" && !/(^|\s)(\[?alt\]?|\[attr\.alt\])=/.test(el.attrs),
    msg: "<img> needs alt (alt=\"\" when decorative)",
  },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".html") || (name.endsWith(".ts") && !name.endsWith(".spec.ts"))) out.push(p);
  }
  return out;
}

function templateOf(file, text) {
  if (file.endsWith(".html")) return { source: text, offset: 0 };
  const m = text.match(/template:\s*`([\s\S]*?)`/);
  if (!m) return null;
  return { source: m[1], offset: text.slice(0, m.index + m[0].indexOf("`") + 1).split(/\r?\n/).length - 1 };
}

function elements(source) {
  const out = [];
  for (const m of source.matchAll(/<!--|<([a-zA-Z][\w-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g)) {
    const name = m[0] === "<!--" ? "!--" : m[1].toLowerCase();
    out.push({ name, attrs: (m[2] ?? "").replace(/\s+/g, " "), index: m.index });
  }
  return out;
}

const allowed = (id, rel) => (ALLOW_BY_RULE[id] ?? []).some((prefix) => rel.startsWith(prefix));

let violations = 0;

for (const file of walk(SCAN)) {
  const rel = relative(ROOT, file).split(sep).join("/");
  const tpl = templateOf(file, readFileSync(file, "utf8"));
  if (!tpl) continue;
  const lines = tpl.source.split(/\r?\n/);
  for (const el of elements(tpl.source)) {
    for (const rule of RULES) {
      if (allowed(rule.id, rel) || !rule.test(el)) continue;
      const line = tpl.source.slice(0, el.index).split(/\r?\n/).length;
      console.error(`${rel}:${line + tpl.offset}  ${rule.id}: ${rule.msg}\n    ${lines[line - 1].trim()}`);
      violations++;
    }
  }
}

if (violations) {
  console.error(`\n${violations} template violation(s).`);
  process.exit(1);
}
console.log("lint-templates: clean");
