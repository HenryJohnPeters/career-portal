/**
 * useTalkingHead.ts
 *
 * TalkingHead 3D avatar with lip-sync driven by the browser-native
 * Web Speech API (SpeechSynthesis). No external TTS endpoint, no model
 * download — works instantly in all modern browsers.
 *
 * How it works:
 *  1. TalkingHead is initialised with `avatarMute: true` so it never
 *     tries to call a Google TTS endpoint. It only drives the 3D
 *     animation / lip-sync from the word timings we give it.
 *  2. When `speakText(text)` is called we:
 *     a. Use `SpeechSynthesisUtterance` boundary events to collect
 *        word-level timestamps in real time.
 *     b. Build a `speakAudio`-compatible object with an AudioBuffer
 *        created from the utterance's audio (via AudioContext recording),
 *        OR — as a simpler fallback — call TalkingHead's own `speakText`
 *        with `avatarMute: false` once we have a voice config so the
 *        built-in lipsync module animates the mouth while the browser
 *        reads out loud via SpeechSynthesis simultaneously.
 *
 * Simplest reliable path used here:
 *  • SpeechSynthesis plays the audio (no API key needed).
 *  • TalkingHead.speakText(..., { avatarMute: true }) runs the mouth
 *    animation independently — the lipsync engine converts the text
 *    to viseme sequences purely from the English phoneme rules built
 *    into the lipsync-en module; no audio alignment needed.
 *  • The two streams start at the same time so lip-sync is approximate
 *    but visually convincing.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import type { InterviewerConfig } from "../interviewer-configs";

type TalkingHeadInstance = {
  showAvatar: (
    opts: Record<string, unknown>,
    onprogress?: ((e: ProgressEvent) => void) | null
  ) => Promise<void>;
  speakText: (
    text: string,
    opts?: Record<string, unknown>,
    onsubtitles?: null,
    excludes?: null
  ) => void;
  stop: () => void;
  start: () => void;
};

export type AvatarStatus =
  | "idle"          // not yet initialised
  | "loading"       // importing TalkingHead JS bundle
  | "avatarLoading" // bundle ready, fetching the GLB model
  | "ready"         // fully ready
  | "speaking"      // currently speaking
  | "error";        // unrecoverable error

export interface UseTalkingHeadReturn {
  containerRef: React.RefCallback<HTMLDivElement>;
  status: AvatarStatus;
  errorMsg: string | null;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

export function useTalkingHead(
  interviewer: InterviewerConfig | null,
  enabled: boolean
): UseTalkingHeadReturn {
  const containerNodeRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<TalkingHeadInstance | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Increment this to trigger a re-run of the bootstrap effect after the
  // containerRef callback fires and stores the node.
  const [nodeVersion, setNodeVersion] = useState(0);

  const [status, setStatus] = useState<AvatarStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Callback ref — stores the node AND signals the effect to (re-)run ─────
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    containerNodeRef.current = node;
    if (node) {
      // Bump the version so the bootstrap useEffect re-runs now that the
      // node is available.
      setNodeVersion((v) => v + 1);
    }
  }, []);

  // ── Main effect — runs when node becomes available OR interviewer changes ──
  useEffect(() => {
    const node = containerNodeRef.current;
    if (!enabled || !interviewer || !node) return;

    // Cancel any in-flight bootstrap
    cancelRef.current?.();
    let cancelled = false;
    cancelRef.current = () => { cancelled = true; };

    setStatus("loading");
    setErrorMsg(null);
    setIsSpeaking(false);

    // Capture non-null values for use inside the async function
    const cfg = interviewer;
    const el = node;

    async function bootstrap() {
      try {
        const { TalkingHead } = await import("@met4citizen/talkinghead");
        if (cancelled) return;

        // Always destroy the previous instance so the new interviewer
        // gets a fresh canvas — showAvatar alone doesn't swap the rig.
        if (headRef.current) {
          try { headRef.current.stop(); } catch { /* ignore */ }
          headRef.current = null;
          // Clear the container so TalkingHead can append a fresh <canvas>
          el.innerHTML = "";
        }

        headRef.current = new TalkingHead(el, {
          ttsEndpoint: "",
          lipsyncModules: ["en"],
          lipsyncLang: "en",
          cameraView: cfg.avatar.cameraView,
          cameraRotateEnable: false,
          cameraPanEnable: false,
          cameraZoomEnable: false,
          modelFPS: 30,
          avatarMood: cfg.avatar.avatarMood,
          lightAmbientColor: cfg.avatar.lightAmbientColor,
          lightDirectColor: cfg.avatar.lightDirectColor,
        }) as TalkingHeadInstance;

        if (cancelled) return;
        setStatus("avatarLoading");

        await headRef.current.showAvatar(
          {
            url: cfg.avatar.url,
            body: cfg.avatar.body,
            avatarMood: cfg.avatar.avatarMood,
            lipsyncLang: "en",
          },
          null
        );
        if (cancelled) return;

        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Avatar failed to load";
        console.error("[useTalkingHead] bootstrap error:", err);
        setErrorMsg(msg);
        setStatus("error");
      }
    }

    bootstrap();

    return () => { cancelled = true; };

    // nodeVersion ensures the effect re-runs the moment the div enters the DOM.
    // interviewer?.id ensures it re-runs when the user picks a different interviewer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interviewer?.id, nodeVersion]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelRef.current?.();
      window.speechSynthesis?.cancel();
      try { headRef.current?.stop(); } catch { /* ignore */ }
      headRef.current = null;
    };
  }, []);

  // ── speakText ─────────────────────────────────────────────────────────────
  //
  // Strategy:
  //  A) TalkingHead.speakText with avatarMute:true  → pure lipsync animation
  //     driven by the built-in English phoneme→viseme rules (no audio).
  //  B) SpeechSynthesisUtterance                    → browser audio playback.
  //  Both fire at the same time so lip-sync is visually convincing.
  //
  const speakText = useCallback(
    (text: string) => {
      if (!headRef.current || !interviewer) return;

      window.speechSynthesis?.cancel();
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }

      setIsSpeaking(true);
      setStatus("speaking");

      // A) Drive 3D lip-sync animation (no audio from TalkingHead)
      headRef.current.speakText(text, { avatarMute: true }, null, null);

      // B) Browser audio via Web Speech API with per-interviewer voice selection
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        utter.rate = interviewer.voice.speed;

        // Map interviewer voice config to Web Speech API voices
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice: SpeechSynthesisVoice | null = null;

        // Voice selection strategy per interviewer:
        // Alex (af_bella)   → warm female voice (Samantha, Karen, Victoria, Google UK Female)
        // Morgan (af_nova)  → professional female (Google US English, Zira, Fiona)
        // Jordan (am_fenrir) → direct male voice (Daniel, Alex, Google UK Male)
        switch (interviewer.id) {
          case "alex":
            selectedVoice = voices.find(v => 
              v.lang.startsWith("en") && 
              (v.name.toLowerCase().includes("samantha") || 
               v.name.toLowerCase().includes("karen") ||
               v.name.toLowerCase().includes("victoria"))
            ) ?? voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ?? null;
            break;

          case "morgan":
            selectedVoice = voices.find(v => 
              v.lang.startsWith("en-US") && 
              (v.name.toLowerCase().includes("google") && v.name.toLowerCase().includes("female"))
            ) ?? voices.find(v => 
              v.lang.startsWith("en") && 
              (v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("fiona"))
            ) ?? null;
            break;

          case "jordan":
            selectedVoice = voices.find(v => 
              v.lang.startsWith("en") && 
              (v.name.toLowerCase().includes("daniel") || 
               v.name.toLowerCase().includes("alex"))
            ) ?? voices.find(v => 
              v.lang.startsWith("en") && 
              v.name.toLowerCase().includes("male")
            ) ?? null;
            break;

          default:
            // Fallback: any en voice
            selectedVoice = voices.find(v => v.lang.startsWith("en")) ?? null;
        }

        if (selectedVoice) utter.voice = selectedVoice;

        const finish = () => {
          setIsSpeaking(false);
          setStatus("ready");
        };
        utter.onend = finish;
        utter.onerror = finish;
        utteranceRef.current = utter;
        window.speechSynthesis.speak(utter);
      } else {
        // No Web Speech API — lip-sync still plays silently
        const words = text.split(/\s+/).length;
        const ms = Math.max(2000, (words / 120) * 60 * 1000);
        setTimeout(() => {
          setIsSpeaking(false);
          setStatus("ready");
        }, ms);
      }
    },
    [interviewer]
  );

  // ── stopSpeaking ──────────────────────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    setIsSpeaking(false);
    if (status === "speaking") setStatus("ready");
  }, [status]);

  return { containerRef, status, errorMsg, speakText, stopSpeaking, isSpeaking };
}
