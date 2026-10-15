import { useCallback, useState } from "react";
import { readStorage, writeStorage } from "../../../lib/storage";

const STORAGE_KEY = "interview.voiceMuted";

/** The interviewer-voice mute preference, remembered per browser (storage failures are ignored). */
export function useVoiceMuted(): [boolean, () => void] {
  const [muted, setMuted] = useState(() => readStorage(STORAGE_KEY) === "1");

  const toggle = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      writeStorage(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return [muted, toggle];
}
