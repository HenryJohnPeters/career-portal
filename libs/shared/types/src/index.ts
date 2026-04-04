// === Auth ===
export interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  stripeCurrentPeriodEnd?: string | null;
}

/**
 * Frontend mirror of the backend `isActivePremium()` safety net.
 * Checks BOTH the isPremium flag AND that stripeCurrentPeriodEnd is in the future.
 * This prevents stale isPremium flags from granting access after expiration.
 */
export function isActivePremium(user: User | null | undefined): boolean {
  if (!user?.isPremium) return false;
  if (!user.stripeCurrentPeriodEnd) return false;
  return new Date() < new Date(user.stripeCurrentPeriodEnd);
}

// === Shared Limits — Single source of truth for the frontend ===
export const FREE_TIER = {
  cvVersions: 1,
  coverLetters: 3,
  monthlyAiActions: 5,
  monthlyMockSessions: 3,
  monthlyQuestions: 50,
  monthlyTechTests: 2,
  interviewerCount: 3,
  templateIds: [
    "classic",
    "modern",
    "minimal",
    "executive",
    "creative",
  ] as readonly string[],
} as const;

// === Interviewer Traits ===
export interface InterviewerTraits {
  questionCount: number;
  adviceLevel: "minimal" | "standard" | "detailed";
  fiftyFifty: boolean;
}

// === Billing ===
export interface SubscriptionStatus {
  isPremium: boolean;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: string | null;
}

// === AI Usage ===
export interface AiUsageStatus {
  used: number;
  limit: number | null; // null = unlimited (premium)
  remaining: number | null; // null = unlimited
  isPremium: boolean;
  resetsAt: string; // ISO date of next month start
  /** Monthly mock session usage (interview prep) */
  mockSessionsUsed: number;
  mockSessionsLimit: number | null;
  mockSessionsRemaining: number | null;
  /** Monthly question answer usage (interview prep) */
  questionsUsed: number;
  questionsLimit: number | null;
  questionsRemaining: number | null;
  /** Monthly technical test usage */
  techTestsUsed: number;
  techTestsLimit: number | null;
  techTestsRemaining: number | null;
}

// === API Response ===
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: number;
  message: string;
  details?: unknown;
}

// === CV ===
export type FontSize = "small" | "medium" | "large";
export type Spacing = "compact" | "comfortable" | "spacious";
export type AccentStyle = "left-border" | "underline" | "background" | "none";
export type BulletStyle = "disc" | "dash" | "arrow" | "chevron" | "none";
export type DividerStyle = "line" | "dots" | "double" | "gradient" | "none";
export type HeaderLayout = "split" | "centered" | "inline" | "banner";
export type TemplateId =
  | "classic"
  | "modern"
  | "minimal"
  | "executive"
  | "creative"
  | "compact"
  | "developer"
  | "elegant"
  | "bold"
  | "academic"
  | "startup"
  | "infographic"
  | "nordic"
  | "timeline"
  | "magazine"
  | "terminal"
  | "gradient"
  | "architect"
  | "metropolis"
  | "zen"
  | "retro"
  | "blueprint"
  | "mosaic"
  | "luxe"
  | "newspaper"
  | "origami"
  | "pulse"
  | "artisan"
  | "frontier";
export type SectionType =
  | "profile"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "interests"
  | "custom";

export interface ThemeConfig {
  primaryColor: string;
  fontHeading: string;
  fontBody: string;
  fontSize: FontSize;
  spacing: Spacing;
  accentStyle: AccentStyle;
  bulletStyle: BulletStyle;
  dividerStyle: DividerStyle;
}

export interface CvVersion {
  id: string;
  userId: string;
  title: string;
  isActive: boolean;
  templateId: string;
  themeConfig: ThemeConfig | Record<string, unknown>;
  headerLayout: string;
  name?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  phone?: string | null;
  location?: string | null;
  website?: string | null;
  linkedin?: string | null;
  github?: string | null;
  createdAt: string;
  updatedAt: string;
  sections: CvSection[];
}

export interface CvSection {
  id: string;
  cvVersionId: string;
  title: string;
  content: string;
  sectionType: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// === Cover Letters ===
export interface CoverLetter {
  id: string;
  userId: string;
  title: string;
  body: string;
  jobId?: string | null;
  job?: Job | null;
  createdAt: string;
  updatedAt: string;
}

// === Jobs ===
export type JobStatus =
  | "wishlist"
  | "applied"
  | "phone_screen"
  | "technical_interview"
  | "onsite"
  | "tech_test"
  | "accepted"
  | "rejected";

export interface Job {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: string;
  url?: string | null;
  notes?: string | null;
  cvVersionId?: string | null;
  coverLetterId?: string | null;
  followUpDate?: string | null;
  cvVersion?: { id: string; title: string } | null;
  linkedCoverLetter?: { id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

// === Dashboard ===
export interface DashboardSummary {
  counts: {
    cvVersions: number;
    coverLetters: number;
    jobs: number;
  };
  recentActivity: RecentActivityItem[];
}

export interface RecentActivityItem {
  type: "cv" | "cover-letter";
  id: string;
  title: string;
  updatedAt: string;
}

// === Interview Prep ===

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

/** A single category in the tech-stack picker */
export interface TechCategory {
  key: string;
  label: string;
  items: string[];
}

/** Full structured catalog returned by GET /interview-prep/options */
export interface InterviewOptionsCatalog {
  techCategories: TechCategory[];
  levels: string[];
  roleFocuses: string[];
  interviewTypes: string[];
  durations: number[];
  difficulties: string[];
  companyStyles: string[];
  personas: string[];
  /** Legacy flat tags derived from question bank */
  tags: string[];
}

export interface RubricCriterion {
  name: string;
  weight: number;
  keywords: string[];
}

export interface InterviewQuestionRubric {
  criteria: RubricCriterion[];
}

export interface InterviewQuestion {
  id: string;
  track: string;
  tags: string[];
  difficulty: number;
  type: string;
  level: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  expectedPoints: string[];
  redFlags: string[];
  rubric: InterviewQuestionRubric;
  modelAnswer: string;
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
  /** Indices of eliminated wrong options for the 50/50 interviewer hint. Present only when the session\'s interviewer has fiftyFifty:true AND the question has ≥4 options and is unanswered. */
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
  selectedOptionIndex: number;
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

export interface InterviewReport {
  overallScore: number;
  maxPossibleScore: number;
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

// === Technical Tests ===

export type TechnicalTestStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "evaluated";

export interface TechTestScenario {
  title: string;
  companyContext: string;
  brief: string;
  background: string;
  requirements: { key: string; text: string }[];
  nonFunctional: string[];
  acceptanceCriteria: string[];
  bonusChallenges: string[];
  evaluationCriteria: { name: string; weight: number; description: string }[];
  hints: string[];
  estimatedTime: string;
  deliverables: string[];
  constraints: string[];
}

export interface TechTestEvaluation {
  overallScore: number;
  maxPossible: number;
  percentage: number;
  grade: string;
  criteriaScores: {
    name: string;
    score: number;
    maxScore: number;
    description: string;
  }[];
  strengths: string[];
  improvements: string[];
  requirementsCovered: number;
  requirementsTotal: number;
  requirementsMissed: string[];
  wordCount: number;
  summary: string;
}

export interface TechnicalTest {
  id: string;
  userId: string;
  title: string;
  track: string;
  level: string;
  difficulty: string;
  roleFocus: string;
  tags: string[];
  timeLimit: number;
  scenario: TechTestScenario;
  status: TechnicalTestStatus;
  submission: string | null;
  evaluation: TechTestEvaluation | null;
  startedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTechnicalTestRequest {
  roleFocus: InterviewRoleFocus;
  level: InterviewLevel;
  difficulty: InterviewDifficulty;
  tags: string[];
  timeLimit?: number;
}

// === AI CV Generation ===
export interface AiFullCvSection {
  title: string;
  sectionType: string;
  content: string;
}

export interface AiFullCvResult {
  name: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  sections: AiFullCvSection[];
}
