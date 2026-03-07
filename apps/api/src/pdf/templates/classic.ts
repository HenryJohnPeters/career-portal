// classic.ts — Timeless single-column serif template

import { getHeaderLayoutCSS } from "./base-css";
import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderContactItem,
  renderSectionContent,
  renderSingleColumnHeader,
} from "./shared";

export function getClassicCSS(headerLayout: string): string {
  return `
    .page { padding: var(--cv-pad); }

    .header {
      margin-bottom: var(--cv-sec-gap);
      padding-bottom: 14pt;
      border-bottom: 2pt solid var(--cv-primary);
      text-align: left;
    }
    .header h1 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h1);
      font-weight: 800;
      letter-spacing: -0.5pt;
      color: var(--cv-text);
      margin-bottom: 6pt;
      line-height: 1.1;
    }
    .header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12pt;
      margin-top: 6pt;
    }

    .section { margin-bottom: var(--cv-sec-gap); }
    .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5pt;
      color: var(--cv-primary);
      margin-bottom: 8pt;
      padding-bottom: 4pt;
      border-bottom: 0.75pt solid var(--cv-muted-border);
      font-variant: small-caps;
    }

    .entry-title { font-family: var(--cv-font-heading); }

    ${getHeaderLayoutCSS(headerLayout)}
  `;
}

export function renderClassicBody(
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
