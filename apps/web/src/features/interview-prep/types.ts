import type {
  InterviewSession,
  InterviewOptionsCatalog,
  AnswerFeedback,
  NextQuestionResponse,
  InterviewTrack,
  InterviewLevel,
  InterviewRoleFocus,
  InterviewType,
} from "@careerportal/shared/types";
import type { InterviewerConfig } from "./interviewer-configs";

export type View = "setup" | "session" | "report";

export interface InterviewSetupProps {
  options: InterviewOptionsCatalog | undefined;
  track: InterviewTrack;
  level: InterviewLevel;
  selectedTags: string[];
  questionCount: number;
  roleFocus: InterviewRoleFocus;
  interviewType: InterviewType;
  expandedCategories: Set<string>;
  isCreating: boolean;
  onTrackChange: (track: InterviewTrack) => void;
  onLevelChange: (level: InterviewLevel) => void;
  onRoleFocusChange: (roleFocus: InterviewRoleFocus) => void;
  onInterviewTypeChange: (type: InterviewType) => void;
  onQuestionCountChange: (count: number) => void;
  onToggleTag: (tag: string) => void;
  onToggleCategory: (key: string) => void;
  onCreateSession: () => void;
  // Practice
  isPracticeStarting: boolean;
  onStartPractice: () => void;
  /** ID of the currently selected mock interviewer */
  selectedInterviewerId: string;
  onInterviewerChange: (id: string) => void;
}

export interface InterviewSessionProps {
  nextQuestion: NextQuestionResponse | undefined;
  nextLoading: boolean;
  lastFeedback: AnswerFeedback | null;
  selectedOptionIndex: number | null;
  isSubmitting: boolean;
  activeSession: InterviewSession | undefined;
  onSelectOption: (index: number) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
  onViewReport: () => void;
  onBackToSetup: () => void;
  /** The resolved interviewer config for avatar + TTS */
  selectedInterviewer: InterviewerConfig | null;
}

export interface InterviewReportProps {
  activeSession: InterviewSession;
  onStartNew: () => void;
}

export interface InterviewHomeProps {
  sessions: InterviewSession[];
  onStartSetup: () => void;
  onResumeSession: (session: InterviewSession) => void;
  onViewReport: (session: InterviewSession) => void;
}
