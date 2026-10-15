import "reflect-metadata";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import {
  AiGenerateCoverLetterDto,
  CreateCoverLetterDto,
  RewriteDto,
  SuggestCoverLetterDto,
  UpdateCoverLetterDto,
} from "./cover-letters.dto";
import { toCoverLetterPayload } from "./cover-letters.queries";

/** Same pipeline as the global ValidationPipe in main.ts. */
async function check<T extends object>(cls: ClassConstructor<T>, body: unknown) {
  const dto = plainToInstance(cls, body);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  return { dto, failed: errors.map((e) => e.property) };
}

const UUID = "00000000-0000-4000-8000-000000000001";

describe("cover letter CRUD DTOs", () => {
  test("create trims the title and rejects a blank one", async () => {
    const ok = await check(CreateCoverLetterDto, { title: "  Acme letter " });
    assert.deepEqual(ok.failed, []);
    assert.equal(ok.dto.title, "Acme letter");
    assert.deepEqual((await check(CreateCoverLetterDto, { title: "   " })).failed, ["title"]);
  });

  test("jobId: null or \"\" unlinks; anything else must be a UUID", async () => {
    const cleared = await check(UpdateCoverLetterDto, { jobId: "" });
    assert.deepEqual(cleared.failed, []);
    assert.equal(cleared.dto.jobId, null);
    assert.deepEqual((await check(UpdateCoverLetterDto, { jobId: null })).failed, []);
    assert.deepEqual((await check(UpdateCoverLetterDto, { jobId: "x".repeat(5000) })).failed, ["jobId"]);
  });

  test("title and body cannot be nulled; body is capped", async () => {
    const { failed } = await check(UpdateCoverLetterDto, { title: null, body: null });
    assert.deepEqual(failed.sort(), ["body", "title"]);
    assert.deepEqual((await check(UpdateCoverLetterDto, { body: "x".repeat(15_001) })).failed, ["body"]);
  });
});

describe("cover letter AI DTOs", () => {
  test("every AI route accepts the editor text and the CV opt-out", async () => {
    const context = { currentBody: "Dear team", useCv: false };
    assert.deepEqual((await check(SuggestCoverLetterDto, context)).failed, []);
    assert.deepEqual((await check(RewriteDto, { ...context, tone: "friendly" })).failed, []);
    assert.deepEqual(
      (await check(AiGenerateCoverLetterDto, { ...context, action: "improve", cvVersionId: UUID })).failed,
      [],
    );
  });

  test("rejects bad types and oversized input", async () => {
    const { failed } = await check(AiGenerateCoverLetterDto, {
      action: "summarise",
      useCv: "no",
      currentBody: "x".repeat(15_001),
      cvVersionId: "abc",
      jobTitle: "x".repeat(201),
    });
    assert.deepEqual(failed.sort(), ["action", "currentBody", "cvVersionId", "jobTitle", "useCv"]);
  });
});

describe("toCoverLetterPayload", () => {
  const row = {
    id: "l1",
    userId: "u1",
    title: "Letter",
    body: "",
    jobId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const acme = { id: "j1", company: "Acme", role: "Dev" };
  const other = { id: "j2", company: "Other", role: "Dev" };

  test("uses the letter's own job link first", () => {
    const payload = toCoverLetterPayload({ ...row, jobId: "j1", job: acme, linkedFromJobs: [other] });
    assert.deepEqual(payload.job, acme);
    assert.equal("linkedFromJobs" in payload, false);
  });

  test("falls back to a tracked job that links the letter", () => {
    assert.deepEqual(toCoverLetterPayload({ ...row, job: null, linkedFromJobs: [other] }).job, other);
    assert.equal(toCoverLetterPayload({ ...row, job: null, linkedFromJobs: [] }).job, null);
  });
});
