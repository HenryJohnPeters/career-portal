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
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  StatCard,
  ResultBanner,
  ProgressRing,
  BackButton,
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
    track,
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
    <div className="w-full">
      {/* Top bar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={state.handleBackToSetup}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700 transition-all shadow-sm"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-gradient-to-r from-accent-dark to-indigo-600 text-white">
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
        <div className="flex items-center gap-2 flex-wrap">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-200/50 dark:border-orange-800/50">
              <Flame className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                {streak} streak
              </span>
            </div>
          )}
          <button
            onClick={state.handleResetQuiz}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>

      {/* Daily limit reached banner */}
      {(dailyLimitReached || dailyLimitError) && (
        <div className="mb-6 rounded-2xl border-2 border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-800/30 mb-4">
            <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-2">
            Daily Limit Reached
          </h3>
          <p className="text-sm text-amber-600/80 dark:text-amber-400/60 mb-1 max-w-md mx-auto">
            You've used all {practiceUsage?.limit ?? 10} free practice questions
            for today. Upgrade to Premium for unlimited practice with
            AI-generated questions.
          </p>
          {practiceUsage?.resetsAt && (
            <p className="text-xs text-amber-500/60 dark:text-amber-400/40 mb-6">
              Resets at midnight UTC ·{" "}
              {new Date(practiceUsage.resetsAt).toLocaleDateString()}
            </p>
          )}
          <div className="flex justify-center gap-3">
            <NavLink
              to="/app/billing"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
            >
              <Crown className="h-4 w-4" /> Upgrade to Premium
            </NavLink>
            <button
              onClick={state.handleBackToSetup}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            >
              Back to Setup
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={CheckCircle2} value={score.correct} label="Correct" />
        <StatCard icon={BookOpen} value={score.total} label="Answered" />
        <StatCard icon={Flame} value={bestStreak} label="Best Streak" />
        <StatCard icon={Trophy} value={`${accuracy}%`} label="Accuracy" />
      </div>

      {/* Progress bar */}
      {score.total > 0 && (
        <div className="mb-6">
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                accuracy >= 70
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  : accuracy >= 40
                  ? "bg-gradient-to-r from-amber-400 to-amber-500"
                  : "bg-gradient-to-r from-red-400 to-red-500"
              }`}
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>
      )}

      {/* Main content grid — only show if limit not reached */}
      {!dailyLimitReached && !dailyLimitError && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            {/* Loading */}
            {isLoadingNext && <LoadingPlaceholder />}

            {/* No questions */}
            {!isLoadingNext && !currentQuestion && (
              <EmptyQuestionState
                onReset={state.handleResetQuiz}
                onChangeFilters={state.handleBackToSetup}
              />
            )}

            {/* Active question (unanswered) */}
            {currentQuestion && !result && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <QuestionCard
                  prompt={currentQuestion.prompt}
                  tags={currentQuestion.tags}
                  questionNumber={score.total + 1}
                  level={level}
                  levelMeta={levelMeta}
                  isMultiSelect={isMultiSelect}
                />

                <div className="grid grid-cols-1 gap-2.5">
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
                  className="w-full bg-gradient-to-r from-accent-dark to-indigo-600 hover:opacity-90 text-white border-0 shadow-lg shadow-accent/10 disabled:opacity-40 disabled:shadow-none"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isMultiSelect
                    ? `Check ${selectedOptionIndices.length} Answer${
                        selectedOptionIndices.length !== 1 ? "s" : ""
                      }`
                    : "Check Answer"}
                </Button>
              </div>
            )}

            {/* Result view */}
            {currentQuestion && result && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                  className="w-full bg-gradient-to-r from-accent-dark to-indigo-600 hover:opacity-90 text-white border-0 shadow-lg shadow-accent/10"
                >
                  Next Question <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Session Stats
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
                    label="Current Streak"
                    value={streak}
                    className="text-orange-600 dark:text-orange-400"
                    icon={
                      streak > 0 ? <Flame className="h-3 w-3" /> : undefined
                    }
                  />
                  <SidebarStat
                    label="Best Streak"
                    value={bestStreak}
                    className="text-amber-600 dark:text-amber-400"
                    icon={<Trophy className="h-3 w-3" />}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Configuration
                </p>
                <div className="space-y-1.5">
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
                  className="mt-3 w-full text-xs font-medium text-accent hover:underline flex items-center justify-center gap-1"
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

/* ── Local sub-components ── */

function LoadingPlaceholder() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-16 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted mb-4 animate-pulse">
        <Sparkles className="h-7 w-7 text-accent" />
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
    <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-20 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted mb-4">
        <Sparkles className="h-7 w-7 text-accent" />
      </div>
      <p className="text-base font-semibold text-gray-600 dark:text-gray-400">
        No questions match your filters
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-6 max-w-sm mx-auto">
        Try adjusting your track or level settings to find more questions
      </p>
      <div className="flex justify-center gap-3">
        <Button onClick={onReset} variant="ghost" size="sm">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset & Retry
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
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      <div className="h-1 bg-gradient-to-r from-accent-dark to-indigo-600" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            Q{questionNumber}
          </span>
          <span
            className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              LEVEL_CHIP_STYLES[level] ?? ""
            }`}
          >
            {levelMeta.icon} {levelMeta.label}
          </span>
          {isMultiSelect && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
              <ListChecks className="h-3 w-3" /> Multi-select
            </span>
          )}
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
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
  const colorBase = isMultiSelect ? "violet" : "blue";
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 flex items-start gap-3.5 group ${
        isSelected
          ? `border-${colorBase}-500 bg-${colorBase}-50 dark:bg-${colorBase}-950/30 ring-1 ring-${colorBase}-400/20 shadow-md shadow-${colorBase}-500/5`
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all ${
          isSelected
            ? `bg-${colorBase}-600 text-white shadow-sm shadow-${colorBase}-500/30`
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
        }`}
      >
        {isMultiSelect ? (
          isSelected ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <span className="h-4 w-4 rounded border-2 border-gray-300 dark:border-gray-600 block" />
          )
        ) : (
          String.fromCharCode(65 + index)
        )}
      </span>
      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
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
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Question
          </p>
          {multiSelect && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
              <ListChecks className="h-2.5 w-2.5" /> Multi-select
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
          {prompt}
        </p>
      </div>
      <div className="p-5 space-y-2">
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
              className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${
                isCorrectOption
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
                  : isWrongSelection
                  ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
                  : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isCorrectOption
                    ? "bg-emerald-500 text-white"
                    : isWrongSelection
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                }`}
              >
                {isCorrectOption ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : isWrongSelection ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : (
                  String.fromCharCode(65 + idx)
                )}
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm leading-relaxed ${
                    isCorrectOption
                      ? "text-emerald-700 dark:text-emerald-400 font-medium"
                      : isWrongSelection
                      ? "text-red-600 dark:text-red-400 line-through opacity-75"
                      : "text-gray-500 dark:text-gray-500"
                  }`}
                >
                  {option}
                </span>
                {isCorrectOption && wasSelected && (
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
                    ✓ Correct
                  </span>
                )}
                {isMissedCorrect && (
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    ✓ Correct (missed)
                  </span>
                )}
                {isWrongSelection && (
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-red-500">
                    ✗ Your pick
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
    <div className="rounded-2xl border border-accent/20 bg-accent-muted/50 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-muted">
          <BookOpen className="h-4 w-4 text-accent" />
        </div>
        <div>
          <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1.5">
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
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-bold ${className} flex items-center gap-1`}>
        {icon}
        {value}
      </span>
    </div>
  );
}
