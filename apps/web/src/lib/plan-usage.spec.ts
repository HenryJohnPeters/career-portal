import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  buildMeterRows,
  formatResetDate,
  meterTone,
  visibleFairUseRows,
} from "./plan-usage";

const meter = (used: number, limit: number | null, resetsAt: string | null = null) => ({
  used,
  limit,
  remaining: limit === null ? null : Math.max(0, limit - used),
  resetsAt,
});

describe("plan usage helpers", () => {
  test("meterTone thresholds", () => {
    assert.equal(meterTone(null), "ok");
    assert.equal(meterTone(0), "ok");
    assert.equal(meterTone(79), "ok");
    assert.equal(meterTone(80), "warning");
    assert.equal(meterTone(99), "warning");
    assert.equal(meterTone(100), "exhausted");
  });

  test("buildMeterRows orders monthly allowances first and skips missing meters", () => {
    const rows = buildMeterRows({
      coverLetters: meter(5, 5),
      aiActions: meter(3, 10, "2026-11-01T00:00:00.000Z"),
      cvVersions: meter(1, 2),
    });
    assert.deepEqual(
      rows.map((r) => r.key),
      ["aiActions", "cvVersions", "coverLetters"],
    );
    assert.equal(rows[0].label, "AI actions");
    assert.equal(rows[0].percent, 30);
    assert.equal(rows[0].resetsAt, "2026-11-01T00:00:00.000Z");
    assert.equal(rows[2].tone, "exhausted");
  });

  test("unlimited meters have no percent", () => {
    const [row] = buildMeterRows({ aiActions: meter(42, null) });
    assert.equal(row.percent, null);
    assert.equal(row.tone, "ok");
  });

  test("fair-use rows only appear from 80% of a cap", () => {
    assert.deepEqual(visibleFairUseRows(null), []);
    assert.deepEqual(
      visibleFairUseRows({ aiActionsToday: 10, dailyLimit: 40, aiActionsThisMonth: 100, monthlyLimit: 300 }),
      [],
    );
    const rows = visibleFairUseRows({
      aiActionsToday: 32,
      dailyLimit: 40,
      aiActionsThisMonth: 300,
      monthlyLimit: 300,
    });
    assert.deepEqual(
      rows.map((r) => [r.key, r.percent, r.tone]),
      [
        ["daily", 80, "warning"],
        ["monthly", 100, "exhausted"],
      ],
    );
  });

  test("formatResetDate shows the UTC boundary day", () => {
    assert.equal(formatResetDate("2026-11-01T00:00:00.000Z", "en-GB"), "1 Nov");
    assert.equal(formatResetDate(null), null);
    assert.equal(formatResetDate("garbage"), null);
  });
});
