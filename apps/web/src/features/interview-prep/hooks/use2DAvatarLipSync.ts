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

// Phoneme to mouth shape mapping based on English pronunciation
const PHONEME_TO_MOUTH: Record<string, MouthShape> = {
  // Closed sounds
  m: "closed",
  b: "closed",
  p: "closed",

  // Wide open sounds
  a: "wide",
  ah: "wide",
  aa: "wide",

  // Smile sounds
  e: "smile",
  ee: "smile",
  i: "smile",
  y: "smile",

  // Round sounds
  o: "round",
  oo: "round",
  oh: "round",
  w: "round",

  // Small opening
  u: "small",
  uh: "small",
  er: "small",

  // Default
  default: "open",
};

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
  speed: number = 1.0
): () => void {
  let currentIndex = 0;
  let intervalId: NodeJS.Timeout;

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
  enabled: boolean
): Use2DAvatarReturn {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const [status, setStatus] = useState<AvatarStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthShape, setMouthShape] = useState<MouthShape>("closed");

  useEffect(() => {
    if (enabled && interviewer) {
      console.log("[2D Avatar] Ready - interviewer:", interviewer.name);
      setStatus("ready");
    } else {
      console.log(
        "[2D Avatar] Idle - enabled:",
        enabled,
        "interviewer:",
        interviewer?.name
      );
      setStatus("idle");
    }
  }, [enabled, interviewer]);

  const speakText = useCallback(
    (text: string) => {
      if (!interviewer || interviewer.id === "none") return;

      // Cleanup any existing speech
      window.speechSynthesis?.cancel();
      cleanupRef.current?.();

      setIsSpeaking(true);
      setStatus("speaking");

      // Start mouth animation
      cleanupRef.current = animateMouthShapes(
        text,
        setMouthShape,
        interviewer.voice.speed
      );

      // Browser audio via Web Speech API
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        utter.rate = interviewer.voice.speed;

        // Voice selection (same logic as original)
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice: SpeechSynthesisVoice | null = null;

        switch (interviewer.id) {
          case "alex":
            selectedVoice =
              voices.find(
                (v) =>
                  v.lang.startsWith("en") &&
                  (v.name.toLowerCase().includes("samantha") ||
                    v.name.toLowerCase().includes("karen") ||
                    v.name.toLowerCase().includes("victoria"))
              ) ??
              voices.find(
                (v) =>
                  v.lang.startsWith("en") &&
                  v.name.toLowerCase().includes("female")
              ) ??
              null;
            break;

          case "morgan":
            selectedVoice =
              voices.find(
                (v) =>
                  v.lang.startsWith("en-US") &&
                  v.name.toLowerCase().includes("google") &&
                  v.name.toLowerCase().includes("female")
              ) ??
              voices.find(
                (v) =>
                  v.lang.startsWith("en") &&
                  (v.name.toLowerCase().includes("zira") ||
                    v.name.toLowerCase().includes("fiona"))
              ) ??
              null;
            break;

          case "jordan":
            selectedVoice =
              voices.find(
                (v) =>
                  v.lang.startsWith("en") &&
                  (v.name.toLowerCase().includes("daniel") ||
                    v.name.toLowerCase().includes("alex"))
              ) ??
              voices.find(
                (v) =>
                  v.lang.startsWith("en") &&
                  v.name.toLowerCase().includes("male")
              ) ??
              null;
            break;

          default:
            selectedVoice = voices.find((v) => v.lang.startsWith("en")) ?? null;
        }

        if (selectedVoice) utter.voice = selectedVoice;

        const finish = () => {
          cleanupRef.current?.();
          setMouthShape("closed");
          setIsSpeaking(false);
          setStatus("ready");
        };

        utter.onend = finish;
        utter.onerror = finish;
        utteranceRef.current = utter;
        window.speechSynthesis.speak(utter);
      } else {
        // No Web Speech API — animate silently
        const words = text.split(/\s+/).length;
        const ms = Math.max(2000, (words / 120) * 60 * 1000);
        setTimeout(() => {
          cleanupRef.current?.();
          setMouthShape("closed");
          setIsSpeaking(false);
          setStatus("ready");
        }, ms);
      }
    },
    [interviewer]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    cleanupRef.current?.();

    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }

    setMouthShape("closed");
    setIsSpeaking(false);
    if (status === "speaking") setStatus("ready");
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
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
