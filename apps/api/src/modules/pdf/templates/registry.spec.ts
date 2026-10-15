import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { FREE_TIER } from "../../../common/constants";
import { renderCvHtml } from "../render-cv-html";
import { TEMPLATE_IDS, isTemplateId } from "./registry";

const libsTemplates = require(
  resolve(__dirname, "../../../../../../libs/shared/types/src/cv-templates"),
) as { TEMPLATE_OPTIONS: { id: string }[] };

const sections = [
  { title: "Profile", sectionType: "profile", order: 0, content: "Engineer." },
  { title: "Skills", sectionType: "skills", order: 1, content: "- TypeScript" },
];

describe("template registry", () => {
  test("ids match the web's TEMPLATE_OPTIONS", () => {
    assert.deepEqual(
      [...TEMPLATE_IDS].sort(),
      libsTemplates.TEMPLATE_OPTIONS.map((t) => t.id).sort(),
    );
  });

  test("free templates all exist", () => {
    for (const id of FREE_TIER.templateIds) assert.ok(isTemplateId(id), id);
  });

  test("isTemplateId ignores prototype keys", () => {
    assert.equal(isTemplateId("toString"), false);
    assert.equal(isTemplateId("__proto__"), false);
  });

  test("every template renders a complete document", () => {
    for (const templateId of TEMPLATE_IDS) {
      const html = renderCvHtml({ title: "CV", userName: "Jane", sections, templateId });
      assert.match(html, /^<!DOCTYPE html>/, templateId);
      assert.match(html, /<\/html>$/, templateId);
    }
  });

  test("unknown templates fall back to classic", () => {
    const classic = renderCvHtml({ title: "CV", sections, templateId: "classic" });
    assert.equal(renderCvHtml({ title: "CV", sections, templateId: "nope" }), classic);
  });
});

describe("theme injection is neutralised in the rendered CV", () => {
  const payloads = {
    primaryColor: `#000;}</style><iframe src="http://169.254.169.254/latest/meta-data/"></iframe><style>`,
    fontHeading: "x'); @import url('http://169.254.169.254/'); a{font-family:'y",
    fontBody: "x', serif; background:url(http://internal/); --a:'b",
    fontSize: "1px}body{background:url(http://internal/)",
    accentStyle: "</style><script>alert(1)</script>",
  };

  for (const templateId of TEMPLATE_IDS) {
    test(templateId, () => {
      const html = renderCvHtml({
        title: "CV",
        sections,
        templateId,
        themeConfig: payloads,
        headerLayout: "</style><script>x</script>",
      });
      assert.ok(!html.includes("169.254.169.254"), "metadata URL leaked");
      assert.ok(!html.includes("internal/"), "internal URL leaked");
      assert.ok(!html.includes("<script"), "script tag leaked");
      assert.ok(!html.includes("<iframe"), "iframe leaked");
      assert.equal(html.match(/<\/style>/g)?.length, 1, "style block broken");
    });
  }
});
