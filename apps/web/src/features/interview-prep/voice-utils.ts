import type { InterviewerConfig } from "./interviewer-configs";

const VOICE_READY_TIMEOUT_MS = 1800;
const MAX_CHUNK_LENGTH = 190;
const CHUNK_PAUSE_MS = 160;
const SENTENCE_END_PAUSE_MS = 340;
const COMMA_PAUSE_MS = 120;
const WORD_DURATION_MS = 420;
const MIN_CHUNK_DURATION_MS = 1200;
const EXTRA_FAILSAFE_BUFFER_MS = 1400;

type VoiceGenderHint = "female" | "male" | "any";

export type VoiceQualityTier = "high" | "standard" | "low";

const FEMALE_VOICE_TOKENS = [
  "female",
  "woman",
  "samantha",
  "victoria",
  "karen",
  "allison",
  "ava",
  "serena",
  "siri female",
  "zira",
  "fiona",
  "moira",
  "susan",
  "aria",
  "jenny",
  "emma",
  "olivia",
  "amira",
  "natasha",
  "alloy-f",
];

const MALE_VOICE_TOKENS = [
  "male",
  "man",
  "aaron",
  "nathan",
  "arthur",
  "daniel",
  "alex",
  "fred",
  "tom",
  "david",
  "matthew",
  "george",
  "liam",
  "andrew",
  "ryan",
  "guy",
  "siri male",
  "brian",
  "christopher",
  "roger",
  "eric",
  "onyx",
  "alloy-m",
];

const HIGH_QUALITY_VOICE_TOKENS = [
  "neural",
  "natural",
  "enhanced",
  "premium",
  "siri",
  "wavenet",
  "studio",
  "online",
];

const LOW_QUALITY_VOICE_TOKENS = [
  "compact",
  "novelty",
  "whisper",
  "espeak",
  "festival",
  "mbrola",
  "zarvox",
  "bells",
  "boing",
  "trinoids",
  "hysterical",
  "pipe",
];

let speechPrimed = false;

function normalizeName(value: string): string {
  return value.toLowerCase().trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function microVariation(seedText: string): number {
  const n = hashString(seedText) % 1000;
  return n / 1000;
}

function getInterviewerLanguage(interviewer: InterviewerConfig): string {
  return normalizeName(interviewer.voice.language || "en-US");
}

function getVoiceGenderHint(interviewer: InterviewerConfig): VoiceGenderHint {
  if (interviewer.voice.fallbackGender) return interviewer.voice.fallbackGender;
  return interviewer.avatar.body === "F" ? "female" : "male";
}

function getPreferredVoiceNames(interviewer: InterviewerConfig): string[] {
  return interviewer.voice.preferredVoiceNames?.map(normalizeName) ?? [];
}

function normalizeVoiceDescriptor(voice: SpeechSynthesisVoice): string {
  return normalizeName(`${voice.name} ${voice.voiceURI ?? ""}`);
}

function getVoiceQualityTier(voice: SpeechSynthesisVoice): VoiceQualityTier {
  const descriptor = normalizeVoiceDescriptor(voice);

  const hasHighQualityToken = HIGH_QUALITY_VOICE_TOKENS.some((token) =>
    descriptor.includes(token),
  );
  const hasLowQualityToken = LOW_QUALITY_VOICE_TOKENS.some((token) =>
    descriptor.includes(token),
  );

  if (hasHighQualityToken && !hasLowQualityToken) return "high";
  if (hasLowQualityToken && !hasHighQualityToken) return "low";
  return "standard";
}

export interface VoiceSelectionDiagnostics {
  availableVoices: number;
  selectedVoiceName: string | null;
  selectedVoiceLang: string | null;
  qualityTier: VoiceQualityTier | null;
  genderMatched: boolean | null;
}

function getLanguageScore(
  voice: SpeechSynthesisVoice,
  interviewer: InterviewerConfig,
): number {
  const target = getInterviewerLanguage(interviewer);
  const targetBase = target.split("-")[0];
  const lang = normalizeName(voice.lang);

  if (lang === target) return 26;
  if (lang.startsWith(`${targetBase}-`)) return 16;
  if (lang.startsWith(targetBase)) return 12;
  if (targetBase === "en" && lang.startsWith("en")) return 10;
  return -120;
}

function getQualityScore(voice: SpeechSynthesisVoice): number {
  const descriptor = normalizeVoiceDescriptor(voice);
  const tier = getVoiceQualityTier(voice);

  let score = 0;
  if (tier === "high") score += 30;
  if (tier === "standard") score += 10;
  if (tier === "low") score -= 26;

  if (descriptor.includes("(enhanced)") || descriptor.includes("(premium)")) {
    score += 12;
  }

  if (descriptor.includes("google") && descriptor.includes("english")) {
    score += 6;
  }

  if (descriptor.includes("fred")) {
    score -= 8;
  }

  return score;
}

function getGenderScore(
  voice: SpeechSynthesisVoice,
  interviewer: InterviewerConfig,
): number {
  const voiceGender = inferVoiceGender(voice.name);
  const genderHint = getVoiceGenderHint(interviewer);

  if (genderHint === "any" || voiceGender === "any") return 0;
  return voiceGender === genderHint ? 9 : -10;
}

function getPreferenceScore(
  voice: SpeechSynthesisVoice,
  interviewer: InterviewerConfig,
): number {
  const descriptor = normalizeVoiceDescriptor(voice);
  const preferredNames = getPreferredVoiceNames(interviewer);

  for (const preferredName of preferredNames) {
    if (descriptor.includes(preferredName)) {
      return 36;
    }
  }

  return 0;
}

function isAcceptableVoice(
  voice: SpeechSynthesisVoice,
  interviewer: InterviewerConfig,
): boolean {
  return (
    getLanguageScore(voice, interviewer) > -100 && getQualityScore(voice) > -30
  );
}

function voiceScore(
  voice: SpeechSynthesisVoice,
  interviewer: InterviewerConfig,
): number {
  let score = 0;

  score += getLanguageScore(voice, interviewer);
  score += getQualityScore(voice);
  score += getGenderScore(voice, interviewer);
  score += getPreferenceScore(voice, interviewer);

  if (voice.localService) score += 3;

  const descriptor = normalizeVoiceDescriptor(voice);
  if (descriptor.includes("default")) score -= 1;

  return score;
}

function inferVoiceGender(name: string): VoiceGenderHint {
  const normalized = normalizeName(name);
  const isFemale = FEMALE_VOICE_TOKENS.some((token) =>
    normalized.includes(token),
  );
  const isMale = MALE_VOICE_TOKENS.some((token) => normalized.includes(token));

  if (isFemale && !isMale) return "female";
  if (isMale && !isFemale) return "male";
  return "any";
}

export function selectVoiceForInterviewer(
  voices: SpeechSynthesisVoice[],
  interviewer: InterviewerConfig,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const genderHint = getVoiceGenderHint(interviewer);
  const language = getInterviewerLanguage(interviewer);
  const baseLanguage = language.split("-")[0];

  const languagePool = voices.filter((voice) => {
    const lang = normalizeName(voice.lang);
    return lang === language || lang.startsWith(`${baseLanguage}-`);
  });

  const englishPool = voices.filter((voice) =>
    normalizeName(voice.lang).startsWith("en"),
  );

  const localePool =
    languagePool.length > 0
      ? languagePool
      : englishPool.length > 0
        ? englishPool
        : voices;

  const acceptablePool = localePool.filter((voice) =>
    isAcceptableVoice(voice, interviewer),
  );
  const qualityPool = acceptablePool.length > 0 ? acceptablePool : localePool;

  const genderMatchedPool =
    genderHint === "any"
      ? qualityPool
      : qualityPool.filter(
          (voice) => inferVoiceGender(voice.name) === genderHint,
        );

  const rankingPool =
    genderMatchedPool.length > 0 ? genderMatchedPool : qualityPool;

  const highQualityPool = rankingPool.filter(
    (voice) => getVoiceQualityTier(voice) === "high",
  );
  const finalPool = highQualityPool.length > 0 ? highQualityPool : rankingPool;

  const ranked = [...finalPool].sort((a, b) => {
    const byScore = voiceScore(b, interviewer) - voiceScore(a, interviewer);
    if (byScore !== 0) return byScore;
    return a.name.localeCompare(b.name);
  });

  const winner = ranked[0];
  return winner && voiceScore(winner, interviewer) > -90 ? winner : null;
}

export function humanizeSpeechText(rawText: string): string {
  return rawText
    .replace(/\s+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\s*\//g, " or ")
    .replace(/\s*&\s*/g, " and ")
    .replace(/\bi\.e\.\b/gi, "that is")
    .replace(/\be\.g\.\b/gi, "for example")
    .replace(/\bvs\.\b/gi, "versus")
    .replace(/\bETA\b/g, "E T A")
    .replace(/\bJWT\b/g, "J W T")
    .replace(/\bUI\b/g, "U I")
    .replace(/\bUX\b/g, "U X")
    .replace(/\bK8s\b/gi, "kubernetes")
    .replace(/\bSRE\b/g, "S R E")
    .replace(/\bHTTP\b/g, "H T T P")
    .replace(/\bHTTPS\b/g, "H T T P S")
    .replace(/\bCI\/CD\b/g, "C I C D")
    .replace(/\bAPI\b/g, "A P I")
    .replace(/\bAPIs\b/g, "A P Is")
    .replace(/\bDB\b/g, "database")
    .replace(/\bSQL\b/g, "S Q L")
    .replace(/\bNoSQL\b/g, "No S Q L")
    .replace(/\bPR\b/g, "P R")
    .replace(/\bQA\b/g, "Q A")
    .replace(/\betc\.\b/gi, "and so on")
    .replace(/\bcan't\b/gi, "cannot")
    .replace(/\bwon't\b/gi, "will not")
    .replace(/\bn't\b/gi, " not")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s*[-]\s*/g, ", ")
    .replace(/\s*([?.!,:;])\s*/g, "$1 ")
    .trim();
}

export function splitSpeechChunks(text: string): string[] {
  // Split on sentence boundaries AND clause boundaries (commas, semicolons)
  // for more natural phrasing with appropriate pauses.
  const sentences = text
    .split(/(?<=[.!?])\ +/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    // Further split long sentences on clause boundaries
    const clauses =
      sentence.length > MAX_CHUNK_LENGTH
        ? sentence
            .split(/(?<=[,;:])\ +/)
            .map((c) => c.trim())
            .filter(Boolean)
        : [sentence];

    for (const clause of clauses) {
      const next = current ? `${current} ${clause}` : clause;
      if (next.length <= MAX_CHUNK_LENGTH) {
        current = next;
        continue;
      }

      if (current) chunks.push(current);

      if (clause.length <= MAX_CHUNK_LENGTH) {
        current = clause;
        continue;
      }

      const words = clause.split(" ");
      let wordChunk = "";
      for (const word of words) {
        const candidate = wordChunk ? `${wordChunk} ${word}` : word;
        if (candidate.length <= MAX_CHUNK_LENGTH) {
          wordChunk = candidate;
        } else {
          if (wordChunk) chunks.push(wordChunk);
          wordChunk = word;
        }
      }
      current = wordChunk;
    }
  }

  if (current) chunks.push(current);

  return chunks.length > 0 ? chunks : [text];
}

async function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];

  const synth = window.speechSynthesis;
  const existing = synth.getVoices();
  if (existing.length > 0) return existing;

  return new Promise((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const done = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      synth.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(synth.getVoices());
    };

    const handleVoicesChanged = () => done();

    timeoutId = setTimeout(done, VOICE_READY_TIMEOUT_MS);
    synth.addEventListener("voiceschanged", handleVoicesChanged);
  });
}

function primeSpeechSynthesis(synth: SpeechSynthesis) {
  if (speechPrimed) return;
  speechPrimed = true;

  // Warm-up reduces clipped first words on some browsers/OS voices.
  const warmup = new SpeechSynthesisUtterance(" ");
  warmup.volume = 0;
  warmup.rate = 1;
  warmup.pitch = 1;
  synth.speak(warmup);
  synth.cancel();
}

interface PlaySpeechOptions {
  interviewer: InterviewerConfig;
  text: string;
  muted?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: () => void;
  onBoundary?: (event: {
    chunk: string;
    chunkIndex: number;
    charIndex: number;
    charLength: number;
  }) => void;
}

function getChunkProsody(
  chunk: string,
  interviewer: InterviewerConfig,
  chunkIndex: number,
  selectedVoice: SpeechSynthesisVoice | null,
): { rate: number; pitch: number; volume: number; pauseAfterMs: number } {
  const baseRate = interviewer.voice.speed;
  const basePitch = interviewer.voice.pitch ?? 1;
  const baseVolume = interviewer.voice.volume ?? 1;

  // Use two different seeds per chunk so rate and pitch vary independently
  const rateVariation = microVariation(
    `${interviewer.id}:rate:${chunkIndex}:${chunk}`,
  );
  const pitchVariation = microVariation(
    `${interviewer.id}:pitch:${chunkIndex}:${chunk}`,
  );
  const rateCentered = (rateVariation - 0.5) * 2;
  const pitchCentered = (pitchVariation - 0.5) * 2;

  let rate = baseRate + rateCentered * 0.06;
  let pitch = basePitch + pitchCentered * 0.08;

  // Question inflection — more noticeable rise
  if (/[?]\s*$/.test(chunk)) {
    pitch += 0.08;
    rate -= 0.02;
  }

  // Emphasis on exclamatory sentences
  if (/[!]\s*$/.test(chunk)) {
    pitch += 0.04;
    rate += 0.02;
  }

  // Slow down for longer, more complex chunks
  if (chunk.length > 120) {
    rate -= 0.04;
  }

  // Opening sentence of speech should be slightly slower/deliberate
  if (chunkIndex === 0) {
    rate -= 0.03;
  }

  const targetGender = getVoiceGenderHint(interviewer);
  const selectedGender = selectedVoice
    ? inferVoiceGender(selectedVoice.name)
    : "any";
  if (targetGender !== "any" && selectedGender !== "any") {
    if (targetGender === "female" && selectedGender !== "female") {
      pitch += 0.05;
    }
    if (targetGender === "male" && selectedGender !== "male") {
      pitch -= 0.05;
    }
  }

  rate = clamp(rate, 0.82, 1.08);
  pitch = clamp(pitch, 0.84, 1.18);

  // Determine natural pause length after this chunk
  let pauseAfterMs = CHUNK_PAUSE_MS;
  if (/[.!?]\s*$/.test(chunk)) {
    pauseAfterMs = SENTENCE_END_PAUSE_MS;
  } else if (/[,;:]\s*$/.test(chunk)) {
    pauseAfterMs = COMMA_PAUSE_MS;
  }
  // Add slight randomness to pauses for naturalness
  pauseAfterMs += Math.floor(rateVariation * 60);

  return {
    rate,
    pitch,
    volume: clamp(baseVolume, 0, 1),
    pauseAfterMs,
  };
}

function estimateChunkDurationMs(chunk: string, rate: number): number {
  const wordCount = chunk.split(/\s+/).filter(Boolean).length;
  const speechDuration = Math.round((wordCount * WORD_DURATION_MS) / rate);
  return Math.max(MIN_CHUNK_DURATION_MS, speechDuration);
}

export function playInterviewerSpeech({
  interviewer,
  text,
  muted = false,
  onStart,
  onComplete,
  onError,
  onBoundary,
}: PlaySpeechOptions): { cancel: () => void } | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onError?.();
    return null;
  }

  if (muted || interviewer.id === "none") {
    onComplete?.();
    return null;
  }

  const synth = window.speechSynthesis;
  const prepared = humanizeSpeechText(text);
  const chunks = splitSpeechChunks(prepared);
  const activeTimers = new Set<ReturnType<typeof setTimeout>>();

  let cancelled = false;
  let activeUtterance: SpeechSynthesisUtterance | null = null;

  const clearTimers = () => {
    for (const timer of activeTimers) {
      clearTimeout(timer);
    }
    activeTimers.clear();
  };

  const cancel = () => {
    cancelled = true;
    clearTimers();
    if (activeUtterance) {
      activeUtterance.onend = null;
      activeUtterance.onerror = null;
      activeUtterance.onboundary = null;
      activeUtterance = null;
    }
    synth.cancel();
  };

  const run = async () => {
    synth.cancel();
    synth.resume();
    primeSpeechSynthesis(synth);
    onStart?.();

    const voices = await waitForVoices();
    if (cancelled) return;

    const selectedVoice = selectVoiceForInterviewer(voices, interviewer);
    let index = 0;

    const speakNext = () => {
      if (cancelled) return;

      if (index >= chunks.length) {
        onComplete?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      const chunkIndex = index;
      const chunkText = chunks[chunkIndex];
      activeUtterance = utterance;
      utterance.lang = interviewer.voice.language || "en-US";
      const prosody = getChunkProsody(
        chunkText,
        interviewer,
        chunkIndex,
        selectedVoice,
      );
      utterance.rate = prosody.rate;
      utterance.pitch = prosody.pitch;
      utterance.volume = prosody.volume;
      if (selectedVoice) utterance.voice = selectedVoice;

      let finished = false;

      const finishChunk = () => {
        if (finished || cancelled) return;
        finished = true;
        index += 1;
        const timer = setTimeout(() => {
          activeTimers.delete(timer);
          speakNext();
        }, prosody.pauseAfterMs);
        activeTimers.add(timer);
      };

      const failsafeTimer = setTimeout(
        () => {
          activeTimers.delete(failsafeTimer);
          finishChunk();
        },
        estimateChunkDurationMs(chunkText, prosody.rate) +
          EXTRA_FAILSAFE_BUFFER_MS,
      );
      activeTimers.add(failsafeTimer);

      utterance.onboundary = (event) => {
        if (cancelled) return;
        onBoundary?.({
          chunk: chunkText,
          chunkIndex,
          charIndex: Math.max(0, event.charIndex ?? 0),
          charLength: Math.max(1, event.charLength ?? 1),
        });
      };

      utterance.onend = () => {
        activeTimers.delete(failsafeTimer);
        finishChunk();
      };

      utterance.onerror = () => {
        activeTimers.delete(failsafeTimer);
        if (cancelled) return;
        clearTimers();
        onError?.();
        onComplete?.();
      };

      synth.speak(utterance);
    };

    speakNext();
  };

  run().catch(() => {
    if (!cancelled) {
      clearTimers();
      onError?.();
      onComplete?.();
    }
  });

  return { cancel };
}

export function getInterviewerPreviewText(
  interviewer: InterviewerConfig,
): string {
  return `Hi, I am ${interviewer.name}. I will be your ${interviewer.role}. I will ask realistic interview questions and give clear feedback. Let's begin when you are ready.`;
}

export async function getVoiceSelectionDiagnostics(
  interviewer: InterviewerConfig,
): Promise<VoiceSelectionDiagnostics> {
  const voices = await waitForVoices();
  const selected = selectVoiceForInterviewer(voices, interviewer);

  if (!selected) {
    return {
      availableVoices: voices.length,
      selectedVoiceName: null,
      selectedVoiceLang: null,
      qualityTier: null,
      genderMatched: null,
    };
  }

  const hint = getVoiceGenderHint(interviewer);
  const selectedGender = inferVoiceGender(selected.name);
  const genderMatched =
    hint === "any" || selectedGender === "any" ? null : selectedGender === hint;

  return {
    availableVoices: voices.length,
    selectedVoiceName: selected.name,
    selectedVoiceLang: selected.lang || null,
    qualityTier: getVoiceQualityTier(selected),
    genderMatched,
  };
}
