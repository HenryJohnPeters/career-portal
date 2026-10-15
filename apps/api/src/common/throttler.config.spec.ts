import "reflect-metadata";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { AccountController } from "../modules/account/account.controller";
import { HealthController } from "../modules/health/health.controller";
import {
  ACCOUNT_ACTION_THROTTLE,
  SKIP_ALL_THROTTLERS,
  THROTTLER_NAMES,
  THROTTLERS,
} from "./throttler.config";

/* @nestjs/throttler metadata keys (prefix + throttler name; not exported by the package). */
const SKIP = "THROTTLER:SKIP";
const LIMIT = "THROTTLER:LIMIT";
const TTL = "THROTTLER:TTL";

describe("throttler config", () => {
  test("exactly the 'default' and 'burst' throttlers (PLAN contract names)", () => {
    assert.deepEqual([...THROTTLER_NAMES], ["default", "burst"]);
    assert.deepEqual(THROTTLERS.map((t) => t.name), [...THROTTLER_NAMES]);
    assert.deepEqual(Object.keys(SKIP_ALL_THROTTLERS).sort(), [...THROTTLER_NAMES].sort());
  });

  test("health probes skip every throttler", () => {
    for (const name of THROTTLER_NAMES) {
      assert.equal(Reflect.getMetadata(SKIP + name, HealthController), true, name);
    }
  });

  test("account export and delete are limited to 3 per hour", () => {
    for (const handler of [
      AccountController.prototype.export,
      AccountController.prototype.deleteAccount,
    ]) {
      assert.equal(Reflect.getMetadata(`${LIMIT}default`, handler), 3, handler.name);
      assert.equal(
        Reflect.getMetadata(`${TTL}default`, handler),
        ACCOUNT_ACTION_THROTTLE.default.ttl,
        handler.name,
      );
    }
  });
});
