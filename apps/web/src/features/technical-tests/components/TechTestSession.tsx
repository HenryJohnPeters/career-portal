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
  const isLow = state.timeRemaining <= 300; // 5 min
  const isCritical = state.timeRemaining <= 60; // 1 min
  const wordCount = state.submission.split(/\s+/).filter(Boolean).length;

  const timerColor = isCritical
    ? "text-red-600 dark:text-red-400"
    : isLow
    ? "text-amber-600 dark:text-amber-400"
    : "text-gray-700 dark:text-gray-300";

  const timerBg = isCritical
    ? "bg-red-500"
    : isLow
    ? "bg-amber-500"
    : "bg-violet-600";

  return (
    <div className="w-full space-y-4">
      {/* Timer bar */}
      <div className="sticky top-0 z-20 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full ${timerBg} transition-all duration-1000 ease-linear`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${timerColor} ${
                isCritical ? "animate-pulse" : ""
              }`}
            >
              <Clock className="h-4 w-4" />
              <span className="text-lg font-mono font-bold">
                {formatTime(state.timeRemaining)}
              </span>
            </div>
            <div className="hidden sm:block h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {scenario.title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {wordCount} words
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowBrief(!showBrief)}
            >
              {showBrief ? (
                <ChevronUp className="h-3 w-3 mr-1" />
              ) : (
                <ChevronDown className="h-3 w-3 mr-1" />
              )}
              Brief
            </Button>
            <Button
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={state.submission.trim().length === 0}
            >
              <Send className="h-3 w-3 mr-1" /> Submit
            </Button>
          </div>
        </div>
      </div>

      {/* Collapsible brief reference */}
      {showBrief && (
        <div className="rounded-2xl border border-violet-200/50 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/20 p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <h4 className="text-sm font-semibold text-violet-800 dark:text-violet-300">
                Problem Brief
              </h4>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {scenario.brief}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <h4 className="text-sm font-semibold text-violet-800 dark:text-violet-300">
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
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Acceptance Criteria
                </h4>
              </div>
              <ul className="space-y-1">
                {scenario.acceptanceCriteria.map((ac, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-500 flex items-start gap-1.5"
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
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Hints
                </h4>
              </div>
              <ul className="space-y-1">
                {scenario.hints.map((h, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-500 flex items-start gap-1.5"
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

      {/* Editor area */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Your Solution
            </h3>
          </div>
          <p className="text-xs text-gray-400">
            Write your code, architecture decisions, explanations, and
            trade-offs. Markdown and code blocks supported.
          </p>
        </div>
        <textarea
          value={state.submission}
          onChange={(e) => state.setSubmission(e.target.value)}
          placeholder={`Write your solution here...\n\nSuggested structure:\n\n## Approach\nDescribe your high-level approach and architectural decisions.\n\n## Implementation\n\`\`\`typescript\n// Your code here\n\`\`\`\n\n## Trade-offs\nExplain the trade-offs you made and why.\n\n## Testing Strategy\nDescribe how you would test this solution.\n\n## What I'd Do Differently With More Time\n...`}
          className="w-full min-h-[60vh] p-5 font-mono text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 outline-none resize-y placeholder:text-gray-300 dark:placeholder:text-gray-700"
          spellCheck={false}
        />
      </div>

      {/* Bottom tip */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Tip:</strong> Include code snippets, explain your reasoning,
          discuss trade-offs, and mention your testing approach. Quality of
          explanation matters as much as code.
        </p>
      </div>

      {/* Submit confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6 max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Submit your solution?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You've written <strong>{wordCount} words</strong> with{" "}
              <strong>{formatTime(state.timeRemaining)}</strong> remaining. Once
              submitted, you cannot edit your solution.
            </p>
            {wordCount < 50 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Your submission is very short. Consider adding more detail for
                  a better evaluation.
                </p>
              </div>
            )}
            <div className="flex items-center gap-3 justify-end">
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
                <Send className="h-4 w-4 mr-2" /> Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
