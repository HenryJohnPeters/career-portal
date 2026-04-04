// frontier.ts — Bold split-screen sidebar with right-aligned content blocks

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderSectionContent,
} from "./shared";

export function getFrontierCSS(theme: ResolvedTheme): string {
  return `
    .page {
      padding: 0;
      display: grid;
      grid-template-columns: 35% 65%;
      grid-template-rows: 1fr;
      min-height: 297mm;
    }

    .frontier-sidebar {
      background: var(--cv-primary);
      padding: 32pt 22pt var(--cv-pad) 22pt;
      color: #fff;
      position: relative;
    }
    .frontier-sidebar::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      width: 4pt;
      height: 100%;
      background: var(--cv-primary-dark);
    }
    .frontier-sidebar .photo {
      width: 90pt;
      height: 90pt;
      border-radius: 50%;
      object-fit: cover;
      border: 3pt solid rgba(255,255,255,0.25);
      margin: 0 auto 14pt auto;
      display: block;
    }
    .frontier-sidebar h1 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h1) - 4pt);
      font-weight: 800;
      color: #fff;
      text-align: center;
      line-height: 1.15;
      margin-bottom: 4pt;
      text-transform: uppercase;
      letter-spacing: 1pt;
    }
    .frontier-sidebar .header-subtitle {
      font-size: calc(var(--cv-fs-sub) - 0.5pt);
      color: rgba(255,255,255,0.7);
      text-align: center;
      margin-bottom: 18pt;
      letter-spacing: 1pt;
      text-transform: uppercase;
    }

    .frontier-sidebar .contact-list {
      display: flex;
      flex-direction: column;
      gap: 8pt;
      margin-bottom: 20pt;
      padding-bottom: 16pt;
      border-bottom: 0.5pt solid rgba(255,255,255,0.15);
    }
    .frontier-sidebar .contact-item {
      color: rgba(255,255,255,0.85);
      font-size: calc(var(--cv-fs-body) - 0.5pt);
    }
    .frontier-sidebar .contact-item-icon { color: #fff; opacity: 0.6; }

    .frontier-sidebar .section {
      margin-bottom: 18pt;
    }
    .frontier-sidebar .section h2 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h2) - 0.5pt);
      font-weight: 700;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 1.5pt;
      margin-bottom: 8pt;
      padding-bottom: 4pt;
      border-bottom: 1pt solid rgba(255,255,255,0.15);
      border-left: none;
      padding-left: 0;
    }
    .frontier-sidebar .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4pt;
      list-style: none;
      margin: 0;
    }
    .frontier-sidebar .skills-content .cv-list li {
      display: inline-block;
      background: rgba(255,255,255,0.12);
      color: #fff;
      border: 0.5pt solid rgba(255,255,255,0.2);
      border-radius: 3pt;
      padding: 2pt 8pt;
      font-size: calc(var(--cv-fs-body) - 1.5pt);
      font-weight: 500;
      position: static;
    }
    .frontier-sidebar .skills-content .cv-list li::before { display: none; }

    .frontier-sidebar .cv-list li { color: rgba(255,255,255,0.85); }
    .frontier-sidebar .cv-list li::before { color: rgba(255,255,255,0.4); }
    .frontier-sidebar .entry-title { color: #fff; }
    .frontier-sidebar .entry-subtitle { color: rgba(255,255,255,0.6); }
    .frontier-sidebar .entry-date { color: rgba(255,255,255,0.5); }
    .frontier-sidebar strong { color: #fff; }
    .frontier-sidebar .rating-dot { background: rgba(255,255,255,0.2); }
    .frontier-sidebar .rating-dot.filled { background: #fff; }
    .frontier-sidebar .profile-content p,
    .frontier-sidebar .section-body p { color: rgba(255,255,255,0.75); font-style: normal; }
    .frontier-sidebar a.cv-link { color: rgba(255,255,255,0.9); border-bottom-color: rgba(255,255,255,0.3); }

    .frontier-main {
      padding: 32pt 28pt var(--cv-pad) 28pt;
      background: #fff;
    }
    .frontier-main .section {
      margin-bottom: var(--cv-sec-gap);
    }
    .frontier-main .section h2 {
      font-family: var(--cv-font-heading);
      font-size: var(--cv-fs-h2);
      font-weight: 700;
      color: var(--cv-primary);
      text-transform: uppercase;
      letter-spacing: 1.5pt;
      margin-bottom: 10pt;
      padding-bottom: 6pt;
      border-bottom: 2pt solid var(--cv-primary);
      border-left: none;
      padding-left: 0;
    }

    .frontier-main .entry-title {
      font-family: var(--cv-font-heading);
      font-weight: 700;
    }

    .frontier-main .profile-content p {
      font-size: calc(var(--cv-fs-body) + 0.5pt);
      color: var(--cv-text-secondary);
      line-height: 1.7;
    }

    .frontier-main .skills-content .cv-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6pt;
      list-style: none;
      margin: 0;
    }
    .frontier-main .skills-content .cv-list li {
      display: inline-block;
      background: var(--cv-primary-light);
      color: var(--cv-primary-dark);
      border: 1pt solid var(--cv-primary);
      border-radius: 3pt;
      padding: 3pt 10pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 600;
      position: static;
    }
    .frontier-main .skills-content .cv-list li::before { display: none; }
  `;
}

export function renderFrontierLayout(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const sidebarTypes = new Set([
    "skills",
    "languages",
    "interests",
    "certifications",
  ]);
  const sidebarSections = sections.filter((s) =>
    sidebarTypes.has(s.sectionType)
  );
  const mainSections = sections.filter((s) => !sidebarTypes.has(s.sectionType));

  const photoHtml = data.photoUrl
    ? `<img class="photo" src="${escapeHtml(data.photoUrl)}" alt="Photo" />`
    : "";

  const contactHtml = contacts.length
    ? `<div class="contact-list">${contacts
        .map((c) => renderContactItem(c))
        .join("")}</div>`
    : "";

  const sideHtml = sidebarSections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");

  const mainHtml = mainSections
    .map(
      (s) =>
        `<div class="section"><h2>${escapeHtml(
          s.title
        )}</h2>${renderSectionContent(s, templateId)}</div>`
    )
    .join("\n");

  return `<div class="frontier-sidebar">
      ${photoHtml}
      <h1>${escapeHtml(data.userName || data.title)}</h1>
      <div class="header-subtitle">${escapeHtml(data.title)}</div>
      ${contactHtml}
      ${sideHtml}
    </div>
    <div class="frontier-main">${mainHtml}</div>`;
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
