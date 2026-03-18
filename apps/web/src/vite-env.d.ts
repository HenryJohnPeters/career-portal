/// <reference types="vite/client" />
/// <reference types="react/canary" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ── Ambient shims for untyped avatar/TTS packages ──────────────────────────

declare module "@met4citizen/talkinghead" {
  export class TalkingHead {
    constructor(container: HTMLElement, options?: Record<string, unknown>);
    showAvatar(
      avatar: Record<string, unknown>,
      onprogress?: ((e: ProgressEvent) => void) | null
    ): Promise<void>;
    speakText(text: string, opts?: Record<string, unknown>): void;
    speakAudio(
      audio: unknown,
      opts?: Record<string, unknown>,
      onsubtitles?: ((word: string) => void) | null
    ): void;
    setMood(mood: string): void;
    setView(view: string, opts?: Record<string, unknown>): void;
    lookAtCamera(t: number): void;
    start(): void;
    stop(): void;
  }
}

declare module "@met4citizen/headtts" {
  export class HeadTTS {
    constructor(options?: Record<string, unknown>);
    connect(
      settings?: Record<string, unknown> | null,
      onprogress?: ((e: ProgressEvent) => void) | null
    ): Promise<void>;
    setup(data: Record<string, unknown>): Promise<void>;
    synthesize(
      data: { input: string | unknown[] },
      onmessage?: ((msg: HeadTTSMessage) => void) | null,
      onerror?: ((err: unknown) => void) | null
    ): Promise<HeadTTSMessage[]>;
    custom(data: Record<string, unknown>): Promise<HeadTTSMessage>;
    clear(): void;
    onstart: (() => void) | null;
    onmessage: ((msg: HeadTTSMessage) => void) | null;
    onend: (() => void) | null;
    onerror: ((err: unknown) => void) | null;
  }

  export interface HeadTTSMessage {
    type: "audio" | "error" | "custom";
    data: unknown;
    ref?: number;
    userData?: unknown;
  }
}
