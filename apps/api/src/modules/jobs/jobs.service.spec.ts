import "reflect-metadata";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { JobsService } from "./jobs.service";
import { JOB_LIMITS } from "./jobs.constants";
import type { CreateJobDto, UpdateJobDto } from "./jobs.dto";
import { fakePrisma } from "./fake-prisma.spec";

const USER = "user-1";
const premium = { getPlan: async () => ({ isPremium: true }) } as any;
const row = (data: Record<string, unknown> = {}) => ({
  id: "job-1",
  status: "applied",
  jobDescription: null,
  ...data,
});

describe("JobsService ownership", () => {
  test("linking another user's CV or cover letter is a 404 and writes nothing", async () => {
    const { client, calls } = fakePrisma({ "cvVersion.findFirst": () => null });
    const service = new JobsService(client, premium);
    await assert.rejects(
      service.create(USER, { company: "A", role: "B", cvVersionId: "cv-of-someone-else" } as CreateJobDto),
      NotFoundException,
    );
    assert.deepEqual(
      calls.find((c) => c.model === "cvVersion")?.args.where,
      { id: "cv-of-someone-else", userId: USER },
    );
    assert.equal(calls.some((c) => c.method === "create"), false);
  });

  test("updating or deleting a job that isn't the user's is a 404", async () => {
    const { client } = fakePrisma({ "job.findFirst": () => null, "job.deleteMany": () => ({ count: 0 }) });
    const service = new JobsService(client, premium);
    await assert.rejects(service.update(USER, "job-x", { status: "onsite" } as UpdateJobDto), NotFoundException);
    await assert.rejects(service.remove(USER, "job-x"), NotFoundException);
  });
});

describe("JobsService.create", () => {
  test("enforces the per-user job cap under the lock", async () => {
    const { client } = fakePrisma({ "job.count": () => JOB_LIMITS.jobsPerUser });
    const service = new JobsService(client, premium);
    await assert.rejects(service.create(USER, { company: "A", role: "B" } as CreateJobDto), ForbiddenException);
  });

  test("stamps appliedAt unless the job starts on the wishlist", async () => {
    const created: any[] = [];
    const { client } = fakePrisma({
      "job.count": () => 0,
      "job.create": (args) => {
        created.push(args.data);
        return row(args.data);
      },
    });
    const service = new JobsService(client, premium);
    await service.create(USER, { company: "A", role: "B" } as CreateJobDto);
    await service.create(USER, { company: "A", role: "B", status: "wishlist" } as CreateJobDto);
    assert.ok(created[0].appliedAt instanceof Date);
    assert.equal(created[0].status, "applied");
    assert.equal(created[1].appliedAt, null);
  });
});

describe("JobsService.update", () => {
  const setup = (current: Record<string, unknown>) => {
    let data: any;
    const { client } = fakePrisma({
      "job.findFirst": () => ({ status: "wishlist", appliedAt: null, jobDescription: "old", ...current }),
      "cvVersion.findFirst": () => ({ id: "owned" }),
      "job.update": (args) => {
        data = args.data;
        return row();
      },
    });
    return { service: new JobsService(client, premium), data: () => data };
  };

  test("leaving the wishlist sets appliedAt once", async () => {
    const fresh = setup({});
    await fresh.service.update(USER, "job-1", { status: "applied" } as UpdateJobDto);
    assert.ok(fresh.data().appliedAt instanceof Date);

    const already = setup({ appliedAt: new Date("2026-01-01") });
    await already.service.update(USER, "job-1", { status: "applied" } as UpdateJobDto);
    assert.equal(already.data().appliedAt, undefined);
  });

  test("null clears fields; omitted fields stay untouched", async () => {
    const { service, data } = setup({ status: "applied" });
    await service.update(USER, "job-1", { followUpDate: null, cvVersionId: null, notes: null } as UpdateJobDto);
    assert.equal(data().followUpDate, null);
    assert.equal(data().cvVersionId, null);
    assert.equal(data().notes, null);
    assert.equal(data().company, undefined);
    assert.equal(data().url, undefined);
  });

  test("a changed job description clears the stale match score", async () => {
    const changed = setup({ status: "applied" });
    await changed.service.update(USER, "job-1", { jobDescription: "new" } as UpdateJobDto);
    assert.equal(changed.data().matchScore, null);

    const same = setup({ status: "applied" });
    await same.service.update(USER, "job-1", { jobDescription: "old" } as UpdateJobDto);
    assert.equal(same.data().matchScore, undefined);
  });

  test("linking a different CV clears the match score, keeping matchCheckedAt", async () => {
    const relinked = setup({ status: "applied", cvVersionId: "cv-1" });
    await relinked.service.update(USER, "job-1", { cvVersionId: "cv-2" } as UpdateJobDto);
    assert.equal(relinked.data().matchScore, null);
    assert.equal(relinked.data().matchCheckedAt, undefined);

    const unlinked = setup({ status: "applied", cvVersionId: "cv-1" });
    await unlinked.service.update(USER, "job-1", { cvVersionId: null } as UpdateJobDto);
    assert.equal(unlinked.data().matchScore, null);

    const same = setup({ status: "applied", cvVersionId: "cv-1" });
    await same.service.update(USER, "job-1", { cvVersionId: "cv-1", notes: "x" } as UpdateJobDto);
    assert.equal(same.data().matchScore, undefined);
  });
});

describe("JobsService.match", () => {
  test("needs a job description", async () => {
    const { client } = fakePrisma({ "job.findFirst": () => ({ jobDescription: "  ", cvVersionId: null }) });
    await assert.rejects(
      new JobsService(client, premium).match(USER, "job-1", {}),
      /Add the job description/,
    );
  });

  test("scores the linked CV and saves the score", async () => {
    let saved: any;
    const { client } = fakePrisma({
      "job.findFirst": () => ({ jobDescription: "React and TypeScript", cvVersionId: "cv-1" }),
      "cvVersion.findFirst": (args) => {
        assert.deepEqual(args.where, { id: "cv-1", userId: USER });
        return {
          id: "cv-1",
          email: null,
          phone: null,
          photoUrl: null,
          user: { email: "jane@example.com" },
          sections: [{ title: "Skills", sectionType: "skills", content: "React" }],
        };
      },
      "job.updateMany": (args) => {
        saved = args;
        return { count: 1 };
      },
    });
    const result = await new JobsService(client, premium).match(USER, "job-1", {});
    assert.equal(result.cvVersionId, "cv-1");
    assert.equal(result.score, 50);
    assert.deepEqual(saved.where, { id: "job-1", userId: USER });
    assert.equal(saved.data.matchScore, 50);
    // A blank CV email falls back to the account email, as on the PDF.
    assert.equal(result.atsChecks.find((c) => c.key === "contact_email")?.passed, true);
  });
});
