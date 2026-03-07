// metropolis.ts — Urban grid-based layout with bold geometric accents

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
} from "./shared";

export function getMetropolisCSS(theme: ResolvedTheme): string {
  return `
    .page {
      padding: 0;
      background: #fff;
      min-height: 297mm;
    }

    .metro-header {
      display: grid;
      grid-template-columns: 6pt 1fr;
      min-height: 120pt;
    }
    .metro-header-accent {
      background: var(--cv-primary);
    }
    .metro-header-content {
      padding: 28pt 32pt 24pt 28pt;
      border-bottom: 2pt solid #f0f0f0;
      position: relative;
    }
    .metro-header-content::after {
      content: "";
      position: absolute;
      bottom: -2pt;
      right: 32pt;
      width: 80pt;
      height: 2pt;
      background: var(--cv-primary);
    }
    .metro-header-content .photo {
      width: 64pt;
      height: 64pt;
      border-radius: 4pt;
      object-fit: cover;
      border: 2pt solid var(--cv-primary);
      float: right;
      margin-left: 16pt;
    }
    .metro-header-content h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) + 2pt);
      font-weight: 900;
      color: var(--cv-text);
      line-height: 1.05;
      margin-bottom: 4pt;
      letter-spacing: -1pt;
      text-transform: uppercase;
    }
    .metro-header-content .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: var(--cv-primary);
      font-weight: 600;
      letter-spacing: 2pt;
      text-transform: uppercase;
      margin-bottom: 12pt;
    }
    .metro-header-content .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14pt;
    }
    .metro-header-content .contact-item {
      color: var(--cv-text-muted);
      font-size: calc(var(--cv-fs-body) - 0.5pt);
    }
    .metro-header-content .contact-item-icon { color: var(--cv-primary); }

    .metro-body {
      display: grid;
      grid-template-columns: 6pt 1fr;
    }
    .metro-body-accent {
      background: var(--cv-primary-light);
    }
    .metro-body-content {
      padding: 22pt 32pt var(--cv-pad) 28pt;
    }

    .metro-body-content .section {
      margin-bottom: 18pt;
      position: relative;
    }
    .metro-body-content .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 800;
      color: var(--cv-text);
      margin-bottom: 10pt;
      padding: 6pt 0 6pt 14pt;
      border-left: 4pt solid var(--cv-primary);
      border-bottom: none;
      text-transform: uppercase;
      letter-spacing: 1.5pt;
      background: var(--cv-primary-light);
      display: inline-block;
      padding-right: 16pt;
    }

    .metro-body-content .entry-heading {
      padding-left: 14pt;
      border-left: 1pt solid #e5e7eb;
      margin-left: 2pt;
    }
    .metro-body-content .entry-title {
      font-family: var(--cv-font-heading);
      font-weight: 700;
    }

    .metro-body-content .section-body,
    .metro-body-content .profile-content,
    .metro-body-content .skills-content,
    .metro-body-content .languages-content,
    .metro-body-content .projects-content,
    .metro-body-content .certifications-content {
      padding-left: 14pt;
      border-left: 1pt solid #e5e7eb;
      margin-left: 2pt;
    }

    .metro-body-content .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6pt;
      list-style: none;
      margin: 0;
    }
    .metro-body-content .skills-content .cv-list li {
      display: inline-block;
      background: var(--cv-primary);
      color: #fff;
      border: none;
      border-radius: 2pt;
      padding: 3pt 10pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 600;
      position: static;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    .metro-body-content .skills-content .cv-list li::before { display: none; }

    .metro-body-content .profile-content p {
      font-size: calc(var(--cv-fs-body) + 0.5pt);
      color: var(--cv-text-secondary);
      line-height: 1.7;
    }

    .metro-body-content .cv-list li::before {
      content: "■";
      color: var(--cv-primary);
      font-size: 6pt;
    }
  `;
}

export function renderMetropolisLayout(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const photoHtml = data.photoUrl
    ? `<img class="photo" src="${escapeHtml(data.photoUrl)}" alt="Photo" />`
    : "";

  const contactHtml = contacts.length
    ? `<div class="contact-row">${contacts
        .map((c) => renderContactItem(c))
        .join("")}</div>`
    : "";

  const header = `<div class="metro-header">
    <div class="metro-header-accent"></div>
    <div class="metro-header-content">
      ${photoHtml}
      <h1>${escapeHtml(data.userName || data.title)}</h1>
      <div class="header-subtitle">${escapeHtml(data.title)}</div>
      ${contactHtml}
    </div>
  </div>`;

  const sectionsHtml = sections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");

  return `${header}<div class="metro-body"><div class="metro-body-accent"></div><div class="metro-body-content">${sectionsHtml}</div></div>`;
}

function renderContactItem(item: ContactItem): string {
  const inner = `<span class="contact-item-icon">${
    item.icon
  }</span><span class="contact-item-text">${escapeHtml(item.text)}</span>`;
  if (item.href)
    return `<a href="${escapeHtml(
      item.href
    )}" class="contact-item">${inner}</a>`;
  return `<span class="contact-item">${inner}</span>`;
}
