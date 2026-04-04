// magazine.ts — Editorial multi-column with pull quotes

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderContactItem,
  renderSectionContent,
} from "./shared";

export function getMagazineCSS(theme: ResolvedTheme): string {
  return `
    .page { padding: 0; display: grid; grid-template-columns: 40% 60%; grid-template-rows: auto 1fr; }

    .header-magazine {
      grid-column: 1 / -1;
      padding: 28pt var(--cv-pad) 18pt var(--cv-pad);
      border-bottom: 4pt solid var(--cv-primary);
    }
    .header-magazine h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) + 2pt);
      font-weight: 800;
      color: var(--cv-text);
      letter-spacing: -0.5pt;
      line-height: 1.05;
      margin-bottom: 4pt;
    }
    .header-magazine .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: var(--cv-text-muted);
      font-style: italic;
    }
    .header-magazine .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12pt;
      margin-top: 10pt;
      padding-top: 8pt;
      border-top: 0.5pt solid var(--cv-muted-border);
    }

    .mag-left {
      grid-column: 1;
      padding: 20pt 18pt 20pt var(--cv-pad);
      border-right: 0.5pt solid var(--cv-muted-border);
    }
    .mag-right {
      grid-column: 2;
      padding: 20pt var(--cv-pad) 20pt 18pt;
    }

    .mag-left .section, .mag-right .section { margin-bottom: var(--cv-sec-gap); }

    .mag-left .section h2, .mag-right .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      color: var(--cv-primary);
      text-transform: uppercase;
      letter-spacing: 1pt;
      margin-bottom: 8pt;
      padding-bottom: 4pt;
      border-bottom: 1pt solid var(--cv-muted-border);
      border-left: none;
      padding-left: 0;
    }

    /* Profile as pull-quote in left column */
    .mag-left .profile-content p {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-body) + 1pt);
      font-style: italic;
      color: var(--cv-text-secondary);
      border-left: 3pt solid var(--cv-primary);
      padding-left: 12pt;
      line-height: 1.6;
    }
  `;
}

export function renderMagazineLayout(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const leftTypes = new Set(["profile", "skills", "languages", "interests", "certifications"]);
  const leftSections = sections.filter((s) => leftTypes.has(s.sectionType));
  const rightSections = sections.filter((s) => !leftTypes.has(s.sectionType));

  const contactHtml = contacts.length
    ? `<div class="contact-row">${contacts.map((c) => renderContactItem(c)).join("")}</div>`
    : "";

  const header = `<div class="header-magazine">
    <h1>${escapeHtml(data.userName || data.title)}</h1>
    <div class="header-subtitle">${escapeHtml(data.title)}</div>
    ${contactHtml}
  </div>`;

  const leftHtml = leftSections
    .map((s) => `<div class="section"><h2>${escapeHtml(s.title)}</h2>${renderSectionContent(s, templateId)}</div>`)
    .join("\n");

  const rightHtml = rightSections
    .map((s) => `<div class="section"><h2>${escapeHtml(s.title)}</h2>${renderSectionContent(s, templateId)}</div>`)
    .join("\n");

  return `${header}
    <div class="mag-left">${leftHtml}</div>
    <div class="mag-right">${rightHtml}</div>`;
}
