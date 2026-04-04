import { useState, useMemo, useEffect } from "react";
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
  InterviewCompanyStyle,
} from "@careerportal/shared/types";
import type { View } from "../types";
import { deriveRoleFocusFromTags } from "../constants";
import { LEVEL_TO_DIFFICULTY } from "../../shared";
import {
  DEFAULT_INTERVIEWER_ID,
  resolveInterviewerId,
} from "../interviewer-configs";

export function useInterviewState() {
  const VOICE_MUTE_STORAGE_KEY = "interview.voiceMuted";

  const [view, setView] = useState<View>("setup");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  );
  const [lastFeedback, setLastFeedback] = useState<AnswerFeedback | null>(null);

  // Setup form state
  const [track, setTrack] = useState<InterviewTrack>("frontend");
  const [level, setLevel] = useState<InterviewLevel>("mid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [persona, setPersona] = useState<InterviewPersona>("neutral");
  const [companyStyle, setCompanyStyle] =
    useState<InterviewCompanyStyle>("startup");

  // ── NEW: selected mock interviewer ──────────────────────────────────────
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>(
    () => resolveInterviewerId(DEFAULT_INTERVIEWER_ID),
  );
  const [voiceMuted, setVoiceMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(VOICE_MUTE_STORAGE_KEY) === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VOICE_MUTE_STORAGE_KEY, voiceMuted ? "1" : "0");
  }, [voiceMuted]);

  // Derive roleFocus automatically from selected tags, using the current
  // track as a tiebreaker so "devops" track always maps to "platform".
  const roleFocus = useMemo(
    () => deriveRoleFocusFromTags(selectedTags, track),
    [selectedTags, track],
  );

  const {
    data: optionsData,
    isLoading: optionsLoading,
    isError,
    error,
    refetch,
  } = useInterviewOptions();
  const { data: sessionData } = useInterviewSession(activeSessionId);
  const { data: nextData, isLoading: nextLoading } = useNextInterviewQuestion(
    activeSessionId && view === "session" ? activeSessionId : null,
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
        persona,
        roleFocus,
        difficulty: LEVEL_TO_DIFFICULTY[level] ?? "medium",
        companyStyle,
        interviewerId: selectedInterviewerId,
      },
      {
        onSuccess: (res) => {
          setActiveSessionId(res.data.id);
          setLastFeedback(null);
          setSelectedOptionIndex(null);
          setView("session");
        },
      },
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
      },
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

  const handleTrackChange = (newTrack: InterviewTrack) => {
    setTrack(newTrack);
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
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
    persona,
    roleFocus,
    companyStyle,
    setTrack: handleTrackChange,
    setLevel,
    setCompanyStyle,
    setPersona,
    setSelectedOptionIndex,
    handleCreateSession,
    handleSubmitAnswer,
    handleNextQuestion,
    handleViewReport,
    handleBackToSetup,
    toggleTag,
    selectedInterviewerId,
    setSelectedInterviewerId,
    voiceMuted,
    setVoiceMuted,
  };
}
