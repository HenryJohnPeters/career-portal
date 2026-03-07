// terminal.ts — Dark hacker terminal with green-on-black aesthetic

import {
  CvData,
  CvSection,
  ContactItem,
  escapeHtml,
  renderContactItem,
  renderSectionContent,
} from "./shared";

export function getTerminalCSS(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap');

    .page {
      padding: 0;
      background: #0d1117;
      color: #c9d1d9;
    }

    .terminal-bar {
      background: #161b22;
      padding: 8pt 14pt;
      display: flex;
      align-items: center;
      gap: 6pt;
      border-bottom: 1pt solid #30363d;
    }
    .terminal-dot { width: 8pt; height: 8pt; border-radius: 50%; }
    .terminal-dot.red { background: #ff5f56; }
    .terminal-dot.yellow { background: #ffbd2e; }
    .terminal-dot.green { background: #27c93f; }
    .terminal-bar-title {
      margin-left: 8pt;
      font-family: 'Fira Code', monospace;
      font-size: 8pt;
      color: #8b949e;
    }

    .terminal-body {
      padding: 22pt var(--cv-pad) var(--cv-pad) var(--cv-pad);
      font-family: 'Fira Code', monospace;
    }

    .terminal-body .header {
      margin-bottom: var(--cv-sec-gap);
      border-bottom: 1pt solid #30363d;
      padding-bottom: 14pt;
    }
    .terminal-body .header h1 {
      font-family: 'Fira Code', monospace;
      font-size: calc(var(--cv-fs-h1) - 6pt);
      font-weight: 700;
      color: #58a6ff;
      line-height: 1.2;
      margin-bottom: 6pt;
    }
    .terminal-body .header h1::before { content: "$ whoami\\A> "; white-space: pre; color: #3fb950; font-weight: 400; font-size: calc(var(--cv-fs-body) - 0.5pt); }
    .terminal-body .header .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12pt;
      margin-top: 6pt;
    }
    .terminal-body .header .contact-item { color: #8b949e; font-family: 'Fira Code', monospace; font-size: calc(var(--cv-fs-body) - 1.5pt); }
    .terminal-body .header .contact-item-icon { color: #3fb950; }
    .terminal-body .header a.contact-item:hover { color: #58a6ff; }

    .terminal-body .section { margin-bottom: var(--cv-sec-gap); }
    .terminal-body .section h2 {
      font-family: 'Fira Code', monospace;
      font-size: var(--cv-fs-h2);
      font-weight: 600;
      color: #3fb950;
      margin-bottom: 8pt;
      border: none;
      padding: 0;
      text-transform: none;
      letter-spacing: 0;
    }
    .terminal-body .section h2::before { content: "# "; color: #8b949e; }

    .terminal-body .entry-title { font-family: 'Fira Code', monospace; color: #58a6ff; }
    .terminal-body .entry-subtitle { color: #8b949e; }
    .terminal-body .entry-date { color: #6e7681; }
    .terminal-body strong { color: #c9d1d9; }

    .terminal-body .cv-list li { color: #c9d1d9; }
    .terminal-body .cv-list li::marker { color: #3fb950; }
    .terminal-body ul.cv-list { list-style: none; }
    .terminal-body ul.cv-list li::before { content: "→ "; color: #3fb950; position: absolute; left: 0; }
    .terminal-body ul.cv-list li { padding-left: 14pt; }

    .terminal-body a.cv-link { color: #58a6ff; border-bottom-color: #30363d; }

    .terminal-body .profile-content p { color: #8b949e; font-style: normal; }

    /* Terminal skills */
    .terminal-body .skills-content .cv-list {
      display: flex; flex-wrap: wrap; gap: 4pt; list-style: none; margin: 0;
    }
    .terminal-body .skills-content .cv-list li {
      background: #161b22;
      color: #3fb950;
      border: 0.5pt solid #30363d;
      font-family: 'Fira Code', monospace;
      font-size: calc(var(--cv-fs-body) - 1.5pt);
      padding: 2pt 8pt;
      border-radius: 3pt;
      position: static;
    }
    .terminal-body .skills-content .cv-list li::before { display: none; }

    .terminal-body .skill-badge {
      font-family: 'Fira Code', monospace;
      background: #161b22;
      color: #3fb950;
      border: 0.5pt solid #30363d;
    }

    .terminal-body .rating-dot { background: #30363d; }
    .terminal-body .rating-dot.filled { background: #3fb950; }
  `;
}

export function renderTerminalBody(
  data: CvData,
  contacts: ContactItem[],
  sections: CvSection[],
  templateId: string
): string {
  const contactHtml = contacts.length
    ? `<div class="contact-row">${contacts.map((c) => renderContactItem(c)).join("")}</div>`
    : "";
  const header = `<div class="header">
    <h1>${escapeHtml(data.userName || data.title)}</h1>
    ${contactHtml}
  </div>`;
  const sectionsHtml = sections
    .map((s) => `<div class="section"><h2>${escapeHtml(s.title)}</h2>${renderSectionContent(s, templateId)}</div>`)
    .join("\n");

  const title = escapeHtml(data.userName || data.title);
  return `<div class="terminal-bar">
      <span class="terminal-dot red"></span>
      <span class="terminal-dot yellow"></span>
      <span class="terminal-dot green"></span>
      <span class="terminal-bar-title">${title} — cv.pdf</span>
    </div>
    <div class="terminal-body">${header}${sectionsHtml}</div>`;
}
