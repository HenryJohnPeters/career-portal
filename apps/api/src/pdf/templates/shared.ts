// shared.ts — Shared types, utilities, and icons for CV templates

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
  themeConfig?: Record<string, unknown>;
  headerLayout?: string;
  photoUrl?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface ResolvedTheme {
  primaryColor: string;
  primaryLight: string;
  primaryDark: string;
  fontHeading: string;
  fontBody: string;
  fontSize: string;
  spacing: string;
  accentStyle: string;
  bulletStyle: string;
  dividerStyle: string;
}

export interface ContactItem {
  icon: string;
  text: string;
  href?: string;
}

// ─── Utility Functions ───────────────────────────────────

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function darkenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  const nr = Math.round(r * f)
    .toString(16)
    .padStart(2, "0");
  const ng = Math.round(g * f)
    .toString(16)
    .padStart(2, "0");
  const nb = Math.round(b * f)
    .toString(16)
    .padStart(2, "0");
  return `#${nr}${ng}${nb}`;
}

export function resolveTheme(config: Record<string, unknown>): ResolvedTheme {
  const primary = (config.primaryColor as string) || "#2563eb";
  const rgb = hexToRgb(primary);
  return {
    primaryColor: primary,
    primaryLight: `rgba(${rgb.r},${rgb.g},${rgb.b},0.10)`,
    primaryDark: darkenHex(primary, 0.2),
    fontHeading: (config.fontHeading as string) || "Merriweather",
    fontBody: (config.fontBody as string) || "Source Sans 3",
    fontSize: (config.fontSize as string) || "medium",
    spacing: (config.spacing as string) || "comfortable",
    accentStyle: (config.accentStyle as string) || "left-border",
    bulletStyle: (config.bulletStyle as string) || "disc",
    dividerStyle: (config.dividerStyle as string) || "line",
  };
}

export function fontImportUrl(heading: string, body: string): string {
  const families = new Set<string>();
  families.add(heading);
  families.add(body);
  const familyArray = Array.from(families);
  const params = familyArray
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700;800`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
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
  if (data.website) {
    const url = data.website.startsWith("http")
      ? data.website
      : `https://${data.website}`;
    items.push({
      icon: ICONS.globe,
      text: data.website.replace(/^https?:\/\//, ""),
      href: url,
    });
  }
  if (data.linkedin) {
    const url = data.linkedin.startsWith("http")
      ? data.linkedin
      : `https://linkedin.com/in/${data.linkedin}`;
    items.push({
      icon: ICONS.linkedin,
      text: data.linkedin.replace(
        /^https?:\/\/(www\.)?linkedin\.com\/in\//,
        ""
      ),
      href: url,
    });
  }
  if (data.github) {
    const url = data.github.startsWith("http")
      ? data.github
      : `https://github.com/${data.github}`;
    items.push({
      icon: ICONS.github,
      text: data.github.replace(/^https?:\/\/(www\.)?github\.com\//, ""),
      href: url,
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

export function renderMarkdown(
  content: string,
  sectionType: string,
  templateId: string
): string {
  if (!content.trim()) return "";

  let html = escapeHtml(content);

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, "<em>$1</em>");

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="cv-link">$1</a>'
  );

  // Skill badges: [skill: React]
  html = html.replace(
    /\[skill:\s*([^\]]+)\]/g,
    '<span class="skill-badge">$1</span>'
  );

  // Rating dots: [rating: 4/5]
  html = html.replace(/\[rating:\s*(\d)\/(\d)\]/g, (_m, filled, total) => {
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
      const parts = raw.split(/\s*\|\s*/);
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
  templateId: string
): string {
  const md = renderMarkdown(section.content, section.sectionType, templateId);
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
