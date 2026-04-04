// newspaper.ts — Editorial broadsheet-style with multi-column body

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
} from "./shared";

export function getNewspaperCSS(theme: ResolvedTheme): string {
  return `
    .page {
      padding: 0;
      background: #fffef9;
      min-height: 297mm;
    }

    .newspaper-masthead {
      padding: 24pt var(--cv-pad) 18pt var(--cv-pad);
      text-align: center;
      border-bottom: 3pt double #1a1a1a;
      position: relative;
    }
    .newspaper-masthead::before {
      content: "";
      display: block;
      width: 100%;
      height: 0.5pt;
      background: #1a1a1a;
      margin-bottom: 14pt;
    }
    .newspaper-masthead .photo {
      width: 56pt;
      height: 56pt;
      border-radius: 50%;
      object-fit: cover;
      border: 1pt solid #1a1a1a;
      margin: 0 auto 10pt auto;
      display: block;
    }
    .newspaper-masthead h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) + 6pt);
      font-weight: 900;
      color: #1a1a1a;
      line-height: 1.0;
      margin-bottom: 2pt;
      letter-spacing: -1pt;
      font-style: italic;
    }
    .newspaper-masthead .header-subtitle {
      font-size: var(--cv-fs-sub);
      color: #666;
      font-style: italic;
      margin-bottom: 10pt;
      letter-spacing: 1pt;
    }
    .newspaper-masthead .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12pt;
      justify-content: center;
      padding-top: 8pt;
      border-top: 0.5pt solid #ccc;
    }
    .newspaper-masthead .contact-item {
      color: #666;
      font-size: calc(var(--cv-fs-body) - 1pt);
    }
    .newspaper-masthead .contact-item-icon { color: #1a1a1a; }

    .newspaper-edition {
      text-align: center;
      padding: 4pt 0;
      border-bottom: 0.5pt solid #ddd;
      font-size: 7pt;
      color: #999;
      letter-spacing: 2pt;
      text-transform: uppercase;
      font-family: var(--cv-font-body);
    }

    .newspaper-body {
      padding: 18pt var(--cv-pad) var(--cv-pad) var(--cv-pad);
      column-count: 2;
      column-gap: 22pt;
      column-rule: 0.5pt solid #e0e0e0;
    }

    .newspaper-body .section {
      margin-bottom: 16pt;
      break-inside: avoid;
    }
    .newspaper-body .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 800;
      color: #1a1a1a;
      margin-bottom: 8pt;
      padding-bottom: 4pt;
      border-bottom: 1pt solid #1a1a1a;
      border-left: none;
      padding-left: 0;
      text-transform: uppercase;
      letter-spacing: 1.5pt;
    }

    .newspaper-body .entry-title {
      font-family: var(--cv-font-heading);
      font-weight: 700;
      font-style: italic;
    }

    .newspaper-body .profile-content p {
      font-size: calc(var(--cv-fs-body) + 0.5pt);
      color: #333;
      line-height: 1.7;
      text-align: justify;
      text-indent: 16pt;
    }
    .newspaper-body .profile-content p:first-child::first-letter {
      font-family: var(--cv-font-heading);
      font-size: 28pt;
      font-weight: 900;
      float: left;
      margin-right: 4pt;
      margin-top: 2pt;
      line-height: 0.8;
      color: var(--cv-primary);
    }

    .newspaper-body .section-body p,
    .newspaper-body .projects-content p,
    .newspaper-body .certifications-content p {
      text-align: justify;
    }

    .newspaper-body .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4pt;
      list-style: none;
      margin: 0;
    }
    .newspaper-body .skills-content .cv-list li {
      display: inline-block;
      background: #1a1a1a;
      color: #fff;
      border-radius: 0;
      padding: 2pt 8pt;
      font-size: calc(var(--cv-fs-body) - 1.5pt);
      font-weight: 600;
      position: static;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    .newspaper-body .skills-content .cv-list li::before { display: none; }

    .newspaper-body .cv-list {
      text-align: justify;
    }
  `;
}

export function renderNewspaperLayout(
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

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const header = `<div class="newspaper-masthead">
    ${photoHtml}
    <h1>${escapeHtml(data.userName || data.title)}</h1>
    <div class="header-subtitle">${escapeHtml(data.title)}</div>
    ${contactHtml}
  </div>
  <div class="newspaper-edition">${escapeHtml(
    dateStr
  )} · Curriculum Vitae · Professional Edition</div>`;

  const sectionsHtml = sections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");

  return `${header}<div class="newspaper-body">${sectionsHtml}</div>`;
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
