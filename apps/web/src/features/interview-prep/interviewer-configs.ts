/**
 * interviewer-configs.ts
 *
 * Single source-of-truth for all Mock Interview interviewers.
 * Each entry maps to a TalkingHead GLB avatar + HeadTTS voice preset.
 *
 * To add a new interviewer:
 *   1. Drop your .glb into /public/avatars/
 *   2. Add a new entry to INTERVIEWER_CONFIGS below.
 *   3. That's it — the rest of the system picks it up automatically.
 */

import type { InterviewerTraits } from "@careerportal/shared/types";

export interface InterviewerVoiceConfig {
  /** Kokoro voice ID (HeadTTS). Full list: https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped#voicessamples */
  voice: string;
  /** HeadTTS language tag */
  language: string;
  /** Speaking speed multiplier [0.25 – 4] */
  speed: number;
}

export interface InterviewerAvatarConfig {
  /** Path to the GLB model (relative to /public) */
  url: string;
  /** Body form: "M" | "F" */
  body: "M" | "F";
  /** TalkingHead mood for this persona */
  avatarMood:
    | "neutral"
    | "happy"
    | "angry"
    | "sad"
    | "fear"
    | "disgust"
    | "love"
    | "sleep";
  /** TalkingHead camera view */
  cameraView: "full" | "mid" | "upper" | "head";
  /** CSS background for the canvas container — visually differentiates interviewers */
  background: string;
  /** Three.js ambient light colour hex */
  lightAmbientColor: string;
  /** Three.js directional light colour hex */
  lightDirectColor: string;
}

export interface InterviewerConfig {
  /** Unique key — used as the interviewer ID */
  id: string;
  /** Display name */
  name: string;
  /** One-line role description shown in the card */
  role: string;
  /** Short flavour description of their style */
  style: string;
  /** Emoji badge shown when no avatar is loaded */
  emoji: string;
  /** Tailwind gradient for the card accent */
  gradient: string;
  /** Avatar (TalkingHead) settings */
  avatar: InterviewerAvatarConfig;
  /** Voice (HeadTTS) settings */
  voice: InterviewerVoiceConfig;
  /** Fun tag words for the interviewer */
  tags?: string[];
  /** Interviewer traits that affect the interview experience */
  traits?: InterviewerTraits;
}

/**
 * Kokoro voice reference (a subset):
 *
 * Female (af_*):  af_bella · af_nicole · af_nova · af_sarah · af_sky
 * Female (bf_*):  bf_emma  · bf_isabella
 * Male   (am_*):  am_adam  · am_echo   · am_eric · am_fenrir · am_liam · am_michael · am_onyx
 * Male   (bm_*):  bm_daniel · bm_fable  · bm_george · bm_lewis
 *
 * Avatar GLB files are served from /public/avatars/.
 * Free RPM-compatible avatars can be generated at https://avaturn.me
 * The brunette.glb demo model from TalkingHead's own repo is used as fallback.
 */
export const INTERVIEWER_CONFIGS: InterviewerConfig[] = [
  {
    id: "none",
    name: "Endless Questions",
    role: "Practice Mode",
    style: "Answer as many questions as you want without an interviewer",
    emoji: "∞",
    gradient: "from-gray-400 to-gray-600",
    avatar: {
      url: "",
      body: "M",
      avatarMood: "neutral",
      cameraView: "upper",
      background: "linear-gradient(160deg, #1a1a1a 0%, #0a0a0a 100%)",
      lightAmbientColor: "#888888",
      lightDirectColor: "#666666",
    },
    voice: { voice: "af_bella", language: "en-us", speed: 1.0 },
    tags: ["Solo", "Focused", "Minimal"],
  },
  {
    id: "alex",
    name: "Alex",
    role: "Senior Engineer · Friendly",
    style: "Warm, encouraging, focuses on learning",
    emoji: "😊",
    gradient: "from-emerald-500 to-teal-600",
    avatar: {
      url: "/avatars/alex.glb",
      body: "F",
      avatarMood: "happy",
      cameraView: "upper",
      background: "linear-gradient(160deg, #0d2a1f 0%, #0a1628 100%)",
      lightAmbientColor: "#a8e6cf",
      lightDirectColor: "#56c596",
    },
    voice: { voice: "af_bella", language: "en-us", speed: 1.0 },
    tags: ["Encouraging", "Patient", "Wholesome"],
    traits: { questionCount: 5, adviceLevel: "detailed", fiftyFifty: true },
  },
  {
    id: "riley",
    name: "Riley",
    role: "Frontend Specialist · Creative",
    style: "UX-focused, visual design enthusiast",
    emoji: "🎨",
    gradient: "from-cyan-500 to-blue-500",
    avatar: {
      url: "/avatars/riley.glb",
      body: "F",
      avatarMood: "happy",
      cameraView: "upper",
      background: "linear-gradient(160deg, #0d1f2a 0%, #0a1520 100%)",
      lightAmbientColor: "#a8e0ff",
      lightDirectColor: "#56b9ff",
    },
    voice: { voice: "af_sarah", language: "en-us", speed: 1.05 },
    tags: ["Creative", "Artsy", "Vibey"],
    traits: { questionCount: 7, adviceLevel: "detailed", fiftyFifty: false },
  },
  {
    id: "morgan",
    name: "Morgan",
    role: "Staff Engineer · Neutral",
    style: "Professional, balanced, covers all bases",
    emoji: "🤝",
    gradient: "from-blue-500 to-indigo-600",
    avatar: {
      url: "/avatars/morgan.glb",
      body: "F",
      avatarMood: "neutral",
      cameraView: "upper",
      background: "linear-gradient(160deg, #0d1a2e 0%, #0a0f1e 100%)",
      lightAmbientColor: "#a8c8ff",
      lightDirectColor: "#5b9fff",
    },
    voice: { voice: "af_nova", language: "en-us", speed: 0.95 },
    tags: ["Professional", "Balanced", "Corporate"],
    traits: { questionCount: 10, adviceLevel: "standard", fiftyFifty: false },
  },
  {
    id: "sam",
    name: "Sam",
    role: "Tech Lead · Strategic",
    style: "Big-picture thinker, focuses on architecture",
    emoji: "🧠",
    gradient: "from-purple-500 to-pink-600",
    avatar: {
      url: "/avatars/sam.glb",
      body: "M",
      avatarMood: "neutral",
      cameraView: "upper",
      background: "linear-gradient(160deg, #1e0d2a 0%, #0e0a1e 100%)",
      lightAmbientColor: "#d8a8ff",
      lightDirectColor: "#a056ff",
    },
    voice: { voice: "am_adam", language: "en-us", speed: 0.92 },
    tags: ["Strategic", "Wise", "Big Brain"],
    traits: { questionCount: 12, adviceLevel: "standard", fiftyFifty: false },
  },
  {
    id: "kai",
    name: "Kai",
    role: "Backend Engineer · Pragmatic",
    style: "Performance-driven, systems thinking",
    emoji: "⚡",
    gradient: "from-yellow-500 to-orange-500",
    avatar: {
      url: "/avatars/kai.glb",
      body: "M",
      avatarMood: "neutral",
      cameraView: "upper",
      background: "linear-gradient(160deg, #2a1f0d 0%, #1e150a 100%)",
      lightAmbientColor: "#ffe4a8",
      lightDirectColor: "#ffb856",
    },
    voice: { voice: "am_eric", language: "en-us", speed: 0.88 },
    tags: ["Pragmatic", "Chill", "Speedrunner"],
    traits: { questionCount: 15, adviceLevel: "minimal", fiftyFifty: false },
  },
  {
    id: "jordan",
    name: "Jordan",
    role: "Principal Engineer · Tough",
    style: "Challenging, direct, bar-raiser mindset",
    emoji: "🔥",
    gradient: "from-orange-500 to-red-600",
    avatar: {
      url: "/avatars/jordan.glb",
      body: "M",
      avatarMood: "neutral",
      cameraView: "upper",
      background: "linear-gradient(160deg, #2a0d0d 0%, #1a0808 100%)",
      lightAmbientColor: "#ffcba8",
      lightDirectColor: "#ff7043",
    },
    voice: { voice: "am_fenrir", language: "en-us", speed: 0.9 },
    tags: ["Intense", "Direct", "No-Nonsense"],
    traits: { questionCount: 15, adviceLevel: "minimal", fiftyFifty: false },
  },
  {
    id: "phoenix",
    name: "Phoenix",
    role: "Security Engineer · Rigorous",
    style: "Security-first mindset, detail-oriented",
    emoji: "🔒",
    gradient: "from-red-600 to-rose-700",
    avatar: {
      url: "/avatars/phoenix.glb",
      body: "M",
      avatarMood: "neutral",
      cameraView: "upper",
      background: "linear-gradient(160deg, #2a0d15 0%, #1a0810 100%)",
      lightAmbientColor: "#ffa8c0",
      lightDirectColor: "#ff5680",
    },
    voice: { voice: "am_michael", language: "en-us", speed: 0.87 },
    tags: ["Serious", "Vigilant", "Hardcore"],
    traits: { questionCount: 18, adviceLevel: "minimal", fiftyFifty: false },
  },
  {
    id: "nova",
    name: "Nova",
    role: "DevOps Engineer · Methodical",
    style: "Infrastructure expert, automation focus",
    emoji: "🛠️",
    gradient: "from-slate-500 to-gray-600",
    avatar: {
      url: "/avatars/nova.glb",
      body: "F",
      avatarMood: "neutral",
      cameraView: "upper",
      background: "linear-gradient(160deg, #1a1f2a 0%, #0f1218 100%)",
      lightAmbientColor: "#c8d0e0",
      lightDirectColor: "#8090a8",
    },
    voice: { voice: "af_nicole", language: "en-us", speed: 0.93 },
    tags: ["Methodical", "Precise", "Calculated"],
    traits: { questionCount: 20, adviceLevel: "minimal", fiftyFifty: false },
  },
];

/** Convenient lookup by id */
export function getInterviewerById(id: string): InterviewerConfig | undefined {
  return INTERVIEWER_CONFIGS.find((c) => c.id === id);
}

/** The default interviewer used when none has been selected */
export const DEFAULT_INTERVIEWER_ID = INTERVIEWER_CONFIGS[0].id;
