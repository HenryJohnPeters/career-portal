// shared.ts — Shared types, utilities, and icons for CV templates

import { normalizeContactUrl } from "../../cv/cv.rules";

export type { ResolvedTheme } from "./theme";

export interface CvSection {
  title: string;
  content: string;
  order: number;
  sectionType: string;
}

export interface CvData {
  title: string;
  sections: CvSection[];
  userName?: string;
  userEmail?: string;
  templateId?: string;
  /** Raw stored theme; whitelisted by resolveTheme before it reaches CSS. */
  themeConfig?: unknown;
  headerLayout?: string;
  /** Inline `data:` image URI (the renderer never loads remote images). */
  photoUrl?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface ContactItem {
  icon: string;
  text: string;
  href?: string;
}

// ─── Utility Functions ───────────────────────────────────

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape text for HTML element content and quoted attribute values. */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

const SAFE_URL_SCHEMES = new Set(["http", "https", "mailto", "tel"]);

/**
 * Allow only http(s)/mailto/tel links (or scheme-less ones). Takes and returns
 * an already-escaped attribute value; anything else becomes "#".
 */
export function sanitizeUrl(url: string): string {
  const decoded = url
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
  // Browsers ignore control characters and whitespace inside a scheme.
  const compact = decoded.replace(/[\x00-\x20\x7f]/g, "").toLowerCase();
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(compact);
  if (scheme && !SAFE_URL_SCHEMES.has(scheme[1])) return "#";
  return url;
}

// ─── Inline SVG Icons ────────────────────────────────────

export const ICONS = {
  email: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  location: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  globe: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`,
  github: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`,
};

// ─── Contact Items Builder ───────────────────────────────

export function buildContactItems(data: CvData): ContactItem[] {
  const items: ContactItem[] = [];
  if (data.userEmail) {
    items.push({
      icon: ICONS.email,
      text: data.userEmail,
      href: `mailto:${data.userEmail}`,
    });
  }
  if (data.phone) {
    items.push({
      icon: ICONS.phone,
      text: data.phone,
      href: `tel:${data.phone}`,
    });
  }
  if (data.location) {
    items.push({ icon: ICONS.location, text: data.location });
  }
  // Older rows may hold bare values such as "linkedin.com/in/jane".
  if (data.website) {
    const href = normalizeContactUrl("website", data.website);
    items.push({
      icon: ICONS.globe,
      text: href.replace(/^https?:\/\//i, ""),
      href,
    });
  }
  if (data.linkedin) {
    const href = normalizeContactUrl("linkedin", data.linkedin);
    items.push({
      icon: ICONS.linkedin,
      text: href.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, ""),
      href,
    });
  }
  if (data.github) {
    const href = normalizeContactUrl("github", data.github);
    items.push({
      icon: ICONS.github,
      text: href.replace(/^https?:\/\/(www\.)?github\.com\//i, ""),
      href,
    });
  }
  return items;
}

export function renderContactItem(
  item: ContactItem,
  cls = "contact-item"
): string {
  const inner = `<span class="${cls}-icon">${
    item.icon
  }</span><span class="${cls}-text">${escapeHtml(item.text)}</span>`;
  if (item.href)
    return `<a href="${escapeHtml(item.href)}" class="${cls}">${inner}</a>`;
  return `<span class="${cls}">${inner}</span>`;
}

// ─── Enhanced Markdown Renderer ──────────────────────────
//
// Every pattern is bounded and cannot span lines, so rendering stays linear
// in the content length (no catastrophic backtracking on inputs like "[[[[").

const MD_BOLD = /\*\*(.{1,500}?)\*\*/g;
const MD_BOLD_UNDERSCORE = /__(.{1,500}?)__/g;
const MD_ITALIC = /(?<!\*)\*(?!\*)(.{1,500}?)(?<!\*)\*(?!\*)/g;
const MD_ITALIC_UNDERSCORE = /(?<!_)_(?!_)(.{1,500}?)(?<!_)_(?!_)/g;
const MD_LINK = /\[([^[\]\n]{1,300})\]\(([^()\s[\]]{1,2000})\)/g;
const MD_SKILL = /\[skill:[ \t]*([^\s[\]][^[\]\n]{0,99})\]/g;
const MD_RATING = /\[rating:[ \t]*(\d)\/(\d)\]/g;

export function renderMarkdown(content: string): string {
  if (!content.trim()) return "";

  let html = escapeHtml(content);

  html = html.replace(MD_BOLD, "<strong>$1</strong>");
  html = html.replace(MD_BOLD_UNDERSCORE, "<strong>$1</strong>");
  html = html.replace(MD_ITALIC, "<em>$1</em>");
  html = html.replace(MD_ITALIC_UNDERSCORE, "<em>$1</em>");

  html = html.replace(
    MD_LINK,
    (_match: string, text: string, href: string) =>
      `<a href="${sanitizeUrl(href)}" class="cv-link">${text}</a>`
  );

  // Skill badges: [skill: React]
  html = html.replace(MD_SKILL, '<span class="skill-badge">$1</span>');

  // Rating dots: [rating: 4/5]
  html = html.replace(MD_RATING, (_m, filled, total) => {
    const f = parseInt(filled, 10);
    const t = parseInt(total, 10);
    let dots = "";
    for (let i = 0; i < t; i++) {
      dots += `<span class="rating-dot${i < f ? " filled" : ""}"></span>`;
    }
    return `<span class="rating-dots">${dots}</span>`;
  });

  const lines = html.split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ### Title | Subtitle | Date  → flex entry heading
    if (/^###\s+/.test(line)) {
      const raw = line.replace(/^###\s+/, "");
      const parts = raw.split("|").map((part) => part.trim());
      if (parts.length >= 2) {
        const datePart =
          parts.length >= 3
            ? `<span class="entry-date">${parts[parts.length - 1]}</span>`
            : "";
        const subtitle = parts.length >= 3 ? parts[1] : "";
        blocks.push(
          `<div class="entry-heading"><div class="entry-left"><span class="entry-title">${
            parts[0]
          }</span>${
            subtitle ? ` <span class="entry-subtitle">${subtitle}</span>` : ""
          }</div>${datePart}</div>`
        );
      } else {
        blocks.push(`<h4 class="subsection-heading">${raw}</h4>`);
      }
      i++;
      continue;
    }

    // Bullet list
    if (/^[\-\*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\-\*]\s+/.test(lines[i])) {
        items.push(`<li>${lines[i].replace(/^[\-\*]\s+/, "")}</li>`);
        i++;
      }
      blocks.push(`<ul class="cv-list">${items.join("")}</ul>`);
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${lines[i].replace(/^\d+\.\s+/, "")}</li>`);
        i++;
      }
      blocks.push(`<ol class="cv-list">${items.join("")}</ol>`);
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) {
      blocks.push('<hr class="cv-divider">');
      i++;
      continue;
    }

    // Empty
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^[\-\*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^###\s+/.test(lines[i]) &&
      !/^-{3,}$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      blocks.push(`<p>${paraLines.join("<br>")}</p>`);
    }
  }

  return blocks.join("\n");
}

// ─── Section Type Specific Wrappers ──────────────────────

export function renderSectionContent(
  section: CvSection,
  _templateId: string
): string {
  const md = renderMarkdown(section.content);
  if (!md) return '<p class="empty">—</p>';

  switch (section.sectionType) {
    case "profile":
      return `<div class="profile-content">${md}</div>`;
    case "skills":
      return `<div class="skills-content">${md}</div>`;
    case "languages":
      return `<div class="languages-content">${md}</div>`;
    case "projects":
      return `<div class="projects-content">${md}</div>`;
    case "certifications":
      return `<div class="certifications-content">${md}</div>`;
    default:
      return `<div class="section-body">${md}</div>`;
  }
}

// ─── Shared single-column header renderer ────────────────

export function renderSingleColumnHeader(
  data: CvData,
  contacts: ContactItem[]
): string {
  const photoHtml = data.photoUrl
    ? `<img class="photo" src="${escapeHtml(
        data.photoUrl
      )}" alt="Photo" style="width:56pt;height:56pt;border-radius:50%;object-fit:cover;border:2pt solid var(--cv-primary);" />`
    : "";
  const contactHtml = contacts.length
    ? `<div class="contact-row">${contacts
        .map((c) => renderContactItem(c))
        .join("")}</div>`
    : "";
  return `<div class="header">
    ${photoHtml}
    <h1>${escapeHtml(data.userName || data.title)}</h1>
    ${contactHtml}
  </div>`;
}
