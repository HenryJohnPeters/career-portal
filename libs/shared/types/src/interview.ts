// === Interview prep (PLAN §2.9) ===

export type InterviewTrack = "frontend" | "backend" | "fullstack" | "devops";
export type InterviewLevel = "junior" | "mid" | "senior";
export type InterviewQuestionType =
  | "theory"
  | "debugging"
  | "coding"
  | "system-design"
  | "behavioral"
  | "ops";
export type InterviewPersona = "friendly" | "neutral" | "tough";
export type InterviewSessionStatus = "in_progress" | "completed";
export type InterviewRoleFocus =
  | "frontend"
  | "backend"
  | "fullstack"
  | "platform";
export type InterviewType = "coding" | "system-design" | "behavioral";
export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewCompanyStyle = "faang" | "startup" | "enterprise";
export type InterviewDuration = 30 | 60 | 90;

export interface InterviewerTraits {
  questionCount: number;
  adviceLevel: "minimal" | "standard" | "detailed";
  fiftyFifty: boolean;
}

/** A single category in the tech-stack picker */
export interface TechCategory {
  key: string;
  label: string;
  items: string[];
}

/** An interviewer as listed by GET /interview-prep/options. */
export interface InterviewerOption extends InterviewerTraits {
  id: string;
  /** Available on the free plan. */
  free: boolean;
}

/** Full structured catalog returned by GET /interview-prep/options */
export interface InterviewOptionsCatalog {
  techCategories: TechCategory[];
  /** Every TECH_TAG_CATALOG id (the static catalog, never question-bank rows). */
  tags: string[];
  /** Most tags one session may select (MAX_SELECTED_TAGS). */
  maxTags: number;
  tracks: string[];
  levels: string[];
  roleFocuses: string[];
  interviewTypes: string[];
  durations: number[];
  difficulties: string[];
  companyStyles: string[];
  personas: string[];
  interviewers: InterviewerOption[];
}

export interface RubricCriterion {
  name: string;
  weight: number;
  keywords: string[];
}

export interface InterviewQuestionRubric {
  criteria: RubricCriterion[];
}

/**
 * A question as shown to the candidate. The answer key (`correctOptionIndex`,
 * `correctOptionIndices`, `modelAnswer`, `expectedPoints`, `redFlags`,
 * `rubric`) is only present once the question has been answered.
 */
export interface InterviewQuestion {
  id: string;
  track: string;
  tags: string[];
  difficulty: number;
  type: string;
  level: string;
  prompt: string;
  options: string[];
  /** True for "select all that apply" questions (answered with several indices). */
  multiSelect?: boolean;
  correctOptionIndex?: number;
  correctOptionIndices?: number[];
  expectedPoints?: string[];
  redFlags?: string[];
  rubric?: InterviewQuestionRubric;
  modelAnswer?: string;
  followUpIds: string[];
  createdAt: string;
}

export interface InterviewSessionQuestion {
  id: string;
  sessionId: string;
  questionId: string;
  orderIndex: number;
  userAnswer: string | null;
  score: number | null;
  maxScore: number;
  feedback: AnswerFeedback | null;
  isFollowUp: boolean;
  parentQuestionId: string | null;
  answeredAt: string | null;
  createdAt: string;
  question: InterviewQuestion;
  /** Indices of eliminated wrong options for the 50/50 interviewer hint. Present only when the session's interviewer has fiftyFifty:true AND the question has ≥4 options and is unanswered. */
  fiftyFiftyEliminated?: number[] | null;
}

export interface AnswerFeedback {
  pointsHit: string[];
  pointsMissed: string[];
  redFlagsTriggered: string[];
  criteriaScores: { name: string; score: number; maxScore: number }[];
  suggestions: string[];
  personaResponse: string;
  correctAnswer: string;
  correctOptionIndex: number;
  /** Multi-select questions: every correct option. */
  correctOptionIndices?: number[];
  selectedOptionIndex: number;
  /** Multi-select questions: every option the candidate picked. */
  selectedOptionIndices?: number[];
  isCorrect: boolean;
}

export interface InterviewSession {
  id: string;
  userId: string;
  track: string;
  level: string;
  tags: string[];
  roleFocus: string;
  interviewType: string;
  duration: number;
  difficulty: string;
  companyStyle: string;
  questionCount: number;
  persona: string;
  interviewerId?: string | null;
  status: string;
  totalScore: number | null;
  report: InterviewReport | null;
  createdAt: string;
  updatedAt: string;
  questions: InterviewSessionQuestion[];
}

/**
 * POST /interview-prep/sessions. `questionCount` can be lower than requested
 * when fewer questions exist for the chosen track, level and tags.
 */
export interface CreateInterviewSessionResponse extends InterviewSession {
  /** How many questions the chosen interviewer (or the request) asked for. */
  requestedQuestionCount: number;
}

export interface InterviewReport {
  overallScore: number;
  maxPossibleScore: number;
  /** 0-100 */
  percentage: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  missedTopics: string[];
  suggestedStudyAreas: string[];
  questionBreakdown: {
    questionId: string;
    prompt: string;
    type: string;
    score: number;
    maxScore: number;
  }[];
  trackSummary: string;
}

export interface CreateInterviewSessionRequest {
  track: InterviewTrack;
  level: InterviewLevel;
  /** Canonical TECH_TAG_CATALOG ids (see normalizeTag); ≤12, unique. */
  tags: string[];
  roleFocus?: InterviewRoleFocus;
  interviewType?: InterviewType;
  duration?: InterviewDuration;
  difficulty?: InterviewDifficulty;
  companyStyle?: InterviewCompanyStyle;
  questionCount?: number;
  persona?: InterviewPersona;
  interviewerId?: string;
}

/** POST /interview-prep/sessions/:sessionId/questions/:questionId/answer */
export interface SubmitInterviewAnswerRequest {
  /**
   * The selected option index as a string ("2"); multi-select questions send
   * comma-separated indices ("0,2"). Free text is rejected (400).
   */
  answer: string;
}

export interface SubmitInterviewAnswerResponse {
  answered: InterviewSessionQuestion;
  followUp: InterviewSessionQuestion | null;
  feedback: AnswerFeedback;
}

export interface NextQuestionResponse {
  sessionQuestion: InterviewSessionQuestion | null;
  sessionStatus: string;
  progress: { answered: number; total: number };
}

/** GET /interview-prep/sessions — newest first, ≤100. */
export interface InterviewSessionSummary {
  id: string;
  status: InterviewSessionStatus | string;
  track: string;
  level: string;
  difficulty: string;
  interviewType: string;
  interviewerId: string | null;
  questionCount: number;
  answeredCount: number;
  totalScore: number | null;
  percentage: number | null;
  grade: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopicAccuracy {
  tag: string;
  answered: number;
  /** 0-100 */
  accuracy: number;
}

/**
 * GET /interview-prep/progress — last 12 months. Free plan: `weakTopics`
 * (top 3, min 3 answers per tag) only; `byTag`/`byType`/`weeklyTrend` are
 * null and `locked` is true.
 */
export interface InterviewProgress {
  totals: {
    sessions: number;
    completedSessions: number;
    answered: number;
    correct: number;
    accuracy: number | null;
  };
  weakTopics: TopicAccuracy[];
  byTag: { tag: string; answered: number; correct: number; accuracy: number }[] | null;
  byType: { type: string; answered: number; correct: number; accuracy: number }[] | null;
  weeklyTrend: { weekStart: string; answered: number; accuracy: number | null }[] | null;
  locked: boolean;
}
