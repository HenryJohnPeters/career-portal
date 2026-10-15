import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { renderCoverLetterHtml, renderLetterParagraphs } from "./cover-letter";

const base = {
  title: "Acme letter",
  body: "Dear team,\n\nI'd love to join.\nThanks!",
  date: new Date("2026-10-15T12:00:00Z"),
  recipient: { company: "Acme & Co", role: "Senior <Engineer>" },
  sender: { userName: "Jane Doe", userEmail: "jane@example.com", linkedin: "linkedin.com/in/jane" },
  themeConfig: { primaryColor: "#059669", fontHeading: "Lora" },
};

describe("renderLetterParagraphs", () => {
  test("splits on blank lines and keeps single line breaks", () => {
    assert.equal(
      renderLetterParagraphs("One\r\ntwo\n \nThree\n\n\n"),
      "<p>One<br>two</p>\n<p>Three</p>",
    );
  });

  test("escapes everything and renders no markdown", () => {
    assert.equal(
      renderLetterParagraphs(`<img src=x onerror=alert(1)> **bold** "q" 'a'`),
      "<p>&lt;img src=x onerror=alert(1)&gt; **bold** &quot;q&quot; &#39;a&#39;</p>",
    );
  });

  test("is linear on long whitespace runs", () => {
    const start = Date.now();
    renderLetterParagraphs(`a\n${" ".repeat(15_000)}b`.repeat(1));
    renderLetterParagraphs("\n \t".repeat(5_000));
    assert.ok(Date.now() - start < 50);
  });
});

describe("renderCoverLetterHtml", () => {
  test("renders the letterhead, date, recipient and body", () => {
    const html = renderCoverLetterHtml(base);
    assert.match(html, /<h1>Jane Doe<\/h1>/);
    assert.match(html, /15 October 2026/);
    assert.match(html, /<strong>Acme &amp; Co<\/strong>/);
    assert.match(html, /Re: Senior &lt;Engineer&gt;/);
    assert.match(html, /href="https:\/\/linkedin.com\/in\/jane"/);
    assert.match(html, /--cv-primary: #059669;/);
    assert.match(html, /<p>I&#39;d love to join\.<br>Thanks!<\/p>/);
  });

  test("works without a job, contact details or body", () => {
    const html = renderCoverLetterHtml({
      ...base,
      body: "  ",
      recipient: null,
      sender: {},
      themeConfig: undefined,
    });
    assert.match(html, /<h1>Acme letter<\/h1>/);
    assert.ok(!html.includes(`class="letter-recipient"`));
    assert.match(html, /This letter is empty\./);
  });

  test("whitelists the letterhead theme", () => {
    const html = renderCoverLetterHtml({
      ...base,
      themeConfig: { primaryColor: "red;}</style><script>x</script>" },
    });
    assert.ok(!html.includes("<script"));
    assert.match(html, /--cv-primary: #2563eb;/);
  });
});
