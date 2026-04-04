// startup.ts — Modern gradient header with rounded cards template

import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderContactItem,
  renderSectionContent,
} from "./shared";

export function getStartupCSS(): string {
  return `
    .page { padding: 0; background: #fafbfc; }

    .header-startup {
      background: linear-gradient(135deg, var(--cv-primary) 0%, var(--cv-primary-dark) 100%);
      color: #fff;
      padding: 32pt var(--cv-pad) 26pt var(--cv-pad);
      border-radius: 0 0 16pt 16pt;
    }
    .header-startup h1 {
      font-family: var(--cv-font-body);
      font-size: var(--cv-fs-h1);
      font-weight: 800;
      color: #fff;
      line-height: 1.1;
      margin-bottom: 4pt;
    }
    .header-startup .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: rgba(255,255,255,0.8);
      margin-bottom: 12pt;
    }
    .header-startup .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12pt;
    }
    .header-startup .contact-item { color: rgba(255,255,255,0.9); font-size: calc(var(--cv-fs-body) - 1pt); }
    .header-startup .contact-item-icon { color: #fff; }
    .header-startup a.contact-item:hover { color: #fff; }

    .startup-body { padding: 20pt var(--cv-pad) var(--cv-pad) var(--cv-pad); }

    .startup-body .section {
      margin-bottom: var(--cv-sec-gap);
      background: #fff;
      border-radius: 10pt;
      padding: 16pt 18pt;
      border: 1pt solid #e5e7eb;
      box-shadow: 0 1pt 3pt rgba(0,0,0,0.04);
    }
    .startup-body .section h2 {
      font-family: var(--cv-font-body);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      color: var(--cv-primary);
      margin-bottom: 8pt;
      border: none;
      padding: 0;
      text-transform: none;
      letter-spacing: 0;
    }

    .startup-body .skills-content .cv-list li {
      border-radius: 20pt;
      padding: 3pt 10pt;
    }
  `;
}

function renderStartupHeader(data: CvData, contacts: ContactItem[]): string {
  const contactHtml = contacts.length
    ? `<div class="contact-row">${contacts
        .map((c) => renderContactItem(c))
        .join("")}</div>`
    : "";
  return `<div class="header-startup">
    <h1>${escapeHtml(data.userName || data.title)}</h1>
    <div class="header-subtitle">${escapeHtml(data.title)}</div>
    ${contactHtml}
  </div>`;
}

export function renderStartupBody(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const header = renderStartupHeader(data, contacts);
  const sectionsHtml = sections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");
  return `${header}<div class="startup-body">${sectionsHtml}</div>`;
}
