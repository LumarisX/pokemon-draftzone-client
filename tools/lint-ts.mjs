import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SCAN = join(ROOT, "src", "pdz");

const PERSONAL_TOOLS = new Set([
  "src/pdz/features/tools/binder/binder.component.ts",
]);

const RULES = [
  {
    id: "console-log",
    re: /\bconsole\.log\(/,
    msg: "no console.log; surface the state in the UI or a toast",
  },
  {
    id: "angular-material",
    re: /from\s+['"]@angular\/material/,
    msg: "Angular Material was removed; use the pdz primitive",
  },
  {
    id: "cdk-overlay",
    re: /from\s+['"]@angular\/cdk\/overlay/,
    msg: "overlays go through pdz primitives on the native popover API",
  },
  {
    id: "native-dialog",
    re: /(^|[^.\w])(alert|confirm|prompt)\(/,
    msg: "no blocking browser dialogs; use DialogService.confirm or a toast",
    skip: (rel) => PERSONAL_TOOLS.has(rel),
    ignoreLine: /^\s*((public|private|protected|async|static)\s+)*(alert|confirm|prompt)\(/,
  },
  {
    id: "deep-relative-import",
    re: /from\s+['"]\.\.\/\.\.\//,
    msg: "import through a path alias (@pdz/core, @pdz/shared, @pdz/features, @pdz/layout), not ../../",
  },
  {
    id: "route-literal",
    re: /navigate(ByUrl)?\(\s*\[?\s*['"`]\/\w/,
    msg: "absolute route literal; build the path from @pdz/core/route-paths constants",
    skip: (rel) => rel.endsWith(".spec.ts"),
  },
  {
    id: "raw-local-storage",
    re: /\blocalStorage\.(getItem|setItem|removeItem|clear)\(/,
    msg: "storage goes through safeStorage from @pdz/core/utils/storage",
    skip: (rel) => rel === "src/pdz/core/utils/storage.ts" || rel.endsWith(".spec.ts"),
  },
  {
    id: "common-module",
    re: /\bCommonModule\b/,
    msg: "control flow is built in; import the specific pipe (AsyncPipe, DatePipe, DecimalPipe…) instead of CommonModule",
  },
  {
    id: "code-comment",
    re: /(^|\s)\/\/(?!\s*(eslint|@ts-|prettier-ignore))|\/\*(?!\s*(eslint|webpackChunkName|istanbul))/,
    msg: "no explanatory comments; make the code say it",
    stripStrings: true,
  },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".ts")) out.push(p);
  }
  return out;
}

function withoutStrings(line) {
  return line
    .replace(/`(?:\\.|[^`\\])*`/g, "``")
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/\/(?![*/])(?:\\.|[^/\\\n])+\/[gimsuy]*/g, "/re/");
}

let violations = 0;

for (const file of walk(SCAN)) {
  const rel = relative(ROOT, file).split(sep).join("/");
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.skip?.(rel)) continue;
      if (rule.ignoreLine?.test(line)) continue;
      const subject = rule.stripStrings ? withoutStrings(line) : line;
      if (!rule.re.test(subject)) continue;
      console.error(`${rel}:${i + 1}  ${rule.id}: ${rule.msg}\n    ${line.trim()}`);
      violations++;
    }
  });
}

if (violations) {
  console.error(`\n${violations} TypeScript violation(s).`);
  process.exit(1);
}
console.log("lint-ts: clean");
