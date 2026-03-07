import { Spinner, ErrorState } from "@careerportal/web/ui";
import { useInterviewState } from "./hooks/useInterviewState";
import { usePracticeState } from "../practice/hooks/usePracticeState";
import { InterviewSetup } from "./components/InterviewSetup";
import { InterviewSession } from "./components/InterviewSession";
import { InterviewReport } from "./components/InterviewReport";
import { PracticeQuiz } from "../practice/components/PracticeQuiz";

export function InterviewPrepPage() {
  const state = useInterviewState();
  const practice = usePracticeState();

  if (state.optionsLoading || practice.isLoadingOptions) return <Spinner />;
  if (state.isError)
    return (
      <ErrorState
        message={(state.error as Error).message}
        onRetry={state.refetch}
      />
    );
  if (practice.isError)
    return (
      <ErrorState
        message={(practice.error as Error).message}
        onRetry={practice.refetch}
      />
    );

  // Practice quiz view — reuse the practice components
  if (practice.view === "quiz") {
    return <PracticeQuiz state={practice} />;
  }

  if (state.view === "setup") {
    /**
     * When the user clicks "Start Practicing" we sync the shared
     * filters (roleFocus, level, tags) from the interview form into
     * the practice state, then start the practice quiz.
     */
    const handleStartPractice = () => {
      practice.setRoleFocus(state.roleFocus);
      practice.setLevel(state.level);
      // Sync selected tags — clear old ones and set new ones
      // Reset tags by toggling off any that practice has but interview doesn't,
      // and toggling on any that interview has but practice doesn't.
      const interviewTags = new Set(state.selectedTags);
      const practiceTags = new Set(practice.selectedTags);
      for (const t of practiceTags) {
        if (!interviewTags.has(t)) practice.toggleTag(t);
      }
      for (const t of interviewTags) {
        if (!practiceTags.has(t)) practice.toggleTag(t);
      }
      practice.handleStart();
    };

    return (
      <InterviewSetup
        options={state.options}
        track={state.track}
        level={state.level}
        selectedTags={state.selectedTags}
        questionCount={state.questionCount}
        roleFocus={state.roleFocus}
        interviewType={state.interviewType}
        expandedCategories={state.expandedCategories}
        isCreating={state.isCreating}
        onTrackChange={state.setTrack}
        onLevelChange={state.setLevel}
        onRoleFocusChange={state.setRoleFocus}
        onInterviewTypeChange={state.setInterviewType}
        onQuestionCountChange={state.setQuestionCount}
        onToggleTag={state.toggleTag}
        onToggleCategory={state.toggleCategory}
        onCreateSession={state.handleCreateSession}
        isPracticeStarting={practice.isLoadingNext}
        onStartPractice={handleStartPractice}
      />
    );
  }

  if (state.view === "session") {
    return (
      <InterviewSession
        nextQuestion={state.nextQuestion}
        nextLoading={state.nextLoading}
        lastFeedback={state.lastFeedback}
        selectedOptionIndex={state.selectedOptionIndex}
        isSubmitting={state.isSubmitting}
        activeSession={state.activeSession}
        onSelectOption={state.setSelectedOptionIndex}
        onSubmitAnswer={state.handleSubmitAnswer}
        onNextQuestion={state.handleNextQuestion}
        onViewReport={state.handleViewReport}
        onBackToSetup={state.handleBackToSetup}
      />
    );
  }

  if (state.view === "report" && state.activeSession) {
    return (
      <InterviewReport
        activeSession={state.activeSession}
        onStartNew={state.handleBackToSetup}
      />
    );
  }

  return null;
}
