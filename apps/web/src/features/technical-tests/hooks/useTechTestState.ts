import { useState, useCallback, useMemo } from "react";
import {
  useCreateTechnicalTest,
  useStartTechnicalTest,
  useTechnicalTests,
  useDeleteTechnicalTest,
} from "@careerportal/web/data-access";
import type {
  InterviewLevel,
  InterviewDifficulty,
  TechnicalTest,
} from "@careerportal/shared/types";
import { LEVEL_TO_DIFFICULTY } from "../../shared";
import type { TechTestView } from "../types";
import { deriveRoleFocusFromTags } from "../../interview-prep/constants";

export function useTechTestState() {
  const [view, setView] = useState<TechTestView>("setup");

  // Setup filters
  const [level, setLevel] = useState<InterviewLevel>("mid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Derive roleFocus automatically from selected tags
  const roleFocus = useMemo(
    () => deriveRoleFocusFromTags(selectedTags),
    [selectedTags],
  );

  // Derive difficulty from level
  const difficulty: InterviewDifficulty =
    LEVEL_TO_DIFFICULTY[level] ?? "medium";

  // Active test
  const [activeTest, setActiveTest] = useState<TechnicalTest | null>(null);

  // Working state
  const [submission, setSubmission] = useState("");

  // API
  const testsQuery = useTechnicalTests();
  const createTest = useCreateTechnicalTest();
  const startTest = useStartTechnicalTest();
  const deleteTest = useDeleteTechnicalTest();

  const tests = testsQuery.data?.data ?? [];

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  /** Generate a new test scenario */
  const handleGenerate = useCallback(async () => {
    const res = await createTest.mutateAsync({
      roleFocus,
      level,
      difficulty,
      tags: selectedTags.map((t) => t.toLowerCase()),
    });
    setActiveTest(res.data);
    setSubmission("");
    setView("brief");
  }, [roleFocus, level, difficulty, selectedTags, createTest]);

  /** Start the test and move to the working view */
  const handleStart = useCallback(async () => {
    if (!activeTest) return;
    const res = await startTest.mutateAsync(activeTest.id);
    setActiveTest(res.data);
    setView("working");
  }, [activeTest, startTest]);

  /** View a past test */
  const handleViewTest = useCallback((test: TechnicalTest) => {
    setActiveTest(test);
    if (test.status === "in_progress") {
      setSubmission("");
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
    [activeTest, deleteTest],
  );

  /** Back to setup */
  const handleBackToSetup = useCallback(() => {
    setActiveTest(null);
    setSubmission("");
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
    level,
    setLevel,
    difficulty,
    selectedTags,
    toggleTag,
    // Active test
    activeTest,
    submission,
    setSubmission,
    // History
    tests,
    isLoadingTests: testsQuery.isLoading,
    // Loading
    isGenerating: createTest.isPending,
    isStarting: startTest.isPending,
    // Actions
    handleGenerate,
    handleStart,
    handleViewTest,
    handleDelete,
    handleBackToSetup,
    handleShowHistory,
  };
}
