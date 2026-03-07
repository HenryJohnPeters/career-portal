// swiss.ts — Grid-based Swiss/International typographic style template

import { getHeaderLayoutCSS } from "./base-css";
import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
  renderSingleColumnHeader,
} from "./shared";

export function getSwissCSS(headerLayout: string): string {
  return `
    .page { padding: 38pt 42pt; }

    .header {
      margin-bottom: var(--cv-sec-gap);
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10pt;
      align-items: end;
      padding-bottom: 14pt;
      border-bottom: 3pt solid var(--cv-text);
    }
    .header h1 {
      font-family: var(--cv-font-body);
      font-size: var(--cv-fs-h1);
      font-weight: 800;
      color: var(--cv-text);
      line-height: 1;
      letter-spacing: -0.5pt;
      margin: 0;
    }
    .header .contact-row {
      display: flex;
      flex-direction: column;
      gap: 3pt;
      align-items: flex-end;
    }
    .header .contact-item { font-size: calc(var(--cv-fs-body) - 1pt); color: var(--cv-text-muted); }
    .header .contact-item-icon { display: none; }

    .swiss-grid {
      display: grid;
      grid-template-columns: 120pt 1fr;
      gap: 12pt 20pt;
    }
    .swiss-grid .section { display: contents; }
    .swiss-grid .section h2 {
      font-family: var(--cv-font-body);
      font-size: var(--cv-fs-body);
      font-weight: 700;
      color: var(--cv-primary);
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      text-align: right;
      padding-top: 2pt;
      border: none;
      margin: 0;
    }
    .swiss-grid .section-body,
    .swiss-grid .profile-content,
    .swiss-grid .skills-content,
    .swiss-grid .languages-content,
    .swiss-grid .projects-content,
    .swiss-grid .certifications-content {
      border-left: 1pt solid var(--cv-muted-border);
      padding-left: 16pt;
      padding-bottom: 10pt;
    }

    /* Swiss skills — inline text */
    .swiss-grid .skills-content .cv-list {
      list-style: none; margin: 0; display: block;
    }
    .swiss-grid .skills-content .cv-list li {
      display: inline;
      background: none;
      border: none;
      padding: 0;
      font-size: var(--cv-fs-body);
      color: var(--cv-text);
    }
    .swiss-grid .skills-content .cv-list li::before { display: none; }
    .swiss-grid .skills-content .cv-list li::after { content: ", "; }
    .swiss-grid .skills-content .cv-list li:last-child::after { content: ""; }

    .profile-content p { font-style: normal; }

    ${
      headerLayout === "centered"
        ? `
      .header { grid-template-columns: 1fr; text-align: center; }
      .header .contact-row { align-items: center; flex-direction: row; gap: 12pt; justify-content: center; margin-top: 6pt; }
    `
        : ""
    }
  `;
}

export function renderSwissBody(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const header = renderSingleColumnHeader(data, contacts);
  const sectionsHtml = sections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");
  return `${header}<div class="swiss-grid">${sectionsHtml}</div>`;
}
