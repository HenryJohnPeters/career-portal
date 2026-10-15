import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { HOME_TITLE, getAppPageTitle, getDocumentTitle } from "./page-titles";

describe("page titles", () => {
  test("document titles for known routes", () => {
    assert.equal(getDocumentTitle("/"), HOME_TITLE);
    assert.equal(getDocumentTitle("/app/jobs"), "Job Tracker · careerRepo");
    assert.equal(getDocumentTitle("/app/jobs/"), "Job Tracker · careerRepo");
    assert.equal(getDocumentTitle("/login"), "Sign in · careerRepo");
    assert.equal(getDocumentTitle("/privacy"), "Privacy policy · careerRepo");
  });

  test("unknown routes are 'Page not found'", () => {
    assert.equal(getDocumentTitle("/app/job"), "Page not found · careerRepo");
    assert.equal(getDocumentTitle("/nope"), "Page not found · careerRepo");
  });

  test("header title only for app routes", () => {
    assert.equal(getAppPageTitle("/app/settings"), "Settings");
    assert.equal(getAppPageTitle("/login"), null);
  });
});
