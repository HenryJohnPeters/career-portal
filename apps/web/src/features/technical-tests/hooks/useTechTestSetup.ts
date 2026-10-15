import { useCallback, useState } from "react";
import {
  MAX_SELECTED_TAGS,
  normalizeTags,
  type InterviewLevel,
  type InterviewRoleFocus,
} from "@careerportal/shared/types";
import { requestUpgradeForError, useCreateTechnicalTest } from "@careerportal/web/data-access";
import { LEVEL_TO_DIFFICULTY } from "../../interview-prep/meta";
import { getRoleTags } from "../../interview-prep/tech-pathways";
import {
  addTagsToSelection,
  removeTagsFromSelection,
  toggleTagSelection,
} from "../../interview-prep/tag-selection";

/** Technical-test setup: role, level and tech stack, then generate a scenario. */
export function useTechTestSetup(onCreated: (testId: string) => void) {
  const createTest = useCreateTechnicalTest();
  const [role, setRoleState] = useState<InterviewRoleFocus>("fullstack");
  const [level, setLevel] = useState<InterviewLevel>("mid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagLimitReached, setTagLimitReached] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const setRole = useCallback(
    (next: InterviewRoleFocus) => {
      if (next === role) return;
      setRoleState(next);
      const allowed = getRoleTags(next);
      setSelectedTags(selectedTags.filter((t) => allowed.has(t)));
      setTagLimitReached(false);
    },
    [role, selectedTags],
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const result = toggleTagSelection(selectedTags, tag);
      setSelectedTags(result.tags);
      setTagLimitReached(result.limited);
    },
    [selectedTags],
  );

  const addTags = useCallback(
    (tags: readonly string[]) => {
      const result = addTagsToSelection(selectedTags, tags);
      setSelectedTags(result.tags);
      setTagLimitReached(result.limited);
    },
    [selectedTags],
  );

  const removeTags = useCallback(
    (tags: readonly string[]) => {
      setSelectedTags(removeTagsFromSelection(selectedTags, tags));
      setTagLimitReached(false);
    },
    [selectedTags],
  );

  const clearTags = useCallback(() => {
    setSelectedTags([]);
    setTagLimitReached(false);
  }, []);

  const generate = useCallback(() => {
    if (createTest.isPending) return;
    const { tags } = normalizeTags(selectedTags);
    if (tags.length === 0) {
      if (selectedTags.length > 0) {
        setError(new Error("Those topics aren't available any more — please pick technologies from the list."));
      }
      return;
    }
    setError(null);
    createTest.mutate(
      {
        roleFocus: role,
        level,
        difficulty: LEVEL_TO_DIFFICULTY[level],
        tags: tags.slice(0, MAX_SELECTED_TAGS),
      },
      {
        onSuccess: (res) => onCreated(res.data.id),
        onError: (err) => {
          requestUpgradeForError(err);
          setError(err);
        },
      },
    );
  }, [selectedTags, createTest, role, level, onCreated]);

  return {
    role,
    setRole,
    level,
    setLevel,
    selectedTags,
    tagLimitReached,
    toggleTag,
    addTags,
    removeTags,
    clearTags,
    generate,
    isGenerating: createTest.isPending,
    error,
    dismissError: () => setError(null),
  };
}

export type TechTestSetupState = ReturnType<typeof useTechTestSetup>;
