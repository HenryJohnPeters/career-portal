import { useState, useEffect, useRef, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Link,
  Check,
} from "lucide-react";

interface ContactPanelProps {
  name: string;
  email: string;
  photoUrl: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  headerLayout: string;
  onUpdateContact: (fields: Record<string, string>) => void;
}

function ContactField({
  icon: Icon,
  label,
  value,
  placeholder,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  placeholder: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-accent focus:border-accent outline-none"
      />
    </div>
  );
}

const HEADER_LAYOUTS = [
  { value: "split", label: "Split", desc: "Name left, contact right" },
  { value: "centered", label: "Center", desc: "Centered name & contact" },
  { value: "inline", label: "Inline", desc: "Name & contact in one line" },
  { value: "banner", label: "Banner", desc: "Full-width colored header" },
];

export function ContactPanel({
  name,
  email,
  photoUrl,
  phone,
  location,
  website,
  linkedin,
  github,
  headerLayout,
  onUpdateContact,
}: ContactPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isContactExpanded, setIsContactExpanded] = useState(false);
  const [fields, setFields] = useState({
    name,
    email,
    photoUrl,
    phone,
    location,
    website,
    linkedin,
    github,
  });

  // Track whether fields have been locally edited (dirty)
  const isDirty = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a stable ref to the callback so the debounce always calls the latest version
  const onUpdateContactRef = useRef(onUpdateContact);
  useEffect(() => {
    onUpdateContactRef.current = onUpdateContact;
  }, [onUpdateContact]);

  // Sync fields from props only when NOT locally dirty (i.e. server pushed a change)
  useEffect(() => {
    if (isDirty.current) return;
    setFields({
      name,
      email,
      photoUrl,
      phone,
      location,
      website,
      linkedin,
      github,
    });
  }, [name, email, photoUrl, phone, location, website, linkedin, github]);

  const updateField = useCallback((key: string, val: string) => {
    isDirty.current = true;
    setFields((prev) => {
      const next = { ...prev, [key]: val };
      // Schedule debounced save using the ref so it's always fresh
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        isDirty.current = false;
        onUpdateContactRef.current(next);
      }, 600);
      return next;
    });
  }, []);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const [saveFlash, setSaveFlash] = useState(false);
  const triggerFlash = () => {
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;
  const ContactChevron = isContactExpanded ? ChevronUp : ChevronDown;

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
            Contact Info
          </h3>
          {saveFlash && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
        </div>
        <ChevronIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
      </button>

      {isExpanded && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-2.5">
            <ContactField
              icon={User}
              label="Full Name"
              value={fields.name}
              placeholder="John Doe"
              onChange={(v) => updateField("name", v)}
            />
            <ContactField
              icon={Mail}
              label="Email"
              value={fields.email}
              placeholder="john@example.com"
              onChange={(v) => updateField("email", v)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Header Layout
            </label>
            <div className="grid grid-cols-2 gap-2">
              {HEADER_LAYOUTS.map((hl) => {
                const isActive = headerLayout === hl.value;
                return (
                  <button
                    key={hl.value}
                    onClick={() => {
                      onUpdateContactRef.current({ headerLayout: hl.value });
                      triggerFlash();
                    }}
                    className={`px-3 py-2 text-left rounded-lg border transition-colors ${
                      isActive
                        ? "border-accent bg-accent-muted/20 dark:bg-accent-muted/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold ${
                        isActive
                          ? "text-accent-dark dark:text-accent"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {hl.label}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {hl.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <button
              onClick={() => setIsContactExpanded(!isContactExpanded)}
              className="w-full flex items-center justify-between group mb-3"
            >
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                Additional Details (Phone, Location, Links)
              </span>
              <ContactChevron className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>

            {isContactExpanded && (
              <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <ContactField
                  icon={Phone}
                  label="Phone"
                  value={fields.phone}
                  placeholder="+1 (555) 123-4567"
                  onChange={(v) => updateField("phone", v)}
                />
                <ContactField
                  icon={MapPin}
                  label="Location"
                  value={fields.location}
                  placeholder="San Francisco, CA"
                  onChange={(v) => updateField("location", v)}
                />
                <ContactField
                  icon={Globe}
                  label="Website"
                  value={fields.website}
                  placeholder="example.com"
                  onChange={(v) => updateField("website", v)}
                />
                <ContactField
                  icon={Link}
                  label="LinkedIn"
                  value={fields.linkedin}
                  placeholder="linkedin.com/in/username"
                  onChange={(v) => updateField("linkedin", v)}
                />
                <ContactField
                  icon={Github}
                  label="GitHub"
                  value={fields.github}
                  placeholder="github.com/username"
                  onChange={(v) => updateField("github", v)}
                />
                <p className="text-[10px] text-gray-400 dark:text-gray-500 pt-1">
                  Changes auto-save and appear in your CV preview within a few
                  seconds.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
