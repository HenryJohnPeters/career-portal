import type {
  InterviewSession,
  InterviewOptionsCatalog,
  AnswerFeedback,
  NextQuestionResponse,
  InterviewTrack,
  InterviewLevel,
} from "@careerportal/shared/types";
import type { InterviewerConfig } from "./interviewer-configs";

export type View = "setup" | "session" | "report";

export interface InterviewSetupProps {
  track: InterviewTrack;
  level: InterviewLevel;
  selectedTags: string[];
  isCreating: boolean;
  onTrackChange: (track: InterviewTrack) => void;
  onLevelChange: (level: InterviewLevel) => void;
  onToggleTag: (tag: string) => void;
  onCreateSession: () => void;
  /** ID of the currently selected mock interviewer */
  selectedInterviewerId: string;
  onInterviewerChange: (id: string) => void;
  voiceMuted: boolean;
  onToggleVoiceMute: () => void;
  onPreviewInterviewerVoice: () => void;
  isPremium?: boolean;
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
  voiceMuted: boolean;
  onToggleVoiceMute: () => void;
}

export interface InterviewReportProps {
  activeSession: InterviewSession;
  onStartNew: () => void;
}
