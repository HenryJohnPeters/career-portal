import { test } from "node:test";
import assert from "node:assert/strict";
import { buildErrorReport } from "./report-error";

const env = {
  path: "/app/cv",
  release: "abc123",
  environment: "production",
  userAgent: "test",
  now: new Date("2026-10-15T12:00:00.000Z"),
};

test("buildErrorReport keeps what helps debugging and truncates the rest", () => {
  const error = new TypeError("x is undefined");
  const report = buildErrorReport(error, { queryKey: ["jobs"] }, env);
  assert.equal(report.name, "TypeError");
  assert.equal(report.message, "x is undefined");
  assert.ok(report.stack?.includes("TypeError"));
  assert.equal(report.context, '{"queryKey":["jobs"]}');
  assert.equal(report.path, "/app/cv");
  assert.equal(report.timestamp, "2026-10-15T12:00:00.000Z");

  const long = buildErrorReport(new Error("m".repeat(2000)), {}, env);
  assert.ok(long.message.length <= 501);
  assert.equal(long.context, null);
});

test("buildErrorReport handles thrown non-errors and unserialisable context", () => {
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  const report = buildErrorReport("boom", circular, env);
  assert.equal(report.name, "string");
  assert.equal(report.message, "boom");
  assert.equal(report.stack, null);
  assert.equal(report.context, null);
});
