/**
 * use2DAvatarLipSync.ts
 *
 * Lightweight 2D avatar lip-sync system using Web Speech API.
 * Maps text phonemes to mouth shapes (visemes) for realistic lip animation.
 * 100% free, no external dependencies or API keys needed.
 *
 * How it works:
 *  1. Analyzes text to extract phonemes
 *  2. Maps phonemes to mouth shapes (A, E, I, O, U, etc.)
 *  3. Syncs animation with SpeechSynthesisUtterance
 *  4. Renders SVG mouth shapes in real-time
 */

import { useRef, useState, useCallback, useEffect } from "react";
import type { InterviewerConfig } from "../interviewer-configs";
import { humanizeSpeechText, playInterviewerSpeech } from "../voice-utils";

export type MouthShape =
  | "closed" // Mouth closed (M, B, P)
  | "open" // Neutral open (default speaking)
  | "wide" // Wide open (A, AA)
  | "smile" // Smile shape (E, EE, I)
  | "round" // Rounded (O, OO)
  | "small" // Small opening (U, UH)
  | "thinking"; // Neutral/thinking pose

export type AvatarStatus = "idle" | "ready" | "speaking" | "error";

export interface Use2DAvatarReturn {
  status: AvatarStatus;
  mouthShape: MouthShape;
  isSpeaking: boolean;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
}

// Simple phoneme extraction from text
function getPhonemeFromChar(char: string): MouthShape {
  const lower = char.toLowerCase();

  // Vowels
  if (lower === "a") return "wide";
  if (lower === "e" || lower === "i") return "smile";
  if (lower === "o") return "round";
  if (lower === "u") return "small";

  // Consonants
  if (lower === "m" || lower === "b" || lower === "p") return "closed";
  if (lower === "w") return "round";

  return "open";
}

// Animate mouth shapes based on text timing
function animateMouthShapes(
  text: string,
  onShapeChange: (shape: MouthShape) => void,
  speed: number = 1.0,
): () => void {
  let currentIndex = 0;
  let intervalId: ReturnType<typeof setInterval>;

  // Calculate timing based on speech speed
  const baseDelay = 80; // ms per character
  const delay = baseDelay / speed;

  const animate = () => {
    if (currentIndex >= text.length) {
      onShapeChange("closed");
      clearInterval(intervalId);
      return;
    }

    const char = text[currentIndex];
    const shape = getPhonemeFromChar(char);
    onShapeChange(shape);
    currentIndex++;
  };

  intervalId = setInterval(animate, delay);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    onShapeChange("closed");
  };
}

export function use2DAvatarLipSync(
  interviewer: InterviewerConfig | null,
  options: { enabled: boolean; muted: boolean },
): Use2DAvatarReturn {
  const cleanupRef = useRef<(() => void) | null>(null);
  const playbackRef = useRef<{ cancel: () => void } | null>(null);

  const { enabled, muted } = options;

  const [status, setStatus] = useState<AvatarStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthShape, setMouthShape] = useState<MouthShape>("closed");

  useEffect(() => {
    if (enabled && interviewer && !muted) {
      setStatus("ready");
    } else {
      setStatus("idle");
      setIsSpeaking(false);
      setMouthShape("closed");
    }
  }, [enabled, interviewer, muted]);

  const speakText = useCallback(
    (text: string) => {
      if (!interviewer || interviewer.id === "none" || muted) return;

      // Cleanup any existing speech
      playbackRef.current?.cancel();
      cleanupRef.current?.();
      playbackRef.current = null;

      setIsSpeaking(true);
      setStatus("speaking");

      // Start mouth animation
      const prepared = humanizeSpeechText(text);
      cleanupRef.current = animateMouthShapes(
        prepared,
        setMouthShape,
        interviewer.voice.speed,
      );

      const finish = () => {
        cleanupRef.current?.();
        playbackRef.current = null;
        setMouthShape("closed");
        setIsSpeaking(false);
        setStatus(enabled && interviewer && !muted ? "ready" : "idle");
      };

      const playback = playInterviewerSpeech({
        interviewer,
        text,
        muted,
        onComplete: finish,
        onError: finish,
      });

      if (playback) {
        playbackRef.current = playback;
      } else {
        finish();
      }
    },
    [enabled, interviewer, muted],
  );

  const stopSpeaking = useCallback(() => {
    playbackRef.current?.cancel();
    playbackRef.current = null;
    cleanupRef.current?.();

    setMouthShape("closed");
    setIsSpeaking(false);
    setStatus(enabled && interviewer && !muted ? "ready" : "idle");
  }, [enabled, interviewer, muted]);

  useEffect(() => {
    if (muted && isSpeaking) {
      stopSpeaking();
    }
  }, [muted, isSpeaking, stopSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playbackRef.current?.cancel();
      cleanupRef.current?.();
    };
  }, []);

  return {
    status,
    mouthShape,
    isSpeaking,
    speakText,
    stopSpeaking,
  };
}
