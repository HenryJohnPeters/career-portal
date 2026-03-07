import { useState, useEffect } from "react";
import {
  X,
  Building2,
  Briefcase,
  Link2,
  FileText,
  Mail,
  Calendar,
  Save,
  Trash2,
  StickyNote,
} from "lucide-react";
import { Button } from "@careerportal/web/ui";
import type { Job, CvVersion, CoverLetter } from "@careerportal/shared/types";
import { PIPELINE_COLUMNS } from "../constants";

interface TrackerDrawerProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Job>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  cvVersions: CvVersion[];
  coverLetters: CoverLetter[];
  saving: boolean;
  deleting: boolean;
}

export function TrackerDrawer({
  job,
  open,
  onClose,
  onSave,
  onDelete,
  cvVersions,
  coverLetters,
  saving,
  deleting,
}: TrackerDrawerProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [cvVersionId, setCvVersionId] = useState("");
  const [coverLetterId, setCoverLetterId] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (job) {
      setCompany(job.company);
      setRole(job.role);
      setUrl(job.url ?? "");
      setStatus(job.status);
      setCvVersionId(job.cvVersionId ?? "");
      setCoverLetterId(job.coverLetterId ?? "");
      setFollowUpDate(job.followUpDate ? job.followUpDate.slice(0, 10) : "");
      setNotes(job.notes ?? "");
    }
  }, [job]);

  if (!job) return null;

  const handleSave = () => {
    onSave(job.id, {
      company,
      role,
      url: url || undefined,
      status,
      cvVersionId: cvVersionId || undefined,
      coverLetterId: coverLetterId || undefined,
      followUpDate: followUpDate || undefined,
      notes: notes || undefined,
    } as any);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${job.company} — ${job.role}"?`)) {
      onDelete(job.id);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Application details"
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Application Details
                </h2>
                <p className="text-[10px] text-gray-400">Edit &amp; manage</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close panel"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Company */}
            <Field icon={Building2} label="Company">
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="field-input"
                placeholder="Company name"
              />
            </Field>

            {/* Role */}
            <Field icon={Briefcase} label="Role">
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="field-input"
                placeholder="Job title"
              />
            </Field>

            {/* Job URL */}
            <Field icon={Link2} label="Job URL">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="field-input"
                placeholder="https://..."
                type="url"
              />
            </Field>

            {/* Status */}
            <Field icon={Briefcase} label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="field-input"
                aria-label="Application status"
              >
                {PIPELINE_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </Field>

            {/* CV Version */}
            <Field icon={FileText} label="CV Version">
              <select
                value={cvVersionId}
                onChange={(e) => setCvVersionId(e.target.value)}
                className="field-input"
                aria-label="CV version"
              >
                <option value="">— None —</option>
                {cvVersions.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.title}
                  </option>
                ))}
              </select>
            </Field>

            {/* Cover Letter */}
            <Field icon={Mail} label="Cover Letter">
              <select
                value={coverLetterId}
                onChange={(e) => setCoverLetterId(e.target.value)}
                className="field-input"
                aria-label="Cover letter"
              >
                <option value="">— None —</option>
                {coverLetters.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.title}
                  </option>
                ))}
              </select>
            </Field>

            {/* Follow-up date */}
            <Field icon={Calendar} label="Follow-up Date">
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="field-input"
              />
            </Field>

            {/* Notes */}
            <Field icon={StickyNote} label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="field-input resize-y"
                placeholder="Add notes, interview feedback, etc."
              />
            </Field>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-5 py-4">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={deleting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} loading={saving}>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Scoped styles for field inputs */}
        <style>{`
          .field-input {
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid rgb(229 231 235);
            background: rgb(249 250 251);
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            color: rgb(17 24 39);
            outline: none;
            transition: all 150ms;
          }
          .field-input:focus {
            border-color: rgb(99 102 241);
            box-shadow: 0 0 0 2px rgba(99,102,241,0.2);
            background: white;
          }
          @media (prefers-color-scheme: dark) {
            .field-input {
              border-color: rgb(55 65 81);
              background: rgba(31, 41, 55, 0.5);
              color: rgb(243 244 246);
            }
            .field-input:focus {
              background: rgb(31 41 55);
            }
          }
          .dark .field-input {
            border-color: rgb(55 65 81);
            background: rgba(31, 41, 55, 0.5);
            color: rgb(243 244 246);
          }
          .dark .field-input:focus {
            background: rgb(31 41 55);
          }
        `}</style>
      </aside>
    </>
  );
}

/* Tiny helper for consistent field layout */
function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Building2;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </label>
      {children}
    </div>
  );
}
