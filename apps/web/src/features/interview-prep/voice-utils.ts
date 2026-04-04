import type { InterviewerConfig } from "./interviewer-configs";

const VOICE_READY_TIMEOUT_MS = 1200;
const MAX_CHUNK_LENGTH = 220;
const CHUNK_PAUSE_MS = 80;

type VoiceGenderHint = "female" | "male" | "any";

const FEMALE_VOICE_TOKENS = [
  "female",
  "woman",
  "samantha",
  "victoria",
  "karen",
  "zira",
  "fiona",
  "moira",
  "susan",
  "ava",
  "aria",
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
  "onyx",
  "alloy-m",
];

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

function getVoiceGenderHint(interviewer: InterviewerConfig): VoiceGenderHint {
  if (interviewer.voice.fallbackGender) return interviewer.voice.fallbackGender;
  return interviewer.avatar.body === "F" ? "female" : "male";
}

function getPreferredVoiceNames(interviewer: InterviewerConfig): string[] {
  return interviewer.voice.preferredVoiceNames?.map(normalizeName) ?? [];
}

function voiceScore(
  voice: SpeechSynthesisVoice,
  interviewer: InterviewerConfig,
): number {
  const name = normalizeName(voice.name);
  const lang = normalizeName(voice.lang);
  const preferredNames = getPreferredVoiceNames(interviewer);
  const genderHint = getVoiceGenderHint(interviewer);

  let score = 0;

  if (lang.startsWith("en-us")) score += 12;
  else if (lang.startsWith("en-gb")) score += 10;
  else if (lang.startsWith("en")) score += 8;
  else score -= 100;

  if (voice.localService) score += 2;

  for (const preferredName of preferredNames) {
    if (name.includes(preferredName)) {
      score += 30;
      break;
    }
  }

  // Prefer higher-quality natural/neural voices when available.
  if (
    name.includes("siri") ||
    name.includes("neural") ||
    name.includes("natural") ||
    name.includes("enhanced") ||
    name.includes("premium")
  ) {
    score += 12;
  }

  // Penalize lower quality/flat voices that often sound robotic.
  if (name.includes("compact") || name.includes("novelty")) {
    score -= 10;
  }

  if (name.includes("fred")) {
    score -= 6;
  }

  if (genderHint === "female") {
    if (name.includes("female") || name.includes("woman")) score += 4;
    if (name.includes("male") || name.includes("man")) score -= 3;
  }

  if (genderHint === "male") {
    if (name.includes("male") || name.includes("man")) score += 4;
    if (name.includes("female") || name.includes("woman")) score -= 3;
  }

  if (name.includes("whisper")) score -= 5;

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

  const englishVoices = voices.filter((voice) =>
    normalizeName(voice.lang).startsWith("en"),
  );
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  const genderMatched =
    genderHint === "any"
      ? pool
      : pool.filter((voice) => inferVoiceGender(voice.name) === genderHint);

  const rankingPool = genderMatched.length > 0 ? genderMatched : pool;

  const ranked = [...rankingPool].sort((a, b) => {
    const byScore = voiceScore(b, interviewer) - voiceScore(a, interviewer);
    if (byScore !== 0) return byScore;
    return a.name.localeCompare(b.name);
  });

  const winner = ranked[0];
  return voiceScore(winner, interviewer) > -90 ? winner : null;
}

export function humanizeSpeechText(rawText: string): string {
  return rawText
    .replace(/\s+/g, " ")
    .replace(/\s*\//g, " or ")
    .replace(/\s*&\s*/g, " and ")
    .replace(/\bi\.e\.\b/gi, "that is")
    .replace(/\be\.g\.\b/gi, "for example")
    .replace(/\bvs\.\b/gi, "versus")
    .replace(/\bCI\/CD\b/g, "C I C D")
    .replace(/\bAPI\b/g, "A P I")
    .replace(/\bDB\b/g, "database")
    .replace(/\bSQL\b/g, "S Q L")
    .replace(/\bNoSQL\b/g, "No S Q L")
    .replace(/\betc\.\b/gi, "and so on")
    .replace(/\bcan't\b/gi, "cannot")
    .replace(/\bwon't\b/gi, "will not")
    .replace(/\s*([?.!,:;])\s*/g, "$1 ")
    .trim();
}

export function splitSpeechChunks(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length <= MAX_CHUNK_LENGTH) {
      current = next;
      continue;
    }

    if (current) chunks.push(current);

    if (sentence.length <= MAX_CHUNK_LENGTH) {
      current = sentence;
      continue;
    }

    const words = sentence.split(" ");
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

interface PlaySpeechOptions {
  interviewer: InterviewerConfig;
  text: string;
  muted?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: () => void;
}

function getChunkProsody(
  chunk: string,
  interviewer: InterviewerConfig,
  chunkIndex: number,
): { rate: number; pitch: number; volume: number } {
  const baseRate = interviewer.voice.speed;
  const basePitch = interviewer.voice.pitch ?? 1;
  const baseVolume = interviewer.voice.volume ?? 1;

  const variation = microVariation(`${interviewer.id}:${chunkIndex}:${chunk}`);
  const centered = (variation - 0.5) * 2;

  let rate = baseRate + centered * 0.03;
  let pitch = basePitch + centered * 0.05;

  if (/[?]\s*$/.test(chunk)) {
    pitch += 0.05;
    rate += 0.01;
  }

  if (/[!]\s*$/.test(chunk)) {
    pitch += 0.03;
    rate += 0.015;
  }

  if (chunk.length > 160) {
    rate -= 0.03;
  }

  rate = clamp(rate, 0.84, 1.15);
  pitch = clamp(pitch, 0.82, 1.22);

  return {
    rate,
    pitch,
    volume: clamp(baseVolume, 0, 1),
  };
}

export function playInterviewerSpeech({
  interviewer,
  text,
  muted = false,
  onStart,
  onComplete,
  onError,
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

  let cancelled = false;
  let activeUtterance: SpeechSynthesisUtterance | null = null;

  const cancel = () => {
    cancelled = true;
    if (activeUtterance) {
      activeUtterance.onend = null;
      activeUtterance.onerror = null;
      activeUtterance = null;
    }
    synth.cancel();
  };

  const run = async () => {
    synth.cancel();
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
      activeUtterance = utterance;
      utterance.lang = interviewer.voice.language || "en-US";
      const prosody = getChunkProsody(chunks[index], interviewer, index);
      utterance.rate = prosody.rate;
      utterance.pitch = prosody.pitch;
      utterance.volume = prosody.volume;
      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onend = () => {
        if (cancelled) return;
        index += 1;
        setTimeout(() => {
          speakNext();
        }, CHUNK_PAUSE_MS);
      };

      utterance.onerror = () => {
        if (cancelled) return;
        onError?.();
        onComplete?.();
      };

      synth.speak(utterance);
    };

    speakNext();
  };

  run().catch(() => {
    if (!cancelled) {
      onError?.();
      onComplete?.();
    }
  });

  return { cancel };
}

export function getInterviewerPreviewText(
  interviewer: InterviewerConfig,
): string {
  return `Hi, I am ${interviewer.name}. I will be your ${interviewer.role}. Let's begin when you are ready.`;
}
