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
import { PageHero, PremiumUpgradeBanner, ItemCard } from "../shared";
import { useAuth } from "../../lib/auth";
import { AiCoverLetterAssist } from "./AiCoverLetterAssist";
import type { CoverLetter } from "@careerportal/shared/types";
import {
  Mail,
  Plus,
  PlusCircle,
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
    <div className="space-y-6">
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

      {editingId ? (
        /* ── Expanded editor view ── */
        <div className="space-y-4">
          {/* Back to list */}
          <button
            onClick={() => setEditingId(null)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
            Back to letters
          </button>

          {/* Two-column grid: editor left, AI right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {/* ── LEFT: Editor + suggestions + rewrite ── */}
            <div className="flex flex-col gap-4">
              {/* Editor card — grows to fill whatever height the right col takes */}
              <div className="flex flex-col flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 gap-4">
                <div className="flex items-center gap-2">
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
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all"
                  placeholder="Cover letter title"
                />
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Write your cover letter here..."
                  className="flex-1 min-h-[280px] w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all resize-none"
                />
                <div className="flex items-center gap-2">
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

            {/* ── RIGHT: sticky, scrolls independently inside viewport ── */}
            <div className="sticky top-20 self-start space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4 pr-0.5">
              <AiCoverLetterAssist
                coverLetterId={editingId}
                hasBody={editBody.trim().length > 0}
                onApply={(content) => setEditBody(content)}
                onApplyTemplate={(title, body) => {
                  setEditTitle(title);
                  setEditBody(body);
                }}
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
                  <div className="mt-3">
                    <PremiumUpgradeBanner message="AI features require Premium. Upgrade for suggestions, rewrites & more." />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── List view when no letter is selected ── */
        <div className="space-y-4">
          {/* Free-user cap warning */}
          {atFreeLimit && !showCreate && (
            <PremiumUpgradeBanner
              message={`Free accounts are limited to ${FREE_COVER_LETTER_LIMIT} cover letters. Upgrade for unlimited cover letters and AI-powered tools.`}
            />
          )}

          {/* Letter grid */}
          {letters.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-3">
                <FolderOpen className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                No cover letters yet
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                Create your first one below
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {letters.map((cl) => (
                <ItemCard
                  key={cl.id}
                  icon={Mail}
                  title={cl.title}
                  subtitle={
                    cl.body
                      ? `${cl.body.slice(0, 80).trim()}…`
                      : "Empty — click to start writing"
                  }
                  date={cl.updatedAt}
                  onDelete={() => handleDelete(cl.id)}
                  onClick={() => startEdit(cl)}
                />
              ))}
            </div>
          )}

          {/* Create new — now below the list */}
          {showCreate ? (
            <div className="rounded-xl border border-accent/30 dark:border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 dark:from-accent/8 dark:to-accent/3 p-4 space-y-3 animate-in fade-in">
              <label className="block text-xs font-semibold uppercase tracking-wider text-accent-dark dark:text-accent">
                New Cover Letter
              </label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Google SWE Application"
                className="w-full rounded-lg border border-accent/30 dark:border-accent/20 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
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
                  : "border-accent/40 dark:border-accent/30 text-accent-dark dark:text-accent hover:border-accent hover:text-accent-dark dark:hover:text-accent hover:bg-accent/8 dark:hover:bg-accent/10"
              }`}
            >
              <PlusCircle className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
              New Cover Letter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
