import { useState, useCallback, useEffect, useRef } from "react";
import {
  useCreateTechnicalTest,
  useStartTechnicalTest,
  useSubmitTechnicalTest,
  useTechnicalTests,
  useDeleteTechnicalTest,
} from "@careerportal/web/data-access";
import type {
  InterviewRoleFocus,
  InterviewLevel,
  InterviewDifficulty,
  TechnicalTest,
} from "@careerportal/shared/types";
import { LEVEL_TO_DIFFICULTY } from "../../shared";
import type { TechTestView } from "../types";

export function useTechTestState() {
  const [view, setView] = useState<TechTestView>("setup");

  // Setup filters
  const [roleFocus, setRoleFocus] = useState<InterviewRoleFocus>("fullstack");
  const [level, setLevel] = useState<InterviewLevel>("mid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState(60); // minutes

  // Derive difficulty from level
  const difficulty: InterviewDifficulty =
    LEVEL_TO_DIFFICULTY[level] ?? "medium";

  // Active test
  const [activeTest, setActiveTest] = useState<TechnicalTest | null>(null);

  // Working state
  const [submission, setSubmission] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // API
  const testsQuery = useTechnicalTests();
  const createTest = useCreateTechnicalTest();
  const startTest = useStartTechnicalTest();
  const submitTest = useSubmitTechnicalTest();
  const deleteTest = useDeleteTechnicalTest();

  const tests = testsQuery.data?.data ?? [];

  // Timer
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeRemaining]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (
      view === "working" &&
      timeRemaining === 0 &&
      !isTimerRunning &&
      activeTest &&
      activeTest.status === "in_progress"
    ) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, isTimerRunning, view]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  /** Generate a new test scenario */
  const handleGenerate = useCallback(async () => {
    const res = await createTest.mutateAsync({
      roleFocus,
      level,
      difficulty,
      tags: selectedTags.map((t) => t.toLowerCase()),
      timeLimit,
    });
    setActiveTest(res.data);
    setSubmission("");
    setView("brief");
  }, [roleFocus, level, difficulty, selectedTags, timeLimit, createTest]);

  /** Start the timer and move to the working view */
  const handleStart = useCallback(async () => {
    if (!activeTest) return;
    const res = await startTest.mutateAsync(activeTest.id);
    setActiveTest(res.data);
    setTimeRemaining(activeTest.timeLimit * 60);
    setIsTimerRunning(true);
    setView("working");
  }, [activeTest, startTest]);

  /** Submit the user's solution */
  const handleSubmit = useCallback(async () => {
    if (!activeTest) return;
    setIsTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const res = await submitTest.mutateAsync({
      testId: activeTest.id,
      submission,
    });
    setActiveTest(res.data);
    setView("results");
  }, [activeTest, submission, submitTest]);

  /** View a past test's results */
  const handleViewTest = useCallback((test: TechnicalTest) => {
    setActiveTest(test);
    if (test.status === "submitted" || test.status === "evaluated") {
      setSubmission(test.submission ?? "");
      setView("results");
    } else if (test.status === "in_progress") {
      setSubmission("");
      // Calculate remaining time
      if (test.startedAt) {
        const elapsed = Math.floor(
          (Date.now() - new Date(test.startedAt).getTime()) / 1000
        );
        const remaining = Math.max(0, test.timeLimit * 60 - elapsed);
        setTimeRemaining(remaining);
        if (remaining > 0) {
          setIsTimerRunning(true);
        }
      }
      setView("working");
    } else {
      setView("brief");
    }
  }, []);

  /** Delete a test */
  const handleDelete = useCallback(
    async (testId: string) => {
      await deleteTest.mutateAsync(testId);
      if (activeTest?.id === testId) {
        setActiveTest(null);
        setView("setup");
      }
    },
    [activeTest, deleteTest]
  );

  /** Back to setup */
  const handleBackToSetup = useCallback(() => {
    setActiveTest(null);
    setSubmission("");
    setIsTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setView("setup");
  }, []);

  /** Show history */
  const handleShowHistory = useCallback(() => setView("history"), []);

  return {
    // View
    view,
    setView,
    // Setup
    roleFocus,
    setRoleFocus,
    level,
    setLevel,
    difficulty,
    selectedTags,
    toggleTag,
    timeLimit,
    setTimeLimit,
    // Active test
    activeTest,
    submission,
    setSubmission,
    timeRemaining,
    isTimerRunning,
    // History
    tests,
    isLoadingTests: testsQuery.isLoading,
    // Loading
    isGenerating: createTest.isPending,
    isStarting: startTest.isPending,
    isSubmitting: submitTest.isPending,
    // Actions
    handleGenerate,
    handleStart,
    handleSubmit,
    handleViewTest,
    handleDelete,
    handleBackToSetup,
    handleShowHistory,
  };
}
