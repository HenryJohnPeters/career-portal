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
  LayoutTemplate,
} from "lucide-react";
import { Button } from "@careerportal/web/ui";
import {
  useAiGenerateCoverLetter,
  useAiUsage,
  useCvVersions,
} from "@careerportal/web/data-access";
import { useAuth } from "../../lib/auth";
import { COVER_LETTER_TEMPLATES } from "./coverLetterTemplates";

type AiAction = "generate" | "improve" | "tailor";

interface AiCoverLetterAssistProps {
  coverLetterId: string;
  hasBody: boolean;
  onApply: (content: string) => void;
  /** Called when a template is selected — updates title + body in the editor */
  onApplyTemplate: (title: string, body: string) => void;
}

export function AiCoverLetterAssist({
  coverLetterId,
  hasBody,
  onApply,
  onApplyTemplate,
}: AiCoverLetterAssistProps) {
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const { data: usageData } = useAiUsage();
  const usage = usageData?.data;
  const hasUsesLeft = isPremium || (usage?.remaining ?? 1) > 0;

  const { data: cvVersionsData } = useCvVersions();
  const cvVersions = cvVersionsData?.data ?? [];

  const [action, setAction] = useState<AiAction | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<"professional" | "friendly">("professional");
  const [selectedCvVersionId, setSelectedCvVersionId] = useState<string>("");
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
        ...(selectedCvVersionId ? { cvVersionId: selectedCvVersionId } : {}),
      } as any);
      setResult(res.data.content);
    } catch (err: any) {
      setError(err.message || "Failed to generate content. Please try again.");
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      setResult(null);
      setAction(null);
    }
  };

  const handleDiscard = () => {
    setResult(null);
    setAction(null);
    setError(null);
  };

  // Free tier cap reached
  if (!hasUsesLeft) {
    return (
      <div className="space-y-4">
        {/* Templates — always shown even at cap */}
        <TemplatesPanel onApplyTemplate={onApplyTemplate} />

        <div className="rounded-xl border border-accent-400/30 bg-accent-50 dark:bg-accent-900/20 p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent-500" />
              <span className="text-sm font-bold text-accent-700 dark:text-accent-300">
                Monthly Limit Reached
              </span>
            </div>
          </div>
          <p className="text-xs text-accent-800 dark:text-accent-200 leading-relaxed mb-1">
            You've used all {usage?.limit} free AI uses this month. Upgrade to
            Premium for unlimited AI-powered cover letter generation.
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
            Upgrade to Premium — £9.99/mo
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Templates ── */}
      <TemplatesPanel onApplyTemplate={onApplyTemplate} />

      {/* ── AI Generator ── */}
      <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
              AI Cover Letter Generator
            </span>
          </div>
          {!isPremium && usage && (
            <span className="text-[10px] font-medium text-text-tertiary">
              {usage.remaining}/{usage.limit} uses left
            </span>
          )}
        </div>

        {/* Context inputs + actions */}
        {!result && !aiGenerate.isPending && (
          <>
            {/* CV selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                Base on a saved CV{" "}
                <span className="normal-case font-normal">(optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
                <select
                  value={selectedCvVersionId}
                  onChange={(e) => setSelectedCvVersionId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-accent-muted dark:border-gray-700 bg-white dark:bg-gray-800 pl-8 pr-8 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent transition-shadow"
                >
                  <option value="">Don't use CV data</option>
                  {cvVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
              </div>
              <p className="text-[10px] text-text-tertiary">
                {selectedCvVersionId
                  ? "✓ AI will personalise the letter using your CV content"
                  : "No CV selected — AI will generate from job details only"}
              </p>
            </div>

            {/* Role + company */}
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

            {/* Job description — always expanded */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                Job description{" "}
                <span className="normal-case font-normal text-text-tertiary">
                  — paste for best results
                </span>
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job spec here…"
                rows={5}
                className="w-full rounded-lg border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent transition-shadow resize-y"
              />
            </div>

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
                  {hasBody ? "Start fresh" : "New letter"}
                </span>
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
    </div>
  );
}

/* ── Templates panel ── */
function TemplatesPanel({
  onApplyTemplate,
}: {
  onApplyTemplate: (title: string, body: string) => void;
}) {
  const [applied, setApplied] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    const tpl = COVER_LETTER_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    onApplyTemplate(tpl.title, tpl.body);
    setApplied(id);
    setTimeout(() => setApplied(null), 1500);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-muted text-accent">
          <LayoutTemplate className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Start from a Template
        </span>
      </div>
      <p className="text-[11px] text-text-tertiary leading-relaxed">
        Pick a template to pre-fill the editor — then customise it to fit the
        role.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {COVER_LETTER_TEMPLATES.map((tpl) => {
          const isApplied = applied === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => handleSelect(tpl.id)}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                isApplied
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-border bg-bg-tertiary hover:border-accent/40 hover:bg-accent-muted/20 hover:-translate-y-0.5 hover:shadow-sm"
              }`}
            >
              <span className="text-base leading-none shrink-0">
                {tpl.icon}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-[11px] font-semibold truncate ${
                    isApplied
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-text-primary"
                  }`}
                >
                  {isApplied ? "Applied!" : tpl.label}
                </p>
                <p className="text-[10px] text-text-tertiary truncate">
                  {tpl.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
