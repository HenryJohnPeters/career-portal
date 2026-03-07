// mosaic.ts — Colorful tile-based layout with card sections and two-column grid

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
} from "./shared";

export function getMosaicCSS(theme: ResolvedTheme): string {
  return `
    .page {
      padding: 0;
      background: #f5f5f7;
      min-height: 297mm;
    }

    .mosaic-header {
      padding: 28pt var(--cv-pad) 24pt var(--cv-pad);
      background: #fff;
      border-bottom: 1pt solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 18pt;
    }
    .mosaic-header .photo {
      width: 68pt;
      height: 68pt;
      border-radius: 14pt;
      object-fit: cover;
      border: 3pt solid var(--cv-primary);
      flex-shrink: 0;
      box-shadow: 0 3pt 10pt rgba(0,0,0,0.08);
    }
    .mosaic-header-info {
      flex: 1;
    }
    .mosaic-header h1 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h1);
      font-weight: 800;
      color: var(--cv-text);
      line-height: 1.1;
      margin-bottom: 4pt;
    }
    .mosaic-header .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: var(--cv-primary);
      font-weight: 600;
      margin-bottom: 10pt;
    }
    .mosaic-header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12pt;
    }
    .mosaic-header .contact-item {
      color: var(--cv-text-muted);
      font-size: calc(var(--cv-fs-body) - 0.5pt);
    }
    .mosaic-header .contact-item-icon { color: var(--cv-primary); }

    .mosaic-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12pt;
      padding: 18pt var(--cv-pad) var(--cv-pad) var(--cv-pad);
    }

    .mosaic-grid .section {
      background: #fff;
      border-radius: 12pt;
      padding: 18pt 20pt;
      box-shadow: 0 1pt 4pt rgba(0,0,0,0.04);
      border: 1pt solid #e5e7eb;
      break-inside: avoid;
    }
    .mosaic-grid .section.full-width {
      grid-column: 1 / -1;
    }
    .mosaic-grid .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      color: #fff;
      margin: -18pt -20pt 14pt -20pt;
      padding: 10pt 20pt;
      border-radius: 12pt 12pt 0 0;
      background: var(--cv-primary);
      border: none;
      text-transform: uppercase;
      letter-spacing: 1pt;
    }

    /* Alternate tile heading colors */
    .mosaic-grid .section:nth-child(4n+2) h2 {
      background: var(--cv-primary-dark);
    }
    .mosaic-grid .section:nth-child(4n+3) h2 {
      background: linear-gradient(135deg, var(--cv-primary) 0%, var(--cv-primary-dark) 100%);
    }

    .mosaic-grid .entry-title {
      font-family: var(--cv-font-heading);
      font-weight: 700;
    }

    .mosaic-grid .profile-content p {
      font-size: calc(var(--cv-fs-body) + 0.5pt);
      color: var(--cv-text-secondary);
      line-height: 1.7;
    }

    .mosaic-grid .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 5pt;
      list-style: none;
      margin: 0;
    }
    .mosaic-grid .skills-content .cv-list li {
      display: inline-block;
      background: var(--cv-primary-light);
      color: var(--cv-primary-dark);
      border: 1pt solid var(--cv-primary);
      border-radius: 6pt;
      padding: 4pt 10pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 600;
      position: static;
    }
    .mosaic-grid .skills-content .cv-list li::before { display: none; }
  `;
}

export function renderMosaicLayout(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const fullWidthTypes = new Set([
    "profile",
    "experience",
    "education",
    "projects",
  ]);
  const photoHtml = data.photoUrl
    ? `<img class="photo" src="${escapeHtml(data.photoUrl)}" alt="Photo" />`
    : "";

  const contactHtml = contacts.length
    ? `<div class="contact-row">${contacts
        .map((c) => renderContactItem(c))
        .join("")}</div>`
    : "";

  const header = `<div class="mosaic-header">
    ${photoHtml}
    <div class="mosaic-header-info">
      <h1>${escapeHtml(data.userName || data.title)}</h1>
      <div class="header-subtitle">${escapeHtml(data.title)}</div>
      ${contactHtml}
    </div>
  </div>`;

  const sectionsHtml = sections
    .map((s) => {
      const cls = fullWidthTypes.has(s.sectionType)
        ? "section full-width"
        : "section";
      return `<div class="${cls}"><h2>${escapeHtml(
        s.title
      )}</h2>${renderSectionContent(s, templateId)}</div>`;
    })
    .join("\n");

  return `${header}<div class="mosaic-grid">${sectionsHtml}</div>`;
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
