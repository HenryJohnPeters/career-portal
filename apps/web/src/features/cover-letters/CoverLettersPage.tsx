import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCoverLetters,
  useCreateCoverLetter,
  useUpdateCoverLetter,
  useDeleteCoverLetter,
  useSuggestCoverLetter,
  useRewriteCoverLetter,
} from "@careerportal/web/data-access";
import { Button, Spinner, ErrorState } from "@careerportal/web/ui";
import { PageHero } from "../shared";
import { useAuth } from "../../lib/auth";
import { AiCoverLetterAssist } from "./AiCoverLetterAssist";
import type { CoverLetter } from "@careerportal/shared/types";
import {
  Mail,
  Plus,
  PlusCircle,
  Trash2,
  Save,
  X,
  Lightbulb,
  PenLine,
  Sparkles,
  FolderOpen,
  CheckCircle2,
  ArrowRight,
  Wand2,
  RefreshCw,
  Crown,
} from "lucide-react";

const FREE_COVER_LETTER_LIMIT = 3;

export function CoverLettersPage() {
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const navigate = useNavigate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [rewriteResult, setRewriteResult] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError, error, refetch } = useCoverLetters();
  const createMut = useCreateCoverLetter();
  const updateMut = useUpdateCoverLetter();
  const deleteMut = useDeleteCoverLetter();
  const suggestMut = useSuggestCoverLetter();
  const rewriteMut = useRewriteCoverLetter();

  if (isLoading) return <Spinner />;
  if (isError)
    return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  const letters: CoverLetter[] = data?.data || [];
  const atFreeLimit = !isPremium && letters.length >= FREE_COVER_LETTER_LIMIT;

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const res = await createMut.mutateAsync({ title: newTitle });
    setNewTitle("");
    setShowCreate(false);
    startEdit(res.data);
  };

  const startEdit = (cl: CoverLetter) => {
    setEditingId(cl.id);
    setEditTitle(cl.title);
    setEditBody(cl.body);
    setSuggestions([]);
    setRewriteResult(null);
  };

  const handleSave = async () => {
    if (!editingId) return;
    await updateMut.mutateAsync({
      id: editingId,
      title: editTitle,
      body: editBody,
    });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteMut.mutateAsync(id);
    if (editingId === id) setEditingId(null);
  };

  const handleSuggest = async () => {
    if (!editingId) return;
    await updateMut.mutateAsync({
      id: editingId,
      title: editTitle,
      body: editBody,
    });
    const res = await suggestMut.mutateAsync(editingId);
    setSuggestions(res.data);
  };

  const handleRewrite = async (tone: "professional" | "friendly") => {
    if (!editingId) return;
    await updateMut.mutateAsync({
      id: editingId,
      title: editTitle,
      body: editBody,
    });
    const res = await rewriteMut.mutateAsync({ id: editingId, tone });
    setRewriteResult(res.data);
  };

  const applyRewrite = () => {
    if (rewriteResult) {
      setEditBody(rewriteResult);
      setRewriteResult(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHero
        icon={Mail}
        title="Cover Letters"
        subtitle="Craft compelling cover letters with AI-powered suggestions and rewrites. Stand out from the crowd."
        stats={[
          {
            value: letters.length,
            label: `Letter${letters.length !== 1 ? "s" : ""}`,
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel – Letter list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Free-user cap warning */}
          {atFreeLimit && !showCreate && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3 flex items-start gap-2">
              <Crown className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">
                  Free accounts are limited to {FREE_COVER_LETTER_LIMIT} cover
                  letters. Upgrade to Premium for unlimited.
                </p>
                <button
                  onClick={() => navigate("/app/billing")}
                  className="text-[10px] font-semibold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 mt-1 underline underline-offset-2"
                >
                  Upgrade to Premium — £9.99/mo →
                </button>
              </div>
            </div>
          )}

          {/* Create new */}
          {showCreate ? (
            <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10 p-4 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                New Cover Letter
              </label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Google SWE Application"
                className="w-full rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  loading={createMut.isPending}
                  size="sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreate(false);
                    setNewTitle("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => !atFreeLimit && setShowCreate(true)}
              disabled={atFreeLimit}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-medium transition-all duration-200 group ${
                atFreeLimit
                  ? "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                  : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-500 dark:hover:text-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/10"
              }`}
            >
              <PlusCircle className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
              New Cover Letter
            </button>
          )}

          {/* Letter list */}
          {letters.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                <FolderOpen className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                No cover letters yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Create your first one above
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {letters.map((cl) => (
                <div
                  key={cl.id}
                  onClick={() => startEdit(cl)}
                  className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                    editingId === cl.id
                      ? "border-primary-500 bg-primary-500/5 dark:border-primary-500 shadow-sm ring-1 ring-primary-500/20"
                      : "border-border hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-sm bg-bg-elevated"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        editingId === cl.id
                          ? "bg-violet-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600"
                      }`}
                    >
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {cl.title}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                        {cl.body
                          ? cl.body.slice(0, 100)
                          : "Empty — click to start writing"}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        Updated {new Date(cl.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(cl.id);
                      }}
                      className="rounded-lg p-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel – Editor */}
        <div className="lg:col-span-3">
          {editingId ? (
            <div className="space-y-5">
              {/* Editor card */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-muted text-accent">
                    <PenLine className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Editor
                  </span>
                </div>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all"
                  placeholder="Cover letter title"
                />
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={12}
                  placeholder="Write your cover letter here..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all resize-y"
                />
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      loading={updateMut.isPending}
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Close
                    </Button>
                  </div>
                </div>
              </div>

              {/* AI Generate panel – NEW */}
              <AiCoverLetterAssist
                coverLetterId={editingId}
                hasBody={editBody.trim().length > 0}
                onApply={(content) => setEditBody(content)}
              />

              {/* AI tools card */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-600 text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    AI Assistant
                  </span>
                  {!isPremium && (
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={handleSuggest}
                    disabled={suggestMut.isPending || !isPremium}
                    className="relative flex items-center gap-2.5 rounded-xl border border-accent/20 bg-accent-muted/50 p-3.5 text-left hover:shadow-md hover:shadow-accent/5 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                  >
                    <Lightbulb className="h-5 w-5 text-accent shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        Suggest
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Get improvements
                      </p>
                    </div>
                    {!isPremium && (
                      <Crown className="absolute top-2 right-2 h-3 w-3 text-amber-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRewrite("professional")}
                    disabled={rewriteMut.isPending || !isPremium}
                    className="relative flex items-center gap-2.5 rounded-xl border border-accent/20 bg-accent-muted/50 p-3.5 text-left hover:shadow-md hover:shadow-accent/5 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                  >
                    <Wand2 className="h-5 w-5 text-accent shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        Professional
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Formal rewrite
                      </p>
                    </div>
                    {!isPremium && (
                      <Crown className="absolute top-2 right-2 h-3 w-3 text-amber-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRewrite("friendly")}
                    disabled={rewriteMut.isPending || !isPremium}
                    className="relative flex items-center gap-2.5 rounded-xl border border-accent/20 bg-accent-muted/50 p-3.5 text-left hover:shadow-md hover:shadow-accent/5 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                  >
                    <RefreshCw className="h-5 w-5 text-accent shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        Friendly
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Casual rewrite
                      </p>
                    </div>
                    {!isPremium && (
                      <Crown className="absolute top-2 right-2 h-3 w-3 text-amber-500" />
                    )}
                  </button>
                </div>
                {!isPremium && (
                  <button
                    onClick={() => navigate("/app/billing")}
                    className="mt-3 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline underline-offset-2"
                  >
                    <Crown className="h-3 w-3" />
                    AI features require Premium — Upgrade now →
                  </button>
                )}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                      Suggestions
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-text-secondary"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rewrite result */}
              {rewriteResult && (
                <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                        Rewritten Version
                      </h4>
                    </div>
                    <Button size="sm" onClick={applyRewrite}>
                      <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                      Apply
                    </Button>
                  </div>
                  <pre className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed bg-bg-tertiary rounded-lg p-4 border border-border">
                    {rewriteResult}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            /* No letter selected */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-2xl bg-bg-tertiary flex items-center justify-center">
                  <Mail className="h-10 w-10 text-text-tertiary" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
                  <PenLine className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                Select a cover letter
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Choose a letter from the left panel to edit, or create a new one
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
