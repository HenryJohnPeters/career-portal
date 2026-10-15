import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as apiConstants from "./constants";
import * as apiTags from "./tech-tags";

/*
 * The API cannot import libs/shared/types at runtime, so plan limits and the
 * tech tag catalog are mirrored. These tests fail when the copies drift.
 * The libs files are loaded with a computed require so the API build
 * (rootDir: src) never tries to compile them.
 */
const repoRoot = resolve(__dirname, "../../../..");
const libsDir = resolve(repoRoot, "libs/shared/types/src");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const libsPlan = require(resolve(libsDir, "plan")) as Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const libsTags = require(resolve(libsDir, "tech-tags")) as typeof apiTags;

test("FREE_TIER matches the shared copy", () => {
  assert.deepStrictEqual(
    { ...apiConstants.FREE_TIER },
    { ...(libsPlan.FREE_TIER as object) },
  );
});

test("PREMIUM_FAIR_USE matches the shared copy", () => {
  const api = (apiConstants as Record<string, unknown>).PREMIUM_FAIR_USE;
  assert.ok(api, "apps/api/src/common/constants.ts must export PREMIUM_FAIR_USE");
  assert.deepStrictEqual(api, libsPlan.PREMIUM_FAIR_USE);
});

test("AI_DAILY_ATTEMPT_CAP matches the shared copy", () => {
  const api = (apiConstants as Record<string, unknown>).AI_DAILY_ATTEMPT_CAP;
  assert.ok(api, "apps/api/src/common/constants.ts must export AI_DAILY_ATTEMPT_CAP");
  assert.deepStrictEqual(api, libsPlan.AI_DAILY_ATTEMPT_CAP);
});

test("tech-tags.ts is byte-identical in the API and libs", () => {
  const apiSource = readFileSync(resolve(__dirname, "tech-tags.ts"), "utf8");
  const libsSource = readFileSync(resolve(libsDir, "tech-tags.ts"), "utf8");
  assert.equal(apiSource, libsSource);
});

test("TECH_TAG_CATALOG and categories match the shared copy", () => {
  assert.deepStrictEqual(apiTags.TECH_TAG_CATALOG, libsTags.TECH_TAG_CATALOG);
  assert.deepStrictEqual(apiTags.TECH_TAG_CATEGORIES, libsTags.TECH_TAG_CATEGORIES);
  assert.equal(apiTags.MAX_SELECTED_TAGS, libsTags.MAX_SELECTED_TAGS);
});

test("catalog ids are canonical, unique and prompt-safe", () => {
  const ids = new Set<string>();
  const labels = new Set<string>();
  const categories = new Set(apiTags.TECH_TAG_CATEGORIES.map((c) => c.key));
  for (const tag of apiTags.TECH_TAG_CATALOG) {
    assert.match(tag.id, /^[a-z0-9.#+][a-z0-9 .+#/_-]{0,49}$/, tag.id);
    assert.equal(tag.id, tag.id.trim().replace(/\s+/g, " "), tag.id);
    assert.ok(!ids.has(tag.id), `duplicate id ${tag.id}`);
    assert.ok(!labels.has(tag.label), `duplicate label ${tag.label}`);
    assert.ok(categories.has(tag.category), `unknown category ${tag.category}`);
    ids.add(tag.id);
    labels.add(tag.label);
    for (const alias of tag.aliases ?? []) {
      assert.equal(alias, alias.trim().toLowerCase(), `alias ${alias}`);
    }
  }
});

test("no spelling maps to two different tags", () => {
  const owner = new Map<string, string>();
  for (const tag of apiTags.TECH_TAG_CATALOG) {
    const keys = new Set([tag.id, tag.label.toLowerCase(), ...(tag.aliases ?? [])]);
    for (const key of keys) {
      const existing = owner.get(key);
      assert.ok(
        existing === undefined || existing === tag.id,
        `"${key}" maps to both ${existing} and ${tag.id}`,
      );
      owner.set(key, tag.id);
    }
  }
});

test("normalizeTag resolves case, whitespace and aliases", () => {
  assert.equal(apiTags.normalizeTag("  PostgreSQL "), "postgresql");
  assert.equal(apiTags.normalizeTag("Postgres"), "postgresql");
  assert.equal(apiTags.normalizeTag("k8s"), "kubernetes");
  assert.equal(apiTags.normalizeTag("OAuth 2.0"), "oauth");
  assert.equal(apiTags.normalizeTag("Tailwind   CSS"), "tailwind css");
  assert.equal(apiTags.normalizeTag("node"), "node.js");
  assert.equal(apiTags.normalizeTag("system-design"), "system design");
  assert.equal(apiTags.normalizeTag("Made Up Tag"), "made up tag");
  assert.equal(apiTags.isKnownTag("Made Up Tag"), false);
  assert.equal(apiTags.isKnownTag("Next.js"), true);
  assert.equal(apiTags.getTechTagLabel("postgres"), "PostgreSQL");
});

test("normalizeTags de-duplicates and reports unknown tags", () => {
  const result = apiTags.normalizeTags(["React", "react.js", "postgres", "nope", " "]);
  assert.deepStrictEqual(result.tags, ["react", "postgresql"]);
  assert.deepStrictEqual(result.unknown, ["nope", ""]);
});

test("expandTagAliases includes legacy stored spellings", () => {
  const expanded = apiTags.expandTagAliases(["postgresql", "scaling"]);
  assert.ok(expanded.includes("postgres"));
  assert.ok(expanded.includes("postgresql"));
  assert.ok(expanded.includes("scalability"));
});

/** String literals inside every `<key>: [ ... ]` / `findTag(tags, [ ... ])` array of a source file. */
function literalsIn(file: string, pattern: RegExp): string[] {
  const source = readFileSync(resolve(repoRoot, file), "utf8");
  const out: string[] = [];
  for (const match of source.matchAll(pattern)) {
    for (const literal of match[1].matchAll(/"([^"]+)"/g)) out.push(literal[1]);
  }
  return out;
}

test("every question-bank seed tag is in the catalog", () => {
  const tags = literalsIn("apps/api/prisma/seed.ts", /tags:\s*\[([\s\S]*?)\]/g);
  const unknown = tags.filter((t) => !apiTags.isKnownTag(t));
  assert.deepStrictEqual(unknown, []);
});

test("every scenario-generator tag is in the catalog", () => {
  const file = "apps/api/src/modules/technical-tests/engine/scenario-generator.ts";
  const tags = [
    ...literalsIn(file, /tagMatch:\s*\[([\s\S]*?)\]/g),
    ...literalsIn(file, /findTag\(\s*tags,\s*\[([\s\S]*?)\]/g),
  ];
  const unknown = tags.filter((t) => !apiTags.isKnownTag(t));
  assert.deepStrictEqual(unknown, []);
});

test("every API TECH_CATEGORIES item is in the catalog", () => {
  const categories = (apiConstants as Record<string, unknown>).TECH_CATEGORIES as
    | { items: string[] }[]
    | undefined;
  const items = (categories ?? []).flatMap((c) => c.items);
  const unknown = items.filter((t) => !apiTags.isKnownTag(t));
  assert.deepStrictEqual(unknown, []);
});
