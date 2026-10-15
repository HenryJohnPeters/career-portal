import "reflect-metadata";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { QuotaExceededException } from "../../common/errors";
import { CoverLettersService } from "./cover-letters.service";
import { MAX_COVER_LETTERS_PER_USER } from "./cover-letters.queries";
import type { AiGenerateCoverLetterDto, CreateCoverLetterDto } from "./cover-letters.dto";
import { fakePrisma } from "../jobs/fake-prisma.spec";

const USER = "user-1";
const plan = (coverLetters: number | null) =>
  ({ getPlan: async () => ({ limits: { coverLetters } }) }) as any;
const letterRow = { id: "l1", job: null, linkedFromJobs: [] };

/** Records what the service passes to the AI, without calling OpenAI. */
function fakeAi() {
  const requests: any[] = [];
  return {
    requests,
    service: {
      generateCoverLetterContent: async (_userId: string, req: unknown) => {
        requests.push(req);
        return { content: "Letter", truncated: false };
      },
      suggestCoverLetterImprovements: async (_userId: string, req: unknown) => {
        requests.push(req);
        return ["Tip"];
      },
      rewriteCoverLetter: async (_userId: string, req: unknown) => {
        requests.push(req);
        return { content: "Rewritten", truncated: false };
      },
    } as any,
  };
}

describe("CoverLettersService.create", () => {
  test("free plan: quota error with details at the limit", async () => {
    const { client } = fakePrisma({ "coverLetter.count": () => 5 });
    const service = new CoverLettersService(client, fakeAi().service, plan(5));
    await assert.rejects(service.create(USER, { title: "T" } as CreateCoverLetterDto), (err: unknown) => {
      assert.ok(err instanceof QuotaExceededException);
      assert.deepEqual((err.getResponse() as any).details, {
        reason: "quota_exceeded",
        quota: "coverLetters",
        limit: 5,
        used: 5,
        resetsAt: null,
      });
      return true;
    });
  });

  test("premium: no plan quota, but the hard cap still applies", async () => {
    const under = fakePrisma({ "coverLetter.count": () => 50, "coverLetter.create": () => letterRow });
    await new CoverLettersService(under.client, fakeAi().service, plan(null)).create(USER, {
      title: "T",
    } as CreateCoverLetterDto);
    assert.ok(under.calls.some((c) => c.method === "create"));

    const atCap = fakePrisma({ "coverLetter.count": () => MAX_COVER_LETTERS_PER_USER });
    await assert.rejects(
      new CoverLettersService(atCap.client, fakeAi().service, plan(null)).create(USER, {
        title: "T",
      } as CreateCoverLetterDto),
      ForbiddenException,
    );
  });

  test("linking another user's job is a 404", async () => {
    const { client, calls } = fakePrisma({ "job.findFirst": () => null });
    await assert.rejects(
      new CoverLettersService(client, fakeAi().service, plan(null)).create(USER, {
        title: "T",
        jobId: "job-x",
      } as CreateCoverLetterDto),
      NotFoundException,
    );
    assert.equal(calls.some((c) => c.method === "create"), false);
  });
});

describe("CoverLettersService AI context", () => {
  const letter = { id: "l1", body: "Saved body", jobId: null };

  test("uses the editor text and never loads the CV when useCv is false", async () => {
    const ai = fakeAi();
    const { client, calls } = fakePrisma({
      "coverLetter.findFirst": () => letter,
      "user.findUnique": () => ({ name: "Jane" }),
    });
    const service = new CoverLettersService(client, ai.service, plan(null));
    const result = await service.aiGenerate(USER, "l1", {
      action: "improve",
      currentBody: "Unsaved editor text",
      useCv: false,
      cvVersionId: "cv-1",
    } as AiGenerateCoverLetterDto);

    assert.deepEqual(result, { content: "Letter", truncated: false });
    assert.equal(calls.some((c) => c.model === "cvVersion"), false);
    assert.equal(ai.requests[0].currentBody, "Unsaved editor text");
    assert.equal(ai.requests[0].useCv, false);
    assert.equal(ai.requests[0].cvSections, undefined);
    assert.equal(ai.requests[0].userName, "Jane");
  });

  test("a chosen CV that isn't the user's is a 404 before any AI call", async () => {
    const ai = fakeAi();
    const { client } = fakePrisma({
      "coverLetter.findFirst": () => letter,
      "cvVersion.findFirst": () => null,
    });
    await assert.rejects(
      new CoverLettersService(client, ai.service, plan(null)).aiGenerate(USER, "l1", {
        action: "generate",
        cvVersionId: "cv-x",
      } as AiGenerateCoverLetterDto),
      NotFoundException,
    );
    assert.equal(ai.requests.length, 0);
  });

  test("reads job context from a tracked job that links the letter", async () => {
    const ai = fakeAi();
    const { client, calls } = fakePrisma({
      "coverLetter.findFirst": () => letter,
      "job.findFirst": () => ({
        role: "Frontend Dev",
        company: "Acme",
        url: null,
        jobDescription: null,
        notes: "Pasted advert in notes",
      }),
    });
    await new CoverLettersService(client, ai.service, plan(null)).suggest(USER, "l1", {});
    const jobQuery = calls.find((c) => c.model === "job")!;
    assert.deepEqual(jobQuery.args.where, { userId: USER, coverLetterId: "l1" });
    assert.deepEqual(ai.requests[0], {
      body: "Saved body",
      jobTitle: "Frontend Dev",
      companyName: "Acme",
      jobDescription: "Pasted advert in notes",
    });
  });

  test("request fields win over the linked job; rewrite returns the text", async () => {
    const ai = fakeAi();
    const { client } = fakePrisma({
      "coverLetter.findFirst": () => ({ ...letter, jobId: "job-1" }),
      "job.findFirst": () => ({ role: "Dev", company: "Acme", url: "https://acme.com", jobDescription: "JD", notes: null }),
    });
    const service = new CoverLettersService(client, ai.service, plan(null));
    await service.aiGenerate(USER, "l1", { action: "generate", jobTitle: "Lead Dev", companyName: " " } as AiGenerateCoverLetterDto);
    assert.equal(ai.requests[0].jobTitle, "Lead Dev");
    assert.equal(ai.requests[0].companyName, "Acme");
    assert.equal(ai.requests[0].companyUrl, "https://acme.com");
    assert.equal(ai.requests[0].jobDescription, "JD");

    assert.equal(await service.rewrite(USER, "l1", { tone: "friendly" }), "Rewritten");
    assert.equal(ai.requests[1].tone, "friendly");
  });
});
