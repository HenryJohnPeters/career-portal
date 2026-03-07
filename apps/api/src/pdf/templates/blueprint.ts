// blueprint.ts — Technical drawing style with grid lines and precise measurements

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
} from "./shared";

export function getBlueprintCSS(theme: ResolvedTheme): string {
  return `
    .page {
      padding: 0;
      background: #1a2744;
      color: #d4e4ff;
      min-height: 297mm;
      position: relative;
    }
    .page::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 20pt 20pt;
      pointer-events: none;
    }

    .blueprint-border {
      position: absolute;
      top: 12pt; left: 12pt; right: 12pt; bottom: 12pt;
      border: 0.5pt solid rgba(255,255,255,0.15);
      pointer-events: none;
    }
    .blueprint-border::before {
      content: "";
      position: absolute;
      top: 3pt; left: 3pt; right: 3pt; bottom: 3pt;
      border: 0.25pt solid rgba(255,255,255,0.08);
    }

    .blueprint-container {
      padding: 28pt 32pt;
      position: relative;
      z-index: 1;
    }

    .blueprint-header {
      margin-bottom: 20pt;
      padding-bottom: 16pt;
      border-bottom: 1pt solid rgba(255,255,255,0.15);
      position: relative;
    }
    .blueprint-header .photo {
      width: 60pt;
      height: 60pt;
      border-radius: 0;
      object-fit: cover;
      border: 1pt solid rgba(255,255,255,0.3);
      float: right;
      margin-left: 14pt;
    }
    .blueprint-header h1 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h1);
      font-weight: 300;
      color: #fff;
      line-height: 1.1;
      margin-bottom: 4pt;
      letter-spacing: 2pt;
      text-transform: uppercase;
    }
    .blueprint-header .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: 3pt;
      margin-bottom: 12pt;
    }
    .blueprint-header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14pt;
    }
    .blueprint-header .contact-item {
      color: rgba(255,255,255,0.6);
      font-size: calc(var(--cv-fs-body) - 0.5pt);
    }
    .blueprint-header .contact-item-icon { color: rgba(255,255,255,0.4); }

    .blueprint-body .section {
      margin-bottom: 18pt;
      padding-left: 18pt;
      border-left: 0.5pt solid rgba(255,255,255,0.12);
      position: relative;
    }
    .blueprint-body .section::before {
      content: "+";
      position: absolute;
      left: -5pt;
      top: -2pt;
      color: rgba(255,255,255,0.3);
      font-size: 10pt;
      font-family: monospace;
    }
    .blueprint-body .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 400;
      color: #fff;
      margin-bottom: 10pt;
      text-transform: uppercase;
      letter-spacing: 2pt;
      border: none;
      padding: 0;
      position: relative;
    }
    .blueprint-body .section h2::after {
      content: "";
      display: inline-block;
      width: 30pt;
      height: 0.5pt;
      background: rgba(255,255,255,0.3);
      margin-left: 10pt;
      vertical-align: middle;
    }

    .blueprint-body .entry-title { color: #fff; font-weight: 500; }
    .blueprint-body .entry-subtitle { color: rgba(255,255,255,0.5); }
    .blueprint-body .entry-date { color: rgba(255,255,255,0.4); }
    .blueprint-body strong { color: #d4e4ff; }

    .blueprint-body .cv-list li { color: #d4e4ff; }
    .blueprint-body ul.cv-list { list-style: none; }
    .blueprint-body ul.cv-list li::before {
      content: "—";
      position: absolute;
      left: 0;
      color: rgba(255,255,255,0.3);
    }
    .blueprint-body ul.cv-list li { padding-left: 14pt; }

    .blueprint-body a.cv-link { color: #7eb8ff; border-bottom-color: rgba(255,255,255,0.2); }

    .blueprint-body .profile-content p {
      color: rgba(255,255,255,0.7);
      font-style: normal;
      line-height: 1.8;
    }

    .blueprint-body .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6pt;
      list-style: none;
      margin: 0;
    }
    .blueprint-body .skills-content .cv-list li {
      display: inline-block;
      background: rgba(255,255,255,0.06);
      color: #d4e4ff;
      border: 0.5pt solid rgba(255,255,255,0.15);
      border-radius: 0;
      padding: 2pt 10pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 400;
      position: static;
      letter-spacing: 0.5pt;
      text-transform: uppercase;
    }
    .blueprint-body .skills-content .cv-list li::before { display: none; }

    .blueprint-body .rating-dot { background: rgba(255,255,255,0.15); }
    .blueprint-body .rating-dot.filled { background: #7eb8ff; }
  `;
}

export function renderBlueprintLayout(
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

  const header = `<div class="blueprint-header">
    ${photoHtml}
    <h1>${escapeHtml(data.userName || data.title)}</h1>
    <div class="header-subtitle">${escapeHtml(data.title)}</div>
    ${contactHtml}
  </div>`;

  const sectionsHtml = sections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");

  return `<div class="blueprint-border"></div><div class="blueprint-container">${header}<div class="blueprint-body">${sectionsHtml}</div></div>`;
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
