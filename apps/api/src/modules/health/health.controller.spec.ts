import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { healthFailureReason } from "./health.controller";

describe("healthFailureReason", () => {
  test("a dropped connection names the Prisma code and the cause", () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      "\nInvalid `prisma.$queryRaw()` invocation:\n\n\nServer has closed the connection.",
      { code: "P1017", clientVersion: "5.22.0" },
    );
    assert.equal(healthFailureReason(err), "P1017 Server has closed the connection.");
  });

  test("an unreachable server keeps the useful line, not the advice after it", () => {
    const err = new Prisma.PrismaClientInitializationError(
      "\nInvalid `prisma.$queryRaw()` invocation:\n\n\nCan't reach database server at `db:5432`\n\nPlease make sure your database server is running at `db:5432`.",
      "5.22.0",
      "P1001",
    );
    assert.equal(healthFailureReason(err), "P1001 Can't reach database server at `db:5432`");
  });

  test("the ping timeout and non-errors", () => {
    assert.equal(healthFailureReason(new Error("timed out")), "timed out");
    assert.equal(healthFailureReason(new Error("")), "Error");
    assert.equal(healthFailureReason("boom"), "unknown error");
  });
});
