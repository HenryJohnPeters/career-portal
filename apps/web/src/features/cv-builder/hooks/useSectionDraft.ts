import { useEffect, useState } from "react";
import { getErrorMessage, useUpdateCvSection } from "@careerportal/web/data-access";
import { showToast } from "../../../lib/toast";
import { DraftAutosaver } from "../lib/draft-autosaver";
import { validateSectionFields, type SectionFields } from "../lib/cv-content";
import { useLatestRef } from "./useStoreSelector";

export type SectionDraftSaver = DraftAutosaver<SectionFields>;

/**
 * Autosave for the section open in the editor (one at a time). Saves 1.5s
 * after the last keystroke, always to the section the text came from, and
 * flushes on section switch, unmount and before exports.
 */
export function useSectionDraft(): SectionDraftSaver {
  // Silent: the editor shows "Save failed" inline; background failures toast below.
  const update = useUpdateCvSection({ silent: true });
  const mutate = useLatestRef(update.mutateAsync);

  const [saver] = useState<SectionDraftSaver>(
    () =>
      new DraftAutosaver({
        delayMs: 1500,
        save: (id, changes) => mutate.current({ id, ...changes }),
        validate: validateSectionFields,
        describeError: (err) => getErrorMessage(err, "Couldn't save this section."),
        onBackgroundError: (message) =>
          showToast("error", `A section couldn't be saved: ${message}`),
      }),
  );

  useEffect(() => () => saver.dispose(), [saver]);
  return saver;
}
