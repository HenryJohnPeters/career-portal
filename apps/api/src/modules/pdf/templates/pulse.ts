// pulse.ts — Dynamic with vibrant progress indicators and energetic colors

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
} from "./shared";

export function getPulseCSS(theme: ResolvedTheme): string {
  return `
    .page {
      padding: 0;
      background: #fff;
      min-height: 297mm;
    }

    .pulse-header {
      padding: 0;
      display: grid;
      grid-template-columns: 1fr auto;
      background: linear-gradient(120deg, var(--cv-primary) 0%, var(--cv-primary-dark) 60%, #1a1a2e 100%);
      position: relative;
      overflow: hidden;
    }
    .pulse-header::before {
      content: "";
      position: absolute;
      top: -50%; right: -10%;
      width: 300pt;
      height: 300pt;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
      pointer-events: none;
    }
    .pulse-header::after {
      content: "";
      position: absolute;
      bottom: -40%; left: 20%;
      width: 200pt;
      height: 200pt;
      border-radius: 50%;
      background: rgba(255,255,255,0.03);
      pointer-events: none;
    }
    .pulse-header-content {
      padding: 32pt var(--cv-pad) 28pt var(--cv-pad);
      position: relative;
      z-index: 1;
    }
    .pulse-header-content h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) + 4pt);
      font-weight: 900;
      color: #fff;
      line-height: 1.05;
      margin-bottom: 4pt;
      letter-spacing: -1pt;
    }
    .pulse-header-content .header-subtitle {
      font-size: calc(var(--cv-fs-sub) + 1pt);
      color: rgba(255,255,255,0.7);
      font-weight: 300;
      margin-bottom: 16pt;
    }
    .pulse-header-content .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12pt;
    }
    .pulse-header-content .contact-item {
      color: rgba(255,255,255,0.8);
      font-size: calc(var(--cv-fs-body) - 0.5pt);
      background: rgba(255,255,255,0.1);
      padding: 3pt 10pt;
      border-radius: 20pt;
    }
    .pulse-header-content .contact-item-icon { color: #fff; }
    .pulse-header-photo {
      display: flex;
      align-items: center;
      padding-right: var(--cv-pad);
      position: relative;
      z-index: 1;
    }
    .pulse-header-photo .photo {
      width: 80pt;
      height: 80pt;
      border-radius: 50%;
      object-fit: cover;
      border: 4pt solid rgba(255,255,255,0.2);
      box-shadow: 0 4pt 16pt rgba(0,0,0,0.2);
    }

    .pulse-body {
      padding: 22pt var(--cv-pad) var(--cv-pad) var(--cv-pad);
    }

    .pulse-body .section {
      margin-bottom: 18pt;
      position: relative;
      padding-left: 20pt;
    }
    .pulse-body .section::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 4pt;
      height: 100%;
      border-radius: 2pt;
      background: linear-gradient(180deg, var(--cv-primary) 0%, var(--cv-primary-light) 100%);
    }
    .pulse-body .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 800;
      color: var(--cv-primary);
      margin-bottom: 10pt;
      border: none;
      padding: 0;
      text-transform: uppercase;
      letter-spacing: 1.5pt;
      display: flex;
      align-items: center;
      gap: 8pt;
    }
    .pulse-body .section h2::after {
      content: "";
      flex: 1;
      height: 2pt;
      background: linear-gradient(90deg, var(--cv-primary-light) 0%, transparent 100%);
      border-radius: 1pt;
    }

    .pulse-body .entry-heading {
      position: relative;
    }
    .pulse-body .entry-title {
      font-family: var(--cv-font-heading);
      font-weight: 700;
    }

    .pulse-body .profile-content p {
      font-size: calc(var(--cv-fs-body) + 0.5pt);
      color: var(--cv-text-secondary);
      line-height: 1.7;
    }

    .pulse-body .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6pt;
      list-style: none;
      margin: 0;
    }
    .pulse-body .skills-content .cv-list li {
      display: inline-flex;
      align-items: center;
      gap: 5pt;
      background: linear-gradient(135deg, var(--cv-primary) 0%, var(--cv-primary-dark) 100%);
      color: #fff;
      border: none;
      border-radius: 20pt;
      padding: 3pt 12pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 600;
      position: static;
      box-shadow: 0 1pt 4pt rgba(0,0,0,0.1);
    }
    .pulse-body .skills-content .cv-list li::before { display: none; }

    .pulse-body .cv-list li {
      position: relative;
    }

    .pulse-body .rating-dot.filled {
      background: var(--cv-primary);
      box-shadow: 0 0 4pt var(--cv-primary-light);
    }
  `;
}

export function renderPulseLayout(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const photoHtml = data.photoUrl
    ? `<div class="pulse-header-photo"><img class="photo" src="${escapeHtml(
        data.photoUrl
      )}" alt="Photo" /></div>`
    : "";

  const contactHtml = contacts.length
    ? `<div class="contact-row">${contacts
        .map((c) => renderContactItem(c))
        .join("")}</div>`
    : "";

  const header = `<div class="pulse-header">
    <div class="pulse-header-content">
      <h1>${escapeHtml(data.userName || data.title)}</h1>
      <div class="header-subtitle">${escapeHtml(data.title)}</div>
      ${contactHtml}
    </div>
    ${photoHtml}
  </div>`;

  const sectionsHtml = sections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");

  return `${header}<div class="pulse-body">${sectionsHtml}</div>`;
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
