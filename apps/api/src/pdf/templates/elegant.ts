// elegant.ts — Refined serif with subtle accents template

import { getHeaderLayoutCSS } from "./base-css";
import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
  renderSingleColumnHeader,
} from "./shared";

export function getElegantCSS(headerLayout: string): string {
  return `
    .page { padding: 48pt 44pt; }

    .header {
      margin-bottom: var(--cv-sec-gap);
      text-align: center;
      padding-bottom: 16pt;
    }
    .header h1 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h1);
      font-weight: 400;
      letter-spacing: 3pt;
      text-transform: uppercase;
      color: var(--cv-text);
      margin-bottom: 8pt;
      line-height: 1.15;
    }
    .header::after {
      content: "";
      display: block;
      width: 60pt;
      height: 1pt;
      background: var(--cv-primary);
      margin: 12pt auto 0 auto;
    }
    .header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14pt;
      margin-top: 10pt;
      justify-content: center;
    }
    .header .contact-item { color: var(--cv-text-muted); font-size: calc(var(--cv-fs-body) - 0.5pt); }
    .header .contact-item-icon { color: var(--cv-primary); }

    .section { margin-bottom: var(--cv-sec-gap); }
    .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 400;
      letter-spacing: 2pt;
      text-transform: uppercase;
      color: var(--cv-primary);
      margin-bottom: 10pt;
      padding-bottom: 6pt;
      border-bottom: 0.5pt solid var(--cv-primary);
      text-align: center;
      border-left: none;
      padding-left: 0;
    }

    .entry-title { font-family: var(--cv-font-heading); font-weight: 600; }
    .entry-subtitle { font-style: italic; }

    .profile-content p {
      text-align: center;
      font-style: italic;
      color: var(--cv-text-secondary);
      max-width: 80%;
      margin: 0 auto;
    }

    ${
      headerLayout === "split"
        ? `.header { text-align: center; }`
        : getHeaderLayoutCSS(headerLayout)
    }
  `;
}

export function renderElegantBody(
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
