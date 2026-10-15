import { useCallback, useEffect, useRef, useState } from "react";
import type { InterviewerConfig } from "../interviewer-configs";
import {
  cancelAllSpeech,
  isSpeechSynthesisSupported,
  playInterviewerSpeech,
  type SpeechPlayback,
} from "../voice/playback";
import { humanizeSpeechText } from "../voice/speech-text";

/*
 * Interviewer speech + 2D lip-sync. Mouth-shape state changes ~12×/s while
 * speaking, so this hook belongs inside the avatar component: only the avatar
 * re-renders, never the question/feedback tree.
 */

export type MouthShape = "closed" | "open" | "wide" | "smile" | "round" | "small";

const MS_PER_CHAR = 80;

function mouthShapeFor(char: string): MouthShape {
  switch (char.toLowerCase()) {
    case "a":
      return "wide";
    case "e":
    case "i":
      return "smile";
    case "o":
    case "w":
      return "round";
    case "u":
      return "small";
    case "m":
    case "b":
    case "p":
    case " ":
      return "closed";
    default:
      return "open";
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export interface AvatarSpeech {
  mouthShape: MouthShape;
  isSpeaking: boolean;
  /** False when the browser has no speechSynthesis. */
  supported: boolean;
  speak: (text: string) => void;
  stop: () => void;
}

export function useAvatarSpeech(interviewer: InterviewerConfig, muted: boolean): AvatarSpeech {
  const [supported] = useState(isSpeechSynthesisSupported);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthShape, setMouthShape] = useState<MouthShape>("closed");
  const playbackRef = useRef<SpeechPlayback | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopMouth = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setMouthShape("closed");
  }, []);

  const stop = useCallback(() => {
    playbackRef.current?.cancel();
    playbackRef.current = null;
    cancelAllSpeech();
    stopMouth();
    setIsSpeaking(false);
  }, [stopMouth]);

  const speak = useCallback(
    (text: string) => {
      stop();
      if (muted || !supported || interviewer.id === "none") return;

      const animate = !prefersReducedMotion();
      if (animate) {
        // Text-timed animation until the engine's boundary events take over.
        const prepared = humanizeSpeechText(text);
        let index = 0;
        timerRef.current = setInterval(() => {
          if (index >= prepared.length) {
            stopMouth();
            return;
          }
          setMouthShape(mouthShapeFor(prepared[index]));
          index += 1;
        }, MS_PER_CHAR / interviewer.voice.speed);
      }

      setIsSpeaking(true);
      playbackRef.current = playInterviewerSpeech({
        interviewer,
        text,
        onBoundary: animate
          ? ({ chunk, charIndex }) => {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setMouthShape(mouthShapeFor(chunk.charAt(charIndex) || " "));
            }
          : undefined,
        onEnd: () => {
          playbackRef.current = null;
          stopMouth();
          setIsSpeaking(false);
        },
      });
    },
    [interviewer, muted, supported, stop, stopMouth],
  );

  // Muting (or switching interviewer) silences the current utterance.
  useEffect(() => {
    if (muted) stop();
  }, [muted, stop]);

  useEffect(() => stop, [interviewer.id, stop]);

  return { mouthShape, isSpeaking, supported, speak, stop };
}
