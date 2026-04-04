// executive.ts — Colored banner header template

import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderContactItem,
  renderSectionContent,
} from "./shared";

export function getExecutiveCSS(headerLayout: string): string {
  return `
    .page { padding: 0; }

    .header-executive {
      background: var(--cv-primary);
      color: #fff;
      padding: 36pt var(--cv-pad) 28pt var(--cv-pad);
      ${headerLayout === "centered" ? "text-align: center;" : ""}
    }
    .header-executive h1 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h1);
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.4pt;
      line-height: 1.1;
      margin-bottom: 4pt;
    }
    .header-executive .header-subtitle {
      font-size: calc(var(--cv-fs-body) + 1pt);
      color: rgba(255,255,255,0.85);
      font-style: italic;
      margin-bottom: 14pt;
    }
    .header-executive .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14pt;
      border-top: 1px solid rgba(255,255,255,0.25);
      padding-top: 10pt;
      ${headerLayout === "centered" ? "justify-content: center;" : ""}
    }
    .header-executive .contact-item { color: rgba(255,255,255,0.9); }
    .header-executive .contact-item-icon { color: #fff; }
    .header-executive a.contact-item:hover { color: #fff; }

    .executive-body { padding: 24pt var(--cv-pad) var(--cv-pad) var(--cv-pad); }

    .executive-body .section { margin-bottom: var(--cv-sec-gap); }
    .executive-body .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      color: var(--cv-text);
      margin-bottom: 8pt;
      padding-bottom: 5pt;
      border-bottom: 2px solid var(--cv-primary);
      text-transform: none;
      letter-spacing: 0.3pt;
    }

    .entry-title { font-family: var(--cv-font-heading); }
    .profile-content p { font-family: var(--cv-font-heading); font-size: var(--cv-fs-body); }
  `;
}

function renderExecutiveHeader(data: CvData, contacts: ContactItem[]): string {
  const contactHtml = contacts.length
    ? `<div class="contact-row">${contacts
        .map((c) => renderContactItem(c))
        .join("")}</div>`
    : "";
  return `<div class="header-executive">
    <h1>${escapeHtml(data.userName || data.title)}</h1>
    <div class="header-subtitle">${escapeHtml(data.title)}</div>
    ${contactHtml}
  </div>`;
}

export function renderExecutiveBody(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const header = renderExecutiveHeader(data, contacts);
  const sectionsHtml = sections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");
  return `${header}<div class="executive-body">${sectionsHtml}</div>`;
}
