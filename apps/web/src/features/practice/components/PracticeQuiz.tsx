import { Button } from "@careerportal/web/ui";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Flame,
  RotateCcw,
  Filter,
  Sparkles,
  Trophy,
  BookOpen,
  Hash,
  ListChecks,
  Lock,
  Crown,
  ArrowLeft,
  Target,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  ResultBanner,
  ProgressRing,
  LEVEL_META,
  LEVEL_BADGE_STYLES,
  LEVEL_CHIP_STYLES,
} from "../../shared";
import type { PracticeState } from "../types";
import { ROLE_FOCUS_ITEMS } from "../../interview-prep/constants";

interface PracticeQuizProps {
  state: PracticeState;
}

export function PracticeQuiz({ state }: PracticeQuizProps) {
  const {
    level,
    roleFocus,
    selectedTags,
    currentQuestion,
    selectedOptionIndex,
    selectedOptionIndices,
    result,
    score,
    streak,
    bestStreak,
    accuracy,
    isLoadingNext,
    isChecking,
    isMultiSelect,
    hasSelection,
    dailyLimitReached,
    dailyLimitError,
    practiceUsage,
  } = state;

  const roleMeta = ROLE_FOCUS_ITEMS.find((r) => r.key === roleFocus);
  const levelMeta = LEVEL_META[level] ?? LEVEL_META.mid;
  const resultCorrectIndices = result
    ? result.correctOptionIndices ?? [result.correctOptionIndex]
    : [];

  return (
    <div className="w-full space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <button
            onClick={state.handleBackToSetup}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-600 text-white shadow-sm">
            {roleMeta?.icon ?? "🔗"} {roleMeta?.label ?? "Fullstack"}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${
              LEVEL_BADGE_STYLES[level] ?? ""
            }`}
          >
            {levelMeta.icon} {levelMeta.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40">
              <Flame className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                {streak} streak
              </span>
            </div>
          )}
          <button
            onClick={state.handleResetQuiz}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>

      {/* Daily limit */}
      {(dailyLimitReached || dailyLimitError) && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-800/30 mb-4">
            <Lock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-base font-bold text-amber-900 dark:text-amber-200 mb-1.5">
            Daily Limit Reached
          </h3>
          <p className="text-sm text-amber-700/80 dark:text-amber-400/70 mb-1 max-w-sm mx-auto">
            You've used all {practiceUsage?.limit ?? 10} free questions today.
          </p>
          {practiceUsage?.resetsAt && (
            <p className="text-xs text-amber-500/70 dark:text-amber-400/50 mb-5">
              Resets midnight UTC ·{" "}
              {new Date(practiceUsage.resetsAt).toLocaleDateString()}
            </p>
          )}
          <div className="flex justify-center gap-3">
            <NavLink
              to="/app/billing"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 px-5 py-2.5 text-sm font-bold text-white transition-colors shadow-sm"
            >
              <Crown className="h-4 w-4" /> Upgrade to Premium
            </NavLink>
            <button
              onClick={state.handleBackToSetup}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-gray-300 transition-all"
            >
              Back to Setup
            </button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2.5">
        <StatPill
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          value={score.correct}
          label="Correct"
          color="text-emerald-600 dark:text-emerald-400"
        />
        <StatPill
          icon={<Target className="h-3.5 w-3.5 text-primary-500" />}
          value={score.total}
          label="Total"
          color="text-primary-600 dark:text-primary-400"
        />
        <StatPill
          icon={<Flame className="h-3.5 w-3.5 text-orange-500" />}
          value={bestStreak}
          label="Best"
          color="text-orange-600 dark:text-orange-400"
        />
        <StatPill
          icon={<Trophy className="h-3.5 w-3.5 text-amber-500" />}
          value={`${accuracy}%`}
          label="Accuracy"
          color="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Accuracy bar */}
      {score.total > 0 && (
        <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              accuracy >= 70
                ? "bg-emerald-500"
                : accuracy >= 40
                ? "bg-amber-500"
                : "bg-red-400"
            }`}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      )}

      {/* Main content */}
      {!dailyLimitReached && !dailyLimitError && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          <div>
            {isLoadingNext && <LoadingPlaceholder />}

            {!isLoadingNext && !currentQuestion && (
              <EmptyQuestionState
                onReset={state.handleResetQuiz}
                onChangeFilters={state.handleBackToSetup}
              />
            )}

            {currentQuestion && !result && (
              <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <QuestionCard
                  prompt={currentQuestion.prompt}
                  tags={currentQuestion.tags}
                  questionNumber={score.total + 1}
                  level={level}
                  levelMeta={levelMeta}
                  isMultiSelect={isMultiSelect}
                />
                <div className="space-y-2">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = isMultiSelect
                      ? selectedOptionIndices.includes(idx)
                      : selectedOptionIndex === idx;
                    return (
                      <QuizOption
                        key={idx}
                        index={idx}
                        text={option}
                        isSelected={isSelected}
                        isMultiSelect={isMultiSelect}
                        onSelect={() =>
                          isMultiSelect
                            ? state.toggleMultiOption(idx)
                            : state.setSelectedOptionIndex(idx)
                        }
                      />
                    );
                  })}
                </div>
                <Button
                  size="lg"
                  onClick={state.handleSubmitAnswer}
                  loading={isChecking}
                  disabled={!hasSelection}
                  className="w-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isMultiSelect
                    ? `Submit ${selectedOptionIndices.length} Answer${
                        selectedOptionIndices.length !== 1 ? "s" : ""
                      }`
                    : "Submit Answer"}
                </Button>
              </div>
            )}

            {currentQuestion && result && (
              <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ResultBanner isCorrect={result.isCorrect} streak={streak} />
                <AnswerReview
                  prompt={currentQuestion.prompt}
                  options={currentQuestion.options}
                  isMultiSelect={isMultiSelect}
                  resultCorrectIndices={resultCorrectIndices}
                  selectedOptionIndex={selectedOptionIndex}
                  selectedOptionIndices={selectedOptionIndices}
                  multiSelect={result.multiSelect}
                />
                {result.explanation && (
                  <ExplanationCard explanation={result.explanation} />
                )}
                <Button
                  size="lg"
                  onClick={state.handleNextQuestion}
                  loading={isLoadingNext}
                  className="w-full"
                >
                  Next Question <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-3">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Session
                </p>
                <ProgressRing percentage={accuracy} />
                <div className="space-y-2.5">
                  <SidebarStat
                    label="Correct"
                    value={score.correct}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  <SidebarStat
                    label="Wrong"
                    value={score.total - score.correct}
                    className="text-red-500 dark:text-red-400"
                  />
                  <SidebarStat
                    label="Streak"
                    value={streak}
                    className="text-orange-600 dark:text-orange-400"
                    icon={
                      streak > 0 ? <Flame className="h-3 w-3" /> : undefined
                    }
                  />
                  <SidebarStat
                    label="Best"
                    value={bestStreak}
                    className="text-amber-600 dark:text-amber-400"
                    icon={<Trophy className="h-3 w-3" />}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                  Filters
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>{roleMeta?.icon ?? "🔗"}</span>
                    <span>{roleMeta?.label ?? "Fullstack"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>{levelMeta.icon}</span>
                    <span>{levelMeta.label}</span>
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Hash className="h-3 w-3" />
                      <span>
                        {selectedTags.length} topic
                        {selectedTags.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={state.handleBackToSetup}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline underline-offset-2"
                >
                  <Filter className="h-3 w-3" /> Change Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Local components ── */

function StatPill({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 px-2">
      {icon}
      <span
        className={`text-base font-black ${color} tabular-nums leading-none`}
      >
        {value}
      </span>
      <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-16 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20 mb-3 animate-pulse">
        <Sparkles className="h-6 w-6 text-primary-500" />
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        Generating your next question…
      </p>
    </div>
  );
}

function EmptyQuestionState({
  onReset,
  onChangeFilters,
}: {
  onReset: () => void;
  onChangeFilters: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-3">
        <Sparkles className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
        No questions match your filters
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-5 max-w-xs mx-auto">
        Try adjusting your role, level, or topics
      </p>
      <div className="flex justify-center gap-2.5">
        <Button onClick={onReset} variant="ghost" size="sm">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
        </Button>
        <Button onClick={onChangeFilters} size="sm">
          <Filter className="h-3.5 w-3.5 mr-1.5" /> Change Filters
        </Button>
      </div>
    </div>
  );
}

function QuestionCard({
  prompt,
  tags,
  questionNumber,
  level,
  levelMeta,
  isMultiSelect,
}: {
  prompt: string;
  tags: string[];
  questionNumber: number;
  level: string;
  levelMeta: { icon: string; label: string };
  isMultiSelect: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      <div className="h-0.5 bg-gradient-to-r from-primary-500 to-primary-600" />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            Q{questionNumber}
          </span>
          <span
            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md ${
              LEVEL_CHIP_STYLES[level] ?? ""
            }`}
          >
            {levelMeta.icon} {levelMeta.label}
          </span>
          {isMultiSelect && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
              <ListChecks className="h-3 w-3" /> Multi-select
            </span>
          )}
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/60 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-700/50"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
          {prompt}
        </p>
        {isMultiSelect && (
          <p className="mt-2 text-xs text-violet-500 dark:text-violet-400 flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5" /> Select all answers that apply
          </p>
        )}
      </div>
    </div>
  );
}

function QuizOption({
  index,
  text,
  isSelected,
  isMultiSelect,
  onSelect,
}: {
  index: number;
  text: string;
  isSelected: boolean;
  isMultiSelect: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-3.5 transition-all duration-150 flex items-start gap-3 group ${
        isSelected
          ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 shadow-sm"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
          isSelected
            ? "bg-primary-600 text-white shadow-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 group-hover:text-gray-900 dark:group-hover:text-gray-100"
        }`}
      >
        {isMultiSelect ? (
          isSelected ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <span className="h-3.5 w-3.5 rounded border-2 border-gray-400 dark:border-gray-500 block" />
          )
        ) : (
          String.fromCharCode(65 + index)
        )}
      </span>
      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">
        {text}
      </span>
    </button>
  );
}

function AnswerReview({
  prompt,
  options,
  isMultiSelect,
  resultCorrectIndices,
  selectedOptionIndex,
  selectedOptionIndices,
  multiSelect,
}: {
  prompt: string;
  options: string[];
  isMultiSelect: boolean;
  resultCorrectIndices: number[];
  selectedOptionIndex: number | null;
  selectedOptionIndices: number[];
  multiSelect: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
          Question
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
          {prompt}
        </p>
      </div>
      <div className="p-4 space-y-2">
        {options.map((option, idx) => {
          const isCorrectOption = resultCorrectIndices.includes(idx);
          const wasSelected = isMultiSelect
            ? selectedOptionIndices.includes(idx)
            : idx === selectedOptionIndex;
          const isWrongSelection = wasSelected && !isCorrectOption;
          const isMissedCorrect = isCorrectOption && !wasSelected;
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl border ${
                isCorrectOption
                  ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20"
                  : isWrongSelection
                  ? "border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20"
                  : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isCorrectOption
                    ? "bg-emerald-500 text-white"
                    : isWrongSelection
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                }`}
              >
                {isCorrectOption ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : isWrongSelection ? (
                  <XCircle className="h-3 w-3" />
                ) : (
                  String.fromCharCode(65 + idx)
                )}
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm leading-relaxed ${
                    isCorrectOption
                      ? "text-emerald-700 dark:text-emerald-300 font-medium"
                      : isWrongSelection
                      ? "text-red-600 dark:text-red-400 line-through opacity-70"
                      : "text-gray-500 dark:text-gray-500"
                  }`}
                >
                  {option}
                </span>
                {isCorrectOption && wasSelected && (
                  <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                    {" "}
                    ✓ Correct
                  </span>
                )}
                {isMissedCorrect && (
                  <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-amber-600">
                    {" "}
                    ✓ Missed
                  </span>
                )}
                {isWrongSelection && (
                  <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-red-500">
                    {" "}
                    ✗ Wrong
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExplanationCard({ explanation }: { explanation: string }) {
  return (
    <div className="rounded-2xl border border-primary-200/60 dark:border-primary-800/40 bg-primary-50/60 dark:bg-primary-950/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
          <BookOpen className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-1.5">
            Explanation
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {explanation}
          </p>
        </div>
      </div>
    </div>
  );
}

function SidebarStat({
  label,
  value,
  className,
  icon,
}: {
  label: string;
  value: number;
  className: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`text-sm font-bold ${className} flex items-center gap-1`}
      >
        {icon}
        {value}
      </span>
    </div>
  );
}
