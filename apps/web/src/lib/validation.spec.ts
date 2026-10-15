import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isEmailAddress, isFqdn, isWebUrl } from "./validation";

/* Expectations match validator.js 13.15 (what the API's class-validator runs). */

describe("isEmailAddress", () => {
  test("accepts ordinary addresses", () => {
    for (const email of ["jane@example.com", "jane.doe+cv@mail.example.co.uk", "o'brien@example.ie", "jürgen@bücher.de"]) {
      assert.equal(isEmailAddress(email), true, email);
    }
  });

  test("rejects what the API rejects", () => {
    for (const email of [
      "jane@my_company.com",
      "jane..doe@example.com",
      ".jane@example.com",
      "jane.@example.com",
      "jane@example.c0m",
      "jane@-example.com",
      "jane@example-.com",
      "jane@example",
      "jane@",
      "@example.com",
      "jane doe@example.com",
      `${"a".repeat(65)}@example.com`,
    ]) {
      assert.equal(isEmailAddress(email), false, email);
    }
  });
});

describe("isWebUrl", () => {
  test("accepts http(s) links with real host names", () => {
    for (const url of [
      "https://jane.dev",
      "http://jobs.acme.co.uk/role?id=1#apply",
      "https://linkedin.com/in/jane_doe",
      "https://example.com:8443/x",
      "https://user:pass@example.com",
    ]) {
      assert.equal(isWebUrl(url), true, url);
    }
  });

  test("rejects what the API rejects", () => {
    for (const url of [
      "https://jane_doe.dev",
      "https://-jane.dev",
      "https://careers.my_company.com/jobs/1",
      "https://example.c0m/jobs",
      "https://localhost:3000",
      "https://example.com:99999",
      "https://exa%41mple.com",
      "https://example.com/a b",
      "https://example.com/<x>",
      "ftp://example.com",
      "javascript:alert(1)",
      "example.com",
      "https://",
      "https://@example.com",
    ]) {
      assert.equal(isWebUrl(url), false, url);
    }
  });

  test("disallowAuth refuses credentials", () => {
    assert.equal(isWebUrl("https://user:pass@example.com", { disallowAuth: true }), false);
    assert.equal(isWebUrl("https://example.com/@me", { disallowAuth: true }), true);
  });
});

test("isFqdn needs a TLD of letters (or punycode) and clean labels", () => {
  assert.equal(isFqdn("xn--bcher-kva.de"), true);
  assert.equal(isFqdn("example.xn--p1ai"), true);
  assert.equal(isFqdn("example.com."), false);
  assert.equal(isFqdn("192.168.0.1"), false);
  assert.equal(isFqdn(`${"a".repeat(64)}.com`), false);
});
