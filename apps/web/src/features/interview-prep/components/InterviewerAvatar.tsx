import { forwardRef, useImperativeHandle } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { InterviewerConfig } from "../interviewer-configs";
import { useAvatarSpeech } from "../hooks/useAvatarSpeech";
import { Avatar2D } from "./Avatar2D";

export interface InterviewerAvatarHandle {
  speak: (text: string) => void;
  stop: () => void;
}

interface InterviewerAvatarProps {
  interviewer: InterviewerConfig;
  muted: boolean;
}

/**
 * The interviewer's avatar and voice. Speech/lip-sync state lives here so only
 * this component re-renders while the interviewer talks; the session drives
 * it through the imperative `speak`/`stop` handle.
 */
export const InterviewerAvatar = forwardRef<InterviewerAvatarHandle, InterviewerAvatarProps>(
  function InterviewerAvatar({ interviewer, muted }, ref) {
    const { mouthShape, isSpeaking, supported, speak, stop } = useAvatarSpeech(interviewer, muted);

    useImperativeHandle(ref, () => ({ speak, stop }), [speak, stop]);

    const status = !supported ? "Voice isn't supported in this browser" : muted ? "Voice muted" : "Ready";

    return (
      <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-950 shadow-xl">
        <div className={`h-1 w-full bg-gradient-to-r ${interviewer.gradient}`} />

        <div className="w-full relative h-64 lg:h-80" style={{ background: interviewer.background }}>
          <Avatar2D interviewer={interviewer} mouthShape={mouthShape} isSpeaking={isSpeaking} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-gray-950/95 to-transparent">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight">{interviewer.name}</p>
              <p className="text-[11px] text-gray-300 leading-tight">
                {interviewer.title} · {interviewer.tone}
              </p>
            </div>

            {isSpeaking ? (
              <button
                type="button"
                onClick={stop}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 transition-colors text-white text-[11px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                Stop speaking
              </button>
            ) : (
              <p className={`flex items-center gap-1 text-[11px] ${supported && !muted ? "text-emerald-300" : "text-gray-300"}`}>
                {supported && !muted ? (
                  <Volume2 className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <VolumeX className="h-3 w-3" aria-hidden="true" />
                )}
                <span>{status}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  },
);
