// minimal.ts — Dieter Rams whitespace aesthetic template

import { getHeaderLayoutCSS } from "./base-css";
import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
  renderSingleColumnHeader,
} from "./shared";

export function getMinimalCSS(headerLayout: string): string {
  return `
    .page { padding: 48pt 52pt; }

    .header {
      margin-bottom: 28pt;
    }
    .header h1 {
      font-family: var(--cv-font-body);
      font-size: 32pt;
      font-weight: 300;
      color: var(--cv-text);
      letter-spacing: -0.5pt;
      line-height: 1.1;
      margin-bottom: 8pt;
    }
    .header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16pt;
      margin-top: 4pt;
    }
    .header .contact-item { color: var(--cv-text-muted); }
    .header .contact-item-icon { color: var(--cv-text-muted); }

    .section { margin-bottom: 24pt; }
    .section h2 {
      font-family: var(--cv-font-body);
      font-size: calc(var(--cv-fs-body) + 1pt);
      font-weight: 700;
      color: var(--cv-text);
      margin-bottom: 10pt;
      margin-top: 8pt;
      text-transform: none;
      letter-spacing: 0;
      border: none;
      padding: 0;
    }

    .entry-heading { margin-top: 10pt; }

    /* Minimal link style */
    a.cv-link { color: var(--cv-primary); border-bottom: none; }
    a.contact-item { color: var(--cv-text-muted); }
    .contact-item-icon { color: var(--cv-text-muted); }

    /* Minimal skills — no badges */
    .skills-content .cv-list {
      list-style: none; margin: 0; display: block;
    }
    .skills-content .cv-list li {
      display: inline;
      background: none;
      border: none;
      padding: 0;
      color: var(--cv-text);
      font-size: var(--cv-fs-body);
      font-weight: 400;
    }
    .skills-content .cv-list li::before { display: none; }
    .skills-content .cv-list li::after { content: " · "; color: var(--cv-text-muted); }
    .skills-content .cv-list li:last-child::after { content: ""; }

    .profile-content p { font-style: normal; color: var(--cv-text-secondary); font-size: var(--cv-fs-body); }

    ${getHeaderLayoutCSS(headerLayout)}
  `;
}

export function renderMinimalBody(
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
