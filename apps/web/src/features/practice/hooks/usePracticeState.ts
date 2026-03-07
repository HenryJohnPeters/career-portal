import { useState, useCallback } from "react";
import {
  usePracticeNext,
  usePracticeCheck,
  usePracticeOptions,
  usePracticeUsage,
} from "@careerportal/web/data-access";
import type {
  PracticeQuestion,
  PracticeCheckResult,
  InterviewTrack,
  InterviewLevel,
  InterviewRoleFocus,
} from "@careerportal/shared/types";
import type { PracticeView, PracticeState } from "../types";
import { getTagsForRole } from "../../interview-prep/constants";
import { LEVEL_TO_DIFFICULTY } from "../../shared";

/** Map roleFocus → InterviewTrack for the practice API */
const ROLE_TO_TRACK: Record<InterviewRoleFocus, InterviewTrack> = {
  frontend: "frontend",
  backend: "backend",
  fullstack: "fullstack",
  platform: "devops",
};

export function usePracticeState(): PracticeState {
  const [view, setView] = useState<PracticeView>("setup");
  const [roleFocus, setRoleFocusRaw] =
    useState<InterviewRoleFocus>("fullstack");
  const [track, setTrackRaw] = useState<InterviewTrack>("fullstack");
  const [level, setLevel] = useState<InterviewLevel>("mid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [currentQuestion, setCurrentQuestion] =
    useState<PracticeQuestion | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null
  );
  const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>(
    []
  );
  const [result, setResult] = useState<PracticeCheckResult | null>(null);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [dailyLimitError, setDailyLimitError] = useState<string | null>(null);

  const {
    data: optionsData,
    isLoading: isLoadingOptions,
    isError,
    error,
    refetch,
  } = usePracticeOptions();
  const { data: usageData } = usePracticeUsage();
  const practiceNext = usePracticeNext();
  const practiceCheck = usePracticeCheck();

  const options = optionsData?.data;
  const practiceUsage = usageData?.data;
  const isMultiSelect = currentQuestion?.multiSelect ?? false;
  const hasSelection = isMultiSelect
    ? selectedOptionIndices.length > 0
    : selectedOptionIndex !== null;
  const accuracy =
    score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  // Daily limit check
  const dailyLimitReached = !!(
    practiceUsage &&
    !practiceUsage.isPremium &&
    practiceUsage.remaining !== null &&
    practiceUsage.remaining <= 0
  );

  const resetSelection = () => {
    setSelectedOptionIndex(null);
    setSelectedOptionIndices([]);
    setResult(null);
  };

  /**
   * When the role focus changes, derive track and keep only
   * tags that exist in the new role's pathways.
   */
  const setRoleFocus = useCallback((next: InterviewRoleFocus) => {
    setRoleFocusRaw(next);
    setTrackRaw(ROLE_TO_TRACK[next]);
    const validTags = getTagsForRole(next);
    setSelectedTags((prev) => prev.filter((t) => validTags.has(t)));
  }, []);

  /** Keep setTrack for backwards compat — also syncs roleFocus */
  const setTrack = useCallback((t: InterviewTrack) => {
    setTrackRaw(t);
    const mapped = Object.entries(ROLE_TO_TRACK).find(
      ([, v]) => v === t
    )?.[0] as InterviewRoleFocus | undefined;
    if (mapped) {
      setRoleFocusRaw(mapped);
      const validTags = getTagsForRole(mapped);
      setSelectedTags((prev) => prev.filter((tag) => validTags.has(tag)));
    }
  }, []);

  const fetchNextQuestion = useCallback(
    (excludeIds: string[]) => {
      setDailyLimitError(null);
      const difficulty = LEVEL_TO_DIFFICULTY[level];
      practiceNext.mutate(
        {
          track,
          level,
          difficulty,
          tags:
            selectedTags.length > 0
              ? selectedTags.map((t) => t.toLowerCase())
              : undefined,
          excludeIds: excludeIds.length > 0 ? excludeIds : undefined,
        },
        {
          onSuccess: (res) => {
            setCurrentQuestion(res.data);
            resetSelection();
          },
          onError: (err: any) => {
            // Check if it's a daily limit error (403)
            const message = err?.response?.data?.message || err?.message || "";
            if (
              message.includes("daily limit") ||
              message.includes("daily limit")
            ) {
              setDailyLimitError(message);
            }
          },
        }
      );
    },
    [track, level, selectedTags, practiceNext]
  );

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const toggleMultiOption = (idx: number) =>
    setSelectedOptionIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );

  const handleStart = () => {
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setBestStreak(0);
    setAnsweredIds([]);
    resetSelection();
    setView("quiz");
    fetchNextQuestion([]);
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !hasSelection) return;
    const payload = isMultiSelect
      ? { questionId: currentQuestion.id, selectedOptionIndices }
      : {
          questionId: currentQuestion.id,
          selectedOptionIndex: selectedOptionIndex!,
        };

    practiceCheck.mutate(payload, {
      onSuccess: (res) => {
        const r = res.data;
        setResult(r);
        setAnsweredIds((prev) => [...prev, currentQuestion.id]);
        setScore((prev) => ({
          correct: prev.correct + (r.isCorrect ? 1 : 0),
          total: prev.total + 1,
        }));
        if (r.isCorrect) {
          setStreak((prev) => {
            const next = prev + 1;
            setBestStreak((best) => Math.max(best, next));
            return next;
          });
        } else {
          setStreak(0);
        }
      },
    });
  };

  const handleNextQuestion = () => {
    const ids = [...answeredIds, currentQuestion?.id].filter(
      Boolean
    ) as string[];
    fetchNextQuestion(ids);
  };

  const handleBackToSetup = () => {
    setView("setup");
    setCurrentQuestion(null);
    resetSelection();
  };

  const handleResetQuiz = () => {
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setBestStreak(0);
    setAnsweredIds([]);
    resetSelection();
    fetchNextQuestion([]);
  };

  return {
    view,
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
    options,
    isLoadingOptions,
    isLoadingNext: practiceNext.isPending,
    isChecking: practiceCheck.isPending,
    isError,
    error,
    refetch,
    isMultiSelect,
    hasSelection,
    accuracy,
    setTrack,
    setLevel,
    setRoleFocus,
    toggleTag,
    setSelectedOptionIndex,
    toggleMultiOption,
    handleStart,
    handleSubmitAnswer,
    handleNextQuestion,
    handleBackToSetup,
    handleResetQuiz,
    practiceUsage,
    dailyLimitReached,
    dailyLimitError,
  };
}
