import type { ThemeConfig, TemplateId, SectionType } from "./index";

export interface TemplateOption {
  id: TemplateId;
  name: string;
  description: string;
  layout: "single" | "two-column" | "sidebar-left" | "sidebar-right";
  columns?: string; // CSS grid-template-columns
}

export interface ColorPreset {
  name: string;
  color: string;
}

export interface FontPair {
  name: string;
  heading: string;
  body: string;
}

export interface SectionTypeOption {
  type: SectionType;
  label: string;
  icon: string;
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "classic",
    name: "Classic",
    description:
      "Timeless single-column layout with serif headings. Senior staff engineer aesthetic.",
    layout: "single",
  },
  {
    id: "modern",
    name: "Modern",
    description:
      "Two-column grid with sidebar for contact & skills. The flagship template.",
    layout: "two-column",
    columns: "30% 70%",
  },
  {
    id: "minimal",
    name: "Minimal",
    description:
      "Clean single-column with generous whitespace. Dieter Rams aesthetic.",
    layout: "single",
  },
  {
    id: "executive",
    name: "Executive",
    description:
      "Bold colored header banner with elegant serif body. VP of Engineering aesthetic.",
    layout: "single",
  },
  {
    id: "creative",
    name: "Creative",
    description:
      "Gradient sidebar with timeline experience layout. Stands out from the crowd.",
    layout: "sidebar-left",
    columns: "35% 65%",
  },
  {
    id: "compact",
    name: "Compact",
    description:
      "Dense two-column grid for maximum information density. For seasoned professionals.",
    layout: "two-column",
    columns: "50% 50%",
  },
  {
    id: "developer",
    name: "Developer",
    description:
      "Monospace-accented layout with code-block aesthetics. Built for engineers.",
    layout: "single",
  },
  {
    id: "elegant",
    name: "Elegant",
    description:
      "Refined serif typography with subtle gold accents. Quiet confidence.",
    layout: "single",
  },
  {
    id: "bold",
    name: "Bold",
    description:
      "High-contrast, large headings with vibrant color blocks. Makes an impact.",
    layout: "single",
  },
  {
    id: "academic",
    name: "Academic",
    description:
      "Traditional academic CV with publications-ready structure. For researchers.",
    layout: "single",
  },
  {
    id: "startup",
    name: "Startup",
    description:
      "Modern gradient header with rounded cards. Y Combinator energy.",
    layout: "single",
  },
  {
    id: "infographic",
    name: "Infographic",
    description:
      "Visual sidebar with progress bars and icons. Data-driven layout.",
    layout: "sidebar-left",
    columns: "32% 68%",
  },
  {
    id: "nordic",
    name: "Nordic",
    description:
      "Scandinavian-inspired minimalism with muted tones and clean lines.",
    layout: "single",
  },
  {
    id: "timeline",
    name: "Timeline",
    description:
      "Vertical timeline spine connecting all sections. Tells your career story.",
    layout: "single",
  },
  {
    id: "magazine",
    name: "Magazine",
    description:
      "Editorial-style multi-column layout with pull quotes. Eye-catching.",
    layout: "two-column",
    columns: "40% 60%",
  },
  {
    id: "terminal",
    name: "Terminal",
    description:
      "Dark hacker-terminal aesthetic with green-on-black palette. For CLI lovers.",
    layout: "single",
  },
  {
    id: "gradient",
    name: "Gradient",
    description:
      "Modern gradient accents with floating card sections. Beautiful and contemporary.",
    layout: "single",
  },
  {
    id: "architect",
    name: "Architect",
    description:
      "Clean geometric sections with precise spacing and structured layout. Professional excellence.",
    layout: "single",
  },
  {
    id: "metropolis",
    name: "Metropolis",
    description:
      "Urban grid-based layout with bold geometric accents and strong vertical rhythm.",
    layout: "single",
  },
  {
    id: "zen",
    name: "Zen",
    description:
      "Japanese-inspired minimalism with asymmetric whitespace and delicate typography.",
    layout: "single",
  },
  {
    id: "retro",
    name: "Retro",
    description:
      "Vintage-inspired warm tones with rounded cards and nostalgic character.",
    layout: "single",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description:
      "Technical drawing aesthetic with dark background, grid lines, and precise details.",
    layout: "single",
  },
  {
    id: "mosaic",
    name: "Mosaic",
    description:
      "Colorful tile-based grid layout with card sections. Visually organized.",
    layout: "two-column",
    columns: "50% 50%",
  },
  {
    id: "luxe",
    name: "Luxe",
    description:
      "Premium dark-mode with gold accents and refined typography. Black-tie elegance.",
    layout: "single",
  },
  {
    id: "newspaper",
    name: "Newspaper",
    description:
      "Editorial broadsheet-style with multi-column body and drop caps. Front-page energy.",
    layout: "two-column",
    columns: "50% 50%",
  },
  {
    id: "origami",
    name: "Origami",
    description:
      "Paper-fold inspired with angular clip-path sections and layered depth.",
    layout: "single",
  },
  {
    id: "pulse",
    name: "Pulse",
    description:
      "Dynamic gradient header with vibrant energy bars and modern pill badges.",
    layout: "single",
  },
  {
    id: "artisan",
    name: "Artisan",
    description:
      "Handcrafted look with decorative borders, ornamental dividers, and organic styling.",
    layout: "single",
  },
  {
    id: "frontier",
    name: "Frontier",
    description:
      "Bold split-screen sidebar with primary-colored panel and clean content blocks.",
    layout: "sidebar-left",
    columns: "35% 65%",
  },
];

export const COLOR_PRESETS: ColorPreset[] = [
  { name: "Professional Blue", color: "#2563eb" },
  { name: "Modern Slate", color: "#475569" },
  { name: "Fresh Emerald", color: "#059669" },
  { name: "Bold Rose", color: "#e11d48" },
  { name: "Warm Amber", color: "#d97706" },
  { name: "Creative Violet", color: "#7c3aed" },
  { name: "Tech Cyan", color: "#0891b2" },
  { name: "All Black", color: "#171717" },
  { name: "Navy Executive", color: "#1e3a5f" },
  { name: "Dracula", color: "#bd93f9" },
  { name: "Nord", color: "#5e81ac" },
  { name: "GitHub Dark", color: "#238636" },
];

export const FONT_PAIRS: FontPair[] = [
  { name: "Inter", heading: "Inter", body: "Inter" },
  {
    name: "Merriweather + Source Sans",
    heading: "Merriweather",
    body: "Source Sans 3",
  },
  { name: "Raleway + Lora", heading: "Raleway", body: "Lora" },
  {
    name: "DM Sans + DM Serif Display",
    heading: "DM Serif Display",
    body: "DM Sans",
  },
  {
    name: "IBM Plex Sans + Serif",
    heading: "IBM Plex Sans",
    body: "IBM Plex Serif",
  },
  { name: "Fira Code + Fira Sans", heading: "Fira Code", body: "Fira Sans" },
  { name: "JetBrains Mono + Inter", heading: "JetBrains Mono", body: "Inter" },
  {
    name: "Libre Baskerville + Source Sans",
    heading: "Libre Baskerville",
    body: "Source Sans 3",
  },
];

export const SECTION_TYPES: SectionTypeOption[] = [
  { type: "profile", label: "Profile", icon: "👤" },
  { type: "experience", label: "Experience", icon: "💼" },
  { type: "education", label: "Education", icon: "🎓" },
  { type: "skills", label: "Skills", icon: "⚡" },
  { type: "projects", label: "Projects", icon: "🚀" },
  { type: "certifications", label: "Certifications", icon: "🏆" },
  { type: "languages", label: "Languages", icon: "🌍" },
  { type: "interests", label: "Interests", icon: "✨" },
  { type: "custom", label: "Custom", icon: "📝" },
];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  primaryColor: "#2563eb",
  fontHeading: "Merriweather",
  fontBody: "Source Sans 3",
  fontSize: "medium",
  spacing: "comfortable",
  accentStyle: "left-border",
  bulletStyle: "disc",
  dividerStyle: "line",
};

/** Map section title to the correct sectionType */
export function inferSectionType(title: string): SectionType {
  const lower = title.toLowerCase().trim();
  if (
    lower === "profile" ||
    lower === "summary" ||
    lower === "about" ||
    lower === "about me"
  )
    return "profile";
  if (
    lower === "experience" ||
    lower === "work experience" ||
    lower === "employment"
  )
    return "experience";
  if (lower === "education" || lower === "academic background")
    return "education";
  if (lower === "skills" || lower === "technical skills") return "skills";
  if (lower === "projects" || lower === "key projects") return "projects";
  if (lower === "certifications" || lower === "certificates")
    return "certifications";
  if (lower === "languages") return "languages";
  if (lower === "interests" || lower === "hobbies") return "interests";
  return "custom";
}
