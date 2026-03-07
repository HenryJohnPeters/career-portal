// infographic.ts — Visual sidebar with progress bars template

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderContactItem,
  renderSectionContent,
} from "./shared";

export function getInfographicCSS(theme: ResolvedTheme): string {
  return `
    .page { padding: 0; display: grid; grid-template-columns: 32% 68%; min-height: 297mm; }

    .info-sidebar {
      background: var(--cv-primary-light);
      border-right: 2pt solid var(--cv-primary);
      padding: 28pt 18pt;
      display: flex;
      flex-direction: column;
      gap: 16pt;
    }
    .info-sidebar .photo-wrapper {
      text-align: center;
      margin-bottom: 4pt;
    }
    .info-sidebar .photo {
      width: 72pt; height: 72pt; border-radius: 50%;
      object-fit: cover; border: 3pt solid var(--cv-primary);
      display: inline-block;
    }
    .info-sidebar h1 {
      font-family: var(--cv-font-heading);
      font-size: 18pt;
      font-weight: 800;
      color: var(--cv-text);
      text-align: center;
      line-height: 1.15;
      margin-bottom: 2pt;
    }
    .info-sidebar .subtitle {
      font-size: calc(var(--cv-fs-body) - 0.5pt);
      color: var(--cv-text-muted);
      text-align: center;
      font-style: italic;
    }
    .info-sidebar .section { margin-bottom: 4pt; }
    .info-sidebar .section h2 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h2) - 1pt);
      font-weight: 700;
      color: var(--cv-primary-dark);
      margin-bottom: 6pt;
      padding-bottom: 4pt;
      border-bottom: 1px solid var(--cv-primary);
      text-transform: uppercase;
      letter-spacing: 0.8pt;
      border-left: none;
      padding-left: 0;
    }
    .info-sidebar .contact-list {
      display: flex; flex-direction: column; gap: 6pt;
    }
    .info-sidebar .contact-item { font-size: calc(var(--cv-fs-body) - 1pt); color: var(--cv-text-secondary); }
    .info-sidebar .contact-item-icon { color: var(--cv-primary); }

    /* Sidebar skills — progress bar style */
    .info-sidebar .skills-content .cv-list {
      list-style: none; margin: 0; display: flex; flex-direction: column; gap: 5pt;
    }
    .info-sidebar .skills-content .cv-list li {
      display: block;
      background: var(--cv-primary);
      color: #fff;
      border: none;
      padding: 3pt 8pt;
      border-radius: 2pt;
      font-size: calc(var(--cv-fs-body) - 1.5pt);
      font-weight: 500;
      position: static;
    }
    .info-sidebar .skills-content .cv-list li::before { display: none; }

    .info-main {
      padding: 28pt 28pt var(--cv-pad) 22pt;
    }
    .info-main .section { margin-bottom: var(--cv-sec-gap); }
    .info-main .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      color: var(--cv-primary);
      margin-bottom: 8pt;
      padding-bottom: 4pt;
      border-bottom: 2pt solid var(--cv-primary);
      text-transform: uppercase;
      letter-spacing: 0.8pt;
      border-left: none;
      padding-left: 0;
    }
  `;
}

export function renderInfographicLayout(
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
    ? `<div class="photo-wrapper"><img class="photo" src="${escapeHtml(
        data.photoUrl
      )}" alt="Photo" /></div>`
    : "";

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

  return `<div class="info-sidebar">
      ${photoHtml}
      <div><h1>${escapeHtml(
        data.userName || data.title
      )}</h1><div class="subtitle">${escapeHtml(data.title)}</div></div>
      ${contactHtml}${sideHtml}
    </div>
    <div class="info-main">${mainHtml}</div>`;
}
