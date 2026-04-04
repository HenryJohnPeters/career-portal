// developer.ts — Monospace-accented, code-block aesthetic template

import { getHeaderLayoutCSS } from "./base-css";
import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
  renderSingleColumnHeader,
} from "./shared";

export function getDeveloperCSS(headerLayout: string): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

    .page { padding: var(--cv-pad); background: #fff; }

    .header {
      margin-bottom: var(--cv-sec-gap);
      padding: 18pt 20pt;
      background: #1e1e2e;
      border-radius: 6pt;
      border: 1pt solid #313244;
    }
    .header h1 {
      font-family: 'Fira Code', monospace;
      font-size: calc(var(--cv-fs-h1) - 4pt);
      font-weight: 700;
      color: #cdd6f4;
      line-height: 1.15;
      margin-bottom: 6pt;
    }
    .header h1::before { content: "> "; color: var(--cv-primary); }
    .header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12pt;
      margin-top: 8pt;
      padding-top: 8pt;
      border-top: 1px solid #313244;
    }
    .header .contact-item { color: #a6adc8; font-family: 'Fira Code', monospace; font-size: calc(var(--cv-fs-body) - 1.5pt); }
    .header .contact-item-icon { color: var(--cv-primary); }
    .header a.contact-item:hover { color: #cdd6f4; }

    .section { margin-bottom: var(--cv-sec-gap); }
    .section h2 {
      font-family: 'Fira Code', monospace;
      font-size: var(--cv-fs-h2);
      font-weight: 600;
      color: var(--cv-primary);
      margin-bottom: 8pt;
      padding: 4pt 10pt;
      background: #1e1e2e;
      border-radius: 3pt;
      display: inline-block;
      border: none;
      text-transform: none;
      letter-spacing: 0;
    }
    .section h2::before { content: "// "; color: #6c7086; }

    .entry-title { font-family: 'Fira Code', monospace; font-size: calc(var(--cv-fs-sub) - 0.5pt); }
    .entry-subtitle { font-family: 'Fira Sans', sans-serif; }

    .skill-badge {
      font-family: 'Fira Code', monospace;
      background: #1e1e2e;
      color: var(--cv-primary);
      border: 0.5pt solid #313244;
    }

    .skills-content .cv-list li {
      font-family: 'Fira Code', monospace;
      background: #1e1e2e;
      color: var(--cv-primary);
      border: 0.5pt solid #313244;
    }

    .profile-content p { font-family: 'Fira Sans', sans-serif; }

    ${getHeaderLayoutCSS(headerLayout)}
  `;
}

export function renderDeveloperBody(
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
