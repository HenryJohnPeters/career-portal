// gradient.ts — Modern gradient accents with floating card sections

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
} from "./shared";

export function getGradientCSS(theme: ResolvedTheme): string {
  return `
    .page { 
      padding: 0; 
      background: linear-gradient(135deg, ${theme.primaryLight} 0%, #ffffff 50%, ${theme.primaryLight} 100%);
      min-height: 297mm;
    }

    .gradient-container {
      padding: 28pt var(--cv-pad) var(--cv-pad) var(--cv-pad);
    }

    .header-gradient {
      margin-bottom: 22pt;
      text-align: center;
      padding: 24pt 28pt;
      background: linear-gradient(135deg, var(--cv-primary) 0%, var(--cv-primary-dark) 100%);
      border-radius: 12pt;
      box-shadow: 0 4pt 12pt rgba(0,0,0,0.08);
      position: relative;
      overflow: hidden;
    }
    .header-gradient::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 100%);
      pointer-events: none;
    }
    .header-gradient .photo {
      width: 70pt;
      height: 70pt;
      border-radius: 50%;
      object-fit: cover;
      border: 3pt solid rgba(255,255,255,0.4);
      margin: 0 auto 10pt auto;
      display: block;
      box-shadow: 0 2pt 8pt rgba(0,0,0,0.15);
    }
    .header-gradient h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) + 2pt);
      font-weight: 800;
      color: #fff;
      line-height: 1.1;
      margin-bottom: 6pt;
      position: relative;
      letter-spacing: -0.5pt;
    }
    .header-gradient .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: rgba(255,255,255,0.85);
      margin-bottom: 14pt;
      position: relative;
    }
    .header-gradient .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14pt;
      justify-content: center;
      padding-top: 12pt;
      border-top: 1px solid rgba(255,255,255,0.2);
      position: relative;
    }
    .header-gradient .contact-item { 
      color: rgba(255,255,255,0.9); 
      font-size: calc(var(--cv-fs-body) - 0.5pt);
    }
    .header-gradient .contact-item-icon { color: #fff; }
    .header-gradient a.contact-item:hover { color: #fff; }

    .gradient-body .section {
      margin-bottom: 18pt;
      background: #fff;
      border-radius: 10pt;
      padding: 18pt 20pt;
      box-shadow: 0 2pt 8pt rgba(0,0,0,0.04);
      border: 1pt solid rgba(0,0,0,0.04);
      position: relative;
    }
    .gradient-body .section::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 4pt;
      height: 100%;
      background: linear-gradient(180deg, var(--cv-primary) 0%, var(--cv-primary-dark) 100%);
      border-radius: 10pt 0 0 10pt;
    }
    .gradient-body .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      color: var(--cv-primary);
      margin-bottom: 10pt;
      padding-left: 12pt;
      border: none;
      text-transform: uppercase;
      letter-spacing: 0.8pt;
      position: relative;
    }
    .gradient-body .section h2::after {
      content: "";
      display: block;
      width: 40pt;
      height: 2pt;
      background: linear-gradient(90deg, var(--cv-primary) 0%, transparent 100%);
      margin-top: 4pt;
    }

    /* Gradient skills — colorful pills */
    .gradient-body .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6pt;
      list-style: none;
      margin: 0;
      padding-left: 12pt;
    }
    .gradient-body .skills-content .cv-list li {
      display: inline-block;
      background: linear-gradient(135deg, var(--cv-primary-light) 0%, rgba(255,255,255,0.5) 100%);
      color: var(--cv-primary-dark);
      border: 1pt solid var(--cv-primary);
      border-radius: 20pt;
      padding: 3pt 12pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 500;
      position: static;
      box-shadow: 0 1pt 3pt rgba(0,0,0,0.05);
    }
    .gradient-body .skills-content .cv-list li::before { display: none; }

    /* Gradient entry headings */
    .gradient-body .entry-heading {
      padding-left: 12pt;
    }
    .gradient-body .section-body,
    .gradient-body .profile-content,
    .gradient-body .languages-content,
    .gradient-body .projects-content,
    .gradient-body .certifications-content {
      padding-left: 12pt;
    }
    .gradient-body .cv-list {
      padding-left: 12pt;
    }

    .gradient-body .profile-content p {
      font-size: calc(var(--cv-fs-body) + 0.5pt);
      color: var(--cv-text-secondary);
      line-height: 1.7;
    }
  `;
}

export function renderGradientLayout(
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

  const header = `<div class="header-gradient">
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

  return `<div class="gradient-container">${header}<div class="gradient-body">${sectionsHtml}</div></div>`;
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
