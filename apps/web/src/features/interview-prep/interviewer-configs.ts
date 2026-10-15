/**
 * Mock-interview interviewers: display data, browser-voice tuning and traits.
 *
 * The API owns the behaviour (apps/api/src/modules/interview-prep/
 * interviewer-traits.ts: question count, 50/50 hints, persona and the order
 * that decides which interviewers are free). Keep `id` order and `traits` here
 * in sync with it; the server rejects locked interviewers regardless of the UI.
 */

import { FREE_TIER, type InterviewerTraits } from "@careerportal/shared/types";

export type InterviewerId =
  | "none"
  | "alex"
  | "riley"
  | "morgan"
  | "sam"
  | "kai"
  | "jordan"
  | "phoenix"
  | "nova";

export interface InterviewerVoiceConfig {
  /** BCP 47 language tag for the utterances. */
  language: string;
  /** Speaking rate multiplier (speechSynthesis `rate`). */
  speed: number;
  /** Pitch [0-2], 1 is neutral. */
  pitch?: number;
  /** Volume [0-1]. */
  volume?: number;
  /** Lowercase substrings of preferred system voice names, best first. */
  preferredVoiceNames?: string[];
  /** Voice gender to prefer when no preferred voice is installed. */
  gender: "female" | "male" | "any";
}

export interface InterviewerConfig {
  id: InterviewerId;
  name: string;
  /** Job title, e.g. "Senior Engineer". */
  title: string;
  /** Interview tone, e.g. "Friendly". */
  tone: string;
  /** One-line description of their interviewing style. */
  style: string;
  /** Tailwind gradient classes for the card accent. */
  gradient: string;
  /** CSS background behind the avatar. */
  background: string;
  /** Glow / speaking-ring colour. */
  accentColor: string;
  voice: InterviewerVoiceConfig;
  traits: InterviewerTraits;
}

/** Same order as the API's INTERVIEWERS list: the first FREE_TIER.interviewerCount are free. */
export const INTERVIEWER_CONFIGS: readonly InterviewerConfig[] = [
  {
    id: "none",
    name: "Quick Practice",
    title: "No interviewer",
    tone: "Self-paced",
    style: "Up to 25 questions at your own pace, without a voice",
    gradient: "from-gray-400 to-gray-600",
    background: "linear-gradient(160deg, #1a1a1a 0%, #0a0a0a 100%)",
    accentColor: "#888888",
    voice: { language: "en-US", speed: 1, gender: "any" },
    traits: { questionCount: 25, adviceLevel: "standard", fiftyFifty: false },
  },
  {
    id: "alex",
    name: "Alex",
    title: "Senior Engineer",
    tone: "Friendly",
    style: "Warm, encouraging, focuses on learning",
    gradient: "from-emerald-500 to-teal-600",
    background: "linear-gradient(160deg, #0d2a1f 0%, #0a1628 100%)",
    accentColor: "#a8e6cf",
    voice: {
      language: "en-US",
      speed: 0.98,
      pitch: 1.08,
      volume: 1,
      preferredVoiceNames: ["samantha", "karen", "victoria", "zira"],
      gender: "female",
    },
    traits: { questionCount: 5, adviceLevel: "detailed", fiftyFifty: true },
  },
  {
    id: "riley",
    name: "Riley",
    title: "Frontend Specialist",
    tone: "Creative",
    style: "UX-focused, visual design enthusiast",
    gradient: "from-cyan-500 to-blue-500",
    background: "linear-gradient(160deg, #0d1f2a 0%, #0a1520 100%)",
    accentColor: "#a8e0ff",
    voice: {
      language: "en-US",
      speed: 1.04,
      pitch: 1.12,
      volume: 1,
      preferredVoiceNames: ["moira", "samantha", "google uk english female"],
      gender: "female",
    },
    traits: { questionCount: 7, adviceLevel: "detailed", fiftyFifty: false },
  },
  {
    id: "morgan",
    name: "Morgan",
    title: "Staff Engineer",
    tone: "Neutral",
    style: "Professional, balanced, covers all bases",
    gradient: "from-blue-500 to-indigo-600",
    background: "linear-gradient(160deg, #0d1a2e 0%, #0a0f1e 100%)",
    accentColor: "#a8c8ff",
    voice: {
      language: "en-US",
      speed: 0.94,
      pitch: 0.98,
      volume: 1,
      preferredVoiceNames: ["zira", "fiona", "google us english"],
      gender: "female",
    },
    traits: { questionCount: 10, adviceLevel: "standard", fiftyFifty: false },
  },
  {
    id: "sam",
    name: "Sam",
    title: "Tech Lead",
    tone: "Strategic",
    style: "Big-picture thinker, focuses on architecture",
    gradient: "from-purple-500 to-pink-600",
    background: "linear-gradient(160deg, #1e0d2a 0%, #0e0a1e 100%)",
    accentColor: "#d8a8ff",
    voice: {
      language: "en-US",
      speed: 0.9,
      pitch: 0.9,
      volume: 1,
      preferredVoiceNames: ["daniel", "alex", "google uk english male"],
      gender: "male",
    },
    traits: { questionCount: 12, adviceLevel: "standard", fiftyFifty: false },
  },
  {
    id: "kai",
    name: "Kai",
    title: "Backend Engineer",
    tone: "Pragmatic",
    style: "Performance-driven, systems thinking",
    gradient: "from-yellow-500 to-orange-500",
    background: "linear-gradient(160deg, #2a1f0d 0%, #1e150a 100%)",
    accentColor: "#ffe4a8",
    voice: {
      language: "en-US",
      speed: 0.96,
      pitch: 0.94,
      volume: 1,
      preferredVoiceNames: ["aaron", "nathan", "daniel", "siri"],
      gender: "male",
    },
    traits: { questionCount: 15, adviceLevel: "minimal", fiftyFifty: false },
  },
  {
    id: "jordan",
    name: "Jordan",
    title: "Principal Engineer",
    tone: "Tough",
    style: "Challenging, direct, bar-raiser mindset",
    gradient: "from-orange-500 to-red-600",
    background: "linear-gradient(160deg, #2a0d0d 0%, #1a0808 100%)",
    accentColor: "#ffcba8",
    voice: {
      language: "en-US",
      speed: 0.94,
      pitch: 0.9,
      volume: 1,
      preferredVoiceNames: ["aaron", "arthur", "daniel", "siri"],
      gender: "male",
    },
    traits: { questionCount: 15, adviceLevel: "minimal", fiftyFifty: false },
  },
  {
    id: "phoenix",
    name: "Phoenix",
    title: "Security Engineer",
    tone: "Rigorous",
    style: "Security-first mindset, detail-oriented",
    gradient: "from-red-600 to-rose-700",
    background: "linear-gradient(160deg, #2a0d15 0%, #1a0810 100%)",
    accentColor: "#ffa8c0",
    voice: {
      language: "en-US",
      speed: 0.92,
      pitch: 0.88,
      volume: 1,
      preferredVoiceNames: ["aaron", "nathan", "daniel", "siri"],
      gender: "male",
    },
    traits: { questionCount: 18, adviceLevel: "minimal", fiftyFifty: false },
  },
  {
    id: "nova",
    name: "Nova",
    title: "DevOps Engineer",
    tone: "Methodical",
    style: "Infrastructure expert, automation focus",
    gradient: "from-slate-500 to-gray-600",
    background: "linear-gradient(160deg, #1a1f2a 0%, #0f1218 100%)",
    accentColor: "#c8d0e0",
    voice: {
      language: "en-US",
      speed: 0.92,
      pitch: 0.95,
      volume: 1,
      preferredVoiceNames: ["fiona", "victoria", "google uk english female"],
      gender: "female",
    },
    traits: { questionCount: 20, adviceLevel: "minimal", fiftyFifty: false },
  },
];

export const DEFAULT_INTERVIEWER_ID: InterviewerId = "none";

const FREE_INTERVIEWER_IDS: ReadonlySet<string> = new Set(
  INTERVIEWER_CONFIGS.slice(0, FREE_TIER.interviewerCount).map((c) => c.id),
);

export function getInterviewerById(id: string | null | undefined): InterviewerConfig | undefined {
  return id ? INTERVIEWER_CONFIGS.find((c) => c.id === id) : undefined;
}

/** Free-plan interviewers (Premium unlocks the rest). */
export function isInterviewerFree(id: string): boolean {
  return FREE_INTERVIEWER_IDS.has(id);
}

/** An interviewer the user may pick: unknown or locked ids fall back to the default. */
export function resolveInterviewerId(id: string | null | undefined, allInterviewers: boolean): InterviewerId {
  const config = getInterviewerById(id);
  if (config && (allInterviewers || isInterviewerFree(config.id))) return config.id;
  return DEFAULT_INTERVIEWER_ID;
}

/** True for interviewers with an avatar and a voice ("none" has neither). */
export function hasPersona(interviewer: InterviewerConfig | null | undefined): interviewer is InterviewerConfig {
  return !!interviewer && interviewer.id !== "none";
}

const ADVICE_LABELS: Record<InterviewerTraits["adviceLevel"], string> = {
  minimal: "brief feedback",
  standard: "standard feedback",
  detailed: "detailed feedback",
};

/** "5 questions · detailed feedback · 50/50 hints" */
export function describeTraits(config: InterviewerConfig): string {
  const parts = [`${config.traits.questionCount} questions`, ADVICE_LABELS[config.traits.adviceLevel]];
  if (config.traits.fiftyFifty) parts.push("50/50 hints");
  return parts.join(" · ");
}
