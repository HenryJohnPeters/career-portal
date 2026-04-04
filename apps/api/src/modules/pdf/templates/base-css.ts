// base-css.ts — Base CSS shared by all CV templates

import { ResolvedTheme, fontImportUrl } from "./shared";

// ─── Font size / spacing maps ────────────────────────────

export function getFontSizeVars(size: string): string {
  switch (size) {
    case "small":
      return "--cv-fs-body: 9pt; --cv-fs-h1: 24pt; --cv-fs-h2: 10pt; --cv-fs-sub: 9.5pt; --cv-lh: 1.45;";
    case "large":
      return "--cv-fs-body: 11.5pt; --cv-fs-h1: 32pt; --cv-fs-h2: 12.5pt; --cv-fs-sub: 11pt; --cv-lh: 1.7;";
    default:
      return "--cv-fs-body: 10.5pt; --cv-fs-h1: 28pt; --cv-fs-h2: 11pt; --cv-fs-sub: 10pt; --cv-lh: 1.6;";
  }
}

export function getSpacingVars(spacing: string): string {
  switch (spacing) {
    case "compact":
      return "--cv-pad: 28pt; --cv-sec-gap: 12pt; --cv-entry-gap: 6pt;";
    case "spacious":
      return "--cv-pad: 48pt; --cv-sec-gap: 24pt; --cv-entry-gap: 12pt;";
    default:
      return "--cv-pad: 38pt; --cv-sec-gap: 18pt; --cv-entry-gap: 8pt;";
  }
}

export function getBulletStyle(style: string): string {
  switch (style) {
    case "dash":
      return `
        ul.cv-list { list-style: none; }
        ul.cv-list li::before { content: "–"; position: absolute; left: 0; color: var(--cv-primary); }
      `;
    case "arrow":
      return `
        ul.cv-list { list-style: none; }
        ul.cv-list li::before { content: "›"; position: absolute; left: 0; color: var(--cv-primary); font-weight: 700; }
      `;
    case "chevron":
      return `
        ul.cv-list { list-style: none; }
        ul.cv-list li::before { content: "»"; position: absolute; left: 0; color: var(--cv-primary); }
      `;
    case "none":
      return `ul.cv-list { list-style: none; }`;
    default:
      return "";
  }
}

export function getDividerStyle(style: string): string {
  switch (style) {
    case "dots":
      return "border-top: none; background: repeating-linear-gradient(90deg, var(--cv-primary) 0 3px, transparent 3px 8px); height: 1px;";
    case "double":
      return "border-top: 2px double var(--cv-muted-border); height: 0;";
    case "gradient":
      return "border: none; height: 1px; background: linear-gradient(90deg, var(--cv-primary), transparent);";
    case "none":
      return "display: none;";
    default:
      return "";
  }
}

export function getAccentStyleCSS(style: string): string {
  switch (style) {
    case "left-border":
      return `
        .section h2 {
          padding-left: 10pt;
          border-left: 3.5pt solid var(--cv-primary);
          border-bottom: none;
        }
      `;
    case "underline":
      return `
        .section h2 {
          padding-left: 0;
          border-left: none;
          padding-bottom: 4pt;
          border-bottom: 2pt solid var(--cv-primary);
        }
      `;
    case "background":
      return `
        .section h2 {
          padding: 4pt 10pt;
          border-left: none;
          border-bottom: none;
          background: var(--cv-primary-light);
          border-radius: 3pt;
          display: inline-block;
          margin-bottom: 10pt;
        }
      `;
    case "none":
      return `
        .section h2 {
          padding-left: 0;
          border-left: none;
          border-bottom: none;
        }
      `;
    default:
      return "";
  }
}

// ─── Header Layout CSS ───────────────────────────────────

export function getHeaderLayoutCSS(layout: string): string {
  switch (layout) {
    case "centered":
      return `
        .header { text-align: center; }
        .header h1 { text-align: center; }
        .header .contact-row { justify-content: center; }
        .header .photo { margin: 0 auto 8pt auto; display: block; }
      `;
    case "inline":
      return `
        .header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8pt;
        }
        .header h1 { margin-bottom: 0; flex-shrink: 0; }
        .header .contact-row { margin-top: 0; gap: 10pt; }
      `;
    case "banner":
      return `
        .header {
          background: var(--cv-primary);
          color: #fff;
          padding: 28pt var(--cv-pad) 20pt var(--cv-pad);
          margin: 0 calc(-1 * var(--cv-pad)) var(--cv-sec-gap) calc(-1 * var(--cv-pad));
          border-bottom: none;
        }
        .header h1 { color: #fff; }
        .header .contact-row { border-top: 1px solid rgba(255,255,255,0.25); padding-top: 8pt; margin-top: 8pt; }
        .header .contact-item { color: rgba(255,255,255,0.9); }
        .header .contact-item-icon { color: #fff; }
        .header a.contact-item:hover { color: #fff; }
      `;
    default: // split
      return `
        .header { text-align: left; }
      `;
  }
}

// ─── Base CSS (shared by all templates) ──────────────────

export function getBaseCSS(theme: ResolvedTheme): string {
  return `
    @import url('${fontImportUrl(theme.fontHeading, theme.fontBody)}');

    :root {
      --cv-primary: ${theme.primaryColor};
      --cv-primary-light: ${theme.primaryLight};
      --cv-primary-dark: ${theme.primaryDark};
      --cv-font-heading: '${theme.fontHeading}', serif;
      --cv-font-body: '${theme.fontBody}', sans-serif;
      --cv-text: #1a1a1a;
      --cv-text-secondary: #4b5563;
      --cv-text-muted: #6b7280;
      --cv-muted-border: #e5e7eb;
      ${getFontSizeVars(theme.fontSize)}
      ${getSpacingVars(theme.spacing)}
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page { size: A4; margin: 0; }

    body {
      font-family: var(--cv-font-body);
      font-size: var(--cv-fs-body);
      line-height: var(--cv-lh);
      color: var(--cv-text);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background: #fff;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      position: relative;
      overflow: hidden;
    }

    /* Entry headings */
    .entry-heading {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin: var(--cv-entry-gap) 0 3pt 0;
      flex-wrap: wrap;
      gap: 4pt;
    }
    .entry-left { display: flex; align-items: baseline; gap: 6pt; flex-wrap: wrap; }
    .entry-title { font-weight: 700; color: var(--cv-text); font-size: var(--cv-fs-sub); }
    .entry-subtitle { font-weight: 400; color: var(--cv-text-secondary); }
    .entry-date { font-size: calc(var(--cv-fs-body) - 0.5pt); color: var(--cv-text-muted); white-space: nowrap; font-style: italic; }

    /* Links */
    a.cv-link { color: var(--cv-primary); text-decoration: none; border-bottom: 0.5pt solid var(--cv-primary-light); }
    a.cv-link:hover { border-bottom-color: var(--cv-primary); }

    /* Lists */
    .cv-list {
      margin: 3pt 0 6pt 16pt;
      padding: 0;
    }
    .cv-list li {
      margin-bottom: 2pt;
      line-height: 1.5;
      position: relative;
    }
    ul.cv-list { list-style: disc; }
    ol.cv-list { list-style: decimal; }
    ${getBulletStyle(theme.bulletStyle)}
    ul.cv-list li { padding-left: ${
      theme.bulletStyle !== "disc" && theme.bulletStyle !== "none"
        ? "12pt"
        : "0"
    }; }

    /* Subsection headings */
    .subsection-heading {
      font-family: var(--cv-font-body);
      font-size: var(--cv-fs-sub);
      font-weight: 700;
      color: var(--cv-text);
      margin: var(--cv-entry-gap) 0 3pt 0;
      letter-spacing: 0;
      text-transform: none;
      border-bottom: none;
      padding-bottom: 0;
    }

    /* Profile */
    .profile-content p {
      font-size: calc(var(--cv-fs-body) + 0.5pt);
      font-style: italic;
      color: var(--cv-text-secondary);
      line-height: 1.7;
    }

    /* Skill badges */
    .skill-badge {
      display: inline-block;
      padding: 2pt 8pt;
      margin: 2pt 3pt 2pt 0;
      border-radius: 3pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 500;
      background: var(--cv-primary-light);
      color: var(--cv-primary-dark);
      border: 0.5pt solid rgba(0,0,0,0.06);
    }

    /* Rating dots */
    .rating-dots { display: inline-flex; gap: 3pt; vertical-align: middle; margin-left: 4pt; }
    .rating-dot {
      width: 8pt; height: 8pt; border-radius: 50%;
      background: var(--cv-muted-border);
      display: inline-block;
    }
    .rating-dot.filled { background: var(--cv-primary); }

    /* Section body basics */
    .section-body p, .profile-content p, .projects-content p, .certifications-content p { margin-bottom: 4pt; }
    .section-body p:last-child, .profile-content p:last-child { margin-bottom: 0; }
    .empty { color: #9ca3af; font-style: italic; }
    strong { font-weight: 700; color: var(--cv-text); }
    em { font-style: italic; }

    /* Divider */
    .cv-divider {
      border: none;
      border-top: 0.5pt solid var(--cv-muted-border);
      margin: 8pt 0;
      ${getDividerStyle(theme.dividerStyle)}
    }

    /* Contact items */
    .contact-item {
      display: inline-flex;
      align-items: center;
      gap: 4pt;
      color: var(--cv-text-muted);
      text-decoration: none;
      font-size: calc(var(--cv-fs-body) - 1pt);
    }
    a.contact-item:hover { color: var(--cv-primary); }
    .contact-item-icon { display: inline-flex; align-items: center; color: var(--cv-primary); }
    .contact-item-icon svg { width: 12pt; height: 12pt; }
    .contact-item-text { white-space: nowrap; }

    /* Section break control */
    .section { break-inside: avoid; }
    h2 { break-after: avoid; }

    /* Skills content helpers */
    .skills-content .cv-list { list-style: none; margin-left: 0; display: flex; flex-wrap: wrap; gap: 4pt; }
    .skills-content .cv-list li {
      display: inline-block;
      padding: 2pt 8pt;
      border-radius: 3pt;
      font-size: calc(var(--cv-fs-body) - 1pt);
      font-weight: 500;
      background: var(--cv-primary-light);
      color: var(--cv-primary-dark);
      border: 0.5pt solid rgba(0,0,0,0.05);
      margin-bottom: 0;
      position: static;
    }
    .skills-content .cv-list li::before { display: none; }

    /* Languages dots */
    .languages-content .entry-heading { align-items: center; }

    /* Accent style (applied to section headings — templates can override) */
    ${getAccentStyleCSS(theme.accentStyle)}
  `;
}
