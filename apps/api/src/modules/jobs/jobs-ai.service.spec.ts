import "reflect-metadata";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { MAX_CV_VERSIONS_PER_USER } from "../cv/cv.rules";
import { PremiumRequiredException } from "../../common/errors";
import { JobsAiService } from "./jobs-ai.service";
import type { TailorApplicationDto } from "./jobs.dto";
import { fakePrisma, type PrismaCall } from "./fake-prisma.spec";

const USER = "user-1";
const premium = { assertPremium: async () => ({ isPremium: true }) } as any;
const DTO = { cvVersionId: "cv-1", includeCoverLetter: true, tone: "concise" } as TailorApplicationDto;

const base = {
  templateId: "modern",
  themeConfig: { primaryColor: "#123456" },
  headerLayout: "split",
  name: "Jane",
  email: "jane@example.com",
  photoUrl: null,
  phone: null,
  location: "London",
  website: null,
  linkedin: null,
  github: null,
  sections: [
    { id: "s1", title: "Profile", sectionType: "profile", content: "Original profile" },
    { id: "s2", title: "Education", sectionType: "education", content: "BSc" },
  ],
};

function setup(ai: (input: any) => Promise<unknown>, versionCount = () => 1) {
  const writes: PrismaCall[] = [];
  const { client, calls } = fakePrisma({
    "cvVersion.count": versionCount,
    "job.findFirst": () => ({ id: "job-1", company: "Acme", role: "Dev", jobDescription: "React role" }),
    "cvVersion.findFirst": () => base,
    "user.findUnique": () => ({ name: "Jane" }),
    "coverLetter.count": () => 0,
    "cvVersion.create": (args) => {
      writes.push({ model: "cvVersion", method: "create", args });
      return { id: "cv-new", themeConfig: {}, sections: [] };
    },
    "coverLetter.create": (args) => {
      writes.push({ model: "coverLetter", method: "create", args });
      return { id: "l-new", job: { id: "job-1", company: "Acme", role: "Dev" }, linkedFromJobs: [] };
    },
    "job.updateMany": (args) => {
      writes.push({ model: "job", method: "updateMany", args });
      return { count: 1 };
    },
  });
  const inputs: any[] = [];
  const aiService = {
    tailorApplication: async (_userId: string, input: any) => {
      inputs.push(input);
      return ai(input);
    },
  } as any;
  return { service: new JobsAiService(client, aiService, premium), calls, writes, inputs };
}

describe("JobsAiService.tailor", () => {
  test("free users get premium_required before any data is read", async () => {
    const { client, calls } = fakePrisma({});
    const free = {
      assertPremium: async () => {
        throw new PremiumRequiredException("tailorKit");
      },
    } as any;
    await assert.rejects(new JobsAiService(client, {} as any, free).tailor(USER, "job-1", DTO), PremiumRequiredException);
    assert.equal(calls.length, 0);
  });

  test("requires a job description", async () => {
    const { client } = fakePrisma({
      "job.findFirst": () => ({ id: "job-1", company: "A", role: "B", jobDescription: " " }),
    });
    await assert.rejects(new JobsAiService(client, {} as any, premium).tailor(USER, "job-1", DTO), BadRequestException);
  });

  test("copies the base CV with tailored sections, creates the letter and links both", async () => {
    const { service, writes, inputs } = setup(async () => ({
      sections: [{ id: "s1", content: "Tailored profile" }],
      coverLetter: "Dear Acme",
    }));
    const result = await service.tailor(USER, "job-1", DTO);

    assert.equal(inputs[0].tone, "concise");
    assert.equal(inputs[0].sections.length, 2);
    const version = writes.find((w) => w.model === "cvVersion")!.args.data;
    // Role only: templates print the title under the candidate's name.
    assert.equal(version.title, "Dev");
    assert.equal(version.templateId, "modern");
    assert.equal(version.location, "London");
    assert.equal(version.isActive, false);
    assert.deepEqual(version.sections.createMany.data, [
      { title: "Profile", sectionType: "profile", content: "Tailored profile", order: 0 },
      { title: "Education", sectionType: "education", content: "BSc", order: 1 },
    ]);
    const letter = writes.find((w) => w.model === "coverLetter")!.args.data;
    assert.equal(letter.body, "Dear Acme");
    assert.equal(letter.jobId, "job-1");
    const link = writes.find((w) => w.model === "job")!.args;
    const { matchScore, matchCheckedAt, ...links } = link.data;
    assert.deepEqual(links, { cvVersionId: "cv-new", coverLetterId: "l-new" });
    // The job's score is recomputed for the tailored CV it now links to.
    assert.equal(typeof matchScore, "number");
    assert.ok(matchScore >= 0 && matchScore <= 100);
    assert.ok(matchCheckedAt instanceof Date);
    assert.equal(result.coverLetter?.job?.company, "Acme");
  });

  test("refuses before the AI call when the CV-version cap is reached", async () => {
    const { service, writes, inputs } = setup(
      async () => ({ sections: [], coverLetter: null }),
      () => MAX_CV_VERSIONS_PER_USER,
    );
    await assert.rejects(service.tailor(USER, "job-1", DTO), ForbiddenException);
    assert.equal(inputs.length, 0);
    assert.deepEqual(writes, []);
  });

  test("re-checks the CV-version cap under the lock", async () => {
    let counts = 0;
    const { service, writes } = setup(
      async () => ({ sections: [], coverLetter: null }),
      () => (++counts === 1 ? 1 : MAX_CV_VERSIONS_PER_USER),
    );
    await assert.rejects(service.tailor(USER, "job-1", DTO), /CV versions/);
    assert.deepEqual(writes, []);
  });

  test("an AI failure writes nothing", async () => {
    const { service, writes } = setup(async () => {
      throw new ServiceUnavailableException("The AI service is temporarily unavailable.");
    });
    await assert.rejects(service.tailor(USER, "job-1", DTO), ServiceUnavailableException);
    assert.deepEqual(writes, []);
  });

  test("a second concurrent request from the same user is refused", async () => {
    let release!: () => void;
    const { service } = setup(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ sections: [{ id: "s1", content: "x" }], coverLetter: null });
        }),
    );
    const first = service.tailor(USER, "job-1", DTO);
    await new Promise((r) => setImmediate(r));
    await assert.rejects(service.tailor(USER, "job-1", DTO), /already being created/);
    release();
    await first;
  });
});
