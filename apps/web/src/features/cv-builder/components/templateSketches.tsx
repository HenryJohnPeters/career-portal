import type { ReactNode } from "react";

/** Miniature layout previews for the template picker, keyed by template id. */
export const TEMPLATE_SKETCHES: Record<string, ReactNode> = {
  classic: (
    <div className="flex flex-col gap-1 w-full h-full p-1.5">
      <div className="h-3 bg-current opacity-30 rounded-sm w-3/4" />
      <div className="h-1 bg-current opacity-15 rounded-sm w-full" />
      <div className="flex-1 flex flex-col gap-0.5 mt-1">
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-1/3" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-1/3 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-4/5" />
      </div>
    </div>
  ),
  modern: (
    <div className="flex w-full h-full">
      <div className="w-[30%] bg-current opacity-[0.07] p-1 flex flex-col gap-0.5 border-r border-current/20">
        <div className="h-1.5 bg-current opacity-30 rounded-sm w-3/4" />
        <div className="h-1 bg-current opacity-20 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-20 rounded-sm w-2/3" />
        <div className="mt-1 h-1 bg-current opacity-20 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-20 rounded-sm w-1/2" />
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-0.5">
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  minimal: (
    <div className="flex flex-col gap-1.5 w-full h-full p-2">
      <div className="h-3 bg-current opacity-15 rounded-sm w-1/2" />
      <div className="flex-1 flex flex-col gap-1 mt-1">
        <div className="h-1.5 bg-current opacity-25 rounded-sm w-1/4" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-3/4" />
        <div className="h-1.5 bg-current opacity-25 rounded-sm w-1/4 mt-1.5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  executive: (
    <div className="flex flex-col w-full h-full">
      <div className="bg-current opacity-20 p-1.5 flex flex-col gap-0.5">
        <div className="h-2.5 bg-white/60 rounded-sm w-2/3" />
        <div className="h-1 bg-white/40 rounded-sm w-full" />
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-0.5">
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  creative: (
    <div className="flex w-full h-full">
      <div className="w-[35%] bg-gradient-to-b from-current/20 to-current/30 p-1 flex flex-col gap-0.5">
        <div className="h-2 bg-white/50 rounded-sm w-3/4 mx-auto" />
        <div className="h-1 bg-white/30 rounded-sm w-full" />
        <div className="h-1 bg-white/30 rounded-sm w-2/3" />
        <div className="mt-1 flex flex-wrap gap-0.5">
          <div className="h-1 w-3 bg-white/25 rounded-sm" />
          <div className="h-1 w-4 bg-white/25 rounded-sm" />
          <div className="h-1 w-3 bg-white/25 rounded-sm" />
        </div>
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-0.5">
        <div className="h-1.5 bg-current opacity-25 rounded-sm w-1/3 px-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full border-l-2 border-current/20 pl-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6 border-l-2 border-current/20 pl-1" />
        <div className="h-1.5 bg-current opacity-25 rounded-sm w-1/3 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  compact: (
    <div className="flex flex-col w-full h-full p-1">
      <div className="h-2 bg-current opacity-25 rounded-sm w-1/2 mb-1" />
      <div className="flex-1 grid grid-cols-2 gap-1">
        <div className="flex flex-col gap-0.5">
          <div className="h-1 bg-current opacity-20 rounded-sm w-2/3" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-5/6" />
          <div className="h-1 bg-current opacity-20 rounded-sm w-2/3 mt-0.5" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="h-1 bg-current opacity-20 rounded-sm w-2/3" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-4/5" />
          <div className="h-1 bg-current opacity-20 rounded-sm w-2/3 mt-0.5" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
        </div>
      </div>
    </div>
  ),
  developer: (
    <div className="flex flex-col gap-0.5 w-full h-full p-1.5 bg-gray-900/5">
      <div className="h-2.5 bg-current opacity-20 rounded-sm w-2/3 font-mono" />
      <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
      <div className="flex-1 flex flex-col gap-0.5 mt-1 border border-current/10 rounded p-1">
        <div className="h-1 bg-current opacity-15 rounded-sm w-1/3" />
        <div className="h-0.5 bg-current opacity-8 rounded-sm w-full" />
        <div className="h-0.5 bg-current opacity-8 rounded-sm w-5/6" />
        <div className="h-1 bg-current opacity-15 rounded-sm w-1/3 mt-0.5" />
        <div className="h-0.5 bg-current opacity-8 rounded-sm w-full" />
      </div>
    </div>
  ),
  elegant: (
    <div className="flex flex-col gap-1 w-full h-full p-2">
      <div className="h-3 bg-current opacity-15 rounded-sm w-1/2 mx-auto" />
      <div className="h-px bg-current opacity-20 w-1/3 mx-auto" />
      <div className="flex-1 flex flex-col gap-0.5 mt-1">
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-1/4 italic" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-4/5" />
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-1/4 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  bold: (
    <div className="flex flex-col w-full h-full">
      <div className="bg-current opacity-25 p-1.5">
        <div className="h-3 bg-white/70 rounded-sm w-3/4" />
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-1">
        <div className="h-2 bg-current opacity-30 rounded-sm w-2/5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-2 bg-current opacity-30 rounded-sm w-2/5 mt-0.5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  academic: (
    <div className="flex flex-col gap-0.5 w-full h-full p-2">
      <div className="h-2.5 bg-current opacity-20 rounded-sm w-1/2 mx-auto" />
      <div className="h-0.5 bg-current opacity-10 rounded-sm w-2/3 mx-auto" />
      <div className="h-px bg-current opacity-30 w-full mt-1 mb-1" />
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="h-1 bg-current opacity-20 rounded-sm w-1/3" />
        <div className="h-0.5 bg-current opacity-8 rounded-sm w-full" />
        <div className="h-0.5 bg-current opacity-8 rounded-sm w-5/6" />
        <div className="h-1 bg-current opacity-20 rounded-sm w-1/3 mt-0.5" />
        <div className="h-0.5 bg-current opacity-8 rounded-sm w-full" />
      </div>
    </div>
  ),
  startup: (
    <div className="flex flex-col w-full h-full">
      <div className="bg-gradient-to-r from-current/20 to-current/10 p-1.5 rounded-b-lg">
        <div className="h-2.5 bg-white/60 rounded-full w-2/3" />
        <div className="h-1 bg-white/30 rounded-full w-full mt-0.5" />
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-1">
        <div className="h-1.5 bg-current opacity-20 rounded-full w-1/3" />
        <div className="border border-current/10 rounded-lg p-1 flex flex-col gap-0.5">
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-4/5" />
        </div>
      </div>
    </div>
  ),
  infographic: (
    <div className="flex w-full h-full">
      <div className="w-[32%] bg-current opacity-[0.07] p-1 flex flex-col gap-1 border-r border-current/20">
        <div className="h-2 w-2 rounded-full bg-current opacity-25 mx-auto" />
        <div className="h-1 bg-current opacity-20 rounded-full w-full" />
        <div className="h-1 bg-current opacity-15 rounded-full w-3/4" />
        <div className="h-1 bg-current opacity-20 rounded-full w-full mt-1" />
        <div className="h-1 bg-current opacity-12 rounded-full w-1/2" />
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-0.5">
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  nordic: (
    <div className="flex flex-col gap-1 w-full h-full p-2.5 bg-gray-50/50">
      <div className="h-2.5 bg-current opacity-12 rounded-sm w-1/3" />
      <div className="h-px bg-current opacity-8 w-full" />
      <div className="flex-1 flex flex-col gap-0.5 mt-0.5">
        <div className="h-1.5 bg-current opacity-15 rounded-sm w-1/4" />
        <div className="h-1 bg-current opacity-8 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-8 rounded-sm w-3/4" />
        <div className="h-1.5 bg-current opacity-15 rounded-sm w-1/4 mt-1" />
        <div className="h-1 bg-current opacity-8 rounded-sm w-full" />
      </div>
    </div>
  ),
  timeline: (
    <div className="flex flex-col gap-0.5 w-full h-full p-1.5">
      <div className="h-2.5 bg-current opacity-20 rounded-sm w-1/2 mb-1" />
      <div className="flex-1 flex gap-1.5">
        <div className="flex flex-col items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
          <div className="flex-1 w-px bg-current opacity-15" />
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
          <div className="flex-1 w-px bg-current opacity-15" />
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/3" />
          <div className="h-0.5 bg-current opacity-8 rounded-sm w-full" />
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/3 mt-1" />
          <div className="h-0.5 bg-current opacity-8 rounded-sm w-full" />
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/3 mt-1" />
        </div>
      </div>
    </div>
  ),
  magazine: (
    <div className="flex w-full h-full">
      <div className="w-[40%] p-1.5 flex flex-col gap-0.5 border-r border-current/10">
        <div className="h-3 bg-current opacity-25 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-3/4" />
        <div className="mt-1 p-1 border-l-2 border-current/20">
          <div className="h-0.5 bg-current opacity-15 rounded-sm w-full" />
          <div className="h-0.5 bg-current opacity-15 rounded-sm w-2/3 mt-0.5" />
        </div>
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-0.5">
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  terminal: (
    <div className="flex flex-col gap-0.5 w-full h-full p-1.5 bg-gray-900/90 rounded-sm">
      <div className="flex gap-0.5 mb-0.5">
        <div className="w-1 h-1 rounded-full bg-red-400/60" />
        <div className="w-1 h-1 rounded-full bg-yellow-400/60" />
        <div className="w-1 h-1 rounded-full bg-green-400/60" />
      </div>
      <div className="h-1 bg-green-400/30 rounded-sm w-2/3" />
      <div className="h-0.5 bg-green-400/20 rounded-sm w-full" />
      <div className="h-0.5 bg-green-400/15 rounded-sm w-5/6" />
      <div className="h-1 bg-green-400/30 rounded-sm w-1/3 mt-0.5" />
      <div className="h-0.5 bg-green-400/20 rounded-sm w-full" />
      <div className="h-0.5 bg-green-400/15 rounded-sm w-4/5" />
    </div>
  ),
  gradient: (
    <div className="flex flex-col gap-0.5 w-full h-full p-1.5 bg-gradient-to-br from-current/10 to-current/5">
      <div className="h-2.5 bg-current opacity-20 rounded-lg w-2/3" />
      <div className="h-1 bg-current opacity-10 rounded-lg w-full" />
      <div className="flex-1 flex flex-col gap-1 mt-0.5">
        <div className="border border-current/10 rounded-lg p-1 bg-white/50">
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/5" />
          <div className="h-0.5 bg-current opacity-8 rounded-sm w-full mt-0.5" />
        </div>
        <div className="border border-current/10 rounded-lg p-1 bg-white/50">
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/5" />
          <div className="h-0.5 bg-current opacity-8 rounded-sm w-full mt-0.5" />
        </div>
      </div>
    </div>
  ),
  architect: (
    <div className="flex flex-col gap-1 w-full h-full p-1.5">
      <div className="h-2.5 bg-current opacity-25 rounded-sm w-1/2 border-l-2 border-current/40 pl-1" />
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="border border-current/20 rounded-sm p-1">
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/5" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full mt-0.5" />
        </div>
        <div className="border border-current/20 rounded-sm p-1">
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/5" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full mt-0.5" />
        </div>
      </div>
    </div>
  ),
  metropolis: (
    <div className="flex w-full h-full">
      <div className="w-1.5 bg-current opacity-40" />
      <div className="flex-1 p-1.5 flex flex-col gap-1">
        <div className="h-2.5 bg-current opacity-30 rounded-none w-2/3" />
        <div className="grid grid-cols-3 gap-0.5">
          <div className="h-1 bg-current opacity-20" />
          <div className="h-1 bg-current opacity-20" />
          <div className="h-1 bg-current opacity-20" />
        </div>
        <div className="h-1.5 bg-current opacity-25 w-1/3 mt-0.5" />
        <div className="h-0.5 bg-current opacity-10 w-full" />
        <div className="h-0.5 bg-current opacity-10 w-5/6" />
      </div>
    </div>
  ),
  zen: (
    <div className="flex flex-col w-full h-full p-2 pl-4">
      <div className="h-1.5 bg-current opacity-25 rounded-full w-1/3" />
      <div className="h-px bg-current opacity-20 w-1/4 mt-1.5" />
      <div className="flex flex-col gap-0.5 mt-2">
        <div className="h-0.5 bg-current opacity-10 rounded-full w-3/4" />
        <div className="h-0.5 bg-current opacity-10 rounded-full w-2/3" />
      </div>
      <div className="flex flex-col gap-0.5 mt-2">
        <div className="h-1 bg-current opacity-15 rounded-full w-1/4" />
        <div className="h-0.5 bg-current opacity-10 rounded-full w-3/4" />
      </div>
    </div>
  ),
  retro: (
    <div className="flex flex-col gap-1 w-full h-full p-1.5 bg-amber-500/5">
      <div className="h-2.5 bg-current opacity-25 rounded-full w-3/4 mx-auto" />
      <div className="flex-1 flex flex-col gap-1">
        <div className="rounded-md border border-current/20 p-1">
          <div className="h-1 bg-current opacity-20 rounded-full w-2/5" />
          <div className="h-0.5 bg-current opacity-10 rounded-full w-full mt-0.5" />
        </div>
        <div className="rounded-md border border-current/20 p-1">
          <div className="h-1 bg-current opacity-20 rounded-full w-2/5" />
          <div className="h-0.5 bg-current opacity-10 rounded-full w-full mt-0.5" />
        </div>
      </div>
    </div>
  ),
  blueprint: (
    <div
      className="flex flex-col gap-0.5 w-full h-full p-1.5 bg-slate-800/90"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "6px 6px",
      }}
    >
      <div className="h-1.5 bg-sky-300/50 rounded-sm w-1/2" />
      <div className="h-0.5 bg-sky-200/30 rounded-sm w-full" />
      <div className="h-1 bg-sky-300/40 rounded-sm w-1/3 mt-1" />
      <div className="h-0.5 bg-sky-200/25 rounded-sm w-full" />
      <div className="h-0.5 bg-sky-200/25 rounded-sm w-4/5" />
    </div>
  ),
  mosaic: (
    <div className="flex flex-col gap-0.5 w-full h-full p-1">
      <div className="h-2 bg-current opacity-25 rounded-sm w-2/3" />
      <div className="flex-1 grid grid-cols-2 gap-0.5">
        <div className="rounded-sm bg-current opacity-15" />
        <div className="rounded-sm bg-current opacity-10" />
        <div className="rounded-sm bg-current opacity-10" />
        <div className="rounded-sm bg-current opacity-15" />
      </div>
    </div>
  ),
  luxe: (
    <div className="flex flex-col gap-0.5 w-full h-full p-1.5 bg-gray-900/90">
      <div className="h-2 bg-amber-300/50 rounded-sm w-1/2 mx-auto" />
      <div className="h-px bg-amber-300/40 w-2/3 mx-auto my-0.5" />
      <div className="h-1 bg-amber-200/30 rounded-sm w-1/3" />
      <div className="h-0.5 bg-white/20 rounded-sm w-full" />
      <div className="h-0.5 bg-white/20 rounded-sm w-5/6" />
      <div className="h-1 bg-amber-200/30 rounded-sm w-1/3 mt-0.5" />
      <div className="h-0.5 bg-white/20 rounded-sm w-full" />
    </div>
  ),
  newspaper: (
    <div className="flex flex-col w-full h-full p-1">
      <div className="h-2.5 bg-current opacity-30 rounded-sm w-full" />
      <div className="h-px bg-current opacity-40 w-full my-0.5" />
      <div className="flex-1 grid grid-cols-2 gap-1">
        <div className="flex flex-col gap-0.5">
          <div className="h-1 bg-current opacity-20 rounded-sm w-3/4" />
          <div className="h-0.5 bg-current opacity-10 w-full" />
          <div className="h-0.5 bg-current opacity-10 w-full" />
          <div className="h-0.5 bg-current opacity-10 w-4/5" />
        </div>
        <div className="flex flex-col gap-0.5 border-l border-current/20 pl-1">
          <div className="h-1 bg-current opacity-20 rounded-sm w-3/4" />
          <div className="h-0.5 bg-current opacity-10 w-full" />
          <div className="h-0.5 bg-current opacity-10 w-full" />
        </div>
      </div>
    </div>
  ),
  origami: (
    <div className="flex flex-col gap-1 w-full h-full p-1">
      <div
        className="h-4 bg-current opacity-20 w-full"
        style={{ clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)" }}
      />
      <div
        className="flex-1 bg-current opacity-10 p-1"
        style={{ clipPath: "polygon(4% 0, 100% 0, 100% 100%, 0 100%)" }}
      />
    </div>
  ),
  pulse: (
    <div className="flex flex-col gap-1 w-full h-full">
      <div className="h-5 bg-gradient-to-r from-current/40 to-current/10 opacity-60 p-1">
        <div className="h-1.5 bg-white/60 rounded-sm w-1/2" />
      </div>
      <div className="px-1.5 flex flex-col gap-0.5">
        <div className="flex gap-0.5">
          <div className="h-1 w-4 rounded-full bg-current opacity-20" />
          <div className="h-1 w-3 rounded-full bg-current opacity-20" />
          <div className="h-1 w-5 rounded-full bg-current opacity-20" />
        </div>
        <div className="h-0.5 bg-current opacity-25 rounded-full w-4/5 mt-0.5" />
        <div className="h-0.5 bg-current opacity-15 rounded-full w-3/5" />
      </div>
    </div>
  ),
  artisan: (
    <div className="flex flex-col gap-0.5 w-full h-full p-1.5 border-2 border-double border-current/30 m-0.5">
      <div className="h-1.5 bg-current opacity-25 rounded-sm w-1/2 mx-auto" />
      <div className="text-center text-[6px] leading-none opacity-40">~ * ~</div>
      <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
      <div className="h-0.5 bg-current opacity-10 rounded-sm w-5/6" />
      <div className="text-center text-[6px] leading-none opacity-40">~ * ~</div>
      <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
    </div>
  ),
  frontier: (
    <div className="flex w-full h-full">
      <div className="w-[35%] bg-current opacity-25 p-1 flex flex-col gap-0.5">
        <div className="h-3 w-3 rounded-full bg-white/60 mx-auto" />
        <div className="h-0.5 bg-white/50 rounded-sm w-full mt-0.5" />
        <div className="h-0.5 bg-white/50 rounded-sm w-2/3" />
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-0.5">
        <div className="h-1.5 bg-current opacity-25 rounded-sm w-2/3" />
        <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-0.5 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-1 bg-current opacity-20 rounded-sm w-1/3 mt-1" />
        <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
};
