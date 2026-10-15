import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MAX_SELECTED_TAGS,
  normalizeTag,
  normalizeTags,
  type ApiResponse,
  type InterviewLevel,
  type InterviewSessionSummary,
  type InterviewTrack,
} from "@careerportal/shared/types";
import {
  interviewSessionsQueryOptions,
  isApiError,
  queryKeys,
  requestUpgradeForError,
  useCreateInterviewSession,
} from "@careerportal/web/data-access";
import { findRecoveredSession } from "../answer";
import { LEVEL_TO_DIFFICULTY } from "../meta";
import { TRACK_TO_ROLE_FOCUS, findTrackForTag, getRoleTags } from "../tech-pathways";
import { addTagsToSelection, removeTagsFromSelection, toggleTagSelection } from "../tag-selection";
import {
  DEFAULT_INTERVIEWER_ID,
  resolveInterviewerId,
  type InterviewerId,
} from "../interviewer-configs";

const TIMEOUT_MESSAGE =
  "Preparing your questions took too long. If the interview appears under “Your sessions”, resume it from there — otherwise please try again.";

const UNKNOWN_TAGS_MESSAGE = "Those topics aren't available any more — please pick technologies from the list.";

interface UseInterviewSetupOptions {
  /** Premium (or trial): every interviewer is selectable. */
  allInterviewers: boolean;
  onCreated: (sessionId: string) => void;
}

/** Setup form state and session creation (with recovery when the request times out). */
export function useInterviewSetup({ allInterviewers, onCreated }: UseInterviewSetupOptions) {
  const qc = useQueryClient();
  const createSession = useCreateInterviewSession();

  const [track, setTrackState] = useState<InterviewTrack>("frontend");
  const [level, setLevel] = useState<InterviewLevel>("mid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagLimitReached, setTagLimitReached] = useState(false);
  const [interviewerChoice, setInterviewerChoice] = useState<InterviewerId>(DEFAULT_INTERVIEWER_ID);
  const [error, setError] = useState<unknown>(null);
  const [recovering, setRecovering] = useState(false);

  // Re-validated on every render: a plan change can lock the chosen interviewer.
  const interviewerId = resolveInterviewerId(interviewerChoice, allInterviewers);

  const setTrack = useCallback(
    (next: InterviewTrack) => {
      if (next === track) return;
      setTrackState(next);
      // Keep only the tags the new track's pathways still list.
      const allowed = getRoleTags(TRACK_TO_ROLE_FOCUS[next]);
      setSelectedTags(selectedTags.filter((t) => allowed.has(t)));
      setTagLimitReached(false);
    },
    [track, selectedTags],
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

  /** "Practise this topic": select just that tag, on a track that lists it. */
  const focusTopic = useCallback(
    (rawTag: string) => {
      // Progress rows may carry a legacy alias; the picker works on canonical ids.
      const tag = normalizeTag(rawTag);
      setTrackState(findTrackForTag(tag, track));
      setSelectedTags([tag]);
      setTagLimitReached(false);
      setError(null);
    },
    [track],
  );

  const recoverAfterTimeout = useCallback(
    async (request: { track: string; level: string; since: number; knownIds: ReadonlySet<string> | null }) => {
      setRecovering(true);
      try {
        const res = await qc.fetchQuery({ ...interviewSessionsQueryOptions, staleTime: 0 });
        const found = findRecoveredSession(res.data, request);
        if (found) {
          onCreated(found.id);
          return true;
        }
      } catch {
        // Fall through to the timeout message.
      } finally {
        setRecovering(false);
      }
      return false;
    },
    [qc, onCreated],
  );

  const start = useCallback(() => {
    if (createSession.isPending || recovering) return;
    const { tags } = normalizeTags(selectedTags);
    if (tags.length === 0) {
      if (selectedTags.length > 0) setError(new Error(UNKNOWN_TAGS_MESSAGE));
      return;
    }

    const cached = qc.getQueryData<ApiResponse<InterviewSessionSummary[]>>(queryKeys.interviewSessions);
    const knownIds = cached ? new Set(cached.data.map((s) => s.id)) : null;
    const since = Date.now();

    setError(null);
    createSession.mutate(
      {
        track,
        level,
        tags: tags.slice(0, MAX_SELECTED_TAGS),
        roleFocus: TRACK_TO_ROLE_FOCUS[track],
        difficulty: LEVEL_TO_DIFFICULTY[level],
        interviewerId,
      },
      {
        onSuccess: (res) => onCreated(res.data.id),
        onError: async (err) => {
          if (isApiError(err) && (err.kind === "timeout" || err.kind === "network")) {
            // No response: the server may still have created the session.
            if (await recoverAfterTimeout({ track, level, since, knownIds })) return;
            setError(err.kind === "timeout" ? new Error(TIMEOUT_MESSAGE) : err);
            return;
          }
          requestUpgradeForError(err);
          setError(err);
        },
      },
    );
  }, [selectedTags, createSession, recovering, qc, track, level, interviewerId, onCreated, recoverAfterTimeout]);

  return {
    track,
    setTrack,
    level,
    setLevel,
    selectedTags,
    tagLimitReached,
    toggleTag,
    addTags,
    removeTags,
    clearTags,
    focusTopic,
    interviewerId,
    setInterviewerId: setInterviewerChoice,
    start,
    isStarting: createSession.isPending || recovering,
    error,
    dismissError: () => setError(null),
  };
}

export type InterviewSetupState = ReturnType<typeof useInterviewSetup>;
