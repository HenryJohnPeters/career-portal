import type { InterviewerConfig } from "./interviewer-configs";

const VOICE_READY_TIMEOUT_MS = 1200;
const MAX_CHUNK_LENGTH = 160;
const CHUNK_PAUSE_MS = 180;
const SENTENCE_END_PAUSE_MS = 320;
const COMMA_PAUSE_MS = 100;

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
  // Strongly prefer premium voices — they sound dramatically more human.
  if (
    name.includes("siri") ||
    name.includes("neural") ||
    name.includes("natural") ||
    name.includes("enhanced") ||
    name.includes("premium")
  ) {
    score += 25;
  }

  // macOS high-quality voices (Siri variants)
  if (name.includes("(enhanced)") || name.includes("(premium)")) {
    score += 15;
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
        const currentChunk = chunks[index];
        const prosodyInfo = getChunkProsody(currentChunk, interviewer, index);
        index += 1;
        setTimeout(() => {
          speakNext();
        }, prosodyInfo.pauseAfterMs);
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
