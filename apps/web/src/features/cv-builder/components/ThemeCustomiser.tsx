import { useState, useEffect, useCallback } from "react";
import {
  COLOR_PRESETS,
  FONT_PAIRS,
} from "@careerportal/shared/types/cv-templates";
import type {
  ThemeConfig,
  FontSize,
  Spacing,
  AccentStyle,
  BulletStyle,
  DividerStyle,
} from "@careerportal/shared/types";

interface ThemeCustomiserProps {
  themeConfig: ThemeConfig;
  onUpdateTheme: (partial: Partial<ThemeConfig>) => void;
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
      </label>
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
              value === o.value
                ? "bg-accent text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemeCustomiser({
  themeConfig,
  onUpdateTheme,
}: ThemeCustomiserProps) {
  const [hexInput, setHexInput] = useState(
    themeConfig.primaryColor || "#2563eb"
  );

  useEffect(() => {
    setHexInput(themeConfig.primaryColor || "#2563eb");
  }, [themeConfig.primaryColor]);

  const handleHexChange = useCallback(
    (val: string) => {
      setHexInput(val);
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        onUpdateTheme({ primaryColor: val });
      }
    },
    [onUpdateTheme]
  );

  const currentFontIdx = FONT_PAIRS.findIndex(
    (fp) =>
      fp.heading === themeConfig.fontHeading && fp.body === themeConfig.fontBody
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Theme
      </h3>

      {/* Color presets */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Accent Color
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((cp) => {
            const isActive = themeConfig.primaryColor === cp.color;
            return (
              <button
                key={cp.color}
                title={cp.name}
                onClick={() => onUpdateTheme({ primaryColor: cp.color })}
                className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                  isActive
                    ? "border-gray-800 dark:border-white ring-2 ring-offset-1 ring-accent scale-110"
                    : "border-transparent hover:scale-110"
                }`}
                style={{ backgroundColor: cp.color }}
              >
                {isActive && (
                  <svg
                    className="w-3.5 h-3.5 text-white drop-shadow"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="#2563eb"
            className="w-24 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono"
          />
        </div>
      </div>

      {/* Font pair selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Font Pair
        </label>
        <select
          value={currentFontIdx >= 0 ? currentFontIdx : 0}
          onChange={(e) => {
            const fp = FONT_PAIRS[parseInt(e.target.value, 10)];
            if (fp)
              onUpdateTheme({ fontHeading: fp.heading, fontBody: fp.body });
          }}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          {FONT_PAIRS.map((fp, i) => (
            <option key={fp.name} value={i}>
              {fp.name}
            </option>
          ))}
        </select>
      </div>

      {/* Font size */}
      <ToggleGroup<FontSize>
        label="Font Size"
        value={(themeConfig.fontSize as FontSize) || "medium"}
        onChange={(v) => onUpdateTheme({ fontSize: v })}
        options={[
          { value: "small", label: "S" },
          { value: "medium", label: "M" },
          { value: "large", label: "L" },
        ]}
      />

      {/* Spacing */}
      <ToggleGroup<Spacing>
        label="Spacing"
        value={(themeConfig.spacing as Spacing) || "comfortable"}
        onChange={(v) => onUpdateTheme({ spacing: v })}
        options={[
          { value: "compact", label: "Compact" },
          { value: "comfortable", label: "Comfy" },
          { value: "spacious", label: "Spacious" },
        ]}
      />

      {/* Accent style */}
      <ToggleGroup<AccentStyle>
        label="Accent Style"
        value={(themeConfig.accentStyle as AccentStyle) || "left-border"}
        onChange={(v) => onUpdateTheme({ accentStyle: v })}
        options={[
          { value: "left-border", label: "Border" },
          { value: "underline", label: "Line" },
          { value: "background", label: "Fill" },
          { value: "none", label: "None" },
        ]}
      />

      {/* Bullet style */}
      <ToggleGroup<BulletStyle>
        label="Bullet Style"
        value={(themeConfig.bulletStyle as BulletStyle) || "disc"}
        onChange={(v) => onUpdateTheme({ bulletStyle: v })}
        options={[
          { value: "disc", label: "•" },
          { value: "dash", label: "–" },
          { value: "arrow", label: "›" },
          { value: "chevron", label: "»" },
          { value: "none", label: "None" },
        ]}
      />

      {/* Divider style */}
      <ToggleGroup<DividerStyle>
        label="Divider Style"
        value={(themeConfig.dividerStyle as DividerStyle) || "line"}
        onChange={(v) => onUpdateTheme({ dividerStyle: v })}
        options={[
          { value: "line", label: "Line" },
          { value: "dots", label: "Dots" },
          { value: "gradient", label: "Grad" },
          { value: "none", label: "None" },
        ]}
      />
    </div>
  );
}
