// modern.ts — Two-column CSS Grid flagship template

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderContactItem,
  renderSectionContent,
} from "./shared";

export function getModernCSS(theme: ResolvedTheme): string {
  return `
    .page { padding: 0; display: grid; grid-template-columns: 30% 70%; grid-template-rows: auto 1fr; }

    .header-modern {
      grid-column: 1 / -1;
      padding: 28pt var(--cv-pad) 20pt var(--cv-pad);
      display: flex;
      align-items: center;
      gap: 18pt;
      border-bottom: 3px solid var(--cv-primary);
    }
    .header-modern .photo {
      width: 64pt; height: 64pt; border-radius: 50%;
      object-fit: cover; border: 2.5pt solid var(--cv-primary);
      flex-shrink: 0;
    }
    .header-modern h1 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h1);
      font-weight: 800;
      color: var(--cv-text);
      line-height: 1.1;
      letter-spacing: -0.4pt;
    }
    .header-modern .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: var(--cv-text-muted);
      margin-top: 2pt;
    }

    .sidebar {
      grid-column: 1;
      background: var(--cv-primary-light);
      border-right: 3px solid var(--cv-primary);
      padding: 22pt 18pt;
    }
    .sidebar .section { margin-bottom: var(--cv-sec-gap); }
    .sidebar .section h2 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h2) - 0.5pt);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1pt;
      color: var(--cv-primary-dark);
      margin-bottom: 8pt;
      padding-bottom: 4pt;
      padding-left: 8pt;
      border-left: 4px solid var(--cv-primary);
      border-bottom: none;
    }
    .sidebar .contact-list {
      display: flex;
      flex-direction: column;
      gap: 8pt;
    }
    .sidebar .contact-item {
      font-size: calc(var(--cv-fs-body) - 0.5pt);
    }
    .sidebar .skills-content .cv-list li {
      font-size: calc(var(--cv-fs-body) - 1.5pt);
      padding: 2pt 6pt;
    }

    .main-content {
      grid-column: 2;
      padding: 22pt var(--cv-pad) var(--cv-pad) 22pt;
    }
    .main-content .section { margin-bottom: var(--cv-sec-gap); }
    .main-content .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1pt;
      color: var(--cv-primary);
      margin-bottom: 8pt;
      padding-bottom: 4pt;
      padding-left: 10pt;
      border-left: 4px solid var(--cv-primary);
      border-bottom: none;
    }
  `;
}

export function renderModernLayout(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const sidebarTypes = new Set([
    "skills",
    "languages",
    "interests",
    "certifications",
  ]);
  const sidebarSections = sections.filter((s) =>
    sidebarTypes.has(s.sectionType)
  );
  const mainSections = sections.filter((s) => !sidebarTypes.has(s.sectionType));

  const photoHtml = data.photoUrl
    ? `<img class="photo" src="${escapeHtml(data.photoUrl)}" alt="Photo" />`
    : "";

  const header = `<div class="header-modern">
    ${photoHtml}
    <div>
      <h1>${escapeHtml(data.userName || data.title)}</h1>
      <div class="header-subtitle">${escapeHtml(data.title)}</div>
    </div>
  </div>`;

  const contactHtml = contacts.length
    ? `<div class="section"><h2>Contact</h2><div class="contact-list">${contacts
        .map((c) => renderContactItem(c))
        .join("")}</div></div>`
    : "";

  const sideHtml = sidebarSections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");

  const mainHtml = mainSections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");

  return `${header}
    <div class="sidebar">${contactHtml}${sideHtml}</div>
    <div class="main-content">${mainHtml}</div>`;
}
