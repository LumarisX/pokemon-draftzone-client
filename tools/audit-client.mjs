import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep, dirname, basename } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src", "pdz");
const args = new Set(process.argv.slice(2));

const CODES = [
  ["hdr", "routed page without `<pdz-page-header>`"],
  ["ctl", "native control without a pdz attribute"],
  ["a11y", "click handler or `routerLink` on a non-interactive element"],
  ["img", "raw `<img>`"],
  ["tbl", "`<table>` without `pdz-table`"],
  ["card", "hand-rolled card block (raised fill + border + radius)"],
  ["lvl", "legacy `--pdz-level-*` shadow"],
  ["shadow", "`box-shadow` that is not none, an elevation token or a focus ring"],
  ["w", "raw `font-weight`"],
  ["2px", "2px border"],
  ["mq", "raw `@media` width query"],
  ["sp", "raw length in margin/padding/gap/inset"],
  ["rad", "raw `border-radius`"],
  ["lit", "color literal"],
  ["imp", "`!important` / `::ng-deep`"],
  ["nasa", "Nasalization (display font) outside a title or big number role"],
  ["hov", "hover that scales or lifts more than 1px"],
  ["tint", "`pdz-card` tinted with `color=`"],
  ["B", "secondary color to classify"],
  ["rel", "deep relative import"],
  ["cm", "`CommonModule`"],
  ["dec", "decorator API"],
  ["sub", "manual unsubscribe"],
  ["bs", "`BehaviorSubject`"],
  ["push", "no `OnPush`"],
  ["any", "`any`"],
  ["log", "`console.log`"],
  ["route", "route literal"],
  ["cmt", "comment lines"],
];

const PAGE_HEADER_EXEMPT = new Set([
  "features/pages/homepage/homepage.component",
  "features/pages/landing/landing.component",
  "features/pages/not-found/not-found.component",
  "features/pages/external-link/external-link.component",
  "features/league-zone/tournaments/tournament-draft/tournament-draft.component",
  "features/planner/planner.component",
]);

const ALLOW = {
  ctl: [
    "shared/inputs/",
    "shared/dropdowns/select/",
    "shared/dropdowns/pokemon-search/",
    "shared/data/chip/",
    "shared/data/sort/",
    "shared/layout/tabs/",
    "shared/layout/disclosure/",
  ],
  img: ["shared/images/", "shared/dropdowns/select/"],
  a11y: ["shared/images/sprite/"],
  card: ["shared/layout/", "shared/data/card/"],
  nasa: ["shared/layout/page-header/"],
};

const allowed = (code, unit) => (ALLOW[code] ?? []).some((prefix) => unit.startsWith(prefix));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|html|scss)$/.test(name) && !/\.spec\.ts$/.test(name)) out.push(p);
  }
  return out;
}

const rel = (p) => relative(SRC, p).split(sep).join("/");
const unitOf = (p) => rel(p).replace(/\.(ts|html|scss)$/, "");

function stripStrings(line) {
  return line.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""');
}

function commentLines(text, kind) {
  let n = 0;
  if (kind === "html") {
    for (const m of text.matchAll(/<!--[\s\S]*?-->/g)) n += m[0].split("\n").length;
    return n;
  }
  let inBlock = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (inBlock) {
      n++;
      if (line.includes("*/")) inBlock = false;
      continue;
    }
    const code = stripStrings(line);
    if (/^\/\*/.test(code) || /[;{}]\s*\/\*/.test(code)) {
      if (/eslint|prettier-ignore|@ts-/.test(line)) continue;
      n++;
      if (!code.includes("*/")) inBlock = true;
      continue;
    }
    const idx = code.search(/(^|[^:\\])\/\//);
    if (idx === -1) continue;
    if (/eslint|prettier-ignore|@ts-|^\/\/\/\s*</.test(line)) continue;
    if (kind === "scss" && /url\(/.test(code)) continue;
    n++;
  }
  return n;
}

function scssBlocks(text) {
  const blocks = [];
  const stack = [];
  let buf = "";
  for (const ch of text.replace(/\/\/[^\n]*/g, "")) {
    if (ch === "{") {
      stack.push({ selector: buf.trim(), decls: [] });
      buf = "";
    } else if (ch === "}") {
      const b = stack.pop();
      if (b) {
        b.decls.push(...buf.split(";").map((d) => d.trim()).filter(Boolean));
        blocks.push(b);
      }
      buf = "";
    } else if (ch === ";") {
      if (stack.length) stack[stack.length - 1].decls.push(buf.trim());
      buf = "";
    } else buf += ch;
  }
  return blocks;
}

const LEN = /(?<![\w.(-])-?\d*\.?\d+(px|rem|em)(?![\w-])/;

function auditScss(text, f) {
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.replace(/\/\/.*$/, "");
    if (/var\(--pdz-level-/.test(line)) f.lvl++;
    if (/^\s*box-shadow\s*:/.test(line) && !/var\(--pdz-level-/.test(line)) {
      const v = line.split(":").slice(1).join(":");
      if (!/^\s*(none|inherit|initial|unset)\s*;?\s*$/.test(v) && !/^\s*var\(--pdz-[\w-]+(,\s*none)?\)\s*;?\s*$/.test(v) && !/focus|outline|0 0 0 \d+px/.test(v))
        f.shadow++;
    }
    if (/^\s*font-weight\s*:/.test(line) && !/pdz\.font-weight|--pdz-font-weight|inherit/.test(line)) f.w++;
    if (/^\s*border(-(top|bottom|left|right|block|inline)(-(start|end))?)?(-width)?\s*:\s*[^;]*\b2px\b/.test(line)) f["2px"]++;
    if (/@media[^{]*(max|min)-width\s*:\s*\d/.test(line)) f.mq++;
    const sp = line.match(/^\s*(margin|padding|gap|row-gap|column-gap|inset|top|left|right|bottom)(-[\w-]+)?\s*:\s*([^;]+)/);
    if (sp) {
      const vals = sp[3].replace(/calc\([^)]*\)|var\([^)]*\)|pdz\.[\w-]+\([^)]*\)/g, "").trim().split(/\s+/);
      for (const v of vals) if (LEN.test(v) && !/^-?1px$/.test(v)) f.sp++;
    }
    const rad = line.match(/^\s*border(-[\w-]+)?-radius\s*:\s*([^;]+)/);
    if (rad && !/pdz\.shape|--pdz-shape|inherit/.test(rad[2]) && LEN.test(rad[2])) f.rad++;
    if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d|\bhsla?\(\s*\d/.test(line)) f.lit++;
    if (/!important|::ng-deep/.test(line)) f.imp++;
    if (/pdz\.color\(\s*(on-)?secondary/.test(line) || /--pdz-color-(on-)?secondary/.test(line)) f.B++;
    if (/font-family\s*:\s*[^;]*(pdz\.font\(display\)|--pdz-font-display|Nasalization)/.test(line)) f.nasa++;
  }
  for (const b of scssBlocks(text)) {
    const decls = b.decls.join(";");
    if (/(^|:)hover/.test(b.selector)) {
      if (/transform\s*:[^;]*scale\(/.test(decls)) f.hov++;
      const ty = decls.match(/translateY\(\s*-?(\d*\.?\d+)(px|rem)/);
      if (ty && (ty[2] === "rem" ? Number(ty[1]) * 16 : Number(ty[1])) > 1) f.hov++;
    }
    if (/background(-color)?\s*:\s*pdz\.color\((raised|raised-high)\)/.test(decls) && /border\s*:\s*1px solid/.test(decls) && /border-radius/.test(decls))
      f.card++;
  }
}

function auditHtml(text, f) {
  const tags = [...text.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gis)];
  for (const [, tag, attrsRaw] of tags) {
    const t = tag.toLowerCase();
    const attrs = attrsRaw.replace(/\s+/g, " ");
    if (t === "button" && !/\bpdz-(button|menu-item|tab-link|card)\b|\bpdz-menu-trigger\b/.test(attrs)) f.ctl++;
    if (t === "input" && !/\bpdz-(input|checkbox|radio)\b/.test(attrs) && !/type="(file|hidden)"/.test(attrs)) f.ctl++;
    if ((t === "textarea" || t === "select") && !/\bpdz-input\b/.test(attrs)) f.ctl++;
    if (["div", "span", "li", "img", "pdz-icon", "td", "tr", "p", "section", "article", "header"].includes(t) && /\(click\)=/.test(attrs) && !/\brole="(button|option|tab|menuitem|link|checkbox|switch)"|\[attr\.role\]/.test(attrs)) f.a11y++;
    if (/\brouterLink\b/.test(attrs) && !["a", "area"].includes(t) && !/\bpdz-(tab-link|menu-item)\b/.test(attrs)) f.a11y++;
    if (t === "img") f.img++;
    if (t === "table" && !/pdz-table/.test(attrs)) f.tbl++;
    if (/^pdz-card$|pdz-card/.test(t === "pdz-card" ? t : attrs) && /\s\[?color\]?="(?!danger|warning|info|success|neutral)/.test(attrs)) f.tint++;
    if (/\bcolor="secondary"|\[color\]="'secondary'"/.test(attrs)) f.B++;
    if (/\brouterLink="\/[\w]/.test(attrs)) f.route++;
  }
}

function auditTs(text, f) {
  const code = text.split(/\r?\n/).map(stripStrings).join("\n");
  f.rel += (text.match(/from\s+['"]\.\.\/\.\.\//g) || []).length;
  if (/\bCommonModule\b/.test(code)) f.cm++;
  f.dec += (code.match(/@(Input|Output|ViewChild|ViewChildren|ContentChild|ContentChildren|HostListener|HostBinding)\(/g) || []).length;
  f.sub += (code.match(/takeUntil\(this\.\w*destroy|\.unsubscribe\(\)/gi) || []).length;
  f.bs += (code.match(/new BehaviorSubject\b/g) || []).length;
  if (/@Component\(/.test(code) && !/ChangeDetectionStrategy\.OnPush/.test(code)) f.push++;
  f.any += (code.match(/(:\s*any\b|<any>|\bas any\b|\bany\[\])/g) || []).length;
  f.log += (code.match(/console\.log\(/g) || []).length;
  f.route += (text.match(/navigate(ByUrl)?\(\s*\[?\s*['"`]\/\w/g) || []).length;
  f.route += (text.match(/routerLink:\s*['"`]\/\w/g) || []).length;
}

function resolveImport(fromFile, spec) {
  let base;
  if (spec.startsWith("@pdz/")) {
    const [, area, ...rest] = spec.split("/");
    base = join(SRC, area, ...rest);
  } else if (spec.startsWith(".")) {
    base = join(dirname(fromFile), spec);
  } else return null;
  for (const candidate of [`${base}.ts`, join(base, "index.ts")]) if (existsSync(candidate)) return candidate;
  return null;
}

function routeFiles() {
  const out = [];
  for (const p of walk(SRC).filter((f) => /routes?\.ts$/.test(f))) {
    const text = readFileSync(p, "utf8");
    const imports = new Map();
    for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
      const target = resolveImport(p, m[2]);
      if (!target) continue;
      for (const name of m[1].split(",").map((s) => s.trim().split(/\s+as\s+/).pop()).filter(Boolean)) imports.set(name, target);
    }
    const units = new Set();
    for (const m of text.matchAll(/\bcomponent:\s*(\w+)/g)) {
      const target = imports.get(m[1]);
      if (target) units.add(unitOf(target));
    }
    for (const m of text.matchAll(/loadComponent:\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const target = resolveImport(p, m[1]);
      if (target) units.add(unitOf(target));
    }
    out.push(units);
  }
  return out;
}

function templateOfUnit(entry) {
  const html = entry.files.filter((p) => p.endsWith(".html")).map((p) => readFileSync(p, "utf8")).join("\n");
  const ts = entry.files.filter((p) => p.endsWith(".ts")).map((p) => readFileSync(p, "utf8")).join("\n");
  return html + ts;
}

function selectorIndex() {
  const index = new Map();
  for (const [u, entry] of units) {
    for (const p of entry.files.filter((f) => f.endsWith(".ts"))) {
      const m = readFileSync(p, "utf8").match(/selector:\s*['"]([\w-]+)['"]/);
      if (m) index.set(m[1], u);
    }
  }
  return index;
}

function rendersPageHeader(u, selectors, seen = new Set()) {
  if (seen.has(u)) return false;
  seen.add(u);
  const entry = units.get(u);
  if (!entry) return false;
  const tpl = templateOfUnit(entry);
  if (/<pdz-page-header\b/.test(tpl)) return true;
  for (const m of tpl.matchAll(/<(pdz-[\w-]+)\b/g)) {
    const child = selectors.get(m[1]);
    if (child && rendersPageHeader(child, selectors, seen)) return true;
  }
  return false;
}

const units = new Map();
const empty = () => Object.fromEntries(CODES.map(([c]) => [c, 0]));

for (const p of walk(SRC)) {
  const u = unitOf(p);
  if (!units.has(u)) units.set(u, { f: empty(), files: [] });
  const entry = units.get(u);
  entry.files.push(p);
  const text = readFileSync(p, "utf8");
  if (p.endsWith(".scss")) auditScss(text, entry.f);
  if (p.endsWith(".html")) auditHtml(text, entry.f);
  if (p.endsWith(".ts")) {
    auditTs(text, entry.f);
    const tpl = text.match(/template:\s*`([\s\S]*?)`/);
    if (tpl) auditHtml(tpl[1], entry.f);
    const sty = text.match(/styles:\s*\[?\s*`([\s\S]*?)`/);
    if (sty) auditScss(sty[1], entry.f);
  }
  entry.f.cmt += commentLines(text, p.split(".").pop());
}

for (const [u, { f }] of units) for (const code of Object.keys(ALLOW)) if (allowed(code, u)) f[code] = 0;

for (const [, entry] of units) {
  const template = entry.files
    .filter((p) => /\.(html|ts)$/.test(p))
    .map((p) => readFileSync(p, "utf8"))
    .join("\n");
  if (/<router-outlet/.test(template)) entry.f.push = 0;
}

const selectors = selectorIndex();
for (const routed of routeFiles()) {
  const shellHasHeader = [...routed].some((u) => {
    const entry = units.get(u);
    return entry && /<router-outlet/.test(templateOfUnit(entry)) && rendersPageHeader(u, selectors);
  });
  for (const u of routed) {
    const entry = units.get(u);
    if (!entry || PAGE_HEADER_EXEMPT.has(u) || shellHasHeader) continue;
    if (/<router-outlet/.test(templateOfUnit(entry))) continue;
    if (!rendersPageHeader(u, selectors)) entry.f.hdr++;
  }
}

const AREA_ORDER = ["core", "layout", "pdz.component", "shared"];
const areaOf = (u) => {
  const parts = u.split("/");
  if (parts[0] === "features") return `features/${parts[1]}`;
  return parts.length === 1 ? parts[0] : parts[0];
};
const inArea = (u) => {
  const parts = u.split("/");
  return parts[0] === "features" ? parts.slice(2).join("/") : parts.length === 1 ? parts[0] : parts.slice(1).join("/");
};

const BOOL = new Set(["hdr", "push", "cm"]);
const fmt = (f) =>
  CODES.filter(([c]) => f[c] > 0)
    .map(([c]) => (BOOL.has(c) ? c : `${c} ${f[c]}`))
    .join(" · ");

const totals = empty();
const unitsWith = empty();
const byArea = new Map();
for (const [u, { f }] of [...units].sort(([a], [b]) => a.localeCompare(b))) {
  for (const [c] of CODES) {
    totals[c] += f[c];
    if (f[c] > 0) unitsWith[c]++;
  }
  if (!fmt(f)) continue;
  const area = areaOf(u);
  if (!byArea.has(area)) byArea.set(area, []);
  byArea.get(area).push([inArea(u), f]);
}

const failOn = [...args].find((a) => a.startsWith("--fail-on="))?.slice(10).split(",");
if (failOn) {
  let failed = 0;
  for (const code of failOn) {
    for (const [u, { f }] of units) {
      if (f[code] > 0) {
        console.error(`src/pdz/${u}  ${code}: ${CODES.find(([c]) => c === code)?.[1] ?? code}`);
        failed++;
      }
    }
  }
  if (failed) {
    console.error(`\n${failed} audit failure(s).`);
    process.exit(1);
  }
  console.log(`audit: clean for ${failOn.join(", ")}`);
  process.exit(0);
}

if (args.has("--json")) {
  console.log(JSON.stringify({ totals, unitsWith, units: Object.fromEntries([...units].map(([u, { f }]) => [u, f])) }, null, 2));
  process.exit(0);
}

const only = [...args].find((a) => a.startsWith("--code="))?.slice(7);
if (only) {
  const rows = [...units].filter(([, { f }]) => f[only] > 0).sort(([, a], [, b]) => b.f[only] - a.f[only]);
  for (const [u, { f }] of rows) console.log(`${f[only]}\t${u}`);
  process.exit(0);
}

const out = [];
const today = new Date().toISOString().slice(0, 10);
out.push(`Generated ${today} by \`node tools/audit-client.mjs\`. Codes and counts:`, "");
out.push(CODES.map(([c, d]) => `\`${c}\` ${d}`).join(" · "), "");
out.push("| Code | Total | Units |", "| --- | --- | --- |");
for (const [c] of CODES) out.push(`| \`${c}\` | ${totals[c]} | ${unitsWith[c]} |`);
const areas = [...byArea.keys()].sort((a, b) => {
  const ia = AREA_ORDER.indexOf(a);
  const ib = AREA_ORDER.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  return a.localeCompare(b);
});
for (const area of areas) {
  const rows = byArea.get(area);
  out.push("", `### \`${area}\` (${rows.length})`, "", "| Component | Findings |", "| --- | --- |");
  for (const [name, f] of rows) out.push(`| \`${name}\` | ${fmt(f)} |`);
}
console.log(out.join("\n"));
