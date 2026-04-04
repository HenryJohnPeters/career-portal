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
}
