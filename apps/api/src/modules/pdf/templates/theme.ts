// theme.ts — CV theme whitelist.
//
// Theme values are interpolated into <style>, so only known-safe values may
// ever reach CSS: 3/6-digit hex colours, allowlisted font families and enum
// values. Anything else falls back to the default; unknown keys are dropped.
// The same normaliser runs when a theme is saved (CvService) and when it is
// rendered, so rows stored before validation existed are neutralised too.
// Mirrors ThemeConfig / FONT_PAIRS / DEFAULT_THEME_CONFIG in
// libs/shared/types/src/cv-templates.ts (theme.spec.ts asserts they match).

export const THEME_FONTS = [
  "Inter",
  "Merriweather",
  "Source Sans 3",
  "Raleway",
  "Lora",
  "DM Serif Display",
  "DM Sans",
  "IBM Plex Sans",
  "IBM Plex Serif",
  "Fira Code",
  "Fira Sans",
  "JetBrains Mono",
  "Libre Baskerville",
] as const;

export const THEME_OPTIONS = {
  fontSize: ["small", "medium", "large"],
  spacing: ["compact", "comfortable", "spacious"],
  accentStyle: ["left-border", "underline", "background", "none"],
  bulletStyle: ["disc", "dash", "arrow", "chevron", "none"],
  dividerStyle: ["line", "dots", "double", "gradient", "none"],
} as const;

type ThemeOptionKey = keyof typeof THEME_OPTIONS;

export interface ThemeConfig {
  primaryColor: string;
  fontHeading: string;
  fontBody: string;
  fontSize: (typeof THEME_OPTIONS.fontSize)[number];
  spacing: (typeof THEME_OPTIONS.spacing)[number];
  accentStyle: (typeof THEME_OPTIONS.accentStyle)[number];
  bulletStyle: (typeof THEME_OPTIONS.bulletStyle)[number];
  dividerStyle: (typeof THEME_OPTIONS.dividerStyle)[number];
}

export const DEFAULT_THEME: Readonly<ThemeConfig> = Object.freeze({
  primaryColor: "#2563eb",
  fontHeading: "Merriweather",
  fontBody: "Source Sans 3",
  fontSize: "medium",
  spacing: "comfortable",
  accentStyle: "left-border",
  bulletStyle: "disc",
  dividerStyle: "line",
});

export const HEADER_LAYOUTS = ["split", "centered", "inline", "banner"] as const;
export type HeaderLayout = (typeof HEADER_LAYOUTS)[number];

export interface ResolvedTheme extends ThemeConfig {
  primaryLight: string;
  primaryDark: string;
}

const FONT_BY_KEY = new Map<string, string>(
  THEME_FONTS.map((font) => [font.toLowerCase(), font]),
);

/** `#abc` / `#aabbcc` → lowercase `#aabbcc`; anything else → null. */
export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1].toLowerCase();
  return hex.length === 3
    ? `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
    : `#${hex}`;
}

/** Canonical font name when allowlisted (case/spacing-insensitive), else null. */
export function normalizeFont(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 60) return null;
  return FONT_BY_KEY.get(value.trim().replace(/\s+/g, " ").toLowerCase()) ?? null;
}

function normalizeOption<K extends ThemeOptionKey>(
  key: K,
  value: unknown,
): ThemeConfig[K] | null {
  const options = THEME_OPTIONS[key] as readonly string[];
  return typeof value === "string" && options.includes(value)
    ? (value as ThemeConfig[K])
    : null;
}

const THEME_KEYS = Object.keys(DEFAULT_THEME) as (keyof ThemeConfig)[];

function normalizeValue(key: keyof ThemeConfig, value: unknown): string | null {
  switch (key) {
    case "primaryColor":
      return normalizeHexColor(value);
    case "fontHeading":
    case "fontBody":
      return normalizeFont(value);
    default:
      return normalizeOption(key, value);
  }
}

/**
 * Whitelist a theme. Keys present in `raw` are validated (invalid → default);
 * keys absent from `raw` come from `base`, so a partial update merges over the
 * stored theme. Unknown keys are dropped. Never throws.
 */
export function normalizeThemeConfig(
  raw: unknown,
  base: Readonly<ThemeConfig> = DEFAULT_THEME,
): ThemeConfig {
  const input =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const theme = { ...base } as Record<keyof ThemeConfig, string>;
  for (const key of THEME_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    theme[key] = normalizeValue(key, input[key]) ?? DEFAULT_THEME[key];
  }
  return theme as ThemeConfig;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function darkenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v: number) =>
    Math.round(v * (1 - amount))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** Validated theme plus the derived colours the templates use. */
export function resolveTheme(raw: unknown): ResolvedTheme {
  const theme = normalizeThemeConfig(raw);
  const { r, g, b } = hexToRgb(theme.primaryColor);
  return {
    ...theme,
    primaryLight: `rgba(${r},${g},${b},0.10)`,
    primaryDark: darkenHex(theme.primaryColor, 0.2),
  };
}

/** Google Fonts stylesheet URL for two allowlisted families. */
export function fontImportUrl(heading: string, body: string): string {
  const families = Array.from(new Set([heading, body]))
    .map((font) => normalizeFont(font))
    .filter((font): font is string => font !== null);
  const params = families
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700;800`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
