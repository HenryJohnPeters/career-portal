import "reflect-metadata";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import {
  AnalyzeJobDto,
  CreateJobDto,
  MatchTextDto,
  TailorApplicationDto,
  UpdateJobDto,
} from "./jobs.dto";

/** Same pipeline as the global ValidationPipe in main.ts. */
async function check<T extends object>(cls: ClassConstructor<T>, body: unknown) {
  const dto = plainToInstance(cls, body);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  return { dto, failed: errors.map((e) => e.property) };
}

const UUID = "00000000-0000-4000-8000-000000000001";

describe("CreateJobDto", () => {
  test("accepts the new fields and normalises them", async () => {
    const { dto, failed } = await check(CreateJobDto, {
      company: "  Acme ",
      role: " Engineer",
      url: "acme.com/jobs/1",
      jobDescription: "  Build things  ",
      location: "London",
      salary: "",
      followUpDate: "2026-11-02",
      keySkills: [" React ", "react", "", "TypeScript"],
      cvVersionId: "",
    });
    assert.deepEqual(failed, []);
    assert.equal(dto.company, "Acme");
    assert.equal(dto.role, "Engineer");
    assert.equal(dto.url, "https://acme.com/jobs/1");
    assert.equal(dto.jobDescription, "Build things");
    assert.equal(dto.salary, null);
    assert.equal(dto.cvVersionId, null);
    assert.deepEqual(dto.keySkills, ["React", "TypeScript"]);
  });

  test("rejects blank required fields and unknown statuses", async () => {
    const { failed } = await check(CreateJobDto, {
      company: "   ",
      role: "",
      status: "ghosted",
    });
    assert.deepEqual(failed.sort(), ["company", "role", "status"]);
  });

  test("non-string and malformed values are a 400, not a crash", async () => {
    const { failed } = await check(CreateJobDto, {
      company: "Acme",
      role: "Dev",
      url: 123,
      notes: {},
      cvVersionId: "not-a-uuid",
      followUpDate: "2026-02-30",
      keySkills: ["ok", 5],
    });
    assert.deepEqual(failed.sort(), ["cvVersionId", "followUpDate", "keySkills", "notes", "url"]);
  });

  test("only http(s) URLs without credentials", async () => {
    for (const url of ["javascript:alert(1)", "ftp://x.com/a", "https://user:pw@evil.com"]) {
      const { failed } = await check(CreateJobDto, { company: "A", role: "B", url });
      assert.deepEqual(failed, ["url"], url);
    }
  });

  test("enforces size limits", async () => {
    const { failed } = await check(CreateJobDto, {
      company: "A",
      role: "B",
      jobDescription: "x".repeat(20_001),
      location: "x".repeat(121),
      keySkills: Array.from({ length: 31 }, (_, i) => `skill${i}`),
    });
    assert.deepEqual(failed.sort(), ["jobDescription", "keySkills", "location"]);
  });
});

describe("UpdateJobDto", () => {
  test("a partial PATCH (kanban drag) validates", async () => {
    const { failed } = await check(UpdateJobDto, { status: "onsite" });
    assert.deepEqual(failed, []);
  });

  test("null and \"\" clear every nullable field", async () => {
    const body = {
      url: null,
      notes: "",
      cvVersionId: null,
      coverLetterId: "",
      followUpDate: null,
      jobDescription: "   ",
      location: null,
      salary: null,
      appliedAt: "",
    };
    const { dto, failed } = await check(UpdateJobDto, body);
    assert.deepEqual(failed, []);
    for (const key of Object.keys(body)) {
      assert.equal((dto as unknown as Record<string, unknown>)[key], null, key);
    }
  });

  test("required columns cannot be nulled", async () => {
    const { failed } = await check(UpdateJobDto, { company: null, role: null, status: null });
    assert.deepEqual(failed.sort(), ["company", "role", "status"]);
  });

  test("keySkills null means none", async () => {
    const { dto, failed } = await check(UpdateJobDto, { keySkills: null });
    assert.deepEqual(failed, []);
    assert.deepEqual(dto.keySkills, []);
  });

  test("rejects unknown properties", async () => {
    const { failed } = await check(UpdateJobDto, { userId: UUID, matchScore: 100 });
    assert.deepEqual(failed.sort(), ["matchScore", "userId"]);
  });
});

describe("match / analyse / tailor DTOs", () => {
  test("match-text needs a CV id and a non-blank description", async () => {
    assert.deepEqual((await check(MatchTextDto, { cvVersionId: UUID, jobDescription: "React" })).failed, []);
    assert.deepEqual(
      (await check(MatchTextDto, { cvVersionId: "x", jobDescription: "  " })).failed.sort(),
      ["cvVersionId", "jobDescription"],
    );
  });

  test("analyse needs at least 50 characters after trimming", async () => {
    const short = await check(AnalyzeJobDto, { jobDescription: `${" ".repeat(60)}too short` });
    assert.deepEqual(short.failed, ["jobDescription"]);
    const ok = await check(AnalyzeJobDto, { jobDescription: "x".repeat(50) });
    assert.deepEqual(ok.failed, []);
  });

  test("tailor validates the CV id, the letter flag and the tone", async () => {
    assert.deepEqual(
      (await check(TailorApplicationDto, { cvVersionId: UUID, includeCoverLetter: true, tone: "concise" })).failed,
      [],
    );
    assert.deepEqual(
      (await check(TailorApplicationDto, { cvVersionId: UUID, includeCoverLetter: "yes", tone: "rude" })).failed.sort(),
      ["includeCoverLetter", "tone"],
    );
  });
});
