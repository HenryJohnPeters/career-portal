import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { PASSWORD_RULES, emailSchema, newPasswordSchema, withPasswordConfirmation } from "./password-rules";

describe("newPasswordSchema", () => {
  test("accepts passwords that meet every rule", () => {
    for (const value of ["abcdefg1", "correct horse battery 9", "Pässwörd12", "12345678a"]) {
      assert.equal(newPasswordSchema.safeParse(value).success, true, value);
    }
  });

  test("rejects short, letter-less, digit-less and over-long passwords", () => {
    const cases: [string, RegExp][] = [
      ["abc1", /at least 8/],
      ["12345678", /letter/],
      ["abcdefgh", /number/],
      [`a1${"x".repeat(71)}`, /too long/],
      // 36 two-byte characters + a digit = 73 bytes: over bcrypt's 72-byte limit.
      [`1${"é".repeat(36)}`, /too long/],
    ];
    for (const [value, message] of cases) {
      const result = newPasswordSchema.safeParse(value);
      assert.equal(result.success, false, value);
      if (!result.success) assert.match(result.error.issues[0].message, message, value);
    }
  });

  test("the checklist agrees with the schema", () => {
    const value = "abcdefg1";
    assert.ok(PASSWORD_RULES.every((rule) => rule.test(value)));
    assert.deepEqual(
      PASSWORD_RULES.filter((rule) => !rule.test("abc")).map((rule) => rule.id),
      ["length", "number"],
    );
  });
});

describe("emailSchema", () => {
  test("trims and validates", () => {
    const parsed = emailSchema.safeParse("  jane@example.com ");
    assert.equal(parsed.success, true);
    if (parsed.success) assert.equal(parsed.data, "jane@example.com");
    assert.equal(emailSchema.safeParse("not-an-email").success, false);
    assert.equal(emailSchema.safeParse("").success, false);
  });
});

describe("withPasswordConfirmation", () => {
  const schema = withPasswordConfirmation({ name: z.string() });

  test("requires the confirmation to match", () => {
    const ok = schema.safeParse({ name: "Jane", password: "abcdefg1", confirmPassword: "abcdefg1" });
    assert.equal(ok.success, true);
    const mismatch = schema.safeParse({ name: "Jane", password: "abcdefg1", confirmPassword: "abcdefg2" });
    assert.equal(mismatch.success, false);
    if (!mismatch.success) assert.deepEqual(mismatch.error.issues[0].path, ["confirmPassword"]);
  });
});
