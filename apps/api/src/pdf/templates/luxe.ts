// luxe.ts — Premium dark-mode with gold accents

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
} from "./shared";

export function getLuxeCSS(theme: ResolvedTheme): string {
  return `
    .page {
      padding: 0;
      background: #111111;
      color: #e8e8e8;
      min-height: 297mm;
    }

    .luxe-header {
      padding: 36pt var(--cv-pad) 28pt var(--cv-pad);
      text-align: center;
      border-bottom: 1pt solid #2a2a2a;
      position: relative;
    }
    .luxe-header::after {
      content: "";
      position: absolute;
      bottom: -1pt;
      left: 50%;
      transform: translateX(-50%);
      width: 60pt;
      height: 1pt;
      background: linear-gradient(90deg, transparent, #c9a84c, transparent);
    }
    .luxe-header .photo {
      width: 72pt;
      height: 72pt;
      border-radius: 50%;
      object-fit: cover;
      border: 2pt solid #c9a84c;
      margin: 0 auto 12pt auto;
      display: block;
      box-shadow: 0 0 20pt rgba(201,168,76,0.15);
    }
    .luxe-header h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) + 2pt);
      font-weight: 300;
      color: #ffffff;
      line-height: 1.1;
      margin-bottom: 4pt;
      letter-spacing: 4pt;
      text-transform: uppercase;
    }
    .luxe-header .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: #c9a84c;
      letter-spacing: 3pt;
      text-transform: uppercase;
      margin-bottom: 16pt;
    }
    .luxe-header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16pt;
      justify-content: center;
    }
    .luxe-header .contact-item {
      color: #888;
      font-size: calc(var(--cv-fs-body) - 0.5pt);
    }
    .luxe-header .contact-item-icon { color: #c9a84c; }
    .luxe-header a.contact-item:hover { color: #c9a84c; }

    .luxe-body {
      padding: 24pt var(--cv-pad) var(--cv-pad) var(--cv-pad);
    }

    .luxe-body .section {
      margin-bottom: 20pt;
      position: relative;
    }
    .luxe-body .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 300;
      color: #c9a84c;
      margin-bottom: 12pt;
      letter-spacing: 3pt;
      text-transform: uppercase;
      border: none;
      padding: 0 0 6pt 0;
      border-bottom: 0.5pt solid #2a2a2a;
      text-align: center;
    }

    .luxe-body .entry-title { color: #fff; font-weight: 600; }
    .luxe-body .entry-subtitle { color: #888; }
    .luxe-body .entry-date { color: #666; }
    .luxe-body strong { color: #e8e8e8; }

    .luxe-body .cv-list li { color: #ccc; }
    .luxe-body ul.cv-list { list-style: none; }
    .luxe-body ul.cv-list li::before {
      content: "◆";
      position: absolute;
      left: 0;
      color: #c9a84c;
      font-size: 5pt;
      top: 4pt;
    }
    .luxe-body ul.cv-list li { padding-left: 14pt; }

    .luxe-body a.cv-link { color: #c9a84c; border-bottom-color: #333; }

    .luxe-body .profile-content p {
      color: #aaa;
      font-style: italic;
      line-height: 1.8;
      text-align: center;
      max-width: 85%;
      margin: 0 auto;
    }

    .luxe-body .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6pt;
      list-style: none;
      margin: 0;
      justify-content: center;
    }
    .luxe-body .skills-content .cv-list li {
      display: inline-block;
      background: rgba(201,168,76,0.08);
      color: #c9a84c;
      border: 0.5pt solid rgba(201,168,76,0.3);
      border-radius: 0;
      padding: 3pt 12pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 400;
      position: static;
      letter-spacing: 0.5pt;
      text-transform: uppercase;
    }
    .luxe-body .skills-content .cv-list li::before { display: none; }

    .luxe-body .rating-dot { background: #2a2a2a; }
    .luxe-body .rating-dot.filled { background: #c9a84c; }

    .luxe-body .skill-badge {
      background: rgba(201,168,76,0.08);
      color: #c9a84c;
      border-color: rgba(201,168,76,0.3);
    }
  `;
}

export function renderLuxeLayout(
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

  const header = `<div class="luxe-header">
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

  return `${header}<div class="luxe-body">${sectionsHtml}</div>`;
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
