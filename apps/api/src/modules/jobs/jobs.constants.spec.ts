import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import {
  JOB_LIMITS,
  JOB_STATUSES,
  normalizeJobStatus,
  storedStatusValues,
} from "./jobs.constants";

/*
 * The API cannot import libs/shared/types at runtime, so the job statuses and
 * limits are mirrored. Loaded with a computed require so the API build
 * (rootDir: src) never compiles the libs file.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const libsJobs = require(
  resolve(__dirname, "../../../../../libs/shared/types/src/jobs"),
) as { JOB_STATUSES: readonly string[]; JOB_LIMITS: Record<string, number> };

describe("shared mirror", () => {
  test("JOB_STATUSES matches libs/shared/types", () => {
    assert.deepEqual([...JOB_STATUSES], [...libsJobs.JOB_STATUSES]);
  });

  test("JOB_LIMITS matches libs/shared/types", () => {
    assert.deepEqual({ ...JOB_LIMITS }, { ...libsJobs.JOB_LIMITS });
  });
});

describe("job statuses", () => {
  test("legacy and unknown stored values read as current statuses", () => {
    assert.equal(normalizeJobStatus("onsite"), "onsite");
    assert.equal(normalizeJobStatus("saved"), "wishlist");
    assert.equal(normalizeJobStatus("interview"), "phone_screen");
    assert.equal(normalizeJobStatus("offer"), "accepted");
    assert.equal(normalizeJobStatus("ghosted"), "rejected");
    assert.equal(normalizeJobStatus("nonsense"), "applied");
    assert.equal(normalizeJobStatus(null), "applied");
  });

  test("filters include the legacy values of each status", () => {
    assert.deepEqual(storedStatusValues(["accepted", "rejected"]), [
      "accepted",
      "rejected",
      "offer",
      "ghosted",
    ]);
    assert.deepEqual(storedStatusValues(["onsite"]), ["onsite"]);
  });
});
