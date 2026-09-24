import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";

const BUCKET = "pokemondraftzone.com";
const DISTRIBUTION_ID = "E1FL60DTYOOOFE";
const PROFILE = process.env.AWS_PROFILE ?? "pdz-deploy";
const BUILD_DIR = join(process.cwd(), "dist", "pokemon-draftzone-client", "browser");
const MANIFEST_KEY = ".deploy/manifest.json";

const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
const SHORT_CACHE = "public, max-age=3600";
const NO_CACHE = "no-cache";

const HASHED_PASSES = [
  ["*-????????.js", "text/javascript"],
  ["*-????????.css", "text/css"],
  ["media/*", null],
];
const NO_CACHE_FILES = [
  ["manifest.webmanifest", "application/manifest+json"],
  ["ngsw.json", "application/json"],
  ["ngsw-worker.js", "text/javascript"],
  ["safety-worker.js", "text/javascript"],
  ["worker-basic.min.js", "text/javascript"],
  ["index.html", "text/html"],
];

const dryRun = process.argv.includes("--dry-run");
const scratch = mkdtempSync(join(tmpdir(), "pdz-deploy-"));

function aws(args, { capture = false } = {}) {
  return execFileSync("aws", [...args, "--profile", PROFILE], {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
}

function step(message) {
  console.log(`\n=== ${message}${dryRun ? " (dry run)" : ""}`);
}

function listBuildFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory()
      ? listBuildFiles(path)
      : [relative(BUILD_DIR, path).split(sep).join("/")];
  });
}

function assertProductionBuild() {
  const index = join(BUILD_DIR, "index.html");
  if (!existsSync(index)) {
    throw new Error(`No build at ${BUILD_DIR}. Run "npm run deploy", not this script directly.`);
  }
  if (!/main-[A-Z0-9]{8}\.js/.test(readFileSync(index, "utf8"))) {
    throw new Error("index.html does not reference a hashed main bundle; this is not a production build.");
  }
}

function assertLoggedIn() {
  try {
    const identity = JSON.parse(aws(["sts", "get-caller-identity", "--output", "json"], { capture: true }));
    console.log(`Deploying as ${identity.Arn}`);
  } catch {
    throw new Error(`AWS CLI profile "${PROFILE}" has no valid credentials. Run: aws login --profile ${PROFILE}`);
  }
}

function readPreviousFiles() {
  try {
    return JSON.parse(aws(["s3", "cp", `s3://${BUCKET}/${MANIFEST_KEY}`, "-"], { capture: true })).files;
  } catch (error) {
    if (/Not Found|NoSuchKey|does not exist|404/i.test(String(error.stderr))) return null;
    throw error;
  }
}

function listBucketKeys() {
  const out = aws(
    ["s3api", "list-objects-v2", "--bucket", BUCKET, "--query", "Contents[].Key", "--output", "json"],
    { capture: true },
  );
  return (JSON.parse(out) ?? []).filter((key) => !key.startsWith(".deploy/"));
}

function sync(filters, cacheControl, extra = []) {
  aws([
    "s3", "sync", BUILD_DIR, `s3://${BUCKET}`,
    ...filters,
    "--cache-control", cacheControl,
    "--no-progress",
    ...extra,
    ...(dryRun ? ["--dryrun"] : []),
  ]);
}

function uploadNoCacheFiles(files) {
  for (const [name, contentType] of NO_CACHE_FILES) {
    if (!files.includes(name)) continue;
    if (dryRun) {
      console.log(`(dryrun) upload: ${name}`);
      continue;
    }
    aws([
      "s3", "cp", join(BUILD_DIR, name), `s3://${BUCKET}/${name}`,
      "--cache-control", NO_CACHE,
      "--content-type", contentType,
      "--no-progress",
    ]);
  }
}

function invalidate() {
  if (dryRun) {
    console.log(`(dryrun) invalidate /* on ${DISTRIBUTION_ID}`);
    return;
  }
  const out = aws(
    ["cloudfront", "create-invalidation", "--distribution-id", DISTRIBUTION_ID, "--paths", "/*", "--output", "json"],
    { capture: true },
  );
  console.log(`Invalidation ${JSON.parse(out).Invalidation.Id} created`);
}

function writeManifest(files) {
  if (dryRun) {
    console.log(`(dryrun) write ${MANIFEST_KEY} (${files.length} files)`);
    return;
  }
  const path = join(scratch, "manifest.json");
  writeFileSync(path, JSON.stringify({ deployedAt: new Date().toISOString(), files }));
  aws(["s3", "cp", path, `s3://${BUCKET}/${MANIFEST_KEY}`, "--cache-control", NO_CACHE, "--no-progress"]);
}

function prune(stale) {
  if (stale.length === 0) {
    console.log("Nothing to prune");
    return;
  }
  for (const key of stale) console.log(`${dryRun ? "(dryrun) " : ""}delete: ${key}`);
  if (dryRun) return;
  for (let i = 0; i < stale.length; i += 500) {
    const path = join(scratch, "delete.json");
    const batch = stale.slice(i, i + 500).map((Key) => ({ Key }));
    writeFileSync(path, JSON.stringify({ Objects: batch, Quiet: true }));
    aws(["s3api", "delete-objects", "--bucket", BUCKET, "--delete", `file://${path}`], { capture: true });
  }
}

try {
  assertProductionBuild();
  assertLoggedIn();

  const files = listBuildFiles(BUILD_DIR);
  const liveKeys = listBucketKeys();
  const previousFiles = readPreviousFiles() ?? liveKeys;
  const keep = new Set([...files, ...previousFiles]);
  const stale = liveKeys.filter((key) => !keep.has(key));

  for (const [pattern, contentType] of HASHED_PASSES) {
    step(`Hashed ${pattern} (immutable)`);
    sync(["--exclude", "*", "--include", pattern, "--exclude", "assets/*"], IMMUTABLE_CACHE, [
      "--size-only",
      ...(contentType ? ["--content-type", contentType] : []),
    ]);
  }

  step("Assets (1 hour)");
  sync(
    [
      ...HASHED_PASSES.flatMap(([pattern]) => ["--exclude", pattern]),
      ...NO_CACHE_FILES.flatMap(([name]) => ["--exclude", name]),
      "--include", "assets/*",
    ],
    SHORT_CACHE,
  );

  step("Entry files (no-cache, index.html last)");
  uploadNoCacheFiles(files);

  step("CloudFront invalidation");
  invalidate();

  step("Manifest");
  writeManifest(files);

  step("Prune files older than the previous deploy");
  prune(stale);

  console.log(`\nDone${dryRun ? " (dry run, nothing changed)" : ""}.`);
} catch (error) {
  console.error(`\nDeploy failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
