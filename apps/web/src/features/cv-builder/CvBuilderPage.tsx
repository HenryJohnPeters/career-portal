import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { getErrorMessage, useCvVersions } from "@careerportal/web/data-access";
import { ErrorState, Spinner } from "@careerportal/web/ui";
import { PageHero } from "../shared";
import { CvWorkspace, type WorkspaceTab } from "./CvWorkspace";
import { VersionList } from "./components/VersionList";

/**
 * CV builder. The open version lives in the URL (`?version=<id>`) so links
 * (e.g. from the Tailor kit) and the browser Back button work; `?new=1` opens
 * the create form. `?tab=match&job=<jobId>` opens the Match tab with that
 * tracked job preselected.
 */
export function CvBuilderPage() {
  const [params, setParams] = useSearchParams();
  const { data, isLoading, isFetching, isError, error, refetch } = useCvVersions();
  const versions = data?.data ?? [];
  const selectedId = params.get("version");
  const tabParam = params.get("tab");
  const initialTab: WorkspaceTab | undefined =
    tabParam === "match" || tabParam === "design" || tabParam === "content" ? tabParam : undefined;
  const initialJobId = params.get("job") ?? undefined;
  const selected = selectedId ? versions.find((v) => v.id === selectedId) ?? null : null;
  const resolving = !!selectedId && !selected && isFetching;
  const refetchedFor = useRef<string | null>(null);

  // A link can point at a version created since the list was cached (e.g. by
  // the Tailor kit): refetch once before treating the id as unknown. A deleted
  // or unknown version then falls back to the list.
  useEffect(() => {
    if (!data || !selectedId || selected || isFetching) return;
    if (refetchedFor.current !== selectedId) {
      refetchedFor.current = selectedId;
      void refetch();
      return;
    }
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("version");
        return next;
      },
      { replace: true },
    );
  }, [data, selectedId, selected, isFetching, refetch, setParams]);

  const open = useCallback((id: string) => setParams({ version: id }), [setParams]);
  const back = useCallback(() => setParams({}), [setParams]);

  if (isLoading || resolving) return <Spinner label="Loading your CVs" />;
  // A failed background refetch keeps the cached list (and any open editor).
  if (isError && !data) {
    return (
      <ErrorState
        message={getErrorMessage(error, "Your CVs couldn't be loaded.")}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHero
        icon={FileText}
        title="CV Builder"
        subtitle="Create and manage CV versions, match them to jobs, and download polished PDFs."
        stats={[
          { value: versions.length, label: `Version${versions.length !== 1 ? "s" : ""}` },
          { value: versions.filter((v) => v.isActive).length, label: "Active" },
        ]}
      />

      {selected ? (
        <CvWorkspace
          key={selected.id}
          version={selected}
          onBack={back}
          initialTab={initialTab}
          initialJobId={initialJobId}
        />
      ) : (
        <VersionList
          versions={versions}
          initialShowCreate={params.get("new") === "1"}
          onOpen={open}
        />
      )}
    </div>
  );
}
