import "reflect-metadata";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import {
  AiGenerateCvSectionDto,
  ApplyCvContentDto,
  CreateCvSectionDto,
  ReorderSectionsDto,
  UpdateCvSectionDto,
  UpdateCvVersionDto,
} from "./cv.dto";

/** Same pipeline as the global ValidationPipe in main.ts. */
async function check<T extends object>(cls: ClassConstructor<T>, body: unknown) {
  const dto = plainToInstance(cls, body);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  const failed = (list: typeof errors, prefix = ""): string[] =>
    list.flatMap((e) => [
      ...(e.constraints ? [`${prefix}${e.property}`] : []),
      ...failed(e.children ?? [], `${prefix}${e.property}.`),
    ]);
  return { dto, failed: failed(errors) };
}

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("UpdateCvVersionDto contact fields", () => {
  test("normalises bare URLs instead of rejecting them", async () => {
    const { dto, failed } = await check(UpdateCvVersionDto, {
      website: "example.com",
      linkedin: "linkedin.com/in/jane",
      github: "octocat",
    });
    assert.deepEqual(failed, []);
    assert.equal(dto.website, "https://example.com");
    assert.equal(dto.linkedin, "https://linkedin.com/in/jane");
    assert.equal(dto.github, "https://github.com/octocat");
  });

  test("empty strings and null clear fields", async () => {
    const { dto, failed } = await check(UpdateCvVersionDto, {
      email: "",
      website: " ",
      phone: "",
      linkedin: null,
    });
    assert.deepEqual(failed, []);
    assert.equal(dto.email, null);
    assert.equal(dto.website, null);
    assert.equal(dto.phone, null);
    assert.equal(dto.linkedin, null);
  });

  test("non-strings are a 400, not a crash", async () => {
    const { failed } = await check(UpdateCvVersionDto, {
      photoUrl: 123,
      website: ["x"],
      email: false,
    });
    assert.deepEqual(failed.sort(), ["email", "photoUrl", "website"]);
  });

  test("photoUrl must be https", async () => {
    const { failed } = await check(UpdateCvVersionDto, { photoUrl: "http://example.com/a.png" });
    assert.deepEqual(failed, ["photoUrl"]);
  });

  test("null is rejected for non-nullable columns", async () => {
    const { failed } = await check(UpdateCvVersionDto, {
      title: null,
      isActive: null,
      templateId: null,
      themeConfig: null,
      headerLayout: null,
    });
    assert.deepEqual(failed.sort(), ["headerLayout", "isActive", "templateId", "themeConfig", "title"]);
  });

  test("template and header layout must be known; title ≤ 120", async () => {
    const { failed } = await check(UpdateCvVersionDto, {
      templateId: "corporate",
      headerLayout: "sideways",
      title: "x".repeat(121),
    });
    assert.deepEqual(failed.sort(), ["headerLayout", "templateId", "title"]);
  });

  test("themeConfig is accepted as any object (normalised by the service)", async () => {
    const { failed } = await check(UpdateCvVersionDto, {
      themeConfig: { primaryColor: "</style>", extra: 1 },
    });
    assert.deepEqual(failed, []);
  });
});

describe("section DTOs", () => {
  test("unknown section types become custom; known ones are lowercased", async () => {
    const created = await check(CreateCvSectionDto, { title: "A", sectionType: "Summary" });
    assert.equal(created.dto.sectionType, "custom");
    const updated = await check(UpdateCvSectionDto, { sectionType: "SKILLS" });
    assert.equal(updated.dto.sectionType, "skills");
  });

  test("enforce title and content limits", async () => {
    const { failed } = await check(UpdateCvSectionDto, {
      title: "t".repeat(201),
      content: "c".repeat(15_001),
    });
    assert.deepEqual(failed.sort(), ["content", "title"]);
  });

  test("reorder ids must be unique UUIDs", async () => {
    assert.deepEqual((await check(ReorderSectionsDto, { sectionIds: [uuid(1), uuid(2)] })).failed, []);
    assert.deepEqual(
      (await check(ReorderSectionsDto, { sectionIds: [uuid(1), uuid(1)] })).failed,
      ["sectionIds"],
    );
    assert.deepEqual((await check(ReorderSectionsDto, { sectionIds: ["x"] })).failed, ["sectionIds"]);
  });
});

describe("ApplyCvContentDto", () => {
  const section = { title: "Profile", content: "Hi", sectionType: "profile" };

  test("accepts sections plus a normalised contact", async () => {
    const { dto, failed } = await check(ApplyCvContentDto, {
      contact: { name: "Jane", website: "jane.dev", email: "" },
      sections: [section],
    });
    assert.deepEqual(failed, []);
    assert.equal(dto.contact?.website, "https://jane.dev");
    assert.equal(dto.contact?.email, null);
  });

  test("caps the section count at 30 and requires at least one", async () => {
    assert.deepEqual(
      (await check(ApplyCvContentDto, { sections: Array(31).fill(section) })).failed,
      ["sections"],
    );
    assert.deepEqual((await check(ApplyCvContentDto, { sections: [] })).failed, ["sections"]);
  });

  test("validates nested sections and rejects unknown fields", async () => {
    const { failed } = await check(ApplyCvContentDto, {
      contact: { evil: true },
      sections: [{ ...section, content: "x".repeat(15_001), order: 3 }],
    });
    assert.deepEqual(failed.sort(), ["contact.evil", "sections.0.content", "sections.0.order"]);
  });
});

describe("AiGenerateCvSectionDto", () => {
  test("accepts the editor text up to 15000 chars", async () => {
    assert.deepEqual(
      (await check(AiGenerateCvSectionDto, { action: "improve", currentContent: "x".repeat(15_000) })).failed,
      [],
    );
    assert.deepEqual(
      (await check(AiGenerateCvSectionDto, { action: "improve", currentContent: "x".repeat(15_001) })).failed,
      ["currentContent"],
    );
  });
});
