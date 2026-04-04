// compact.ts — Dense two-column, max info template

import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderContactItem,
  renderSectionContent,
} from "./shared";

export function getCompactCSS(): string {
  return `
    .page {
      padding: 20pt 22pt;
      font-size: 9pt;
      line-height: 1.4;
    }

    .header-compact {
      margin-bottom: 10pt;
      padding-bottom: 8pt;
      border-bottom: 1.5pt solid var(--cv-primary);
    }
    .header-compact h1 {
      font-family: var(--cv-font-heading);
      font-size: 18pt;
      font-weight: 800;
      color: var(--cv-text);
      line-height: 1.1;
      margin-bottom: 4pt;
    }
    .header-compact .contact-row {
      display: flex; flex-wrap: wrap; gap: 8pt;
    }
    .header-compact .contact-item { font-size: 8pt; }
    .header-compact .contact-item-icon svg { width: 9pt; height: 9pt; }

    .compact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10pt 18pt;
    }
    .compact-full { grid-column: 1 / -1; }

    .compact-grid .section { margin-bottom: 8pt; }
    .compact-grid .section h2 {
      font-family: var(--cv-font-body);
      font-size: 9.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8pt;
      color: var(--cv-primary);
      margin-bottom: 4pt;
      padding-bottom: 2pt;
      border-bottom: 0.5pt solid var(--cv-muted-border);
    }

    .compact-grid .entry-heading { margin-top: 4pt; }
    .compact-grid .entry-title { font-size: 9pt; }
    .compact-grid .entry-date { font-size: 8pt; }
    .compact-grid .cv-list { margin: 2pt 0 3pt 12pt; }
    .compact-grid .cv-list li { margin-bottom: 1pt; font-size: 8.5pt; line-height: 1.35; }

    .compact-grid .profile-content p { font-size: 9pt; font-style: normal; }

    /* Compact skills — comma sep */
    .compact-grid .skills-content .cv-list {
      display: inline; list-style: none; margin: 0;
    }
    .compact-grid .skills-content .cv-list li {
      display: inline;
      background: none;
      border: none;
      padding: 0;
      font-size: 8.5pt;
      color: var(--cv-text);
      font-weight: 400;
    }
    .compact-grid .skills-content .cv-list li::after { content: ", "; }
    .compact-grid .skills-content .cv-list li:last-child::after { content: ""; }
    .compact-grid .skills-content .cv-list li::before { display: none; }
  `;
}

export function renderCompactLayout(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const contactHtml = contacts.length
    ? `<div class="contact-row">${contacts
        .map((c) => renderContactItem(c))
        .join("")}</div>`
    : "";

  const header = `<div class="header-compact">
    <h1>${escapeHtml(data.userName || data.title)}</h1>
    ${contactHtml}
  </div>`;

  // Profile goes full width, rest alternates in 2-col grid
  const profileSection = sections.find((s) => s.sectionType === "profile");
  const otherSections = sections.filter((s) => s.sectionType !== "profile");

  const profileHtml = profileSection
    ? `<div class="section compact-full"><h2>${escapeHtml(
        profileSection.title
      )}</h2>${renderSectionContent(profileSection, templateId)}</div>`
    : "";

  const othersHtml = otherSections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");

  return `${header}<div class="compact-grid">${profileHtml}${othersHtml}</div>`;
}
