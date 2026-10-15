// Runs every *.spec.ts under the web app and web libs with vite-node (one
// process per file, because vite-node executes only its first file argument).
// Specs use node:test, so a failing spec sets a non-zero exit code.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = resolve(fileURLToPath(import.meta.url), "../..");
const repoRoot = resolve(webRoot, "../..");
const roots = [join(webRoot, "src"), join(repoRoot, "libs/web"), join(repoRoot, "libs/shared")];

function findSpecs(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findSpecs(full));
    else if (/\.spec\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const specs = roots.flatMap((root) => {
  try {
    return findSpecs(root);
  } catch {
    return [];
  }
});

const failed = [];
for (const spec of specs) {
  const rel = relative(repoRoot, spec);
  const result = spawnSync("vite-node", [spec], { cwd: webRoot, stdio: "pipe", encoding: "utf8", shell: process.platform === "win32" });
  const ok = result.status === 0;
  const summary = (result.stdout.match(/^# (pass|fail) \d+$/gm) ?? []).join(", ");
  console.log(`${ok ? "PASS" : "FAIL"} ${rel}${summary ? ` (${summary})` : ""}`);
  if (!ok) {
    failed.push(rel);
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
  }
}

console.log(`\n${specs.length - failed.length}/${specs.length} spec files passed`);
if (failed.length > 0) process.exit(1);
