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

const COORDINATED_BADGE = [];

const UNTOKENIZED_ORPHANS = [
  "src/pdz/features/league-zone/pools/power-rankings/power-rankings.component.scss",
  "src/pdz/features/league-zone/league/upload-image/upload-image.component.scss",
  "src/pdz/features/league-zone/league-auction/league-auction.component.scss",
];

const BESPOKE_DENSITY = ["src/pdz/features/tools/wheel/wheel.component.scss"];

const BESPOKE_RENDERING = ["src/pdz/features/tools/wheel/wheel.component.scss"];

const DISPLAY_FONT_MOMENTS = [
  "src/pdz/shared/layout/page-header/page-header.component.scss",
  "src/pdz/features/pages/homepage/homepage.component.scss",
  "src/pdz/features/league-zone/league-drafting/league-drafting.component.scss",
  "src/pdz/features/league-zone/tournaments/tournament-nav/tournament-nav.component.scss",
];

const ALLOW_BY_RULE = {
  "raw-font-size": new Set([
    ...BESPOKE_DISPLAY,
    ...COORDINATED_BADGE,
    ...UNTOKENIZED_ORPHANS,
    ...BESPOKE_DENSITY,
  ]),
  "unroled-type": new Set([]),
  "raw-color": new Set([...BESPOKE_RENDERING]),
  "raw-spacing": new Set([...BESPOKE_DISPLAY]),
  "display-font": new Set([...DISPLAY_FONT_MOMENTS]),
};

const TOKEN_SOURCES = /^src\/styles\/(tokens|themes|tools)\//;

const LENGTH = /(?<![\w.#-])-?\d*\.?\d+(px|rem|em)(?![\w-])/;

function stripBalanced(value, names) {
  let out = "";
  let i = 0;
  const opener = new RegExp(`^(?:${names})\\(`);
  while (i < value.length) {
    const m = value.slice(i).match(opener);
    if (!m || (i > 0 && /[\w-]/.test(value[i - 1]))) {
      out += value[i++];
      continue;
    }
    let depth = 0;
    let j = i + m[0].length - 1;
    for (; j < value.length; j++) {
      if (value[j] === "(") depth++;
      else if (value[j] === ")" && --depth === 0) break;
    }
    out += " ";
    i = j + 1;
  }
  return out;
}

const TOKEN_CALLS = "calc|min|max|clamp|var|pdz\\.[\\w-]+|color-mix";

function splitTopLevel(value) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

const DECL_RULES = [
  {
    id: "raw-duration",
    props: /^(transition|transition-duration)$/,
    test: (v) => /(?<![\w.-])[0-9.]+m?s(?![\w-])/.test(stripBalanced(v, TOKEN_CALLS)),
    msg: "raw transition duration; use pdz.duration(none|fast|base|slow)",
  },
  {
    id: "raw-easing",
    props: /^(transition|transition-timing-function)$/,
    test: (v) =>
      /(?<![\w-])(?:ease-in-out|ease-in|ease-out|ease)(?![\w-])|cubic-bezier\(/.test(
        stripBalanced(v, "var|pdz\\.[\\w-]+"),
      ),
    msg: "raw easing; use pdz.easing(standard|exit|linear)",
  },
  {
    id: "raw-font-weight",
    props: /^font-weight$/,
    test: (v) =>
      !/^(pdz\.font-weight\(\w+\)|var\(--pdz-font-weight-\w+\)|inherit|initial|unset|normal|bolder|lighter)$/.test(v),
    msg: "raw font-weight; use @include pdz.text(<role>) or pdz.font-weight(regular|semibold|bold)",
  },
  {
    id: "raw-color",
    props: /./,
    test: (v) => /#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(\s*\d/.test(v),
    msg: "color literal; use pdz.color(<role>), pdz.color-rgba(<role>, <alpha>) or color-mix() over a role",
  },
  {
    id: "raw-radius",
    props: /^border(-[\w-]+)?-radius$/,
    test: (v) => LENGTH.test(stripBalanced(v, TOKEN_CALLS)),
    msg: "raw border-radius; use pdz.shape(<corner>)",
  },
  {
    id: "raw-shadow",
    props: /^box-shadow$/,
    test: (v) =>
      !splitTopLevel(v).every(
        (part) =>
          /^(none|inherit|initial|unset)$/.test(part) ||
          /^var\(--pdz-[\w-]+(,\s*none)?\)$/.test(part) ||
          /^(inset\s+)?0\s+0\s+0\s+/.test(part),
      ),
    msg: "box-shadow must be none, var(--pdz-elevation-1..3), or a 0 0 0 <width> ring",
    skipInKeyframes: true,
  },
  {
    id: "raw-spacing",
    props: /^(margin|padding|gap|row-gap|column-gap|inset)(-[\w-]+)?$/,
    test: (v) =>
      stripBalanced(v, TOKEN_CALLS)
        .split(/\s+/)
        .some((t) => LENGTH.test(t) && !/^-?1px$/.test(t)),
    msg: "raw spacing length; use pdz.space(<step>) or pdz.layout(<alias>), or calc() for geometry",
  },
  {
    id: "display-font",
    props: /^font-family$/,
    test: (v) => /pdz\.font\(display\)|--pdz-font-display|Nasalization/.test(v),
    msg: "Nasalization is for page titles and big numbers only; use a body role, or @include pdz.text(display|headline)",
    pdzOnly: true,
  },
];

function declarations(lines) {
  const out = [];
  let buf = "";
  let start = 0;
  let depth = 0;
  const keyframeDepths = [];
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, "");
    for (const ch of code) {
      if (ch === "{") {
        if (/@keyframes/.test(buf)) keyframeDepths.push(depth);
        depth++;
        buf = "";
      } else if (ch === "}") {
        depth--;
        if (keyframeDepths.length && keyframeDepths[keyframeDepths.length - 1] === depth) keyframeDepths.pop();
        buf = "";
      } else if (ch === ";") {
        const m = buf.trim().match(/^([\w-]+)\s*:\s*([\s\S]+)$/);
        if (m && !m[1].startsWith("--") && !buf.trim().startsWith("$")) {
          out.push({ prop: m[1], value: m[2].replace(/\s+/g, " ").trim(), line: start + 1, inKeyframes: keyframeDepths.length > 0 });
        }
        buf = "";
      } else {
        if (!buf.trim()) start = i;
        buf += ch;
      }
    }
    buf += " ";
  });
  return out;
}

const MEDIA_RULE = {
  id: "raw-media",
  re: /@media[^{]*(max|min)-width\s*:\s*\d/,
  msg: "raw @media width query; use @include pdz.respond-above/respond-below(<breakpoint>) or a container query",
};

const RULES = [
  {
    id: "raw-font-size",
    re: /font-size\s*:\s*[0-9.]+(rem|px)\s*(;|$)/,
    msg: "raw font-size; use pdz.font-size(<token>) or @include pdz.text(<role>)",
    glyphExempt: true,
  },
  {
    id: "raw-z-index",
    re: /z-index\s*:\s*-?\d{2,}/,
    msg: "raw z-index; use pdz.z(<layer>) for a page-level surface, or a bare 0-9 for ordering inside a stacking context you own",
    styles: true,
  },
  {
    id: "legacy-shadow",
    re: /var\(--pdz-level-/,
    msg: "the --pdz-level-* shadows are gone; panels use a border, floating things use var(--pdz-elevation-1..3)",
    styles: true,
  },
  {
    id: "ng-deep",
    re: /::ng-deep/,
    msg: "::ng-deep is banned; project content, pass an input, or scope an unencapsulated stylesheet under the host selector",
    styles: true,
  },
  {
    id: "important",
    re: /!important/,
    msg: "!important is banned; fix the specificity instead",
  },
  {
    id: "legacy-role",
    re: /color\((["']?)(surface|surface-container[\w-]*|background|outline-variant)\1\)/,
    msg: "deleted color role; use the ladder (ground, raised, raised-high, overlay, floating, inset) or border-subtle",
    styles: true,
  },
  {
    id: "dead-font-var",
    re: /--pdz-font-(fancy|regular)\b/,
    msg: "that font variable does not exist; use pdz.font(display|body|mono) or @include pdz.text(<role>)",
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
    const pair = token && weight && `${token}/${normalizeWeight(weight)}`;
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
    if (!inStyles && MEDIA_RULE.re.test(line.replace(/\/\/.*$/, ""))) {
      console.error(`${rel}:${i + 1}  ${MEDIA_RULE.id}: ${MEDIA_RULE.msg}\n    ${line.trim()}`);
      violations++;
    }
  });

  if (!TOKEN_SOURCES.test(rel)) {
    for (const decl of declarations(lines)) {
      for (const rule of DECL_RULES) {
        if (rule.pdzOnly && inStyles) continue;
        if (rule.skipInKeyframes && decl.inKeyframes) continue;
        if (ALLOW_BY_RULE[rule.id]?.has(rel)) continue;
        if (!rule.props.test(decl.prop) || !rule.test(decl.value)) continue;
        console.error(`${rel}:${decl.line}  ${rule.id}: ${rule.msg}\n    ${decl.prop}: ${decl.value}`);
        violations++;
      }
    }
  }

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
