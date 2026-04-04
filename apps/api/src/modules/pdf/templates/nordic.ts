// nordic.ts — Scandinavian minimalism with muted tones

import { getHeaderLayoutCSS } from "./base-css";
import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
  renderSingleColumnHeader,
} from "./shared";

export function getNordicCSS(headerLayout: string): string {
  return `
    .page { padding: 48pt 46pt; background: #fafafa; }

    .header {
      margin-bottom: 28pt;
    }
    .header h1 {
      font-family: var(--cv-font-body);
      font-size: calc(var(--cv-fs-h1) - 4pt);
      font-weight: 300;
      color: #2d3436;
      letter-spacing: 0.5pt;
      margin-bottom: 6pt;
      line-height: 1.15;
    }
    .header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14pt;
      margin-top: 6pt;
      padding-top: 8pt;
      border-top: 0.5pt solid #dfe6e9;
    }
    .header .contact-item { color: #636e72; font-size: calc(var(--cv-fs-body) - 0.5pt); }
    .header .contact-item-icon { color: #636e72; }

    .section { margin-bottom: 22pt; }
    .section h2 {
      font-family: var(--cv-font-body);
      font-size: calc(var(--cv-fs-body) + 0.5pt);
      font-weight: 600;
      color: #2d3436;
      margin-bottom: 8pt;
      text-transform: uppercase;
      letter-spacing: 2pt;
      border: none;
      padding: 0;
    }

    .entry-heading { margin-top: 10pt; }
    .entry-title { color: #2d3436; }
    .entry-subtitle { color: #636e72; }
    .entry-date { color: #b2bec3; }

    a.cv-link { color: var(--cv-primary); border-bottom: none; }

    /* Nordic skills — subtle pills */
    .skills-content .cv-list li {
      background: #dfe6e9;
      color: #2d3436;
      border: none;
      font-weight: 500;
    }

    .profile-content p { font-style: normal; color: #636e72; }

    ${getHeaderLayoutCSS(headerLayout)}
  `;
}

export function renderNordicBody(
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
