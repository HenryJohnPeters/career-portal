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

export interface AiUsageStatus {
  used: number;
  limit: number | null;
  remaining: number | null;
  isPremium: boolean;
  resetsAt: string;
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
