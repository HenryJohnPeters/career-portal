import { useState, useCallback, useMemo } from "react";
import {
  useInterviewOptions,
  useInterviewSession,
  useCreateInterviewSession,
  useNextInterviewQuestion,
  useSubmitInterviewAnswer,
} from "@careerportal/web/data-access";
import type {
  AnswerFeedback,
  InterviewTrack,
  InterviewLevel,
  InterviewPersona,
  InterviewType,
  InterviewDifficulty,
  InterviewCompanyStyle,
} from "@careerportal/shared/types";
import type { View } from "../types";
import { deriveRoleFocusFromTags } from "../constants";
import { LEVEL_TO_DIFFICULTY } from "../../shared";
import {
  DEFAULT_INTERVIEWER_ID,
  INTERVIEWER_CONFIGS,
} from "../interviewer-configs";

export function useInterviewState() {
  const [view, setView] = useState<View>("setup");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null
  );
  const [lastFeedback, setLastFeedback] = useState<AnswerFeedback | null>(null);

  // Setup form state
  const [track, setTrack] = useState<InterviewTrack>("frontend");
  const [level, setLevel] = useState<InterviewLevel>("mid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [questionCount] = useState(100); // Endless mode - set high number
  const [persona, setPersona] = useState<InterviewPersona>("neutral");
  const [interviewType, setInterviewType] = useState<InterviewType>("coding");
  const [companyStyle, setCompanyStyle] =
    useState<InterviewCompanyStyle>("startup");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // ── NEW: selected mock interviewer ──────────────────────────────────────
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>(
    DEFAULT_INTERVIEWER_ID
  );

  // Derive roleFocus automatically from selected tags
  const roleFocus = useMemo(
    () => deriveRoleFocusFromTags(selectedTags),
    [selectedTags]
  );

  // Derive difficulty from level
  const difficulty: InterviewDifficulty =
    LEVEL_TO_DIFFICULTY[level] ?? "medium";

  const {
    data: optionsData,
    isLoading: optionsLoading,
    isError,
    error,
    refetch,
  } = useInterviewOptions();
  const { data: sessionData } = useInterviewSession(activeSessionId);
  const { data: nextData, isLoading: nextLoading } = useNextInterviewQuestion(
    activeSessionId && view === "session" ? activeSessionId : null
  );
  const createSession = useCreateInterviewSession();
  const submitAnswer = useSubmitInterviewAnswer();

  const options = optionsData?.data;
  const activeSession = sessionData?.data;
  const nextQuestion = nextData?.data;

  const handleCreateSession = () => {
    const selectedInterviewer = INTERVIEWER_CONFIGS.find(
      (i) => i.id === selectedInterviewerId
    );
    const questionCountToUse =
      selectedInterviewer?.id === "none"
        ? 25
        : Math.min(selectedInterviewer?.traits?.questionCount ?? 10, 25);

    createSession.mutate(
      {
        track,
        level,
        tags: selectedTags.map((t) => t.toLowerCase()),
        questionCount: questionCountToUse,
        persona,
        roleFocus,
        interviewType,
        difficulty,
        companyStyle,
      },
      {
        onSuccess: (res) => {
          setActiveSessionId(res.data.id);
          setLastFeedback(null);
          setSelectedOptionIndex(null);
          setView("session");
        },
      }
    );
  };

  const handleSubmitAnswer = () => {
    if (
      !activeSessionId ||
      !nextQuestion?.sessionQuestion ||
      selectedOptionIndex === null
    )
      return;
    submitAnswer.mutate(
      {
        sessionId: activeSessionId,
        questionId: nextQuestion.sessionQuestion.id,
        answer: String(selectedOptionIndex),
      },
      {
        onSuccess: (res) => {
          setLastFeedback(res.data.feedback);
          setSelectedOptionIndex(null);
        },
      }
    );
  };

  const handleNextQuestion = () => {
    setLastFeedback(null);
  };

  const handleViewReport = () => {
    setView("report");
  };

  const handleBackToSetup = () => {
    setView("setup");
    setActiveSessionId(null);
    setLastFeedback(null);
    setSelectedOptionIndex(null);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return {
    view,
    options,
    activeSession,
    nextQuestion,
    nextLoading,
    lastFeedback,
    selectedOptionIndex,
    optionsLoading,
    isError,
    error,
    refetch,
    isCreating: createSession.isPending,
    isSubmitting: submitAnswer.isPending,
    track,
    level,
    selectedTags,
    questionCount,
    persona,
    roleFocus,
    interviewType,
    difficulty,
    companyStyle,
    expandedCategories,
    setTrack,
    setLevel,
    setInterviewType,
    setCompanyStyle,
    setPersona,
    setSelectedOptionIndex,
    handleCreateSession,
    handleSubmitAnswer,
    handleNextQuestion,
    handleViewReport,
    handleBackToSetup,
    toggleTag,
    toggleCategory,
    selectedInterviewerId,
    setSelectedInterviewerId,
  };
}
