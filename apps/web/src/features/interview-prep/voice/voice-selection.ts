import type { InterviewerVoiceConfig } from "../interviewer-configs";

/*
 * Picks the most natural installed system voice for an interviewer. Pure
 * functions over SpeechSynthesisVoice-like objects, so they are unit-testable.
 */

export type VoiceGender = "female" | "male" | "any";
export type VoiceQualityTier = "high" | "standard" | "low";

/** The SpeechSynthesisVoice fields the ranking reads. */
export type VoiceLike = Pick<SpeechSynthesisVoice, "name" | "lang" | "localService"> & {
  voiceURI?: string;
};

type VoiceProfile = Pick<InterviewerVoiceConfig, "language" | "preferredVoiceNames" | "gender">;

/** Common system/neural voice first names (macOS, Windows/Edge, Google, Siri). */
const FEMALE_NAMES = new Set([
  "samantha", "victoria", "karen", "allison", "ava", "serena", "zira", "fiona", "moira",
  "susan", "aria", "jenny", "emma", "olivia", "amira", "natasha", "sonia", "libby",
  "michelle", "tessa", "veena", "kate", "hazel", "catherine", "nicky", "sara", "clara",
]);

const MALE_NAMES = new Set([
  "aaron", "nathan", "arthur", "daniel", "alex", "fred", "tom", "david", "matthew",
  "george", "liam", "andrew", "ryan", "guy", "brian", "christopher", "roger", "eric",
  "mark", "james", "thomas", "steffan", "oliver", "rishi", "gordon", "lee",
]);

const HIGH_QUALITY_TOKENS = ["neural", "natural", "enhanced", "premium", "siri", "wavenet", "studio", "online"];

const LOW_QUALITY_TOKENS = [
  "compact", "novelty", "whisper", "espeak", "festival", "mbrola", "zarvox", "bells",
  "boing", "trinoids", "hysterical", "pipe",
];

function normalize(value: string | undefined): string {
  return (value ?? "").toLowerCase().trim();
}

function describe(voice: VoiceLike): string {
  return normalize(`${voice.name} ${voice.voiceURI ?? ""}`);
}

function tokens(text: string): Set<string> {
  return new Set(text.split(/[^a-z]+/).filter(Boolean));
}

/**
 * Gender from whole-word tokens. Explicit words win ("Google UK English
 * Female"), then known first names; anything ambiguous is "any".
 */
export function inferVoiceGender(name: string): VoiceGender {
  const words = tokens(normalize(name));
  if (words.has("female") || words.has("woman")) return "female";
  if (words.has("male") || words.has("man")) return "male";
  const female = [...words].some((w) => FEMALE_NAMES.has(w));
  const male = [...words].some((w) => MALE_NAMES.has(w));
  if (female && !male) return "female";
  if (male && !female) return "male";
  return "any";
}

export function getVoiceQualityTier(voice: VoiceLike): VoiceQualityTier {
  const descriptor = describe(voice);
  const high = HIGH_QUALITY_TOKENS.some((t) => descriptor.includes(t));
  const low = LOW_QUALITY_TOKENS.some((t) => descriptor.includes(t));
  if (high && !low) return "high";
  if (low && !high) return "low";
  return "standard";
}

function languageScore(voice: VoiceLike, profile: VoiceProfile): number {
  const target = normalize(profile.language || "en-US");
  const base = target.split("-")[0];
  const lang = normalize(voice.lang).replace("_", "-");
  if (lang === target) return 26;
  if (lang.startsWith(`${base}-`)) return 16;
  if (lang.startsWith(base)) return 12;
  return -120;
}

function qualityScore(voice: VoiceLike): number {
  const descriptor = describe(voice);
  const tier = getVoiceQualityTier(voice);
  let score = tier === "high" ? 30 : tier === "standard" ? 10 : -26;
  if (descriptor.includes("(enhanced)") || descriptor.includes("(premium)")) score += 12;
  if (descriptor.includes("google") && descriptor.includes("english")) score += 6;
  if (descriptor.includes("fred")) score -= 8;
  return score;
}

/** Index of the first preferred name the voice matches, or -1. */
function preferenceRank(voice: VoiceLike, profile: VoiceProfile): number {
  const descriptor = describe(voice);
  const preferred = (profile.preferredVoiceNames ?? []).map(normalize);
  return preferred.findIndex((name) => name && descriptor.includes(name));
}

export function scoreVoice(voice: VoiceLike, profile: VoiceProfile): number {
  let score = languageScore(voice, profile) + qualityScore(voice);

  const gender = inferVoiceGender(voice.name);
  if (profile.gender !== "any" && gender !== "any") {
    score += gender === profile.gender ? 9 : -10;
  }

  const rank = preferenceRank(voice, profile);
  if (rank >= 0) score += 36 + Math.max(0, 10 - rank);

  if (voice.localService) score += 3;
  if (describe(voice).includes("default")) score -= 1;
  return score;
}

/**
 * Best voice for the profile, or null when nothing usable is installed.
 * Preferred names are trusted over the gender filter (gender inference from a
 * name is a guess); otherwise voices of the wanted gender are ranked first.
 */
export function selectVoice<V extends VoiceLike>(voices: readonly V[], profile: VoiceProfile): V | null {
  if (voices.length === 0) return null;

  const language = normalize(profile.language || "en-US");
  const base = language.split("-")[0];
  const languagePool = voices.filter((v) => {
    const lang = normalize(v.lang).replace("_", "-");
    return lang === language || lang.startsWith(`${base}-`);
  });
  const localePool = languagePool.length > 0 ? languagePool : voices;

  const acceptable = localePool.filter(
    (v) => languageScore(v, profile) > -100 && qualityScore(v) > -30,
  );
  const qualityPool = acceptable.length > 0 ? acceptable : localePool;

  const preferredPool = qualityPool.filter((v) => preferenceRank(v, profile) >= 0);
  let pool: readonly V[] = preferredPool;
  if (pool.length === 0) {
    const genderPool =
      profile.gender === "any"
        ? qualityPool
        : qualityPool.filter((v) => inferVoiceGender(v.name) === profile.gender);
    pool = genderPool.length > 0 ? genderPool : qualityPool;
    const highQuality = pool.filter((v) => getVoiceQualityTier(v) === "high");
    if (highQuality.length > 0) pool = highQuality;
  }

  const ranked = [...pool].sort((a, b) => {
    const byScore = scoreVoice(b, profile) - scoreVoice(a, profile);
    return byScore !== 0 ? byScore : a.name.localeCompare(b.name);
  });
  const winner = ranked[0];
  return winner && scoreVoice(winner, profile) > -90 ? winner : null;
}
