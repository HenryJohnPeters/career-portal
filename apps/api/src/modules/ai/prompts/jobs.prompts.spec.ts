import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  buildTailorLetterPrompt,
  buildTailorSectionsPrompt,
  isFaithfulTailoring,
  jobAnalysisSchema,
  pickTailorableSections,
  tailoredSectionsSchema,
  toTailorTone,
} from "./jobs.prompts";
import type { TailorApplicationInput } from "../ai.types";

describe("jobAnalysisSchema", () => {
  test("normalises fields and maps seniority aliases", () => {
    const parsed = jobAnalysisSchema.safeParse({
      company: " Acme ",
      role: "",
      location: null,
      salary: "£60k",
      seniority: "Staff",
      keySkills: ["TypeScript", "typescript", 4, "React"],
      niceToHave: "Go",
      summary: " Build things. ",
    });
    assert.ok(parsed.success);
    assert.deepEqual(parsed.data, {
      company: "Acme",
      role: null,
      location: null,
      salary: "£60k",
      seniority: "lead",
      keySkills: ["TypeScript", "React"],
      niceToHave: [],
      summary: "Build things.",
    });
  });

  test("unknown seniority values (including prototype keys) become null", () => {
    for (const seniority of ["expert", "constructor", 3]) {
      const parsed = jobAnalysisSchema.safeParse({ seniority });
      assert.ok(parsed.success);
      assert.equal(parsed.data.seniority, null);
    }
  });
});

const input = (sections: TailorApplicationInput["sections"]): TailorApplicationInput => ({
  company: "Acme",
  role: "Senior Engineer",
  jobDescription: "React and AWS",
  userName: "Jane",
  sections,
  includeCoverLetter: true,
});

describe("pickTailorableSections", () => {
  test("takes non-empty profile/experience/skills sections only", () => {
    const picked = pickTailorableSections([
      { id: "1", title: "Profile", sectionType: "profile", content: "Dev" },
      { id: "2", title: "Education", sectionType: "education", content: "BSc" },
      { id: "3", title: "Skills", sectionType: "skills", content: "  " },
      { id: "4", title: "Work", sectionType: "experience", content: "Acme" },
    ]);
    assert.deepEqual(picked.map((s) => s.id), ["1", "4"]);
  });

  test("skips whole sections that do not fit the budget instead of cutting them", () => {
    const picked = pickTailorableSections(
      [
        { id: "1", title: "A", sectionType: "experience", content: "x".repeat(80) },
        { id: "2", title: "B", sectionType: "experience", content: "y".repeat(50) },
        { id: "3", title: "C", sectionType: "skills", content: "z".repeat(10) },
      ],
      100,
    );
    assert.deepEqual(picked.map((s) => s.id), ["1", "3"]);
  });
});

describe("buildTailorSectionsPrompt", () => {
  test("uses short keys mapped back to section ids", () => {
    const sections = [
      { id: "uuid-a", title: "Profile", sectionType: "profile", content: "Dev" },
      { id: "uuid-b", title: "Work", sectionType: "experience", content: "Acme" },
    ];
    const prompt = buildTailorSectionsPrompt(input(sections), sections);
    assert.deepEqual([...prompt.keyToId], [
      ["s1", "uuid-a"],
      ["s2", "uuid-b"],
    ]);
    assert.ok(prompt.user.includes('<cv_section key="s2" type="experience" title="Work">\nAcme\n</cv_section>'));
    assert.ok(!prompt.user.includes("uuid-a"));
    assert.ok(prompt.user.startsWith("Tailor my CV sections for the Senior Engineer role at Acme."));
  });

  test("degrades gracefully without a role or company", () => {
    const sections = [{ id: "a", title: "Profile", sectionType: "profile", content: "Dev" }];
    const prompt = buildTailorSectionsPrompt({ ...input(sections), role: " ", company: "" }, sections);
    assert.ok(prompt.user.startsWith("Tailor my CV sections for the job in <job_description>."));
  });
});

describe("tailoredSectionsSchema", () => {
  test("maps keys to content, ignoring malformed items and duplicates", () => {
    const parsed = tailoredSectionsSchema.safeParse({
      sections: [{ key: "s1", content: " A " }, { key: "s1", content: "dup" }, { key: 2 }, "x"],
    });
    assert.ok(parsed.success);
    assert.deepEqual([...parsed.data], [["s1", "A"]]);
  });

  test("drops sections longer than a CV section may be", () => {
    const parsed = tailoredSectionsSchema.safeParse({
      sections: [{ key: "s1", content: "x".repeat(15_001) }, { key: "s2", content: "ok" }],
    });
    assert.ok(parsed.success);
    assert.deepEqual([...parsed.data.keys()], ["s2"]);
  });

  test("fails when no section came back", () => {
    assert.equal(tailoredSectionsSchema.safeParse({ sections: [] }).success, false);
  });
});

describe("isFaithfulTailoring", () => {
  const original =
    "### Acme | Engineer | 2019 - 2022\n- Built React apps\n### Beta | Dev | 2017 - 2019\n- Shipped APIs";

  test("accepts reordered and reworded content with the same facts", () => {
    const tailored =
      "### Acme | Engineer | 2019 - 2022\n- Shipped React apps used by thousands\n### Beta | Dev | 2017 - 2019\n- Built APIs";
    assert.equal(isFaithfulTailoring(original, tailored), true);
  });

  test("rejects invented years", () => {
    const tailored = original.replace("2017", "2015");
    assert.equal(isFaithfulTailoring(original, tailored), false);
  });

  test("rejects dropped entries", () => {
    assert.equal(
      isFaithfulTailoring(original, "### Acme | Engineer | 2019 - 2022\n- Built React apps"),
      false,
    );
  });

  test("rejects a renamed employer or role in an entry heading", () => {
    const tailored = original.replace("Acme | Engineer", "Google | Staff Engineer");
    assert.equal(isFaithfulTailoring(original, tailored, "experience"), false);
  });

  test("rejects an invented entry that reuses existing years", () => {
    const tailored = `${original}\n### NewCo | CTO | 2019 - 2022\n- Led everything`;
    assert.equal(isFaithfulTailoring(original, tailored, "experience"), false);
  });

  test("tolerates heading emphasis, dash style, spacing and case", () => {
    const tailored =
      "### **Beta** | Dev | 2017 – 2019\n- Built APIs\n###  acme |  Engineer | 2019-2022\n- Shipped React apps";
    assert.equal(isFaithfulTailoring(original, tailored, "experience"), true);
  });

  test("lets skills sections regroup into new categories but not drop old ones", () => {
    const skills = "### Frontend\n- React, TypeScript\n### Backend\n- Node.js";
    const regrouped = `${skills}\n### Most relevant\n- React, Node.js`;
    assert.equal(isFaithfulTailoring(skills, regrouped, "skills"), true);
    assert.equal(isFaithfulTailoring(skills, "### Most relevant\n- React, TypeScript, Node.js\n### Other\n- none", "skills"), false);
  });

  test("rejects a large loss of content in long sections", () => {
    const long = "word ".repeat(100);
    assert.equal(isFaithfulTailoring(long, "word word"), false);
    assert.equal(isFaithfulTailoring("short", "s"), true);
  });
});

describe("tailor letter prompt", () => {
  test("uses CV context and the job description as data, with a safe tone", () => {
    const prompt = buildTailorLetterPrompt({
      ...input([{ id: "1", title: "Profile", sectionType: "profile", content: "Dev" }]),
      tone: "sarcastic",
    });
    assert.ok(prompt.user.includes("<cv>\n[Profile]\nDev\n</cv>"));
    assert.ok(prompt.system.includes("Polished, professional tone."));
    assert.equal(toTailorTone("concise"), "concise");
  });
});
