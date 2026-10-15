import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseInline, parseRichText, richTextSummary, toSpeakableText } from "./rich-text";

describe("rich text", () => {
  test("plain prose is one text block", () => {
    assert.deepEqual(parseRichText("What is a closure?"), [
      { kind: "text", parts: [{ code: false, text: "What is a closure?" }] },
    ]);
  });

  test("fenced code keeps blank lines and language", () => {
    const blocks = parseRichText("Find the bug:\n\n```yaml\nlabels:\n\n  app: web\n```\nWhy?");
    assert.equal(blocks.length, 3);
    assert.deepEqual(blocks[1], { kind: "code", code: "labels:\n\n  app: web", language: "yaml" });
    assert.equal(blocks[2].kind, "text");
  });

  test("indented paragraphs become dedented code blocks", () => {
    const blocks = parseRichText("What does this log?\n\n    for (var i = 0; i < 3; i++) {\n      log(i);\n    }");
    assert.deepEqual(blocks[1], {
      kind: "code",
      code: "for (var i = 0; i < 3; i++) {\n  log(i);\n}",
      language: null,
    });
  });

  test("inline code spans and unmatched backticks", () => {
    assert.deepEqual(parseInline("Use `useMemo` here, not ` alone"), [
      { code: false, text: "Use " },
      { code: true, text: "useMemo" },
      { code: false, text: " here, not ` alone" },
    ]);
  });

  test("an unterminated fence is treated as text", () => {
    const blocks = parseRichText("```js\nconst a = 1;");
    assert.ok(blocks.every((b) => b.kind === "text"));
  });

  test("speakable text replaces code with a pointer", () => {
    assert.equal(
      toSpeakableText("Requests to the `web` Service fail.\n\n```yaml\nselector:\n  app: web\n```\nWhat is the bug?"),
      "Requests to the web Service fail. Take a look at the code snippet. What is the bug?",
    );
  });
});

describe("rich text summary", () => {
  test("keeps prose and inline code, drops code blocks", () => {
    assert.equal(
      richTextSummary("Why does `count` lag?\n\n    setCount(count + 1);\n\nExplain."),
      "Why does `count` lag? Explain.",
    );
  });
});
