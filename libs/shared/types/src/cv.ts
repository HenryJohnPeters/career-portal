// === CV (PLAN §2.5) ===

export type FontSize = "small" | "medium" | "large";
export type Spacing = "compact" | "comfortable" | "spacious";
export type AccentStyle = "left-border" | "underline" | "background" | "none";
export type BulletStyle = "disc" | "dash" | "arrow" | "chevron" | "none";
export type DividerStyle = "line" | "dots" | "double" | "gradient" | "none";
export type HeaderLayout = "split" | "centered" | "inline" | "banner";
export type TemplateId =
  | "classic"
  | "modern"
  | "minimal"
  | "executive"
  | "creative"
  | "compact"
  | "developer"
  | "elegant"
  | "bold"
  | "academic"
  | "startup"
  | "infographic"
  | "nordic"
  | "timeline"
  | "magazine"
  | "terminal"
  | "gradient"
  | "architect"
  | "metropolis"
  | "zen"
  | "retro"
  | "blueprint"
  | "mosaic"
  | "luxe"
  | "newspaper"
  | "origami"
  | "pulse"
  | "artisan"
  | "frontier";
export type SectionType =
  | "profile"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "interests"
  | "custom";

/** Server-side limits (the API rejects anything larger). */
export const CV_LIMITS = {
  maxSectionsPerVersion: 30,
  sectionTitle: 200,
  sectionContent: 15_000,
  versionTitle: 120,
} as const;

export interface ThemeConfig {
  primaryColor: string;
  fontHeading: string;
  fontBody: string;
  fontSize: FontSize;
  spacing: Spacing;
  accentStyle: AccentStyle;
  bulletStyle: BulletStyle;
  dividerStyle: DividerStyle;
}

/**
 * Contact header fields of a CV version. URLs are normalised server-side
 * (`https://` added when missing); an empty string clears a field.
 */
export interface CvContactFields {
  name?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  phone?: string | null;
  location?: string | null;
  website?: string | null;
  linkedin?: string | null;
  github?: string | null;
}

export interface CvVersion {
  id: string;
  userId: string;
  title: string;
  isActive: boolean;
  templateId: string;
  themeConfig: ThemeConfig | Record<string, unknown>;
  headerLayout: string;
  name?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  phone?: string | null;
  location?: string | null;
  website?: string | null;
  linkedin?: string | null;
  github?: string | null;
  /** True when a previous bulk apply can be undone (POST /cv/versions/:id/restore-snapshot). */
  hasSnapshot: boolean;
  createdAt: string;
  updatedAt: string;
  sections: CvSection[];
}

export interface CvSection {
  id: string;
  cvVersionId: string;
  title: string;
  content: string;
  sectionType: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** PATCH /cv/versions/:id */
export interface UpdateCvVersionRequest extends CvContactFields {
  title?: string;
  isActive?: boolean;
  templateId?: string;
  themeConfig?: Partial<ThemeConfig> | Record<string, unknown>;
  headerLayout?: string;
}

export interface ApplyCvContentSection {
  title: string;
  content: string;
  sectionType: SectionType;
}

/**
 * PUT /cv/versions/:id/content — replaces all sections (1..30) in one
 * transaction and snapshots the previous content for undo.
 */
export interface ApplyCvContentRequest {
  contact?: CvContactFields;
  sections: ApplyCvContentSection[];
}
