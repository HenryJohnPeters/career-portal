import { useEffect, useId, useState } from "react";
import { Check } from "lucide-react";
import { COLOR_PRESETS, FONT_PAIRS } from "@careerportal/shared/types/cv-templates";
import type {
  AccentStyle,
  BulletStyle,
  DividerStyle,
  FontSize,
  Spacing,
  ThemeConfig,
} from "@careerportal/shared/types";

const HEX = /^#[0-9a-fA-F]{6}$/;

function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; title?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</legend>
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            aria-label={o.title}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
              value === o.value
                ? "bg-accent text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Colour, fonts, size and styles. Changes show instantly (the parent passes the
 * theme with unsaved edits applied) and are saved in one PATCH after a pause,
 * so dragging the colour picker sends a single request.
 */
export function ThemeCustomiser({
  theme,
  onChange,
}: {
  theme: ThemeConfig;
  onChange: (patch: Partial<ThemeConfig>) => void;
}) {
  const ids = useId();
  const [hexInput, setHexInput] = useState(theme.primaryColor);

  useEffect(() => {
    setHexInput((current) =>
      current.toLowerCase() === theme.primaryColor.toLowerCase() ? current : theme.primaryColor,
    );
  }, [theme.primaryColor]);

  const changeHex = (value: string) => {
    setHexInput(value);
    if (HEX.test(value)) onChange({ primaryColor: value.toLowerCase() });
  };

  const fontIndex = FONT_PAIRS.findIndex(
    (fp) => fp.heading === theme.fontHeading && fp.body === theme.fontBody,
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Theme</h3>

      <fieldset className="space-y-1.5">
        <legend className="text-xs font-medium text-gray-600 dark:text-gray-400">Accent colour</legend>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => {
            const active = theme.primaryColor.toLowerCase() === preset.color.toLowerCase();
            return (
              <button
                key={preset.color}
                type="button"
                aria-pressed={active}
                aria-label={preset.name}
                title={preset.name}
                onClick={() => changeHex(preset.color)}
                className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  active
                    ? "border-gray-800 dark:border-white ring-2 ring-offset-1 ring-accent scale-110"
                    : "border-transparent hover:scale-110"
                }`}
                style={{ backgroundColor: preset.color }}
              >
                {active && <Check className="w-3.5 h-3.5 text-white drop-shadow" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <label htmlFor={`${ids}-picker`} className="sr-only">
            Custom accent colour
          </label>
          <input
            id={`${ids}-picker`}
            type="color"
            value={HEX.test(hexInput) ? hexInput : theme.primaryColor}
            onChange={(e) => changeHex(e.target.value)}
            className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <label htmlFor={`${ids}-hex`} className="sr-only">
            Accent colour hex code
          </label>
          <input
            id={`${ids}-hex`}
            type="text"
            value={hexInput}
            onChange={(e) => changeHex(e.target.value.trim())}
            maxLength={7}
            spellCheck={false}
            placeholder="#2563eb"
            aria-invalid={!HEX.test(hexInput) || undefined}
            className="w-24 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono"
          />
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor={`${ids}-fonts`} className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Font pair
        </label>
        <select
          id={`${ids}-fonts`}
          value={fontIndex >= 0 ? fontIndex : 0}
          onChange={(e) => {
            const pair = FONT_PAIRS[Number(e.target.value)];
            if (pair) onChange({ fontHeading: pair.heading, fontBody: pair.body });
          }}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          {FONT_PAIRS.map((pair, i) => (
            <option key={pair.name} value={i}>
              {pair.name}
            </option>
          ))}
        </select>
      </div>

      <ToggleGroup<FontSize>
        label="Font size"
        value={theme.fontSize}
        onChange={(fontSize) => onChange({ fontSize })}
        options={[
          { value: "small", label: "S", title: "Small" },
          { value: "medium", label: "M", title: "Medium" },
          { value: "large", label: "L", title: "Large" },
        ]}
      />

      <ToggleGroup<Spacing>
        label="Spacing"
        value={theme.spacing}
        onChange={(spacing) => onChange({ spacing })}
        options={[
          { value: "compact", label: "Compact" },
          { value: "comfortable", label: "Comfy", title: "Comfortable" },
          { value: "spacious", label: "Spacious" },
        ]}
      />

      <ToggleGroup<AccentStyle>
        label="Accent style"
        value={theme.accentStyle}
        onChange={(accentStyle) => onChange({ accentStyle })}
        options={[
          { value: "left-border", label: "Border", title: "Left border" },
          { value: "underline", label: "Line", title: "Underline" },
          { value: "background", label: "Fill", title: "Background fill" },
          { value: "none", label: "None" },
        ]}
      />

      <ToggleGroup<BulletStyle>
        label="Bullet style"
        value={theme.bulletStyle}
        onChange={(bulletStyle) => onChange({ bulletStyle })}
        options={[
          { value: "disc", label: "•", title: "Disc" },
          { value: "dash", label: "–", title: "Dash" },
          { value: "arrow", label: "›", title: "Arrow" },
          { value: "chevron", label: "»", title: "Chevron" },
          { value: "none", label: "None" },
        ]}
      />

      <ToggleGroup<DividerStyle>
        label="Divider style"
        value={theme.dividerStyle}
        onChange={(dividerStyle) => onChange({ dividerStyle })}
        options={[
          { value: "line", label: "Line" },
          { value: "dots", label: "Dots" },
          { value: "gradient", label: "Grad", title: "Gradient" },
          { value: "none", label: "None" },
        ]}
      />
    </div>
  );
}
