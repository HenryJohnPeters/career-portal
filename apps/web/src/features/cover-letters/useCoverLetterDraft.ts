import { useEffect, useState } from "react";
import type { CoverLetter } from "@careerportal/shared/types";
import { getErrorMessage, useUpdateCoverLetter } from "@careerportal/web/data-access";
import { showToast } from "../../lib/toast";
import { DraftAutosaver } from "../cv-builder/lib/draft-autosaver";
import { useLatestRef } from "../cv-builder/hooks/useStoreSelector";
import { validateLetterFields, type LetterFields } from "./letter-fields";

export type LetterDraftSaver = DraftAutosaver<LetterFields>;

/**
 * Autosave for the open letter: saves the changed fields 1.5s after the last
 * keystroke, and on Save, Back, tab hide and unmount.
 */
export function useCoverLetterDraft(letter: CoverLetter): LetterDraftSaver {
  // Silent: the editor shows save status inline; background failures toast.
  const update = useUpdateCoverLetter({ silent: true });
  const mutate = useLatestRef(update.mutateAsync);

  const [saver] = useState<LetterDraftSaver>(() => {
    const created = new DraftAutosaver<LetterFields>({
      delayMs: 1500,
      save: (id, changes) => mutate.current({ id, ...changes }),
      validate: validateLetterFields,
      describeError: (err) => getErrorMessage(err, "Couldn't save this letter."),
      onBackgroundError: (message) =>
        showToast("error", `Your cover letter couldn't be saved: ${message}`),
    });
    created.open(letter.id, { title: letter.title, body: letter.body ?? "" });
    return created;
  });

  useEffect(() => () => saver.dispose(), [saver]);
  return saver;
}
