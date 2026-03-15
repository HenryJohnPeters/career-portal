import { useState } from "react";
import { X, Plus, Building2, Briefcase, Link2, FileText, Mail } from "lucide-react";
import { Button } from "@careerportal/web/ui";
import { PIPELINE_COLUMNS } from "../constants";
import type { CvVersion, CoverLetter } from "@careerportal/shared/types";

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    company: string;
    role: string;
    status?: string;
    url?: string;
    cvVersionId?: string;
    coverLetterId?: string;
  }) => Promise<void>;
  creating: boolean;
  cvVersions: CvVersion[];
  coverLetters: CoverLetter[];
}

export function AddJobModal({
  open,
  onClose,
  onCreate,
  creating,
  cvVersions,
  coverLetters,
}: AddJobModalProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("wishlist");
  const [url, setUrl] = useState("");
  const [cvVersionId, setCvVersionId] = useState("");
  const [coverLetterId, setCoverLetterId] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    await onCreate({
      company,
      role,
      status,
      url: url || undefined,
      cvVersionId: cvVersionId || undefined,
      coverLetterId: coverLetterId || undefined,
    });
    setCompany("");
    setRole("");
    setStatus("wishlist");
    setUrl("");
    setCvVersionId("");
    setCoverLetterId("");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add new application"
          className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Plus className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Add Application
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                <Building2 className="h-3 w-3" />
                Company *
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="e.g. Acme Corp"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                <Briefcase className="h-3 w-3" />
                Role *
              </label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="e.g. Frontend Developer"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                aria-label="Initial status"
              >
                {PIPELINE_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                <Link2 className="h-3 w-3" />
                Job URL (optional)
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="https://..."
                type="url"
              />
            </div>

            {/* CV Version */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                <FileText className="h-3 w-3" />
                CV Version (optional)
              </label>
              <select
                value={cvVersionId}
                onChange={(e) => setCvVersionId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                aria-label="CV version"
              >
                <option value="">— None —</option>
                {cvVersions.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Cover Letter */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                <Mail className="h-3 w-3" />
                Cover Letter (optional)
              </label>
              <select
                value={coverLetterId}
                onChange={(e) => setCoverLetterId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                aria-label="Cover letter"
              >
                <option value="">— None —</option>
                {coverLetters.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button size="sm" type="submit" loading={creating}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Application
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
