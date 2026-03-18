import { Button } from "@careerportal/web/ui";
import {
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Target,
  Lightbulb,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { TechTestScenario } from "@careerportal/shared/types";
import type { useTechTestState } from "../hooks/useTechTestState";

interface TechTestSessionProps {
  state: ReturnType<typeof useTechTestState>;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TechTestSession({ state }: TechTestSessionProps) {
  const test = state.activeTest;
  const [showBrief, setShowBrief] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!test) return null;

  const scenario = test.scenario as TechTestScenario;
  const totalSeconds = test.timeLimit * 60;
  const progress =
    totalSeconds > 0
      ? ((totalSeconds - state.timeRemaining) / totalSeconds) * 100
      : 0;
  const isLow = state.timeRemaining <= 300;
  const isCritical = state.timeRemaining <= 60;
  const wordCount = state.submission.split(/\s+/).filter(Boolean).length;

  const timerColor = isCritical
    ? "text-red-600 dark:text-red-400"
    : isLow
    ? "text-amber-600 dark:text-amber-400"
    : "text-gray-700 dark:text-gray-300";

  const progressColor = isCritical
    ? "bg-red-500"
    : isLow
    ? "bg-amber-500"
    : "bg-violet-600";

  return (
    <div className="w-full space-y-4">
      {/* ── Sticky timer bar ── */}
      <div className="sticky top-0 z-20 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="h-1 bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full ${progressColor} transition-all duration-1000 ease-linear`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex items-center gap-1.5 ${timerColor} ${
                isCritical ? "animate-pulse" : ""
              }`}
            >
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="text-base sm:text-lg font-mono font-bold tabular-nums">
                {formatTime(state.timeRemaining)}
              </span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-gray-200 dark:bg-gray-700" />
            <p className="hidden md:block text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">
              {scenario.title}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
              {wordCount} words
            </span>
            <button
              onClick={() => setShowBrief(!showBrief)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            >
              {showBrief ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">Brief</span>
            </button>
            <Button
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={state.submission.trim().length === 0}
            >
              <Send className="h-3 w-3 sm:mr-1.5" />
              <span className="hidden sm:inline">Submit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Brief panel ── */}
      {showBrief && (
        <div className="rounded-2xl border border-violet-200/50 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-950/20 p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-violet-500 dark:text-violet-400" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Problem Brief
              </h4>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {scenario.brief}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-violet-500 dark:text-violet-400" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Requirements ({scenario.requirements.length})
              </h4>
            </div>
            <div className="space-y-1.5">
              {scenario.requirements.map((req) => (
                <div
                  key={req.key}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span className="text-[10px] font-bold text-violet-500 bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                    {req.key}
                  </span>
                  <span className="text-xs leading-relaxed">{req.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-emerald-500" />
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Acceptance Criteria
                </h4>
              </div>
              <ul className="space-y-1">
                {scenario.acceptanceCriteria.map((ac, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs text-gray-500"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />{" "}
                    {ac}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Hints
                </h4>
              </div>
              <ul className="space-y-1">
                {scenario.hints.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs text-gray-500"
                  >
                    <Lightbulb className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{" "}
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Editor ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-800 gap-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Your Solution
            </h3>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Code, architecture decisions, trade-offs, testing strategy
          </p>
        </div>
        <textarea
          value={state.submission}
          onChange={(e) => state.setSubmission(e.target.value)}
          placeholder={`Write your solution here...\n\nSuggested structure:\n\n## Approach\nDescribe your high-level approach and architectural decisions.\n\n## Implementation\n\`\`\`typescript\n// Your code here\n\`\`\`\n\n## Trade-offs\nExplain the trade-offs you made and why.\n\n## Testing Strategy\nDescribe how you would test this solution.\n\n## What I'd Do Differently With More Time\n...`}
          className="w-full min-h-[50vh] sm:min-h-[60vh] p-4 sm:p-5 font-mono text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 outline-none resize-y placeholder:text-gray-300 dark:placeholder:text-gray-700"
          spellCheck={false}
        />
      </div>

      {/* ── Tip ── */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Tip:</strong> Include code snippets, explain your reasoning,
          discuss trade-offs, and mention your testing approach. Quality of
          explanation matters as much as code.
        </p>
      </div>

      {/* ── Submit confirmation modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl p-5 sm:p-6 max-w-md w-full space-y-4 animate-in fade-in scale-in duration-200">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Submit your solution?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You've written{" "}
              <strong className="text-gray-700 dark:text-gray-300">
                {wordCount} words
              </strong>{" "}
              with{" "}
              <strong className="text-gray-700 dark:text-gray-300">
                {formatTime(state.timeRemaining)}
              </strong>{" "}
              remaining. Once submitted, you cannot edit your solution.
            </p>
            {wordCount < 50 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Your submission is very short. Consider adding more detail for
                  a better evaluation.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2.5 justify-end">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                Keep Working
              </Button>
              <Button
                onClick={() => {
                  setShowConfirm(false);
                  state.handleSubmit();
                }}
                loading={state.isSubmitting}
              >
                <Send className="h-4 w-4 mr-1.5" /> Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
