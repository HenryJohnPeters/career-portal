// zen.ts — Japanese-inspired minimalist with asymmetric whitespace

import { getHeaderLayoutCSS } from "./base-css";
import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
  renderSingleColumnHeader,
} from "./shared";

export function getZenCSS(headerLayout: string): string {
  return `
    .page { 
      padding: 52pt 56pt 44pt 56pt;
      background: #fdfbf7;
      min-height: 297mm;
    }

    .header {
      margin-bottom: 28pt;
      padding-bottom: 20pt;
      border-bottom: none;
      text-align: left;
      position: relative;
    }
    .header::after {
      content: "";
      display: block;
      width: 32pt;
      height: 0.5pt;
      background: var(--cv-primary);
      margin-top: 16pt;
    }
    .header h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) + 4pt);
      font-weight: 300;
      letter-spacing: 4pt;
      color: var(--cv-text);
      margin-bottom: 8pt;
      line-height: 1.15;
      text-transform: lowercase;
    }
    .header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16pt;
      margin-top: 10pt;
    }
    .header .contact-item {
      color: var(--cv-text-muted);
      font-size: calc(var(--cv-fs-body) - 1pt);
      letter-spacing: 0.5pt;
    }
    .header .contact-item-icon { color: var(--cv-primary); opacity: 0.6; }

    .section {
      margin-bottom: 24pt;
      padding-left: 40pt;
      position: relative;
    }
    .section::before {
      content: "";
      position: absolute;
      left: 16pt;
      top: 4pt;
      width: 4pt;
      height: 4pt;
      border-radius: 50%;
      background: var(--cv-primary);
      opacity: 0.4;
    }
    .section h2 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h2) - 0.5pt);
      font-weight: 300;
      letter-spacing: 3pt;
      text-transform: lowercase;
      color: var(--cv-primary);
      margin-bottom: 12pt;
      border: none;
      padding: 0;
    }

    .entry-title {
      font-family: var(--cv-font-heading);
      font-weight: 500;
      letter-spacing: 0.5pt;
    }
    .entry-subtitle {
      font-weight: 300;
      color: var(--cv-text-muted);
    }
    .entry-date {
      font-weight: 300;
      letter-spacing: 0.5pt;
    }

    .profile-content p {
      font-size: var(--cv-fs-body);
      color: var(--cv-text-secondary);
      line-height: 1.9;
      font-weight: 300;
      letter-spacing: 0.3pt;
    }

    .cv-list li {
      font-weight: 300;
      line-height: 1.8;
    }

    .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8pt;
      list-style: none;
      margin: 0;
    }
    .skills-content .cv-list li {
      display: inline-block;
      background: transparent;
      color: var(--cv-text-secondary);
      border: 0.5pt solid var(--cv-muted-border);
      border-radius: 0;
      padding: 3pt 12pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 300;
      position: static;
      letter-spacing: 1pt;
      text-transform: lowercase;
    }
    .skills-content .cv-list li::before { display: none; }

    ${headerLayout === "split" ? "" : getHeaderLayoutCSS(headerLayout)}
  `;
}

export function renderZenBody(
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
