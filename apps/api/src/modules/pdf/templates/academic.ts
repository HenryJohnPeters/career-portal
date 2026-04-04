// academic.ts — Traditional academic CV template

import { getHeaderLayoutCSS } from "./base-css";
import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderContactItem,
  renderSectionContent,
} from "./shared";

export function getAcademicCSS(headerLayout: string): string {
  return `
    .page { padding: 42pt 48pt; }

    .header {
      margin-bottom: var(--cv-sec-gap);
      text-align: center;
      padding-bottom: 14pt;
      border-bottom: 1pt solid #000;
    }
    .header h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) - 2pt);
      font-weight: 400;
      color: var(--cv-text);
      letter-spacing: 1pt;
      margin-bottom: 4pt;
      line-height: 1.15;
    }
    .header .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: var(--cv-text-secondary);
      font-style: italic;
      margin-bottom: 8pt;
    }
    .header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14pt;
      margin-top: 6pt;
      justify-content: center;
    }
    .header .contact-item { color: var(--cv-text-secondary); font-size: calc(var(--cv-fs-body) - 0.5pt); }
    .header .contact-item-icon { color: var(--cv-text-secondary); }

    .section { margin-bottom: var(--cv-sec-gap); }
    .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1pt;
      color: var(--cv-text);
      margin-bottom: 6pt;
      padding-bottom: 4pt;
      border-bottom: 0.5pt solid #000;
      border-left: none;
      padding-left: 0;
    }

    .entry-title { font-family: var(--cv-font-heading); }

    .profile-content p { font-style: normal; }

    /* Academic skills — simple inline list */
    .skills-content .cv-list {
      list-style: none; margin: 0; display: block;
    }
    .skills-content .cv-list li {
      display: inline;
      background: none;
      border: none;
      padding: 0;
      font-size: var(--cv-fs-body);
      font-weight: 400;
      color: var(--cv-text);
    }
    .skills-content .cv-list li::before { display: none; }
    .skills-content .cv-list li::after { content: " · "; color: var(--cv-text-muted); }
    .skills-content .cv-list li:last-child::after { content: ""; }

    ${
      headerLayout === "split"
        ? `.header { text-align: center; }`
        : getHeaderLayoutCSS(headerLayout)
    }
  `;
}

function renderAcademicHeader(data: CvData, contacts: ContactItem[]): string {
  const contactHtml = contacts.length
    ? `<div class="contact-row">${contacts
        .map((c) => renderContactItem(c))
        .join("")}</div>`
    : "";
  return `<div class="header">
    <h1>${escapeHtml(data.userName || data.title)}</h1>
    <div class="header-subtitle">${escapeHtml(data.title)}</div>
    ${contactHtml}
  </div>`;
}

export function renderAcademicBody(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const header = renderAcademicHeader(data, contacts);
  const sectionsHtml = sections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");
  return `${header}${sectionsHtml}`;
}
