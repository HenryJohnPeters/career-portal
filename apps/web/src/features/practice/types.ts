import type {
  PracticeQuestion,
  PracticeCheckResult,
  InterviewOptionsCatalog,
  InterviewTrack,
  InterviewLevel,
  InterviewRoleFocus,
  PracticeUsageStatus,
} from "@careerportal/shared/types";

export type PracticeView = "setup" | "quiz";

export interface PracticeScore {
  correct: number;
  total: number;
}

export interface PracticeState {
  view: PracticeView;
  track: InterviewTrack;
  level: InterviewLevel;
  roleFocus: InterviewRoleFocus;
  selectedTags: string[];
  currentQuestion: PracticeQuestion | null;
  selectedOptionIndex: number | null;
  selectedOptionIndices: number[];
  result: PracticeCheckResult | null;
  score: PracticeScore;
  streak: number;
  bestStreak: number;
  options: InterviewOptionsCatalog | undefined;
  practiceUsage: PracticeUsageStatus | undefined;
  isLoadingOptions: boolean;
  isLoadingNext: boolean;
  isChecking: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  isMultiSelect: boolean;
  hasSelection: boolean;
  accuracy: number;
  dailyLimitReached: boolean;
  dailyLimitError: string | null;
  // Actions
  setTrack: (t: InterviewTrack) => void;
  setLevel: (l: InterviewLevel) => void;
  setRoleFocus: (r: InterviewRoleFocus) => void;
  toggleTag: (tag: string) => void;
  setSelectedOptionIndex: (i: number) => void;
  toggleMultiOption: (i: number) => void;
  handleStart: () => void;
  handleSubmitAnswer: () => void;
  handleNextQuestion: () => void;
  handleBackToSetup: () => void;
  handleResetQuiz: () => void;
}
