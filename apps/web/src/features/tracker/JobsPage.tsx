import { useState, useMemo, useCallback } from "react";
import {
  useJobs,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
  useCvVersions,
  useCoverLetters,
} from "@careerportal/web/data-access";
import { Spinner, ErrorState, Button } from "@careerportal/web/ui";
import { PageHero } from "../shared";
import type { Job, CvVersion, CoverLetter } from "@careerportal/shared/types";
import { Briefcase, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  KanbanBoard,
  TrackerDrawer,
  AddJobModal,
  ColumnManager,
  TrackerFilters,
  EMPTY_FILTERS,
  useToast,
  useColumnConfig,
  getFollowUpBadge,
} from "./index";
import type { TrackerFilterState, PipelineStatus } from "./index";

export function JobsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    visibleColumns,
    hiddenColumns,
    removeColumn,
    addColumn,
    moveColumn,
    resetColumns,
  } = useColumnConfig();

  const { data, isLoading, isError, error, refetch } = useJobs();
  const { data: cvData } = useCvVersions();
  const { data: clData } = useCoverLetters();

  const createMut = useCreateJob();
  const updateMut = useUpdateJob();
  const deleteMut = useDeleteJob();

  const jobs: Job[] = data?.data || [];
  const cvVersions: CvVersion[] = cvData?.data || [];
  const coverLetters: CoverLetter[] = clData?.data || [];

  const [filters, setFilters] = useState<TrackerFilterState>(EMPTY_FILTERS);
  const [drawerJob, setDrawerJob] = useState<Job | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const filteredJobs = useMemo(() => {
    let result = jobs;
    const q = filters.search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (j) =>
          j.company.toLowerCase().includes(q) ||
          j.role.toLowerCase().includes(q)
      );
    }
    if (filters.status) {
      result = result.filter((j) => j.status === filters.status);
    }
    if (filters.followUpDue) {
      result = result.filter((j) => {
        const badge = getFollowUpBadge(j.followUpDate);
        return badge === "due" || badge === "overdue";
      });
    }
    if (filters.missingCv) {
      result = result.filter((j) => !j.cvVersionId);
    }
    if (filters.missingCoverLetter) {
      result = result.filter((j) => !j.coverLetterId);
    }
    return result;
  }, [jobs, filters]);

  const handleStatusChange = useCallback(
    (jobId: string, newStatus: PipelineStatus) => {
      const previousJobs = queryClient.getQueryData(["jobs"]);
      queryClient.setQueryData(["jobs"], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((j: Job) =>
            j.id === jobId ? { ...j, status: newStatus } : j
          ),
        };
      });
      updateMut.mutate(
        { id: jobId, status: newStatus },
        {
          onError: () => {
            queryClient.setQueryData(["jobs"], previousJobs);
            toast("error", "Failed to update status. Reverted.");
          },
          onSuccess: () => {
            toast("success", "Status updated");
          },
        }
      );
    },
    [queryClient, updateMut, toast]
  );

  const handleCardClick = useCallback((job: Job) => {
    setDrawerJob(job);
    setDrawerOpen(true);
  }, []);

  const handleDrawerSave = async (id: string, patch: Partial<Job>) => {
    try {
      await updateMut.mutateAsync({ id, ...patch } as any);
      toast("success", "Application saved");
      const freshJobs: Job[] =
        queryClient.getQueryData<any>(["jobs"])?.data || [];
      const updated = freshJobs.find((j) => j.id === id);
      if (updated) setDrawerJob(updated);
    } catch {
      toast("error", "Failed to save application");
    }
  };

  const handleDrawerDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      toast("success", "Application deleted");
      setDrawerOpen(false);
      setDrawerJob(null);
    } catch {
      toast("error", "Failed to delete application");
    }
  };

  const handleCreate = async (formData: {
    company: string;
    role: string;
    status?: string;
    url?: string;
    cvVersionId?: string;
    coverLetterId?: string;
  }) => {
    try {
      await createMut.mutateAsync(formData);
      toast("success", "Application added");
      setAddModalOpen(false);
    } catch {
      toast("error", "Failed to add application");
    }
  };

  if (isLoading) return <Spinner />;
  if (isError)
    return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  return (
    <div className="flex flex-col h-full min-h-0 space-y-6">
      <PageHero
        icon={Briefcase}
        title="Job Tracker"
        subtitle="Track your applications through every stage. Drag cards to update status, click to view details."
        stats={[
          {
            value: jobs.length,
            label: `Application${jobs.length !== 1 ? "s" : ""}`,
          },
        ]}
        action={
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-accent hover:bg-accent-dark text-white border-0 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Application
          </Button>
        }
      />

      {/* Mobile add button */}
      <div className="sm:hidden">
        <Button
          onClick={() => setAddModalOpen(true)}
          size="sm"
          className="bg-accent hover:bg-accent-dark text-white border-0 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Application
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <TrackerFilters filters={filters} onChange={setFilters} />
        <ColumnManager
          visibleColumns={visibleColumns}
          hiddenColumns={hiddenColumns}
          onRemove={removeColumn}
          onAdd={addColumn}
          onMove={moveColumn}
          onReset={resetColumns}
        />
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard
          jobs={filteredJobs}
          columns={visibleColumns}
          onStatusChange={handleStatusChange}
          onCardClick={handleCardClick}
        />
      </div>

      <TrackerDrawer
        job={drawerJob}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleDrawerSave}
        onDelete={handleDrawerDelete}
        cvVersions={cvVersions}
        coverLetters={coverLetters}
        saving={updateMut.isPending}
        deleting={deleteMut.isPending}
      />

      <AddJobModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreate={handleCreate}
        creating={createMut.isPending}
        cvVersions={cvVersions}
        coverLetters={coverLetters}
      />
    </div>
  );
}
