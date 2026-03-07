// artisan.ts — Handcrafted look with decorative borders and organic styling

import { getHeaderLayoutCSS } from "./base-css";
import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
  renderSingleColumnHeader,
} from "./shared";

export function getArtisanCSS(headerLayout: string): string {
  return `
    .page {
      padding: 44pt 42pt;
      background: #fdfcfa;
      min-height: 297mm;
      position: relative;
    }
    .page::before {
      content: "";
      position: absolute;
      top: 16pt; left: 16pt; right: 16pt; bottom: 16pt;
      border: 1pt solid #e8e2d8;
      pointer-events: none;
    }
    .page::after {
      content: "";
      position: absolute;
      top: 19pt; left: 19pt; right: 19pt; bottom: 19pt;
      border: 0.5pt solid #f0ebe3;
      pointer-events: none;
    }

    .header {
      margin-bottom: 24pt;
      padding-bottom: 18pt;
      border-bottom: none;
      text-align: center;
      position: relative;
    }
    .header::after {
      content: "❦";
      display: block;
      text-align: center;
      color: var(--cv-primary);
      font-size: 14pt;
      margin-top: 14pt;
      opacity: 0.5;
    }
    .header h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) + 2pt);
      font-weight: 400;
      letter-spacing: 3pt;
      text-transform: uppercase;
      color: var(--cv-text);
      margin-bottom: 6pt;
      line-height: 1.15;
    }
    .header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14pt;
      margin-top: 10pt;
      justify-content: center;
    }
    .header .contact-item {
      color: var(--cv-text-muted);
      font-size: calc(var(--cv-fs-body) - 0.5pt);
    }
    .header .contact-item-icon { color: var(--cv-primary); opacity: 0.7; }

    .section {
      margin-bottom: 22pt;
      position: relative;
    }
    .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 400;
      letter-spacing: 2.5pt;
      text-transform: uppercase;
      color: var(--cv-primary);
      margin-bottom: 12pt;
      text-align: center;
      border: none;
      padding: 0;
      position: relative;
    }
    .section h2::before,
    .section h2::after {
      content: "—";
      color: var(--cv-primary);
      opacity: 0.3;
      margin: 0 8pt;
      font-weight: 300;
    }

    .entry-title {
      font-family: var(--cv-font-heading);
      font-weight: 600;
    }
    .entry-subtitle {
      font-style: italic;
      color: var(--cv-text-muted);
    }

    .profile-content p {
      text-align: center;
      font-style: italic;
      color: var(--cv-text-secondary);
      line-height: 1.8;
      max-width: 85%;
      margin: 0 auto;
      font-size: calc(var(--cv-fs-body) + 0.5pt);
    }

    .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8pt;
      list-style: none;
      margin: 0;
      justify-content: center;
    }
    .skills-content .cv-list li {
      display: inline-block;
      background: transparent;
      color: var(--cv-primary-dark);
      border: 1pt solid var(--cv-primary);
      border-radius: 0;
      padding: 3pt 14pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 500;
      position: static;
      letter-spacing: 1pt;
      text-transform: uppercase;
      position: relative;
    }
    .skills-content .cv-list li::before { display: none; }
    .skills-content .cv-list li::after {
      content: "";
      position: absolute;
      top: 2pt; left: 2pt; right: 2pt; bottom: 2pt;
      border: 0.5pt solid var(--cv-primary-light);
      pointer-events: none;
    }

    .cv-list {
      list-style: none;
    }
    .cv-list li {
      position: relative;
      padding-left: 16pt;
    }
    .cv-list li::before {
      content: "◇";
      position: absolute;
      left: 0;
      color: var(--cv-primary);
      font-size: 8pt;
      top: 2pt;
    }

    .entry-heading {
      text-align: center;
      justify-content: center;
    }

    ${headerLayout === "split" ? "" : getHeaderLayoutCSS(headerLayout)}
  `;
}

export function renderArtisanBody(
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
