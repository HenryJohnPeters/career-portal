import { useState } from "react";
import {
  Sparkles,
  X,
  Loader2,
  Check,
  RotateCcw,
  Crown,
  Wand2,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Code2,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { Button } from "@careerportal/web/ui";
import {
  useAiGenerateFullCv,
  useCreateCvSection,
  useUpdateCvVersion,
  useDeleteCvSection,
  useAiUsage,
} from "@careerportal/web/data-access";
import type { AiFullCvResult } from "@careerportal/web/data-access";
import { useAuth } from "../../../lib/auth";
import { useNavigate } from "react-router-dom";
import type { CvSection } from "@careerportal/shared/types";

const SECTION_ICONS: Record<string, typeof Briefcase> = {
  profile: User,
  experience: Briefcase,
  education: GraduationCap,
  skills: Code2,
  projects: FileText,
  certifications: Trophy,
};

const PLACEHOLDER_TEXT = `Just dump everything here — messy is fine! For example:

"I'm John Smith, live in London, john@email.com. Worked at Google as a senior engineer for 3 years building search infrastructure in Go and Python, led a team of 4. Before that I was at a startup called Acme for 2 years doing full-stack React/Node stuff. I went to UCL and got a CS degree in 2018. I know TypeScript, React, Node, Python, Go, AWS, Docker, Kubernetes. I built a side project called DevTrack that got 2k users — it's a developer productivity tool. I also have an AWS Solutions Architect cert. I speak English natively and conversational Spanish."

The AI will turn this into a polished, structured CV with all sections filled out.`;

interface RawTextCvPanelProps {
  versionId: string;
  existingSections: CvSection[];
  onComplete: () => void;
}

export function RawTextCvPanel({
  versionId,
  existingSections,
  onComplete,
}: RawTextCvPanelProps) {
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const { data: usageData } = useAiUsage();
  const usage = usageData?.data;
  const hasUsesLeft = isPremium || (usage?.remaining ?? 1) > 0;
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [result, setResult] = useState<AiFullCvResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState("");

  const generateFullCv = useAiGenerateFullCv();
  const createSection = useCreateCvSection();
  const updateVersion = useUpdateCvVersion();
  const deleteSection = useDeleteCvSection();

  const handleGenerate = async () => {
    if (!rawText.trim()) return;
    setResult(null);
    setError(null);

    try {
      const res = await generateFullCv.mutateAsync({
        versionId,
        rawText: rawText.trim(),
        jobTitle: jobTitle.trim() || undefined,
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to generate CV. Please try again.");
    }
  };

  const handleApply = async () => {
    if (!result) return;
    setIsApplying(true);

    try {
      // 1. Update contact info on the version
      const contactFields: Record<string, string> = {};
      if (result.name) contactFields.name = result.name;
      if (result.email) contactFields.email = result.email;
      if (result.phone) contactFields.phone = result.phone;
      if (result.location) contactFields.location = result.location;
      if (result.website) contactFields.website = result.website;
      if (result.linkedin) contactFields.linkedin = result.linkedin;
      if (result.github) contactFields.github = result.github;

      if (Object.keys(contactFields).length > 0) {
        setApplyProgress("Updating contact info…");
        await updateVersion.mutateAsync({ id: versionId, ...contactFields });
      }

      // 2. Delete existing sections (replacing the whole CV)
      if (existingSections.length > 0) {
        setApplyProgress("Clearing old sections…");
        for (const section of existingSections) {
          await deleteSection.mutateAsync(section.id);
        }
      }

      // 3. Create each AI-generated section
      for (let i = 0; i < result.sections.length; i++) {
        const s = result.sections[i];
        setApplyProgress(
          `Creating section ${i + 1}/${result.sections.length}: ${s.title}…`
        );
        await createSection.mutateAsync({
          versionId,
          title: s.title,
          content: s.content,
          sectionType: s.sectionType,
        });
      }

      setApplyProgress("");
      setIsApplying(false);
      setResult(null);
      setRawText("");
      setJobTitle("");
      setIsOpen(false);
      onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to apply CV sections.");
      setIsApplying(false);
      setApplyProgress("");
    }
  };

  // Collapsed button state
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="group w-full rounded-xl border-2 border-dashed border-accent-muted dark:border-accent-muted/60 bg-gradient-to-r from-accent-muted/20 to-accent-muted/10 dark:from-accent-muted/10 dark:to-accent-muted/5 p-5 text-left hover:border-accent-dark/50 dark:hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-dark to-accent text-white shadow-md shadow-accent/20 group-hover:shadow-lg group-hover:shadow-accent/30 transition-shadow">
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-accent-dark dark:group-hover:text-accent transition-colors">
                AI Brain Dump → Full CV
              </h3>
              {!isPremium && usage && (
                <span className="text-[9px] font-medium text-accent-light dark:text-accent-light">
                  {usage.remaining}/{usage.limit} uses
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Paste{" "}
              <span className="font-medium text-accent-dark dark:text-accent">
                everything
              </span>{" "}
              you know about yourself in one big text dump — your jobs, skills,
              education, projects, anything. AI will sort it all out into a
              polished, ready-to-use CV. No formatting needed.
            </p>
          </div>
          <Sparkles className="h-5 w-5 shrink-0 text-accent-light dark:text-accent-light group-hover:text-accent dark:group-hover:text-accent transition-colors mt-1" />
        </div>
      </button>
    );
  }

  // Free tier cap reached
  if (!hasUsesLeft) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Monthly Limit Reached
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-amber-800 dark:text-amber-200 mb-1">
          You've used all {usage?.limit} free AI uses this month. Upgrade to
          Premium for unlimited AI-powered tools.
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
          Upgrade to Premium
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent-muted dark:border-accent-muted bg-gradient-to-br from-accent-muted/30 to-accent-muted/20 dark:from-accent-muted/10 dark:to-accent-muted/5 shadow-lg shadow-accent/5 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-accent-muted dark:border-accent-muted/50">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-dark to-accent text-white shadow-sm">
            <Wand2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              AI Brain Dump → Full CV
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              Paste everything. We'll handle the rest.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isPremium && usage && (
            <span className="text-[10px] font-medium text-accent-light dark:text-accent-light">
              {usage.remaining}/{usage.limit} uses left
            </span>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              setResult(null);
              setError(null);
            }}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Input phase */}
        {!result && !generateFullCv.isPending && (
          <>
            {/* Helper callout */}
            <div className="flex gap-3 rounded-lg border border-accent-muted dark:border-accent-muted/40 bg-white/60 dark:bg-gray-800/40 p-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-accent-light mt-0.5" />
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="font-semibold text-accent-dark dark:text-accent">
                  Don't overthink it.
                </span>{" "}
                Just brain-dump everything — your work history, skills,
                education, projects, certifications, contact info, anything at
                all. Messy notes, bullet points, full sentences, copy-pasted
                LinkedIn — all fine. The AI will extract, organise, and rewrite
                it into a professional CV.
                {existingSections.some((s) => s.content.trim()) && (
                  <span className="block mt-1.5 font-medium text-amber-600 dark:text-amber-400">
                    ⚠ This will replace all your existing sections.
                  </span>
                )}
              </div>
            </div>

            {/* Raw text area */}
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={PLACEHOLDER_TEXT}
              rows={10}
              className="w-full rounded-xl border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent transition-shadow resize-y leading-relaxed"
            />

            {/* Optional job title */}
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Target role (e.g. Senior Frontend Engineer) — optional, helps tailor the profile"
              className="w-full rounded-lg border border-accent-muted dark:border-accent-muted bg-white dark:bg-gray-800 px-3 py-2.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent transition-shadow"
            />

            {/* Character count + generate */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {rawText.length.toLocaleString()} characters
                {rawText.length > 0 && rawText.length < 50 && (
                  <span className="text-amber-500 ml-1">
                    — write more for better results
                  </span>
                )}
              </span>
              <Button
                onClick={handleGenerate}
                disabled={rawText.trim().length < 20}
                className={rawText.trim().length < 20 ? "opacity-50" : ""}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate My CV
              </Button>
            </div>
          </>
        )}

        {/* Loading state */}
        {generateFullCv.isPending && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-dark to-accent flex items-center justify-center shadow-lg shadow-accent/30">
                <Sparkles className="h-7 w-7 text-white animate-pulse" />
              </div>
              <Loader2 className="absolute -top-2 -right-2 h-6 w-6 text-accent-dark animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-accent-dark dark:text-accent">
                AI is building your CV…
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Extracting info, organising sections, polishing language
              </p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-accent-light animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Result preview */}
        {result && !isApplying && (
          <div className="space-y-4">
            {/* Success banner */}
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                CV generated! Review below then apply.
              </span>
            </div>

            {/* Contact info preview */}
            {(result.name ||
              result.email ||
              result.phone ||
              result.location) && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                  Contact Info Detected
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700 dark:text-gray-300">
                  {result.name && (
                    <p>
                      <span className="text-gray-400">Name:</span> {result.name}
                    </p>
                  )}
                  {result.email && (
                    <p>
                      <span className="text-gray-400">Email:</span>{" "}
                      {result.email}
                    </p>
                  )}
                  {result.phone && (
                    <p>
                      <span className="text-gray-400">Phone:</span>{" "}
                      {result.phone}
                    </p>
                  )}
                  {result.location && (
                    <p>
                      <span className="text-gray-400">Location:</span>{" "}
                      {result.location}
                    </p>
                  )}
                  {result.linkedin && (
                    <p>
                      <span className="text-gray-400">LinkedIn:</span>{" "}
                      {result.linkedin}
                    </p>
                  )}
                  {result.github && (
                    <p>
                      <span className="text-gray-400">GitHub:</span>{" "}
                      {result.github}
                    </p>
                  )}
                  {result.website && (
                    <p>
                      <span className="text-gray-400">Website:</span>{" "}
                      {result.website}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sections preview */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {result.sections.map((s, i) => {
                const Icon = SECTION_ICONS[s.sectionType] || FileText;
                return (
                  <details
                    key={i}
                    className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden"
                  >
                    <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors select-none">
                      <Icon className="h-4 w-4 text-accent shrink-0" />
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex-1">
                        {s.title}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
                        {s.content.length} chars
                      </span>
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

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handleApply}>
                <Check className="h-4 w-4 mr-1.5" />
                Apply to CV
                {existingSections.some((s) => s.content.trim()) &&
                  " (Replaces All)"}
              </Button>
              <Button
                variant="ghost"
                onClick={handleGenerate}
                disabled={generateFullCv.isPending}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Regenerate
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Back to Edit
              </Button>
            </div>
          </div>
        )}

        {/* Applying state */}
        {isApplying && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-8 w-8 text-accent-dark animate-spin" />
            <p className="text-sm font-medium text-accent-dark dark:text-accent">
              Applying your new CV…
            </p>
            {applyProgress && (
              <p className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
                {applyProgress}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
