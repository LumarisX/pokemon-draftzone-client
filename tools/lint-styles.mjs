import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SCAN = join(ROOT, "src", "pdz");

const GLYPH_SIZED = /icon|sprite|symbol|close-button/i;
const SVG_TEXT = /(^|[\s>])text([\s>.,:]|$)/i;

const BESPOKE_DISPLAY = [
  "src/pdz/features/pages/homepage/homepage.component.scss",
  "src/pdz/shared/forms/team-form/team-form.component.scss",
];

const COORDINATED_BADGE = [
  "src/pdz/shared/dialogs/pokemon-type/pokemon-type.component.scss",
  "src/pdz/shared/widgets/typechart/_typechart-core.shared.scss",
];

const UNTOKENIZED_ORPHANS = [
  "src/pdz/features/league-zone/divisions/power-rankings/power-rankings.component.scss",
  "src/pdz/features/league-zone/league/upload-image/upload-image.component.scss",
  "src/pdz/features/league-zone/league-auction/league-auction.component.scss",
];

const BESPOKE_DENSITY = ["src/pdz/features/tools/wheel/wheel.component.scss"];

const ALLOW = new Set([
  ...BESPOKE_DISPLAY,
  ...COORDINATED_BADGE,
  ...UNTOKENIZED_ORPHANS,
  ...BESPOKE_DENSITY,
]);

const RULES = [
  {
    id: "raw-font-size",
    re: /font-size\s*:\s*[0-9.]+(rem|px)\s*(;|$)/,
    msg: "raw font-size; use pdz.font-size(<token>) or @include pdz.text(<role>)",
  },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".scss")) out.push(p);
  }
  return out;
}

function selectorPath(lines, upto) {
  const stack = [];
  let pending = "";
  for (let i = 0; i < upto; i++) {
    const code = lines[i].replace(/\/\/.*$/, "");
    for (const ch of code) {
      if (ch === "{") { stack.push(pending.trim()); pending = ""; }
      else if (ch === "}") { stack.pop(); pending = ""; }
      else pending += ch;
    }
    if (/;\s*$/.test(code)) pending = "";
  }
  return stack.join(" ");
}

let violations = 0;

for (const file of walk(SCAN)) {
  const rel = relative(ROOT, file).split(sep).join("/");
  if (ALLOW.has(rel)) continue;

  const lines = readFileSync(file, "utf8").split(/\r?\n/);

  lines.forEach((line, i) => {
    if (/,\s*$/.test(line)) return;
    for (const rule of RULES) {
      if (!rule.re.test(line)) continue;
      const path = selectorPath(lines, i);
      if (GLYPH_SIZED.test(path) || SVG_TEXT.test(path)) return;
      console.error(`${rel}:${i + 1}  ${rule.id}: ${rule.msg}\n    ${line.trim()}`);
      violations++;
    }
  });
}

if (violations) {
  console.error(`\n${violations} style violation(s). Exempt a genuine one-off in tools/lint-styles.mjs.`);
  process.exit(1);
}
console.log("lint-styles: clean");
