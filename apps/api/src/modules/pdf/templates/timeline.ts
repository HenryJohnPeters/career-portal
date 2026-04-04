// timeline.ts — Vertical timeline spine design

import { getHeaderLayoutCSS } from "./base-css";
import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
  renderSingleColumnHeader,
} from "./shared";

export function getTimelineCSS(headerLayout: string): string {
  return `
    .page { padding: var(--cv-pad); }

    .header {
      margin-bottom: var(--cv-sec-gap);
      padding-bottom: 14pt;
      border-bottom: 2pt solid var(--cv-primary);
    }
    .header h1 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h1);
      font-weight: 800;
      color: var(--cv-text);
      letter-spacing: -0.5pt;
      line-height: 1.1;
      margin-bottom: 6pt;
    }
    .header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12pt;
      margin-top: 6pt;
    }

    .section {
      margin-bottom: var(--cv-sec-gap);
      padding-left: 22pt;
      border-left: 2pt solid var(--cv-primary-light);
      position: relative;
    }
    .section::before {
      content: "";
      width: 10pt;
      height: 10pt;
      background: var(--cv-primary);
      border-radius: 50%;
      position: absolute;
      left: -6pt;
      top: 2pt;
    }
    .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1pt;
      color: var(--cv-primary);
      margin-bottom: 8pt;
      border: none;
      padding: 0;
    }

    .entry-heading {
      position: relative;
      padding-left: 12pt;
    }
    .entry-heading::before {
      content: "";
      width: 6pt;
      height: 6pt;
      background: var(--cv-primary-light);
      border: 1.5pt solid var(--cv-primary);
      border-radius: 50%;
      position: absolute;
      left: -28pt;
      top: 4pt;
    }

    .entry-title { font-family: var(--cv-font-heading); }

    ${getHeaderLayoutCSS(headerLayout)}
  `;
}

export function renderTimelineBody(
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
