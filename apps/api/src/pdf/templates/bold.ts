// bold.ts — High-contrast, large headings, vibrant blocks template

import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderContactItem,
  renderSectionContent,
} from "./shared";

export function getBoldCSS(headerLayout: string): string {
  return `
    .page { padding: 0; }

    .header-bold {
      background: var(--cv-primary);
      color: #fff;
      padding: 40pt var(--cv-pad) 32pt var(--cv-pad);
      ${headerLayout === "centered" ? "text-align: center;" : ""}
    }
    .header-bold h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) + 4pt);
      font-weight: 800;
      color: #fff;
      letter-spacing: -1pt;
      line-height: 1.05;
      margin-bottom: 6pt;
      text-transform: uppercase;
    }
    .header-bold .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14pt;
      margin-top: 12pt;
      ${headerLayout === "centered" ? "justify-content: center;" : ""}
    }
    .header-bold .contact-item { color: rgba(255,255,255,0.85); font-weight: 500; }
    .header-bold .contact-item-icon { color: #fff; }
    .header-bold a.contact-item:hover { color: #fff; }

    .bold-body { padding: 24pt var(--cv-pad) var(--cv-pad) var(--cv-pad); }

    .bold-body .section { margin-bottom: var(--cv-sec-gap); }
    .bold-body .section h2 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h2) + 1pt);
      font-weight: 800;
      color: var(--cv-primary);
      margin-bottom: 10pt;
      text-transform: uppercase;
      letter-spacing: 1pt;
      padding-bottom: 6pt;
      border-bottom: 3pt solid var(--cv-primary);
      border-left: none;
      padding-left: 0;
    }

    .bold-body .entry-title {
      font-family: var(--cv-font-heading);
      font-weight: 800;
      font-size: calc(var(--cv-fs-sub) + 0.5pt);
    }

    .bold-body .skills-content .cv-list li {
      background: var(--cv-primary);
      color: #fff;
      font-weight: 600;
      border: none;
    }
  `;
}

function renderBoldHeader(data: CvData, contacts: ContactItem[]): string {
  const contactHtml = contacts.length
    ? `<div class="contact-row">${contacts
        .map((c) => renderContactItem(c))
        .join("")}</div>`
    : "";
  return `<div class="header-bold">
    <h1>${escapeHtml(data.userName || data.title)}</h1>
    ${contactHtml}
  </div>`;
}

export function renderBoldBody(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const header = renderBoldHeader(data, contacts);
  const sectionsHtml = sections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");
  return `${header}<div class="bold-body">${sectionsHtml}</div>`;
}
