import { useId, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Check,
  ChevronDown,
  Code2,
  FileText,
  GraduationCap,
  History,
  Loader2,
  RotateCcw,
  Sparkles,
  Trophy,
  User,
  Wand2,
  X,
} from "lucide-react";
import type { AiFullCvResult } from "@careerportal/shared/types";
import {
  useAiGenerateFullCv,
  useApplyCvContent,
  useRestoreCvSnapshot,
} from "@careerportal/web/data-access";
import { Button } from "@careerportal/web/ui";
import { showToast } from "../../../lib/toast";
import {
  AiLimitReachedCard,
  AiUsesLeft,
  EMPTY_AI_RESULT,
  aiErrorMessage,
  usePlanStatus,
} from "../../ai-assist";
import { toApplyCvContent } from "../lib/cv-content";

const RAW_TEXT_MAX = 20_000;
const RAW_TEXT_MIN = 20;
const JOB_TITLE_MAX = 200;
const JOB_DESCRIPTION_MAX = 10_000;

const SECTION_ICONS: Record<string, typeof Briefcase> = {
  profile: User,
  experience: Briefcase,
  education: GraduationCap,
  skills: Code2,
  projects: FileText,
  certifications: Trophy,
};

const CONTACT_PREVIEW: { key: keyof AiFullCvResult; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "github", label: "GitHub" },
  { key: "website", label: "Website" },
];

const PLACEHOLDER_TEXT = `Just dump everything here — messy is fine! For example:

"I'm John Smith, live in London, john@email.com. Worked at Google as a senior engineer for 3 years building search infrastructure in Go and Python, led a team of 4. Before that I was at a startup called Acme for 2 years doing full-stack React/Node stuff. I went to UCL and got a CS degree in 2018. I know TypeScript, React, Node, Python, Go, AWS, Docker, Kubernetes…"

The AI will turn this into a polished, structured CV with all sections filled out.`;

const inputClass =
  "w-full rounded-lg border border-accent-muted bg-white dark:bg-gray-800 px-3 py-2.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent";

interface RawTextCvPanelProps {
  versionId: string;
  /** Whether the CV already has content (applying replaces it). */
  hasContent: boolean;
  /** A previous apply can be undone (CvVersion.hasSnapshot). */
  hasSnapshot: boolean;
  /** Save pending edits before content is replaced; false aborts. */
  beforeReplace: () => Promise<boolean>;
  /** All sections were replaced (new ids): reset editors. */
  onReplaced: () => void;
}

/**
 * "Brain dump → full CV": the AI structures pasted text into contact details
 * and sections, which replace the CV's content in one transactional request.
 * The previous content is kept server-side and can be restored.
 */
export function RawTextCvPanel({
  versionId,
  hasContent,
  hasSnapshot,
  beforeReplace,
  onReplaced,
}: RawTextCvPanelProps) {
  const plan = usePlanStatus();
  const ids = useId();
  const generate = useAiGenerateFullCv({ silent: true });
  const apply = useApplyCvContent({ silent: true });
  const restore = useRestoreCvSnapshot();

  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<AiFullCvResult | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = generate.isPending || apply.isPending || restore.isPending;

  const handleGenerate = async () => {
    if (rawText.trim().length < RAW_TEXT_MIN || generate.isPending) return;
    setResult(null);
    setError(null);
    try {
      const res = await generate.mutateAsync({
        versionId,
        rawText: rawText.trim(),
        jobTitle: jobTitle.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      });
      const data = res.data as AiFullCvResult & { truncated?: boolean };
      if (!toApplyCvContent(data)) {
        setError(EMPTY_AI_RESULT);
        return;
      }
      setTruncated(data.truncated === true);
      setResult(data);
    } catch (err) {
      setError(aiErrorMessage(err));
    }
  };

  const handleApply = async () => {
    if (!result || busy) return;
    const body = toApplyCvContent(result);
    if (!body) {
      setError(EMPTY_AI_RESULT);
      return;
    }
    setError(null);
    if (!(await beforeReplace())) {
      setError("Some of your edits couldn't be saved yet. Fix or discard them, then apply again.");
      return;
    }
    try {
      await apply.mutateAsync({ versionId, ...body });
      onReplaced();
      setResult(null);
      setRawText("");
      setJobTitle("");
      setJobDescription("");
      setIsOpen(false);
      showToast("success", "Your CV was updated. Use “Restore previous content” to undo.");
    } catch (err) {
      setError(aiErrorMessage(err, "Couldn't apply the generated CV. Your CV was not changed."));
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    if (!(await beforeReplace())) {
      showToast("error", "Some of your edits couldn't be saved yet. Fix or discard them first.");
      return;
    }
    try {
      await restore.mutateAsync(versionId);
      onReplaced();
      showToast("success", "Previous content restored.");
    } catch {
      // Toasted by the global handler.
    }
  };

  const restoreButton = hasSnapshot && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void handleRestore()}
      loading={restore.isPending}
      disabled={busy && !restore.isPending}
      title="Swap your current sections with the ones you had before the last AI apply"
    >
      {!restore.isPending && <History className="h-3.5 w-3.5" aria-hidden="true" />}
      Restore previous content
    </Button>
  );

  if (!isOpen) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={false}
          className="group w-full rounded-xl border-2 border-primary-500/40 bg-gradient-to-r from-primary-500/10 to-primary-400/5 p-4 text-left hover:border-primary-500/70 hover:shadow-md hover:shadow-primary-500/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
              <Wand2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary">AI Brain Dump → Full CV</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                  AI
                </span>
                <AiUsesLeft meter={plan.aiMeter} isPremium={plan.isPremium} />
              </div>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                Paste everything about yourself — AI structures it into a full CV you can review before applying.
              </p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          </div>
        </button>
        {restoreButton && <div className="flex justify-end">{restoreButton}</div>}
      </div>
    );
  }

  if (!plan.hasAiUsesLeft && !result) {
    return (
      <div className="space-y-2">
        <AiLimitReachedCard meter={plan.aiMeter} onClose={() => setIsOpen(false)} />
        {restoreButton && <div className="flex justify-end">{restoreButton}</div>}
      </div>
    );
  }

  return (
    <section
      aria-label="AI brain dump"
      className="rounded-xl border border-primary-500/20 bg-primary-500/5 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-primary-500/10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
            <Wand2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">AI Brain Dump → Full CV</h3>
            <p className="text-[11px] text-text-secondary mt-0.5">Paste everything. Review, then apply.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AiUsesLeft meter={plan.aiMeter} isPremium={plan.isPremium} />
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setResult(null);
              setError(null);
            }}
            disabled={apply.isPending}
            aria-label="Close the brain dump"
            className="rounded-lg p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {!result && !generate.isPending && (
          <>
            <div className="flex gap-3 rounded-lg border border-accent-200 dark:border-accent-700 bg-accent-50 dark:bg-accent-900/20 p-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-accent-600 dark:text-accent-400 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-accent-800 dark:text-accent-200 leading-relaxed">
                <span className="font-semibold">Don't overthink it.</span> Work history, skills,
                education, projects, contact info — messy notes or a pasted LinkedIn profile are fine.
                {hasContent && (
                  <span className="block mt-1.5 font-medium text-amber-700 dark:text-amber-400">
                    Applying replaces your current sections. You can restore them afterwards.
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor={`${ids}-raw`} className="sr-only">
                Everything about you
              </label>
              <textarea
                id={`${ids}-raw`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                maxLength={RAW_TEXT_MAX}
                placeholder={PLACEHOLDER_TEXT}
                rows={10}
                aria-describedby={`${ids}-raw-count`}
                className={`${inputClass} rounded-xl px-4 py-3 text-sm resize-y leading-relaxed`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`${ids}-role`} className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                Target role <span className="normal-case font-normal">— optional</span>
              </label>
              <input
                id={`${ids}-role`}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                maxLength={JOB_TITLE_MAX}
                placeholder="e.g. Senior Frontend Engineer"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`${ids}-jd`} className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                Job description <span className="normal-case font-normal">— optional, tailors the wording</span>
              </label>
              <textarea
                id={`${ids}-jd`}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                maxLength={JOB_DESCRIPTION_MAX}
                placeholder="Paste the job description to tailor your profile, skills and wording…"
                rows={4}
                className={`${inputClass} resize-y leading-relaxed`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span id={`${ids}-raw-count`} className="text-[11px] text-text-tertiary tabular-nums">
                {rawText.length.toLocaleString("en-GB")}/{RAW_TEXT_MAX.toLocaleString("en-GB")} characters
                {rawText.trim().length > 0 && rawText.trim().length < 50 && (
                  <span className="text-amber-600 dark:text-amber-400 ml-1">— write more for better results</span>
                )}
              </span>
              <Button onClick={() => void handleGenerate()} disabled={rawText.trim().length < RAW_TEXT_MIN}>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Generate my CV
              </Button>
            </div>
          </>
        )}

        {generate.isPending && (
          <div role="status" className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" aria-hidden="true" />
            <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">AI is building your CV…</p>
            <p className="text-xs text-text-secondary">Extracting info, organising sections, polishing language</p>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="mt-2 text-xs font-medium text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5">
              <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                CV generated — review it below, then apply.
              </span>
            </div>
            {truncated && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Your text was long, so the AI only used the first part of it. Check nothing important is missing.
              </p>
            )}

            {CONTACT_PREVIEW.some(({ key }) => result[key]) && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2">
                  Contact info detected
                </p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700 dark:text-gray-300">
                  {CONTACT_PREVIEW.filter(({ key }) => result[key]).map(({ key, label }) => (
                    <div key={key} className="flex gap-1 min-w-0">
                      <dt className="text-text-tertiary">{label}:</dt>
                      <dd className="truncate">{String(result[key])}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {result.sections.map((s, i) => {
                const Icon = SECTION_ICONS[s.sectionType] || FileText;
                return (
                  <details
                    key={i}
                    className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden"
                  >
                    <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors select-none">
                      <Icon className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex-1">{s.title}</span>
                      <span className="text-[10px] text-text-tertiary tabular-nums">{s.content.length} chars</span>
                    </summary>
                    <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-700/50 pt-2">
                      <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed font-sans">
                        {s.content}
                      </pre>
                    </div>
                  </details>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button onClick={() => void handleApply()} loading={apply.isPending}>
                {!apply.isPending && <Check className="h-4 w-4" aria-hidden="true" />}
                {hasContent ? "Replace my CV with this" : "Apply to CV"}
              </Button>
              <Button variant="ghost" onClick={() => void handleGenerate()} disabled={busy}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Regenerate
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                disabled={apply.isPending}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Back to edit
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
