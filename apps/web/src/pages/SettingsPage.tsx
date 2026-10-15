import { PlanUsageCard } from "../components/PlanUsageCard";

/** Placeholder registered by web-shell; web-pages replaces it with the full settings page. */
export function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Settings</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your plan and account.
        </p>
      </div>
      <PlanUsageCard />
    </div>
  );
}
