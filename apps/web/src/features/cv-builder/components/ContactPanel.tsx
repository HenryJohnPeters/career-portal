import { useEffect, useId, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Github, Globe, Link, Mail, MapPin, Phone, User } from "lucide-react";
import type { CvVersion } from "@careerportal/shared/types";
import type { ContactBuffer } from "../hooks/useCvDesign";
import { useStoreSelector } from "../hooks/useStoreSelector";
import {
  CONTACT_KEYS,
  CONTACT_MAX_LENGTH,
  URL_KEYS,
  normaliseUrl,
  toContactPatchValue,
  validateContactField,
  type ContactKey,
  type ContactValues,
} from "../lib/contact";
import { SaveStatus } from "./SaveStatus";

const FIELDS: { key: ContactKey; label: string; icon: LucideIcon; placeholder: string; type?: string; autoComplete?: string }[] = [
  { key: "name", label: "Full name", icon: User, placeholder: "Jane Doe", autoComplete: "name" },
  { key: "email", label: "Email", icon: Mail, placeholder: "jane@example.com", type: "email", autoComplete: "email" },
  { key: "phone", label: "Phone", icon: Phone, placeholder: "+44 7700 900123", type: "tel", autoComplete: "tel" },
  { key: "location", label: "Location", icon: MapPin, placeholder: "London, UK", autoComplete: "address-level2" },
  { key: "website", label: "Website", icon: Globe, placeholder: "example.com", type: "url", autoComplete: "url" },
  { key: "linkedin", label: "LinkedIn", icon: Link, placeholder: "linkedin.com/in/username", type: "url" },
  { key: "github", label: "GitHub", icon: Github, placeholder: "github.com/username", type: "url" },
];

const HEADER_LAYOUTS = [
  { value: "split", label: "Split", desc: "Name left, contact right" },
  { value: "centered", label: "Center", desc: "Centred name & contact" },
  { value: "inline", label: "Inline", desc: "Name & contact in one line" },
  { value: "banner", label: "Banner", desc: "Full-width coloured header" },
];

function serverValues(version: CvVersion): ContactValues {
  const values = {} as ContactValues;
  for (const key of CONTACT_KEYS) values[key] = version[key] ?? "";
  return values;
}

/**
 * Contact header fields. Edits are buffered into one PATCH per pause, URLs get
 * https:// added, invalid values are flagged inline (and not sent), and a
 * failed save keeps the text with a Retry.
 */
export function ContactPanel({
  version,
  accountName,
  accountEmail,
  buffer,
}: {
  version: CvVersion;
  /** Used on the CV when the field is left blank. */
  accountName: string;
  accountEmail: string;
  buffer: ContactBuffer;
}) {
  const ids = useId();
  const status = useStoreSelector(buffer, (s) => s.status);
  const error = useStoreSelector(buffer, (s) => s.error);
  const unsaved = useStoreSelector(buffer, (s) => s.unsaved);
  const [values, setValues] = useState<ContactValues>(() => {
    // Keep text that is still being saved if the panel remounts (tab switch).
    const initial = serverValues(version);
    for (const key of CONTACT_KEYS) {
      const pending = unsaved[key];
      if (typeof pending === "string") initial[key] = pending;
    }
    return initial;
  });
  const [errors, setErrors] = useState<Partial<Record<ContactKey, string>>>({});
  const [touched, setTouched] = useState<ReadonlySet<ContactKey>>(() => new Set());

  // Take server values (e.g. a normalised URL, or an AI apply) for fields the
  // user isn't changing.
  useEffect(() => {
    const fromServer = serverValues(version);
    setValues((current) => {
      let changed = false;
      const next = { ...current };
      for (const key of CONTACT_KEYS) {
        if (key in unsaved || errors[key]) continue;
        // The server holds what this text saves as (e.g. "jane.dev" stored as
        // "https://jane.dev"): keep the text so the field doesn't change mid-typing.
        if (toContactPatchValue(key, next[key]) === fromServer[key]) continue;
        if (next[key] !== fromServer[key]) {
          next[key] = fromServer[key];
          changed = true;
        }
      }
      return changed ? next : current;
    });
    // Re-sync only when the server copy changes; `unsaved`/`errors` are read, not tracked.
  }, [version]);

  const change = (key: ContactKey, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    const message = validateContactField(key, value);
    setErrors((current) => ({ ...current, [key]: message ?? undefined }));
    if (!message) buffer.add({ [key]: toContactPatchValue(key, value) });
  };

  const blur = (key: ContactKey) => {
    setTouched((current) => new Set(current).add(key));
    if (URL_KEYS.has(key) && !errors[key] && values[key].trim()) {
      setValues((current) => ({ ...current, [key]: normaliseUrl(current[key], key) }));
    }
  };

  const headerLayout = (unsaved.headerLayout as string | undefined) ?? version.headerLayout ?? "split";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact details</h3>
        <SaveStatus
          status={status}
          error={error}
          onRetry={() => void buffer.flush()}
          idleLabel="Auto-saves as you type"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2.5">
        {FIELDS.map(({ key, label, icon: Icon, placeholder, type, autoComplete }) => {
          const fieldId = `${ids}-${key}`;
          const shownError = touched.has(key) ? errors[key] : undefined;
          const fallback = key === "name" ? accountName : key === "email" ? accountEmail : "";
          return (
            <div key={key}>
              <label htmlFor={fieldId} className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                {label}
              </label>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" aria-hidden="true" />
                <input
                  id={fieldId}
                  type={type ?? "text"}
                  inputMode={type === "url" ? "url" : undefined}
                  autoComplete={autoComplete ?? "off"}
                  value={values[key]}
                  onChange={(e) => change(key, e.target.value)}
                  onBlur={() => blur(key)}
                  maxLength={CONTACT_MAX_LENGTH[key]}
                  placeholder={fallback || placeholder}
                  aria-invalid={shownError ? true : undefined}
                  aria-describedby={shownError ? `${fieldId}-error` : fallback ? `${fieldId}-hint` : undefined}
                  className={`flex-1 min-w-0 px-2.5 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-accent focus:border-accent outline-none ${
                    shownError ? "border-red-400" : "border-gray-200 dark:border-gray-700"
                  }`}
                />
              </div>
              {shownError ? (
                <p id={`${fieldId}-error`} role="alert" className="mt-1 ml-6 text-[11px] text-red-600 dark:text-red-400">
                  {shownError}
                </p>
              ) : (
                fallback &&
                !values[key] && (
                  <p id={`${fieldId}-hint`} className="mt-1 ml-6 text-[10px] text-text-tertiary">
                    Leave blank to use your account {key === "name" ? "name" : "email"}.
                  </p>
                )
              )}
            </div>
          );
        })}
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Header layout</legend>
        <div className="grid grid-cols-2 gap-2">
          {HEADER_LAYOUTS.map((layout) => {
            const active = headerLayout === layout.value;
            return (
              <button
                key={layout.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  buffer.add({ headerLayout: layout.value });
                  void buffer.flush();
                }}
                className={`px-3 py-2 text-left rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  active
                    ? "border-accent bg-accent-muted/20 dark:bg-accent-muted/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                }`}
              >
                <span className={`block text-xs font-semibold ${active ? "text-accent-dark dark:text-accent" : "text-gray-700 dark:text-gray-300"}`}>
                  {layout.label}
                </span>
                <span className="block text-[11px] text-gray-500 dark:text-gray-400">{layout.desc}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
