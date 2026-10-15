import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  addDaysToDateKey,
  daysBetween,
  describeDueDate,
  getFollowUpState,
  isFollowUpDue,
} from "./follow-up";

describe("follow-up date helpers", () => {
  test("addDaysToDateKey crosses months, years and DST changes", () => {
    assert.equal(addDaysToDateKey("2026-10-15", 7), "2026-10-22");
    assert.equal(addDaysToDateKey("2026-12-29", 7), "2027-01-05");
    assert.equal(addDaysToDateKey("2026-03-28", 1), "2026-03-29");
    assert.equal(addDaysToDateKey("2026-03-29", 1), "2026-03-30");
    assert.equal(addDaysToDateKey("2026-03-01", -1), "2026-02-28");
  });

  test("daysBetween counts whole calendar days", () => {
    assert.equal(daysBetween("2026-10-15", "2026-10-15"), 0);
    assert.equal(daysBetween("2026-10-15", "2026-10-18"), 3);
    assert.equal(daysBetween("2026-10-15", "2026-10-10"), -5);
    assert.equal(daysBetween("2026-03-27", "2026-03-30"), 3);
  });
});

describe("getFollowUpState", () => {
  const today = "2026-10-15";

  test("reads the calendar date of a UTC-midnight timestamp, not the local time", () => {
    assert.equal(getFollowUpState("2026-10-15T00:00:00.000Z", "applied", today), "today");
    assert.equal(getFollowUpState("2026-10-14T00:00:00.000Z", "applied", today), "overdue");
  });

  test("classifies overdue, today, soon and later", () => {
    assert.equal(getFollowUpState("2026-10-01", "applied", today), "overdue");
    assert.equal(getFollowUpState("2026-10-15", "onsite", today), "today");
    assert.equal(getFollowUpState("2026-10-16", "applied", today), "soon");
    assert.equal(getFollowUpState("2026-10-17", "applied", today), "soon");
    assert.equal(getFollowUpState("2026-10-18", "applied", today), "later");
  });

  test("no date is none; closed applications are paused", () => {
    assert.equal(getFollowUpState(null, "applied", today), "none");
    assert.equal(getFollowUpState("", "applied", today), "none");
    assert.equal(getFollowUpState("2026-10-01", "accepted", today), "paused");
    assert.equal(getFollowUpState("2026-10-01", "rejected", today), "paused");
  });

  test("isFollowUpDue covers overdue, today and soon only", () => {
    assert.equal(isFollowUpDue("overdue"), true);
    assert.equal(isFollowUpDue("today"), true);
    assert.equal(isFollowUpDue("soon"), true);
    assert.equal(isFollowUpDue("later"), false);
    assert.equal(isFollowUpDue("paused"), false);
    assert.equal(isFollowUpDue("none"), false);
  });
});

describe("describeDueDate", () => {
  test("uses friendly relative words", () => {
    const today = "2026-10-15";
    assert.equal(describeDueDate("2026-10-15", today), "Today");
    assert.equal(describeDueDate("2026-10-16", today), "Tomorrow");
    assert.equal(describeDueDate("2026-10-14", today), "Yesterday");
    assert.equal(describeDueDate("2026-10-20", today), "In 5 days");
    assert.equal(describeDueDate("2026-10-11", today), "4 days overdue");
  });
});
