import * as sass from "sass";
import { join } from "node:path";

const ROOT = process.cwd();
const verbose = process.argv.includes("--verbose");

const { css } = sass.compile(join(ROOT, "src", "styles", "styles.scss"), {
  loadPaths: [join(ROOT, "src", "styles")],
  style: "expanded",
  silenceDeprecations: ["import"],
});

function declarations(body) {
  const out = new Map();
  for (const m of body.matchAll(/(--pdz-[\w-]+)\s*:\s*([^;]+);/g)) out.set(m[1], m[2].trim());
  return out;
}

function topLevelBlocks(text) {
  const blocks = [];
  let depth = 0;
  let start = 0;
  let selector = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") {
      if (depth === 0) {
        selector = text.slice(start, i).trim();
        start = i + 1;
      }
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        blocks.push({ selector, body: text.slice(start, i) });
        start = i + 1;
      }
    }
  }
  return blocks;
}

const base = new Map();
const themes = new Map();
for (const { selector, body } of topLevelBlocks(css)) {
  if (selector === ":root") for (const [k, v] of declarations(body)) base.set(k, v);
  const m = selector.match(/^:root\[pdz-theme="?([\w-]+)"?\]\[pdz-theme-mode="?(\w+)"?\]$/);
  if (m) themes.set(`${m[1]}/${m[2]}`, declarations(body));
}

function hexToRgba(hex) {
  let h = hex.slice(1);
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
  const n = (i) => parseInt(h.slice(i, i + 2), 16);
  return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
}

function splitArgs(s) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function resolve(value, vars, seen = new Set()) {
  value = value.trim();
  const v = value.match(/^var\((--[\w-]+)(?:\s*,\s*(.+))?\)$/);
  if (v) {
    if (seen.has(v[1])) return null;
    seen.add(v[1]);
    const next = vars.get(v[1]) ?? base.get(v[1]) ?? v[2];
    return next == null ? null : resolve(next, vars, seen);
  }
  if (value === "transparent") return [0, 0, 0, 0];
  if (value === "white") return [255, 255, 255, 1];
  if (value === "black") return [0, 0, 0, 1];
  if (/^#[0-9a-f]+$/i.test(value)) return hexToRgba(value);
  const rgb = value.match(/^rgba?\((.+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [parts[0], parts[1], parts[2], parts[3] ?? 1];
  }
  const mix = value.match(/^color-mix\(in srgb,\s*(.+)\)$/);
  if (mix) {
    const [a, b] = splitArgs(mix[1]);
    const pa = a.match(/^(.*?)\s+([\d.]+)%$/);
    const pb = b.match(/^(.*?)\s+([\d.]+)%$/);
    const ca = resolve(pa ? pa[1] : a, vars, new Set(seen));
    const cb = resolve(pb ? pb[1] : b, vars, new Set(seen));
    if (!ca || !cb) return null;
    const wa = pa ? Number(pa[2]) / 100 : pb ? 1 - Number(pb[2]) / 100 : 0.5;
    const wb = 1 - wa;
    const alpha = ca[3] * wa + cb[3] * wb;
    if (alpha === 0) return [0, 0, 0, 0];
    const ch = (i) => (ca[i] * ca[3] * wa + cb[i] * cb[3] * wb) / alpha;
    return [ch(0), ch(1), ch(2), alpha];
  }
  return null;
}

function over(fg, bg) {
  const a = fg[3];
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)).concat(1);
}

function luminance([r, g, b]) {
  const lin = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function gradientStops(value, vars) {
  const m = value?.trim().match(/^linear-gradient\((.+)\)$/s);
  if (!m) return null;
  const args = splitArgs(m[1]).filter((a) => !/^(-?[\d.]+deg|to\s)/.test(a));
  const stops = args.map((a) => {
    const p = a.match(/^(.*?)\s+([\d.]+)%$/);
    return { color: resolve(p ? p[1] : a, vars), at: p ? Number(p[2]) : null };
  });
  if (stops.length < 2 || stops.some((s) => !s.color)) return null;
  stops.forEach((s, i) => (s.at ??= (i / (stops.length - 1)) * 100));
  return stops;
}

function sampleGradient(stops, t) {
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t >= a.at && t <= b.at) {
      const k = b.at === a.at ? 0 : (t - a.at) / (b.at - a.at);
      return [0, 1, 2].map((j) => a.color[j] + (b.color[j] - a.color[j]) * k).concat(1);
    }
  }
  return stops[stops.length - 1].color;
}

function weakestStop(stops, fg, from, to) {
  let worst = null;
  let worstRatio = Infinity;
  for (let t = from; t <= to; t += 0.5) {
    const bg = sampleGradient(stops, t);
    const ratio = contrast(fg, bg);
    if (ratio < worstRatio) {
      worstRatio = ratio;
      worst = bg;
    }
  }
  return worst;
}

const RUNGS = ["ground", "raised", "raised-high", "overlay", "floating", "inset"];
const TEXT = ["on-surface", "on-surface-variant", "on-surface-muted"];
const ACCENT_TEXT = ["primary-accent", "secondary-accent", "team1-accent", "team2-accent"];

const failures = [];
const rows = [];

for (const [name, vars] of [...themes].sort(([a], [b]) => a.localeCompare(b))) {
  const mode = name.split("/")[1];
  const color = (role) => resolve(`var(--pdz-color-${role})`, vars);
  const ground = color("ground");
  const surface = (rung) => {
    const c = color(rung);
    return c && c[3] < 1 ? over(c, ground) : c;
  };

  const check = (label, fgRole, bgRole, min, bgColor) => {
    const fg = color(fgRole);
    const bg = bgColor ?? surface(bgRole);
    if (!fg || !bg) {
      failures.push(`${name}  ${label}: could not resolve ${fgRole} on ${bgRole}`);
      return;
    }
    const ratio = contrast(fg[3] < 1 ? over(fg, bg) : fg, bg);
    rows.push([name, label, ratio]);
    if (ratio < min) failures.push(`${name}  ${label}: ${ratio.toFixed(2)} < ${min}`);
  };

  for (const rung of RUNGS) {
    for (const text of TEXT) check(`${text} on ${rung}`, text, rung, 4.5);
    for (const accent of ACCENT_TEXT) check(`${accent} on ${rung}`, accent, rung, 4.5);
  }
  check("on-surface-placeholder on inset", "on-surface-placeholder", "inset", 4.5);
  check("outline on raised", "outline", "raised", 3);
  check("outline on inset", "outline", "inset", 3);
  for (const role of ["primary", "secondary", "danger", "success", "positive", "negative"])
    check(`on-${role} on ${role}`, `on-${role}`, role, 4.5);
  const versus = gradientStops(vars.get("--pdz-color-versus-gradient") ?? base.get("--pdz-color-versus-gradient"), vars);
  if (!versus) failures.push(`${name}  versus-gradient: could not resolve its stops`);
  else {
    check("on-versus-gradient on versus-gradient (weakest point)", "on-versus-gradient", null, 3, weakestStop(versus, color("on-versus-gradient"), 0, 100));
    check("on-versus-gradient on versus-gradient (middle)", "on-versus-gradient", null, 4.5, weakestStop(versus, color("on-versus-gradient"), 40, 60));
  }
  for (const role of ["primary", "secondary", "danger", "warning", "success", "info"])
    check(`on-${role}-container on ${role}-container`, `on-${role}-container`, `${role}-container`, 4.5);
  for (const team of ["team1", "team2"]) {
    const wash = color(`${team}-wash`);
    const raised = surface("raised");
    if (wash && raised) check(`on-surface on ${team}-wash`, "on-surface", null, 4.5, over(wash, raised));
  }

  if (mode === "dark") {
    for (let i = 1; i < RUNGS.length - 1; i++) {
      const lower = surface(RUNGS[i - 1]);
      const upper = surface(RUNGS[i]);
      if (lower && upper && luminance(upper) <= luminance(lower))
        failures.push(`${name}  ladder: ${RUNGS[i]} is not lighter than ${RUNGS[i - 1]}`);
    }
  }
}

if (verbose) for (const [t, label, r] of rows) console.log(`${t.padEnd(24)} ${label.padEnd(48)} ${r.toFixed(2)}`);

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`\n${failures.length} contrast failure(s) across ${themes.size} theme modes.`);
  process.exit(1);
}
console.log(`check-contrast: ${rows.length} pairs pass across ${themes.size} theme modes`);
