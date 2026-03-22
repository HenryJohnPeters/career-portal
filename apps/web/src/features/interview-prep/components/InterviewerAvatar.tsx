/**
 * InterviewerAvatar.tsx
 *
 * Renders a 2D avatar with lip-sync animation.
 * Replaces the expensive 3D GLB system with a lightweight, free solution.
 * Uses DiceBear API + SVG mouth shapes for realistic lip animation.
 */

import { Volume2, VolumeX, AlertTriangle } from "lucide-react";
import type { AvatarStatus, MouthShape } from "../hooks/use2DAvatarLipSync";
import type { InterviewerConfig } from "../interviewer-configs";
import { Avatar2D } from "./Avatar2D";

interface InterviewerAvatarProps {
  /** null while the config hasn't resolved yet — renders a neutral placeholder */
  interviewer: InterviewerConfig | null;
  status: AvatarStatus;
  mouthShape: MouthShape;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export function InterviewerAvatar({
  interviewer,
  status,
  mouthShape,
  isSpeaking,
  onStopSpeaking,
}: InterviewerAvatarProps) {
  const isError = status === "error";

  // Fallback values when no interviewer is selected yet
  const gradient = interviewer?.gradient ?? "from-gray-500 to-gray-600";
  const emoji = interviewer?.emoji ?? "🤖";
  const name = interviewer?.name ?? "Interviewer";
  const role = interviewer?.role ?? "";

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-950 shadow-xl">
      {/* ── Gradient accent strip ─────────────────────────────────────── */}
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />

      {/* ── 2D Avatar Container ──────────────────────────────────────── */}
      <div
        className="w-full relative"
        style={{
          height: 320,
          background: interviewer?.avatar.background ?? "#0a0f1e",
        }}
        aria-label={`Avatar of ${name}`}
      >
        {interviewer ? (
          <Avatar2D
            interviewer={interviewer}
            mouthShape={mouthShape}
            isSpeaking={isSpeaking}
          />
        ) : (
          /* ── Idle placeholder ────────────────── */
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl mb-3">{emoji}</span>
            <p className="text-xs text-gray-400">Select an interviewer</p>
          </div>
        )}
      </div>

      {/* ── Error overlay ─────────────────────────────────────────────── */}
      {isError && (
        <div className="absolute inset-0 top-1 flex flex-col items-center justify-center bg-gray-950/90 p-4">
          <AlertTriangle className="h-7 w-7 text-amber-400 mb-2" />
          <p className="text-xs font-semibold text-amber-300 text-center mb-1">
            Avatar unavailable
          </p>
          <p className="text-[10px] text-gray-400 text-center leading-relaxed max-w-[180px]">
            Could not initialize avatar. Interview continues normally.
          </p>
        </div>
      )}

      {/* ── Name + role badge ─────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-gray-950/95 to-transparent pointer-events-none">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-bold text-white leading-tight">{name}</p>
            <p className="text-[11px] text-gray-400 leading-tight">{role}</p>
          </div>

          {/* Speaking indicator / mute button */}
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 transition-colors text-white text-[10px] font-semibold"
              title="Stop speaking"
            >
              <VolumeX className="h-3.5 w-3.5" />
              Stop
            </button>
          )}

          {!isSpeaking && status === "ready" && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
              <Volume2 className="h-3 w-3" />
              <span>Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Speaking pulse ring ───────────────────────────────────────── */}
      {isSpeaking && (
        <div className="absolute top-3 right-3 pointer-events-none">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
          </span>
        </div>
      )}
    </div>
  );
}
