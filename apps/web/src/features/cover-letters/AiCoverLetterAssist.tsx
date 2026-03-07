import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  FileText,
  ArrowRight,
} from "lucide-react";
import { Button } from "@careerportal/web/ui";
import {
  useAiGenerateCoverLetter,
  useAiUsage,
} from "@careerportal/web/data-access";
import { useAuth } from "../../lib/auth";

type AiAction = "generate" | "improve" | "tailor";

interface AiCoverLetterAssistProps {
  coverLetterId: string;
  hasBody: boolean;
  onApply: (content: string) => void;
}

export function AiCoverLetterAssist({
  coverLetterId,
  hasBody,
  onApply,
}: AiCoverLetterAssistProps) {
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const { data: usageData } = useAiUsage();
  const usage = usageData?.data;
  const hasUsesLeft = isPremium || (usage?.remaining ?? 1) > 0;

  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<AiAction | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<"professional" | "friendly">("professional");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aiGenerate = useAiGenerateCoverLetter();
  const navigate = useNavigate();

  const handleGenerate = async (selectedAction: AiAction) => {
    setAction(selectedAction);
    setResult(null);
    setError(null);

    try {
      const res = await aiGenerate.mutateAsync({
        id: coverLetterId,
        action: selectedAction,
        jobTitle: jobTitle.trim() || undefined,
        companyName: companyName.trim() || undefined,
        companyUrl: companyUrl.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
        tone,
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
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent-light dark:border-accent-muted py-3.5 text-sm font-medium text-accent-dark dark:text-accent hover:border-accent-dark hover:text-accent-dark dark:hover:border-accent dark:hover:text-accent-light hover:bg-accent-muted/30 dark:hover:bg-accent-muted/10 transition-all duration-200 group"
      >
        <Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform" />
        AI Generate Cover Letter
        {!isPremium && usage && (
          <span className="text-[9px] text-accent-light dark:text-accent-light">
            {usage.remaining}/{usage.limit}
          </span>
        )}
      </button>
    );
  }

  // Free tier cap reached
  if (!hasUsesLeft) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
              Monthly Limit Reached
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed mb-1">
          You've used all {usage?.limit} free AI uses this month. Upgrade to
          Premium for unlimited AI-powered cover letter generation.
        </p>
        {usage?.resetsAt && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-3">
            Resets{" "}
            {new Date(usage.resetsAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
            })}
          </p>
        )}
        <Button
          size="sm"
          className="!bg-gradient-to-r !from-amber-500 !to-orange-600 hover:!from-amber-600 hover:!to-orange-700 !shadow-lg !shadow-amber-500/25"
          onClick={() => navigate("/app/billing")}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Upgrade to Premium — £9.99/mo
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent-muted dark:border-accent-muted bg-gradient-to-br from-accent-muted/50 to-accent-muted/30 dark:from-accent-muted/15 dark:to-accent-muted/10 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-dark to-accent text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent-dark dark:text-accent">
            AI Cover Letter Generator
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isPremium && usage && (
            <span className="text-[10px] font-medium text-accent-light dark:text-accent-light">
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
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Context inputs + actions */}
      {!result && !aiGenerate.isPending && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Target role (optional)"
              className="rounded-lg border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent transition-shadow"
            />
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name (optional)"
              className="rounded-lg border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent transition-shadow"
            />
          </div>

          <input
            value={companyUrl}
            onChange={(e) => setCompanyUrl(e.target.value)}
            placeholder="Company URL (optional) — e.g. https://acme.com"
            className="w-full rounded-lg border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent transition-shadow"
          />

          <details className="group">
            <summary className="flex items-center gap-1 cursor-pointer text-[10px] font-medium text-accent-dark dark:text-accent hover:text-accent dark:hover:text-accent-light transition-colors select-none">
              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
              Add job spec for better results
            </summary>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job spec here…"
              rows={4}
              className="mt-2 w-full rounded-lg border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent transition-shadow resize-y"
            />
          </details>

          {/* Tone picker */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
              Tone:
            </span>
            <div className="flex rounded-lg border border-accent-muted dark:border-accent-muted overflow-hidden">
              {(["professional", "friendly"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 text-[10px] font-medium capitalize transition-colors ${
                    tone === t
                      ? "bg-accent-dark text-white dark:bg-accent dark:text-gray-950"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-accent-muted/50 dark:hover:bg-accent-muted/20"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleGenerate("generate")}
              disabled={aiGenerate.isPending}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800/50 p-3.5 text-center hover:shadow-md hover:shadow-accent/10 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Zap className="h-5 w-5 text-accent-dark dark:text-accent" />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                {hasBody ? "Regenerate" : "Generate"}
              </span>
              <span className="text-[10px] text-gray-400 leading-tight">
                {hasBody ? "Start fresh" : "From your CV"}
              </span>
              <div className="flex items-center gap-1 text-[9px] text-accent-light dark:text-accent-light">
                <FileText className="h-2.5 w-2.5" />
                Uses CV data
              </div>
            </button>
            <button
              onClick={() => handleGenerate("improve")}
              disabled={aiGenerate.isPending || !hasBody}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800/50 p-3.5 text-center hover:shadow-md hover:shadow-accent/10 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Wand2 className="h-5 w-5 text-accent-dark dark:text-accent" />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Improve
              </span>
              <span className="text-[10px] text-gray-400 leading-tight">
                Enhance existing
              </span>
            </button>
            <button
              onClick={() => handleGenerate("tailor")}
              disabled={aiGenerate.isPending || !hasBody}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800/50 p-3.5 text-center hover:shadow-md hover:shadow-accent/10 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Target className="h-5 w-5 text-accent-dark dark:text-accent" />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Tailor
              </span>
              <span className="text-[10px] text-gray-400 leading-tight">
                Match job desc
              </span>
            </button>
          </div>
        </>
      )}

      {/* Loading */}
      {aiGenerate.isPending && (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="h-6 w-6 text-accent-dark dark:text-accent animate-spin" />
          <span className="text-sm font-medium text-accent-dark dark:text-accent animate-pulse">
            AI is crafting your cover letter…
          </span>
          <span className="text-[10px] text-gray-400">
            This may take a few seconds
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
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              AI-Generated Cover Letter
            </span>
          </div>
          <pre className="max-h-72 overflow-y-auto rounded-lg border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800/50 p-4 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {result}
          </pre>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleApply}>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Apply
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
