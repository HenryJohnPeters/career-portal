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
  avatarMood: "neutral" | "happy" | "angry" | "sad" | "fear" | "disgust" | "love" | "sleep";
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
  },
];

/** Convenient lookup by id */
export function getInterviewerById(id: string): InterviewerConfig | undefined {
  return INTERVIEWER_CONFIGS.find((c) => c.id === id);
}

/** The default interviewer used when none has been selected */
export const DEFAULT_INTERVIEWER_ID = INTERVIEWER_CONFIGS[0].id;
