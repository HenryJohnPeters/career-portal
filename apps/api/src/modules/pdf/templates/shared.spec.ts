import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildContactItems, escapeHtml, renderMarkdown, sanitizeUrl } from "./shared";

function timeMs(fn: () => void): number {
  const start = process.hrtime.bigint();
  fn();
  return Number(process.hrtime.bigint() - start) / 1e6;
}

describe("escapeHtml", () => {
  test("escapes the five HTML-significant characters", () => {
    assert.equal(escapeHtml(`<a href="x" title='y'>&</a>`), "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;");
  });

  test("leaves plain text alone", () => {
    assert.equal(escapeHtml("Jane Doe — CV"), "Jane Doe — CV");
  });
});

describe("sanitizeUrl", () => {
  test("keeps http(s), mailto, tel and scheme-less links", () => {
    for (const url of ["https://a.com/x?y=1&amp;z=2", "http://a.com", "mailto:a@b.com", "tel:+441", "example.com/path"]) {
      assert.equal(sanitizeUrl(url), url);
    }
  });

  test("blocks other schemes, including obfuscated ones", () => {
    for (const url of ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "java\tscript:x", "data:text/html,x", "vbscript:x", "file:///etc/passwd"]) {
      assert.equal(sanitizeUrl(url), "#", url);
    }
  });
});

describe("renderMarkdown", () => {
  test("renders the supported syntax", () => {
    const html = renderMarkdown(
      "### Acme | Engineer | 2020\n- **Built** _things_\n[Docs](https://x.com/a) [skill: React] [rating: 2/3]",
    );
    assert.match(html, /<span class="entry-title">Acme<\/span> <span class="entry-subtitle">Engineer<\/span><\/div><span class="entry-date">2020<\/span>/);
    assert.match(html, /<li><strong>Built<\/strong> <em>things<\/em><\/li>/);
    assert.match(html, /<a href="https:\/\/x.com\/a" class="cv-link">Docs<\/a>/);
    assert.match(html, /<span class="skill-badge">React<\/span>/);
    assert.equal((html.match(/rating-dot filled/g) ?? []).length, 2);
  });

  test("escapes user HTML and neutralises javascript links", () => {
    const html = renderMarkdown(`<script>alert(1)</script> [x](javascript:void0) "q" 'a'`);
    assert.ok(!html.includes("<script>"));
    assert.match(html, /<a href="#" class="cv-link">x<\/a>/);
    assert.match(html, /&quot;q&quot; &#39;a&#39;/);
  });

  test("stays fast on pathological input (15k chars per line)", () => {
    const n = 15_000;
    const inputs = {
      brackets: "[".repeat(n),
      linkOpeners: "[a](".repeat(n / 4),
      linkNoClose: "[a](" + "b".repeat(n),
      skills: "[skill:".repeat(n / 7),
      skillSpaces: "[skill:" + " ".repeat(n),
      pipesAndSpaces: "### a" + " ".repeat(n) + "b",
      stars: "*".repeat(n),
      starRuns: "*a".repeat(n / 2),
      underscores: "_".repeat(n),
      doubleStars: "**a*".repeat(n / 4),
      bullets: "- x\n".repeat(n / 4),
      digits: "1".repeat(n),
    };
    for (const [name, input] of Object.entries(inputs)) {
      const ms = timeMs(() => renderMarkdown(input));
      assert.ok(ms < 50, `${name} took ${ms.toFixed(1)}ms`);
    }
  });
});

describe("buildContactItems", () => {
  const base = { title: "CV", sections: [] };

  test("normalises bare URLs from older rows", () => {
    const items = buildContactItems({
      ...base,
      website: "jane.dev",
      linkedin: "linkedin.com/in/jane",
      github: "jane",
    });
    assert.deepEqual(
      items.map((i) => [i.text, i.href]),
      [
        ["jane.dev", "https://jane.dev"],
        ["jane", "https://linkedin.com/in/jane"],
        ["jane", "https://github.com/jane"],
      ],
    );
  });

  test("never produces a script URL", () => {
    const items = buildContactItems({ ...base, website: "javascript:alert(1)" });
    assert.ok(items[0].href?.startsWith("https://"));
  });
});
