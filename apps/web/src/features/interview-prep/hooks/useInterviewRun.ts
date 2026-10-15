import { useCallback, useState } from "react";
import type { AnswerFeedback } from "@careerportal/shared/types";
import {
  isApiError,
  requestUpgradeForError,
  useCompleteInterviewSession,
  useNextInterviewQuestion,
  useSubmitInterviewAnswer,
} from "@careerportal/web/data-access";
import { encodeAnswer, toggleChoice } from "../answer";

/** Feedback for the question just answered, with the context needed to render it. */
export interface AnsweredQuestion {
  questionId: string;
  prompt: string;
  options: string[];
  multiSelect: boolean;
  feedback: AnswerFeedback;
}

/**
 * State for an in-progress interview: the current question, the candidate's
 * selection, submission and feedback. The next-question query keeps the
 * answered question until its refetch lands, so that question is tracked and
 * never shown (or answered) twice.
 */
export function useInterviewRun(sessionId: string, onFinished: () => void) {
  const nextQuery = useNextInterviewQuestion(sessionId);
  const submit = useSubmitInterviewAnswer();
  const complete = useCompleteInterviewSession();

  const [selection, setSelection] = useState<{ questionId: string; indices: number[] } | null>(null);
  const [answered, setAnswered] = useState<AnsweredQuestion | null>(null);
  const [answeredIds, setAnsweredIds] = useState<ReadonlySet<string>>(() => new Set());
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [skippedNotice, setSkippedNotice] = useState(false);
  const [completeError, setCompleteError] = useState<unknown>(null);

  const next = nextQuery.data?.data;
  const rawQuestion = next?.sessionQuestion ?? null;
  // A question we already answered is stale data awaiting the refetch.
  const question = rawQuestion && !answeredIds.has(rawQuestion.id) ? rawQuestion : null;
  const nextIsFresh = !!next && !nextQuery.isFetching && (!rawQuestion || !answeredIds.has(rawQuestion.id));
  const isCompleted = nextIsFresh && next.sessionStatus === "completed";
  const multiSelect = !!question?.question.multiSelect;
  const selected = question && selection?.questionId === question.id ? selection.indices : [];

  const markAnswered = (id: string) => setAnsweredIds((prev) => new Set(prev).add(id));

  const choose = useCallback(
    (index: number) => {
      if (!question) return;
      const current = selection?.questionId === question.id ? selection.indices : [];
      setSelection({ questionId: question.id, indices: toggleChoice(current, index, multiSelect) });
    },
    [question, selection, multiSelect],
  );

  const submitAnswer = useCallback(() => {
    if (!question || selected.length === 0 || submit.isPending) return;
    const current = question;
    setSubmitError(null);
    setSkippedNotice(false);
    submit.mutate(
      { sessionId, questionId: current.id, answer: encodeAnswer(selected) },
      {
        onSuccess: (res) => {
          markAnswered(current.id);
          setAnswered({
            questionId: current.id,
            prompt: current.question.prompt,
            options: current.question.options,
            multiSelect: !!current.question.multiSelect,
            feedback: res.data.feedback,
          });
        },
        onError: (err) => {
          if (isApiError(err) && err.status === 409) {
            // Answered elsewhere (another tab) — move on to the real next question.
            markAnswered(current.id);
            setSkippedNotice(true);
            return;
          }
          requestUpgradeForError(err);
          setSubmitError(err);
        },
      },
    );
  }, [question, selected, submit, sessionId]);

  const goToNext = useCallback(() => {
    setAnswered(null);
    setSkippedNotice(false);
  }, []);

  const endSession = useCallback(() => {
    if (complete.isPending) return;
    setCompleteError(null);
    complete.mutate(sessionId, {
      onSuccess: onFinished,
      onError: (err) => setCompleteError(err),
    });
  }, [complete, sessionId, onFinished]);

  return {
    progress: next?.progress ?? null,
    question,
    selected,
    multiSelect,
    choose,
    submitAnswer,
    isSubmitting: submit.isPending,
    submitError,
    skippedNotice,
    answered,
    goToNext,
    /** True while the question after `answered` is still loading. */
    isLoadingNext: nextQuery.isPending || (nextQuery.isFetching && !nextIsFresh),
    nextError: nextQuery.isError && !nextQuery.isFetching ? nextQuery.error : null,
    retryNext: () => void nextQuery.refetch(),
    isCompleted,
    endSession,
    isEnding: complete.isPending,
    completeError,
  };
}

export type InterviewRunState = ReturnType<typeof useInterviewRun>;
