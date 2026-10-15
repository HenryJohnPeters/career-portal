// cover-letter.ts — Cover letter page with a letterhead matching the chosen
// CV's theme and contact header. The body is plain text: every character is
// escaped, blank lines separate paragraphs and single newlines become <br>.

import { getBaseCSS } from "./base-css";
import {
  buildContactItems,
  escapeHtml,
  renderContactItem,
  type CvData,
} from "./shared";
import { resolveTheme } from "./theme";

export interface CoverLetterRenderData {
  title: string;
  body: string;
  date: Date;
  /** From the linked job, when there is one. */
  recipient: { company: string; role: string } | null;
  sender: Pick<
    CvData,
    "userName" | "userEmail" | "phone" | "location" | "website" | "linkedin" | "github"
  >;
  /** The letterhead CV's stored theme (whitelisted here). */
  themeConfig?: unknown;
}

const LETTER_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Plain text → escaped paragraphs. */
export function renderLetterParagraphs(body: string): string {
  return body
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function getCoverLetterCSS(): string {
  return `
    .page { padding: var(--cv-pad) calc(var(--cv-pad) + 8pt); }

    .letterhead {
      padding-bottom: 12pt;
      margin-bottom: 26pt;
      border-bottom: 2pt solid var(--cv-primary);
    }
    .letterhead h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) - 4pt);
      font-weight: 800;
      letter-spacing: -0.4pt;
      line-height: 1.1;
      color: var(--cv-text);
      margin-bottom: 6pt;
    }
    .letterhead .contact-row { display: flex; flex-wrap: wrap; gap: 6pt 14pt; }

    .letter-date { color: var(--cv-text-secondary); margin-bottom: 14pt; }
    .letter-recipient { margin-bottom: 16pt; }
    .letter-recipient strong { display: block; }
    .letter-subject {
      font-family: var(--cv-font-heading);
      font-weight: 700;
      color: var(--cv-primary-dark);
      margin-bottom: 16pt;
    }
    .letter-body p { margin-bottom: 10pt; line-height: 1.65; }
    .letter-body p:last-child { margin-bottom: 0; }
  `;
}

export function renderCoverLetterHtml(data: CoverLetterRenderData): string {
  const theme = resolveTheme(data.themeConfig);
  const contacts = buildContactItems({ title: data.title, sections: [], ...data.sender });
  const name = data.sender.userName || data.title;

  const contactHtml = contacts.length
    ? `<div class="contact-row">${contacts.map((c) => renderContactItem(c)).join("")}</div>`
    : "";
  const recipientHtml = data.recipient?.company
    ? `<div class="letter-recipient"><strong>${escapeHtml(data.recipient.company)}</strong></div>`
    : "";
  const subjectHtml = data.recipient?.role
    ? `<div class="letter-subject">Re: ${escapeHtml(data.recipient.role)}</div>`
    : "";
  const bodyHtml =
    renderLetterParagraphs(data.body) || '<p class="empty">This letter is empty.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(data.title)}</title>
<style>
${getBaseCSS(theme)}
${getCoverLetterCSS()}
</style>
</head>
<body>
  <div class="page">
    <div class="letterhead">
      <h1>${escapeHtml(name)}</h1>
      ${contactHtml}
    </div>
    <div class="letter-date">${LETTER_DATE.format(data.date)}</div>
    ${recipientHtml}
    ${subjectHtml}
    <div class="letter-body">${bodyHtml}</div>
  </div>
</body>
</html>`;
}
