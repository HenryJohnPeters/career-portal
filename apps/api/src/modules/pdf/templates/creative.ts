// creative.ts — Gradient sidebar + timeline template

import {
  ResolvedTheme,
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderContactItem,
  renderSectionContent,
} from "./shared";

export function getCreativeCSS(theme: ResolvedTheme): string {
  return `
    .page { padding: 0; display: grid; grid-template-columns: 35% 65%; min-height: 297mm; }

    .creative-sidebar {
      background: linear-gradient(170deg, var(--cv-primary) 0%, var(--cv-primary-dark) 100%);
      color: #fff;
      padding: 36pt 20pt 28pt 20pt;
      display: flex;
      flex-direction: column;
      gap: 18pt;
    }
    .creative-sidebar h1 {
      font-family: var(--cv-font-heading);
      font-size: 22pt;
      font-weight: 800;
      color: #fff;
      line-height: 1.15;
      margin-bottom: 2pt;
    }
    .creative-sidebar .subtitle {
      font-size: calc(var(--cv-fs-body) - 0.5pt);
      color: rgba(255,255,255,0.8);
      font-style: italic;
    }
    .creative-sidebar .photo {
      width: 80pt; height: 80pt; border-radius: 50%;
      object-fit: cover; border: 3pt solid rgba(255,255,255,0.4);
      margin: 0 auto 4pt auto; display: block;
    }
    .creative-sidebar .section { margin-bottom: 4pt; }
    .creative-sidebar .section h2 {
      font-size: calc(var(--cv-fs-h2) - 1pt);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2pt;
      color: rgba(255,255,255,0.7);
      margin-bottom: 6pt;
      padding-bottom: 4pt;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    }
    .creative-sidebar .contact-list {
      display: flex; flex-direction: column; gap: 7pt;
    }
    .creative-sidebar .contact-item { color: rgba(255,255,255,0.9); font-size: calc(var(--cv-fs-body) - 1pt); }
    .creative-sidebar .contact-item-icon { color: #fff; }
    .creative-sidebar a.contact-item:hover { color: #fff; }

    /* Sidebar skills overrides */
    .creative-sidebar .skills-content .cv-list {
      display: flex; flex-wrap: wrap; gap: 4pt; list-style: none; margin: 0;
    }
    .creative-sidebar .skills-content .cv-list li {
      background: rgba(255,255,255,0.15);
      color: #fff;
      border: 0.5pt solid rgba(255,255,255,0.25);
      font-size: calc(var(--cv-fs-body) - 1.5pt);
      padding: 2pt 7pt;
      border-radius: 3pt;
    }

    /* Sidebar languages — proficiency dots in white */
    .creative-sidebar .rating-dot { background: rgba(255,255,255,0.25); }
    .creative-sidebar .rating-dot.filled { background: #fff; }
    .creative-sidebar .languages-content { color: rgba(255,255,255,0.9); }
    .creative-sidebar .cv-list { color: rgba(255,255,255,0.9); }
    .creative-sidebar .cv-list li { color: rgba(255,255,255,0.9); }
    .creative-sidebar strong { color: #fff; }

    .creative-main {
      padding: 28pt 28pt var(--cv-pad) 24pt;
    }
    .creative-main .section { margin-bottom: var(--cv-sec-gap); }
    .creative-main .section h2 {
      font-family: var(--cv-font-heading);
      font-size: calc(var(--cv-fs-h2) - 0.5pt);
      font-weight: 700;
      color: #fff;
      background: var(--cv-primary);
      display: inline-block;
      padding: 3pt 12pt;
      border-radius: 3pt;
      margin-bottom: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.8pt;
    }

    /* Timeline for experience */
    .creative-main .section-body .entry-heading {
      padding-left: 16pt;
      border-left: 2px solid var(--cv-primary-light);
      position: relative;
    }
    .creative-main .section-body .entry-heading::before {
      content: "";
      width: 8pt; height: 8pt;
      background: var(--cv-primary);
      border-radius: 50%;
      position: absolute;
      left: -5pt;
      top: 4pt;
    }
    .creative-main .section-body .cv-list {
      padding-left: 16pt;
      border-left: 2px solid var(--cv-primary-light);
      margin-left: 0;
    }
    .creative-main .section-body p {
      padding-left: 16pt;
      border-left: 2px solid var(--cv-primary-light);
    }
  `;
}

export function renderCreativeLayout(
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
    ? `<div class="section"><h2>Contact</h2><div class="contact-list">${contacts
        .map((c) => renderContactItem(c))
        .join("")}</div></div>`
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

  return `<div class="creative-sidebar">
      ${photoHtml}
      <div><h1>${escapeHtml(
        data.userName || data.title
      )}</h1><div class="subtitle">${escapeHtml(data.title)}</div></div>
      ${contactHtml}${sideHtml}
    </div>
    <div class="creative-main">${mainHtml}</div>`;
}
