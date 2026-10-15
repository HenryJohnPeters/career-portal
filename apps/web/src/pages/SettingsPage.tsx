import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PlanUsageCard } from "../components/PlanUsageCard";
import { useAuth } from "../lib/auth";
import { DangerZoneSection } from "./settings/DangerZoneSection";
import { DataSection } from "./settings/DataSection";
import { ProfileSection } from "./settings/ProfileSection";
import { SecuritySection } from "./settings/SecuritySection";

const SECTION_LINKS = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "plan", label: "Plan & usage" },
  { id: "data", label: "Your data" },
  { id: "delete-account", label: "Delete account" },
];

/** Only the known section anchors; a malformed hash (e.g. "#%E0") must not throw. */
function sectionIdFromHash(hash: string): string | null {
  const id = hash.slice(1);
  return SECTION_LINKS.some((link) => link.id === id) ? id : null;
}

/** /app/settings: profile, security, plan, data export and account deletion. */
export function SettingsPage() {
  const { user } = useAuth();
  const { hash } = useLocation();

  // Router navigation doesn't scroll to #anchors (e.g. /app/settings#security).
  useEffect(() => {
    const id = sectionIdFromHash(hash);
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [hash]);

  // ProtectedRoute guarantees a user; this only satisfies the type.
  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 animate-fade-in-up">
      <nav aria-label="Settings sections" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {SECTION_LINKS.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-neutral-100 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-white/5"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <ProfileSection user={user} />
      <SecuritySection />

      <div id="plan" className="scroll-mt-20 space-y-2">
        <PlanUsageCard />
        <p className="text-right">
          <Link
            to="/app/billing"
            className="inline-flex items-center gap-1 rounded text-xs font-semibold text-primary-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-300"
          >
            Manage plan &amp; billing
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </p>
      </div>

      <DataSection />
      <DangerZoneSection user={user} />
    </div>
  );
}
