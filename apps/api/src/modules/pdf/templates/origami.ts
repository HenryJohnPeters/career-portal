// origami.ts — Paper-fold inspired with layered angular sections

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
} from "./shared";

export function getOrigamiCSS(theme: ResolvedTheme): string {
  return `
    .page {
      padding: 0;
      background: #fff;
      min-height: 297mm;
    }

    .origami-header {
      position: relative;
      padding: 36pt var(--cv-pad) 40pt var(--cv-pad);
      background: var(--cv-primary);
      clip-path: polygon(0 0, 100% 0, 100% calc(100% - 24pt), 50% 100%, 0 calc(100% - 24pt));
      text-align: center;
    }
    .origami-header .photo {
      width: 66pt;
      height: 66pt;
      border-radius: 50%;
      object-fit: cover;
      border: 3pt solid rgba(255,255,255,0.4);
      margin: 0 auto 10pt auto;
      display: block;
    }
    .origami-header h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) + 2pt);
      font-weight: 800;
      color: #fff;
      line-height: 1.1;
      margin-bottom: 4pt;
      letter-spacing: -0.5pt;
    }
    .origami-header .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: rgba(255,255,255,0.8);
      margin-bottom: 14pt;
    }
    .origami-header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14pt;
      justify-content: center;
    }
    .origami-header .contact-item { color: rgba(255,255,255,0.85); font-size: calc(var(--cv-fs-body) - 0.5pt); }
    .origami-header .contact-item-icon { color: #fff; }

    .origami-body {
      padding: 8pt var(--cv-pad) var(--cv-pad) var(--cv-pad);
    }

    .origami-body .section {
      margin-bottom: 16pt;
      position: relative;
      padding: 18pt 22pt 18pt 22pt;
      background: #fff;
      border: 1pt solid #eee;
      clip-path: polygon(0 0, calc(100% - 14pt) 0, 100% 14pt, 100% 100%, 14pt 100%, 0 calc(100% - 14pt));
      box-shadow: 0 1pt 4pt rgba(0,0,0,0.03);
    }
    .origami-body .section::before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 14pt 14pt 0;
      border-color: transparent var(--cv-primary-light) transparent transparent;
    }
    .origami-body .section::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 14pt 0 0 14pt;
      border-color: transparent transparent transparent var(--cv-primary-light);
    }

    .origami-body .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      color: var(--cv-primary);
      margin-bottom: 10pt;
      padding-bottom: 6pt;
      border-bottom: 1pt solid var(--cv-primary-light);
      border-left: none;
      padding-left: 0;
      text-transform: uppercase;
      letter-spacing: 1.5pt;
    }

    .origami-body .entry-title {
      font-family: var(--cv-font-heading);
      font-weight: 700;
    }

    .origami-body .profile-content p {
      font-size: calc(var(--cv-fs-body) + 0.5pt);
      color: var(--cv-text-secondary);
      line-height: 1.7;
    }

    .origami-body .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6pt;
      list-style: none;
      margin: 0;
    }
    .origami-body .skills-content .cv-list li {
      display: inline-block;
      background: var(--cv-primary-light);
      color: var(--cv-primary-dark);
      border: none;
      padding: 4pt 12pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 600;
      position: static;
      clip-path: polygon(6pt 0, 100% 0, calc(100% - 6pt) 100%, 0 100%);
      padding-left: 14pt;
      padding-right: 14pt;
    }
    .origami-body .skills-content .cv-list li::before { display: none; }
  `;
}

export function renderOrigamiLayout(
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

  const header = `<div class="origami-header">
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

  return `${header}<div class="origami-body">${sectionsHtml}</div>`;
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
