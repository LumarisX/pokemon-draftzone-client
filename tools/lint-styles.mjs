import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SCAN = join(ROOT, "src", "pdz");
const SCAN_STYLES = join(ROOT, "src", "styles");
const TYPE_TOKENS = join(ROOT, "src", "styles", "tokens", "_typography.scss");
const Z_TOKENS = join(ROOT, "src", "styles", "tokens", "_z-layers.scss");

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

const ALLOW_BY_RULE = {
  "raw-font-size": new Set([
    ...BESPOKE_DISPLAY,
    ...COORDINATED_BADGE,
    ...UNTOKENIZED_ORPHANS,
    ...BESPOKE_DENSITY,
  ]),
  "unroled-type": new Set([]),
};

const RULES = [
  {
    id: "raw-font-size",
    re: /font-size\s*:\s*[0-9.]+(rem|px)\s*(;|$)/,
    msg: "raw font-size; use pdz.font-size(<token>) or @include pdz.text(<role>)",
    glyphExempt: true,
  },
  {
    id: "raw-duration",
    re: /transition[^;]*(?<![\w.-])[0-9.]+m?s(?![\w-])/,
    msg: "raw transition duration; use pdz.duration(none|fast|base|slow)",
  },
  {
    id: "raw-easing",
    re: /transition[^;]*(?:(?<![\w-])(?:ease-in-out|ease-in|ease-out|ease)(?![\w-])|cubic-bezier\()/,
    msg: "raw easing; use pdz.easing(standard|exit|linear)",
  },
  {
    id: "raw-z-index",
    re: /z-index\s*:\s*-?\d{2,}/,
    msg: "raw z-index; use pdz.z(<layer>) for a page-level surface, or a bare 0-9 for ordering inside a stacking context you own",
    styles: true,
  },
];

const WEIGHT_ALIAS = {
  bold: "700",
  semibold: "600",
  medium: "500",
  regular: "400",
  normal: "400",
};

function loadTypeRoles() {
  const src = readFileSync(TYPE_TOKENS, "utf8");
  const mapBody = (name) => {
    const m = src.match(new RegExp("\\$" + name + ":\\s*\\(([\\s\\S]*?)\\n\\);"));
    return m ? m[1] : "";
  };

  const sizeToToken = new Map();
  for (const line of mapBody("font-size").split("\n")) {
    const m = line.match(/^\s*([\w-]+):\s*([^,]+),/);
    if (m) sizeToToken.set(m[2].trim(), m[1]);
  }

  const roleByPair = new Map();
  for (const m of mapBody("text").matchAll(/^ {2}([\w-]+):\s*\(([\s\S]*?)^ {2}\),/gm)) {
    const size = (m[2].match(/font-size:\s*([^,\n]+),/) || [])[1];
    const weight = (m[2].match(/font-weight:\s*([^,\n]+),/) || [])[1];
    const token = size && sizeToToken.get(size.trim());
    const pair = token && weight && `${token}/${weight.trim()}`;
    if (pair && !roleByPair.has(pair)) roleByPair.set(pair, m[1]);
  }
  return { sizeToToken, roleByPair };
}

const { sizeToToken, roleByPair } = loadTypeRoles();

function normalizeSize(value) {
  const named =
    value.match(/pdz\.font-size\((\w+)\)/) ||
    value.match(/var\(--pdz-font-size-([\w-]+)\)/);
  if (named) return named[1];
  return sizeToToken.get(value.trim()) ?? null;
}

function normalizeWeight(value) {
  const named =
    value.match(/var\(--pdz-font-weight-(\w+)\)/) ||
    value.match(/pdz\.font-weight\((\w+)\)/);
  const raw = named ? named[1] : value.trim();
  return WEIGHT_ALIAS[raw] ?? raw;
}

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

function blocksOf(lines) {
  const stack = [];
  const done = [];
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, "");
    for (const ch of code) {
      if (ch === "{") stack.push({ decls: new Map(), hasTextMixin: false });
      else if (ch === "}") {
        const block = stack.pop();
        if (block) done.push(block);
      }
    }
    const top = stack[stack.length - 1];
    if (!top) return;
    if (/@include\s+pdz\.text\(/.test(code)) top.hasTextMixin = true;
    const decl = code.match(/^\s*(font-size|font-weight)\s*:\s*([^;]+);\s*$/);
    if (decl && !/!important/.test(decl[2])) {
      top.decls.set(decl[1], { value: decl[2].trim(), line: i + 1, raw: line });
    }
  });
  return done;
}

function checkZLayerOrder() {
  const rel = "src/styles/tokens/_z-layers.scss";
  const body = (readFileSync(Z_TOKENS, "utf8").match(/\$z-layers:\s*\(([\s\S]*?)\n\);/) || [])[1] || "";
  const rungs = [...body.matchAll(/^\s*([\w-]+):\s*(-?\d+)/gm)].map((m) => [m[1], Number(m[2])]);
  let bad = 0;
  if (rungs.length && rungs[0][1] < 10) {
    console.error(`${rel}  z-layer-order: lowest rung '${rungs[0][0]}' (${rungs[0][1]}) must be >= 10 to clear the local band`);
    bad++;
  }
  for (let i = 1; i < rungs.length; i++) {
    const [name, value] = rungs[i];
    const [prev, prevValue] = rungs[i - 1];
    if (value > prevValue) continue;
    console.error(`${rel}  z-layer-order: '${name}' (${value}) must sit above '${prev}' (${prevValue}); the map is read bottom-to-top`);
    bad++;
  }
  return bad;
}

let violations = checkZLayerOrder();

for (const file of [...walk(SCAN), ...walk(SCAN_STYLES)]) {
  const rel = relative(ROOT, file).split(sep).join("/");
  const inStyles = rel.startsWith("src/styles/");

  const lines = readFileSync(file, "utf8").split(/\r?\n/);

  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (/,\s*$/.test(line) && rule.id !== "raw-z-index") continue;
      if (inStyles && !rule.styles) continue;
      if (ALLOW_BY_RULE[rule.id]?.has(rel)) continue;
      if (!rule.re.test(line)) continue;
      if (rule.glyphExempt) {
        const path = selectorPath(lines, i);
        if (GLYPH_SIZED.test(path) || SVG_TEXT.test(path)) continue;
      }
      console.error(`${rel}:${i + 1}  ${rule.id}: ${rule.msg}\n    ${line.trim()}`);
      violations++;
    }
  });

  if (inStyles || ALLOW_BY_RULE["unroled-type"].has(rel)) continue;
  for (const block of blocksOf(lines)) {
    if (block.hasTextMixin) continue;
    const size = block.decls.get("font-size");
    const weight = block.decls.get("font-weight");
    if (!size || !weight) continue;
    const role = roleByPair.get(
      `${normalizeSize(size.value)}/${normalizeWeight(weight.value)}`,
    );
    if (!role) continue;
    console.error(
      `${rel}:${size.line}  unroled-type: font-size + font-weight in one block; use @include pdz.text(${role})\n    ${size.raw.trim()}\n    ${weight.raw.trim()}`,
    );
    violations++;
  }
}

if (violations) {
  console.error(`\n${violations} style violation(s). Exempt a genuine one-off in tools/lint-styles.mjs.`);
  process.exit(1);
}
console.log("lint-styles: clean");
