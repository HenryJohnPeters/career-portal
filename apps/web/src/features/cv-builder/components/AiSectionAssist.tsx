import { useState } from "react";
import {
  Sparkles,
  Wand2,
  Target,
  Zap,
  X,
  Check,
  Loader2,
  RotateCcw,
  Crown,
  ChevronDown,
} from "lucide-react";
import { Button } from "@careerportal/web/ui";
import {
  useAiGenerateCvSection,
  useAiUsage,
} from "@careerportal/web/data-access";
import { useAuth } from "../../../lib/auth";
import { useNavigate } from "react-router-dom";

type AiAction = "generate" | "improve" | "tailor";

interface AiSectionAssistProps {
  sectionId: string;
  sectionTitle: string;
  sectionType: string;
  hasContent: boolean;
  onApply: (content: string) => void;
}

export function AiSectionAssist({
  sectionId,
  sectionTitle,
  sectionType,
  hasContent,
  onApply,
}: AiSectionAssistProps) {
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const { data: usageData } = useAiUsage();
  const usage = usageData?.data;
  const hasUsesLeft = isPremium || (usage?.remaining ?? 1) > 0;
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<AiAction | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aiGenerate = useAiGenerateCvSection();

  const handleGenerate = async (selectedAction: AiAction) => {
    setAction(selectedAction);
    setResult(null);
    setError(null);

    try {
      const res = await aiGenerate.mutateAsync({
        sectionId,
        action: selectedAction,
        jobTitle: jobTitle.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      });
      setResult(res.data.content);
    } catch (err: any) {
      setError(err.message || "Failed to generate content. Please try again.");
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      setResult(null);
      setOpen(false);
      setAction(null);
    }
  };

  const handleDiscard = () => {
    setResult(null);
    setAction(null);
    setError(null);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary-500/20 bg-primary-500/5 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-500/10 hover:-translate-y-0.5 transition-all duration-200"
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI Assist
        {!isPremium && usage && (
          <span className="text-[9px] text-primary-400 dark:text-primary-500">
            {usage.remaining}/{usage.limit}
          </span>
        )}
      </button>
    );
  }

  // Free tier cap reached
  if (!hasUsesLeft) {
    return (
      <div className="rounded-xl border border-accent-400/30 bg-accent-50 dark:bg-accent-900/20 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-accent-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-accent-700 dark:text-accent-300">
              Monthly Limit Reached
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-accent-800 dark:text-accent-200 mb-2">
          You've used all {usage?.limit} free AI uses this month. Upgrade to
          Premium for unlimited AI-powered tools.
        </p>
        {usage?.resetsAt && (
          <p className="text-[10px] text-accent-600 dark:text-accent-400 mb-3">
            Resets{" "}
            {new Date(usage.resetsAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
            })}
          </p>
        )}
        <Button
          size="sm"
          className="!bg-accent-400 hover:!bg-accent-500"
          onClick={() => navigate("/app/billing")}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Upgrade to Premium
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 dark:bg-primary-500/5 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
            AI Assist — {sectionTitle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isPremium && usage && (
            <span className="text-[10px] font-medium text-text-tertiary">
              {usage.remaining}/{usage.limit} uses left
            </span>
          )}
          <button
            onClick={() => {
              setOpen(false);
              setResult(null);
              setAction(null);
              setError(null);
            }}
            className="rounded-md p-1 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Context inputs */}
      {!result && (
        <>
          <div className="space-y-2">
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Target role (e.g. Senior Frontend Engineer) — optional"
              className="w-full rounded-lg border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent transition-shadow"
            />
            <details className="group">
              <summary className="flex items-center gap-1 cursor-pointer text-[10px] font-medium text-accent-dark dark:text-accent hover:text-accent dark:hover:text-accent-light transition-colors select-none">
                <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                Add job description for better tailoring
              </summary>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here for AI to tailor your content…"
                rows={3}
                className="mt-2 w-full rounded-lg border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent transition-shadow resize-y"
              />
            </details>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleGenerate("generate")}
              disabled={aiGenerate.isPending}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800/50 p-3 text-center hover:shadow-md hover:shadow-accent/10 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Zap className="h-4 w-4 text-accent-dark dark:text-accent" />
              <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200">
                {hasContent ? "Regenerate" : "Generate"}
              </span>
              <span className="text-[9px] text-gray-400 leading-tight">
                {hasContent ? "Fresh content" : "Write from scratch"}
              </span>
            </button>
            <button
              onClick={() => handleGenerate("improve")}
              disabled={aiGenerate.isPending || !hasContent}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800/50 p-3 text-center hover:shadow-md hover:shadow-accent/10 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Wand2 className="h-4 w-4 text-accent-dark dark:text-accent" />
              <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200">
                Improve
              </span>
              <span className="text-[9px] text-gray-400 leading-tight">
                Polish existing
              </span>
            </button>
            <button
              onClick={() => handleGenerate("tailor")}
              disabled={aiGenerate.isPending || !hasContent}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800/50 p-3 text-center hover:shadow-md hover:shadow-accent/10 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Target className="h-4 w-4 text-accent-dark dark:text-accent" />
              <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200">
                Tailor
              </span>
              <span className="text-[9px] text-gray-400 leading-tight">
                Match job desc
              </span>
            </button>
          </div>
        </>
      )}

      {/* Loading */}
      {aiGenerate.isPending && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="h-5 w-5 text-accent-dark dark:text-accent animate-spin" />
          <span className="text-xs font-medium text-accent-dark dark:text-accent animate-pulse">
            AI is writing your {sectionTitle.toLowerCase()} section…
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={handleDiscard}
            className="mt-2 text-[10px] font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          >
            Try again
          </button>
        </div>
      )}

      {/* Result preview */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              AI-Generated Content
            </span>
          </div>
          <pre className="max-h-60 overflow-y-auto rounded-lg border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800/50 p-3 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">
            {result}
          </pre>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleApply}>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Apply to Section
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleGenerate(action!)}
              loading={aiGenerate.isPending}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Regenerate
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDiscard}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
