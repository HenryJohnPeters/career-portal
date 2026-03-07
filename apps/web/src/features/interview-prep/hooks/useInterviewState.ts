import { useState, useCallback } from "react";
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
  InterviewRoleFocus,
  InterviewType,
  InterviewDifficulty,
  InterviewCompanyStyle,
} from "@careerportal/shared/types";
import type { View } from "../types";
import { getTagsForRole } from "../constants";
import { LEVEL_TO_DIFFICULTY } from "../../shared";

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
  const [questionCount, setQuestionCount] = useState(5);
  const [persona, setPersona] = useState<InterviewPersona>("neutral");
  const [roleFocus, setRoleFocusRaw] =
    useState<InterviewRoleFocus>("fullstack");
  const [interviewType, setInterviewType] = useState<InterviewType>("coding");
  const [companyStyle, setCompanyStyle] =
    useState<InterviewCompanyStyle>("startup");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Derive difficulty from level
  const difficulty: InterviewDifficulty =
    LEVEL_TO_DIFFICULTY[level] ?? "medium";

  /**
   * When the role focus changes, keep only the tags that exist
   * in the new role's pathways so the user never sends irrelevant tags.
   */
  const setRoleFocus = useCallback((next: InterviewRoleFocus) => {
    setRoleFocusRaw(next);
    const validTags = getTagsForRole(next);
    setSelectedTags((prev) => prev.filter((t) => validTags.has(t)));
  }, []);

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
    createSession.mutate(
      {
        track,
        level,
        tags: selectedTags.map((t) => t.toLowerCase()),
        questionCount,
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
    setRoleFocus,
    setInterviewType,
    setCompanyStyle,
    setPersona,
    setQuestionCount,
    setSelectedOptionIndex,
    handleCreateSession,
    handleSubmitAnswer,
    handleNextQuestion,
    handleViewReport,
    handleBackToSetup,
    toggleTag,
    toggleCategory,
  };
}
