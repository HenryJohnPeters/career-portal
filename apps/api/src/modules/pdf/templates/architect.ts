// architect.ts — Clean geometric sections with precise spacing and structure

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
} from "./shared";

export function getArchitectCSS(theme: ResolvedTheme): string {
  return `
    .page { 
      padding: 0;
      background: #f8f9fa;
      min-height: 297mm;
    }

    .architect-header {
      background: #fff;
      padding: 32pt var(--cv-pad) 28pt var(--cv-pad);
      border-bottom: 4pt solid var(--cv-primary);
      position: relative;
    }
    .architect-header::after {
      content: "";
      position: absolute;
      bottom: -4pt;
      left: 0;
      width: 30%;
      height: 4pt;
      background: var(--cv-primary-dark);
    }
    .architect-header .header-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 20pt;
      align-items: center;
    }
    .architect-header .photo {
      width: 80pt;
      height: 80pt;
      border-radius: 0;
      object-fit: cover;
      border: 3pt solid var(--cv-primary);
      box-shadow: 4pt 4pt 0 var(--cv-primary-light);
    }
    .architect-header .header-info h1 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h1);
      font-weight: 800;
      color: var(--cv-text);
      line-height: 1.1;
      margin-bottom: 6pt;
      letter-spacing: -0.5pt;
      text-transform: uppercase;
    }
    .architect-header .header-info .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: var(--cv-primary);
      font-weight: 600;
      margin-bottom: 10pt;
      text-transform: uppercase;
      letter-spacing: 1pt;
    }
    .architect-header .contact-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120pt, 1fr));
      gap: 8pt;
    }
    .architect-header .contact-item { 
      color: var(--cv-text-secondary); 
      font-size: calc(var(--cv-fs-body) - 0.5pt);
    }
    .architect-header .contact-item-icon { color: var(--cv-primary); }

    .architect-body {
      padding: 24pt var(--cv-pad) var(--cv-pad) var(--cv-pad);
    }

    .architect-body .section {
      margin-bottom: 20pt;
      background: #fff;
      padding: 0;
      border: 2pt solid #e9ecef;
      position: relative;
    }
    .architect-body .section::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 6pt;
      height: 100%;
      background: var(--cv-primary);
    }
    .architect-body .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      color: #fff;
      background: var(--cv-primary);
      margin: 0;
      padding: 8pt 12pt 8pt 20pt;
      border: none;
      text-transform: uppercase;
      letter-spacing: 1.5pt;
      position: relative;
    }
    .architect-body .section h2::after {
      content: "";
      position: absolute;
      right: 12pt;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 6pt solid var(--cv-primary-dark);
      border-top: 6pt solid transparent;
      border-bottom: 6pt solid transparent;
    }

    .architect-body .section-body,
    .architect-body .profile-content,
    .architect-body .skills-content,
    .architect-body .languages-content,
    .architect-body .projects-content,
    .architect-body .certifications-content {
      padding: 16pt 20pt;
    }

    /* Architect skills — structured grid */
    .architect-body .skills-content .cv-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100pt, 1fr));
      gap: 8pt;
      list-style: none;
      margin: 0;
    }
    .architect-body .skills-content .cv-list li {
      display: block;
      background: #f8f9fa;
      color: var(--cv-text);
      border: 1pt solid #dee2e6;
      border-left: 3pt solid var(--cv-primary);
      padding: 6pt 10pt;
      font-size: calc(var(--cv-fs-body) - 0.5pt);
      font-weight: 500;
      position: static;
      text-align: center;
    }
    .architect-body .skills-content .cv-list li::before { display: none; }

    /* Architect entry headings with geometric accent */
    .architect-body .entry-heading {
      position: relative;
      padding-left: 14pt;
      margin-bottom: 8pt;
    }
    .architect-body .entry-heading::before {
      content: "";
      position: absolute;
      left: 0;
      top: 2pt;
      width: 6pt;
      height: 6pt;
      background: var(--cv-primary);
      transform: rotate(45deg);
    }
    .architect-body .entry-title {
      font-family: var(--cv-font-heading);
      font-weight: 700;
      color: var(--cv-text);
    }

    .architect-body .profile-content p {
      font-size: var(--cv-fs-body);
      color: var(--cv-text-secondary);
      line-height: 1.7;
      text-align: justify;
    }

    /* Architect lists with square bullets */
    .architect-body .cv-list {
      list-style: none;
      margin-left: 14pt;
    }
    .architect-body .cv-list li {
      position: relative;
      padding-left: 14pt;
    }
    .architect-body .cv-list li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 6pt;
      width: 5pt;
      height: 5pt;
      background: var(--cv-primary);
      transform: rotate(45deg);
    }
  `;
}

export function renderArchitectLayout(
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

  const header = `<div class="architect-header">
    <div class="header-grid">
      ${photoHtml ? photoHtml : "<div></div>"}
      <div class="header-info">
        <h1>${escapeHtml(data.userName || data.title)}</h1>
        <div class="header-subtitle">${escapeHtml(data.title)}</div>
        ${contactHtml}
      </div>
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

  return `${header}<div class="architect-body">${sectionsHtml}</div>`;
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
