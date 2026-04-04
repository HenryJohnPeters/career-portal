// corporate.ts — Conservative, ATS-friendly, no-frills template

import { getHeaderLayoutCSS } from "./base-css";
import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
  renderSingleColumnHeader,
} from "./shared";

export function getCorporateCSS(headerLayout: string): string {
  return `
    .page { padding: var(--cv-pad); }

    .header {
      margin-bottom: var(--cv-sec-gap);
      padding-bottom: 12pt;
      border-bottom: 1pt solid #000;
    }
    .header h1 {
      font-family: var(--cv-font-body);
      font-size: var(--cv-fs-h1);
      font-weight: 700;
      color: var(--cv-text);
      margin-bottom: 6pt;
      line-height: 1.1;
    }
    .header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12pt;
    }
    .header .contact-item { color: var(--cv-text); font-size: calc(var(--cv-fs-body) - 0.5pt); }
    .header .contact-item-icon { display: none; }
    .header .contact-item-text::before { content: ""; }

    .section { margin-bottom: var(--cv-sec-gap); }
    .section h2 {
      font-family: var(--cv-font-body);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      text-transform: uppercase;
      color: var(--cv-text);
      margin-bottom: 6pt;
      padding-bottom: 3pt;
      border-bottom: 1pt solid var(--cv-muted-border);
      letter-spacing: 0.5pt;
      border-left: none;
      padding-left: 0;
    }

    .profile-content p { font-style: normal; color: var(--cv-text); }

    /* Corporate skills — plain comma list */
    .skills-content .cv-list {
      list-style: none; margin: 0; display: block;
    }
    .skills-content .cv-list li {
      display: inline;
      background: none;
      border: none;
      padding: 0;
      font-size: var(--cv-fs-body);
      color: var(--cv-text);
      font-weight: 400;
    }
    .skills-content .cv-list li::before { display: none; }
    .skills-content .cv-list li::after { content: ", "; }
    .skills-content .cv-list li:last-child::after { content: ""; }

    /* No decorative elements */
    .skill-badge {
      background: none;
      border: none;
      padding: 0;
      color: var(--cv-text);
      font-weight: 400;
      font-size: var(--cv-fs-body);
    }

    ${getHeaderLayoutCSS(headerLayout)}
  `;
}

export function renderCorporateBody(
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
  return `${header}${sectionsHtml}`;
}
