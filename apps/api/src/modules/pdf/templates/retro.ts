// retro.ts — Vintage 70s-inspired warm tones with rounded elements

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
} from "./shared";

export function getRetroCSS(theme: ResolvedTheme): string {
  return `
    .page {
      padding: 0;
      background: #faf6f0;
      min-height: 297mm;
    }

    .retro-header {
      background: var(--cv-primary);
      padding: 32pt var(--cv-pad) 28pt var(--cv-pad);
      border-bottom: 6pt solid var(--cv-primary-dark);
      border-radius: 0 0 24pt 24pt;
      text-align: center;
      position: relative;
    }
    .retro-header::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2pt,
        rgba(255,255,255,0.03) 2pt,
        rgba(255,255,255,0.03) 4pt
      );
      border-radius: 0 0 24pt 24pt;
      pointer-events: none;
    }
    .retro-header .photo {
      width: 72pt;
      height: 72pt;
      border-radius: 50%;
      object-fit: cover;
      border: 4pt solid rgba(255,255,255,0.3);
      margin: 0 auto 10pt auto;
      display: block;
    }
    .retro-header h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) + 2pt);
      font-weight: 800;
      color: #fff;
      line-height: 1.1;
      margin-bottom: 6pt;
      letter-spacing: -0.5pt;
      position: relative;
    }
    .retro-header .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: rgba(255,255,255,0.8);
      margin-bottom: 14pt;
      font-style: italic;
      position: relative;
    }
    .retro-header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14pt;
      justify-content: center;
      position: relative;
    }
    .retro-header .contact-item { color: rgba(255,255,255,0.85); font-size: calc(var(--cv-fs-body) - 0.5pt); }
    .retro-header .contact-item-icon { color: #fff; }

    .retro-body {
      padding: 24pt var(--cv-pad) var(--cv-pad) var(--cv-pad);
    }

    .retro-body .section {
      margin-bottom: 18pt;
      background: #fff;
      border-radius: 12pt;
      padding: 18pt 22pt;
      border: 1.5pt solid #ede8df;
      position: relative;
    }
    .retro-body .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      color: var(--cv-primary);
      margin-bottom: 10pt;
      padding-bottom: 6pt;
      border-bottom: 2pt dashed var(--cv-primary-light);
      border-left: none;
      padding-left: 0;
      text-transform: uppercase;
      letter-spacing: 1.5pt;
    }

    .retro-body .entry-title {
      font-family: var(--cv-font-heading);
      font-weight: 700;
      color: var(--cv-primary-dark);
    }

    .retro-body .profile-content p {
      font-size: calc(var(--cv-fs-body) + 0.5pt);
      color: var(--cv-text-secondary);
      line-height: 1.7;
      font-style: italic;
    }

    .retro-body .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6pt;
      list-style: none;
      margin: 0;
    }
    .retro-body .skills-content .cv-list li {
      display: inline-block;
      background: var(--cv-primary-light);
      color: var(--cv-primary-dark);
      border: 1.5pt solid var(--cv-primary);
      border-radius: 20pt;
      padding: 3pt 14pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 600;
      position: static;
    }
    .retro-body .skills-content .cv-list li::before { display: none; }

    .retro-body .cv-list {
      list-style: none;
    }
    .retro-body .cv-list li {
      position: relative;
      padding-left: 16pt;
    }
    .retro-body .cv-list li::before {
      content: "✦";
      position: absolute;
      left: 0;
      color: var(--cv-primary);
      font-size: 8pt;
      top: 2pt;
    }
  `;
}

export function renderRetroLayout(
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

  const header = `<div class="retro-header">
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

  return `${header}<div class="retro-body">${sectionsHtml}</div>`;
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
