import type { InterviewerConfig } from "../interviewer-configs";
import { humanizeSpeechText, splitSpeechChunks } from "./speech-text";
import {
  getVoiceQualityTier,
  inferVoiceGender,
  selectVoice,
  type VoiceQualityTier,
} from "./voice-selection";

/*
 * Interviewer speech through the browser's free speechSynthesis API: chunked
 * utterances with light per-chunk prosody, a failsafe for engines that never
 * fire `end`, and cancellation that always silences the engine.
 */

const VOICE_READY_TIMEOUT_MS = 1800;
const CHUNK_PAUSE_MS = 160;
const SENTENCE_END_PAUSE_MS = 340;
const COMMA_PAUSE_MS = 120;
const WORD_DURATION_MS = 420;
const MIN_CHUNK_DURATION_MS = 1200;
const EXTRA_FAILSAFE_BUFFER_MS = 1400;

export interface SpeechPlayback {
  cancel: () => void;
}

export interface BoundaryEvent {
  chunk: string;
  chunkIndex: number;
  charIndex: number;
}

interface PlaySpeechOptions {
  interviewer: InterviewerConfig;
  text: string;
  muted?: boolean;
  /** Called once, when playback ends normally, fails or is unavailable (not on cancel). */
  onEnd?: () => void;
  onBoundary?: (event: BoundaryEvent) => void;
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

/** Silence any utterance, including one whose playback handle was already dropped. */
export function cancelAllSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Some engines throw while initialising; nothing is playing then.
  }
}

async function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSynthesisSupported()) return [];
  const synth = window.speechSynthesis;
  const existing = synth.getVoices();
  if (existing.length > 0) return existing;

  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timeoutId);
      synth.removeEventListener("voiceschanged", done);
      resolve(synth.getVoices());
    };
    const timeoutId = setTimeout(done, VOICE_READY_TIMEOUT_MS);
    synth.addEventListener("voiceschanged", done);
  });
}

/** Selected voice per interviewer, recomputed when the installed voice list changes. */
const voiceCache = new Map<string, SpeechSynthesisVoice | null>();

function voiceFor(interviewer: InterviewerConfig, voices: SpeechSynthesisVoice[]) {
  const key = `${interviewer.id}:${voices.length}`;
  if (!voiceCache.has(key)) voiceCache.set(key, selectVoice(voices, interviewer.voice));
  return voiceCache.get(key) ?? null;
}

let speechPrimed = false;

/** A silent warm-up utterance avoids clipped first words on some engines. */
function primeSpeechSynthesis(synth: SpeechSynthesis) {
  if (speechPrimed) return;
  speechPrimed = true;
  const warmup = new SpeechSynthesisUtterance(" ");
  warmup.volume = 0;
  synth.speak(warmup);
  synth.cancel();
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministic 0-1 variation so repeated prompts sound the same. */
function variation(seed: string): number {
  return (hashString(seed) % 1000) / 1000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function chunkProsody(
  chunk: string,
  interviewer: InterviewerConfig,
  chunkIndex: number,
  voice: SpeechSynthesisVoice | null,
) {
  const rateJitter = variation(`${interviewer.id}:rate:${chunkIndex}:${chunk}`);
  const pitchJitter = variation(`${interviewer.id}:pitch:${chunkIndex}:${chunk}`);

  let rate = interviewer.voice.speed + (rateJitter - 0.5) * 0.12;
  let pitch = (interviewer.voice.pitch ?? 1) + (pitchJitter - 0.5) * 0.16;

  if (/\?\s*$/.test(chunk)) {
    pitch += 0.08; // questions rise
    rate -= 0.02;
  }
  if (/!\s*$/.test(chunk)) {
    pitch += 0.04;
    rate += 0.02;
  }
  if (chunk.length > 120) rate -= 0.04;
  if (chunkIndex === 0) rate -= 0.03;

  // Nudge the pitch when the installed voice is not the wanted gender.
  const wanted = interviewer.voice.gender;
  const actual = voice ? inferVoiceGender(voice.name) : "any";
  if (wanted !== "any" && actual !== "any" && actual !== wanted) {
    pitch += wanted === "female" ? 0.05 : -0.05;
  }

  let pauseAfterMs = CHUNK_PAUSE_MS;
  if (/[.!?]\s*$/.test(chunk)) pauseAfterMs = SENTENCE_END_PAUSE_MS;
  else if (/[,;:]\s*$/.test(chunk)) pauseAfterMs = COMMA_PAUSE_MS;
  pauseAfterMs += Math.floor(rateJitter * 60);

  return {
    rate: clamp(rate, 0.82, 1.08),
    pitch: clamp(pitch, 0.84, 1.18),
    volume: clamp(interviewer.voice.volume ?? 1, 0, 1),
    pauseAfterMs,
  };
}

function estimateChunkDurationMs(chunk: string, rate: number): number {
  const words = chunk.split(/\s+/).filter(Boolean).length;
  return Math.max(MIN_CHUNK_DURATION_MS, Math.round((words * WORD_DURATION_MS) / rate));
}

/**
 * Speak `text` as the interviewer. Returns a handle whose `cancel()` stops it
 * (onEnd is not called then), or null when nothing will play — onEnd has
 * already been called in that case.
 */
export function playInterviewerSpeech({
  interviewer,
  text,
  muted = false,
  onEnd,
  onBoundary,
}: PlaySpeechOptions): SpeechPlayback | null {
  const chunks = splitSpeechChunks(humanizeSpeechText(text));
  if (muted || interviewer.id === "none" || !isSpeechSynthesisSupported() || chunks.length === 0) {
    onEnd?.();
    return null;
  }

  const synth = window.speechSynthesis;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let stopped = false;
  let activeUtterance: SpeechSynthesisUtterance | null = null;

  const clearTimers = () => {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  };

  const detach = () => {
    if (!activeUtterance) return;
    activeUtterance.onend = null;
    activeUtterance.onerror = null;
    activeUtterance.onboundary = null;
    activeUtterance = null;
  };

  /** Ends playback for good; `notify` is false for an explicit cancel. */
  const stop = (notify: boolean, silenceEngine = true) => {
    if (stopped) return;
    stopped = true;
    clearTimers();
    detach();
    if (silenceEngine) cancelAllSpeech();
    if (notify) onEnd?.();
  };

  const schedule = (fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      fn();
    }, ms);
    timers.add(timer);
    return timer;
  };

  const run = async () => {
    synth.cancel();
    synth.resume();
    primeSpeechSynthesis(synth);

    const voices = await waitForVoices();
    if (stopped) return;
    const voice = voiceFor(interviewer, voices);

    const speakChunk = (index: number) => {
      if (stopped) return;
      if (index >= chunks.length) {
        stop(true, false);
        return;
      }

      const chunk = chunks[index];
      const prosody = chunkProsody(chunk, interviewer, index, voice);
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = interviewer.voice.language || "en-US";
      utterance.rate = prosody.rate;
      utterance.pitch = prosody.pitch;
      utterance.volume = prosody.volume;
      if (voice) utterance.voice = voice;
      activeUtterance = utterance;

      let finished = false;
      const finishChunk = () => {
        if (finished || stopped) return;
        finished = true;
        clearTimeout(failsafe);
        timers.delete(failsafe);
        detach();
        schedule(() => speakChunk(index + 1), prosody.pauseAfterMs);
      };

      // Some engines never fire `end`; move on after the estimated duration.
      const failsafe = schedule(
        finishChunk,
        estimateChunkDurationMs(chunk, prosody.rate) + EXTRA_FAILSAFE_BUFFER_MS,
      );

      utterance.onboundary = (event) => {
        if (stopped) return;
        onBoundary?.({ chunk, chunkIndex: index, charIndex: Math.max(0, event.charIndex ?? 0) });
      };
      utterance.onend = finishChunk;
      // "interrupted"/"canceled" means something else already silenced the engine.
      utterance.onerror = (event) =>
        stop(true, event.error !== "interrupted" && event.error !== "canceled");

      synth.speak(utterance);
    };

    speakChunk(0);
  };

  run().catch(() => stop(true));

  return { cancel: () => stop(false) };
}

export function getInterviewerPreviewText(interviewer: InterviewerConfig): string {
  return `Hi, I'm ${interviewer.name}, a ${interviewer.title.toLowerCase()}. I'll ask realistic interview questions and give you clear feedback. Let's begin when you're ready.`;
}

export interface VoiceSelectionDiagnostics {
  availableVoices: number;
  selectedVoiceName: string | null;
  qualityTier: VoiceQualityTier | null;
  /** null when either gender is unknown. */
  genderMatched: boolean | null;
}

export async function getVoiceSelectionDiagnostics(
  interviewer: InterviewerConfig,
): Promise<VoiceSelectionDiagnostics> {
  const voices = await waitForVoices();
  const selected = voiceFor(interviewer, voices);
  if (!selected) {
    return { availableVoices: voices.length, selectedVoiceName: null, qualityTier: null, genderMatched: null };
  }
  const wanted = interviewer.voice.gender;
  const actual = inferVoiceGender(selected.name);
  return {
    availableVoices: voices.length,
    selectedVoiceName: selected.name,
    qualityTier: getVoiceQualityTier(selected),
    genderMatched: wanted === "any" || actual === "any" ? null : actual === wanted,
  };
}
