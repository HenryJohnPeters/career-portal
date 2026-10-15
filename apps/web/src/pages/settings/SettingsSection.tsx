import { useId, type ReactNode } from "react";

interface SettingsSectionProps {
  /** Anchor id, e.g. "security" for /app/settings#security. */
  id: string;
  title: string;
  description?: ReactNode;
  icon: ReactNode;
  tone?: "default" | "danger";
  children: ReactNode;
}

/** A titled card on the settings page; each one is a landmark region. */
export function SettingsSection({ id, title, description, icon, tone = "default", children }: SettingsSectionProps) {
  const headingId = useId();
  const danger = tone === "danger";
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`scroll-mt-20 rounded-2xl border bg-bg-elevated shadow-sm ${
        danger ? "border-red-200 dark:border-red-900/60" : "border-border"
      }`}
    >
      <div className={`flex items-start gap-3 border-b px-5 py-4 sm:px-6 ${danger ? "border-red-200 dark:border-red-900/60" : "border-border"}`}>
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4 ${
            danger
              ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
              : "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h2 id={headingId} className="text-sm font-semibold text-text-primary">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
        </div>
      </div>
      <div className="space-y-6 px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

/** A sub-heading inside a settings section (e.g. "Change password"). */
export function SettingsSubheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
      {children}
    </h3>
  );
}
