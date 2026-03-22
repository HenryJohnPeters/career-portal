import { Spinner, ErrorState } from "@careerportal/web/ui";
import { useInterviewState } from "./hooks/useInterviewState";
import { InterviewSetup } from "./components/InterviewSetup";
import { InterviewSession } from "./components/InterviewSession";
import { InterviewReport } from "./components/InterviewReport";
import { getInterviewerById } from "./interviewer-configs";
import { useAuth } from "../../lib/auth";

export function InterviewPrepPage() {
  const state = useInterviewState();
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;

  // Resolve the full interviewer config object from the selected ID
  const selectedInterviewer =
    getInterviewerById(state.selectedInterviewerId) ?? null;

  if (state.optionsLoading) return <Spinner />;
  if (state.isError)
    return (
      <ErrorState
        message={(state.error as Error).message}
        onRetry={state.refetch}
      />
    );

  if (state.view === "setup") {
    return (
      <InterviewSetup
        options={state.options}
        track={state.track}
        level={state.level}
        selectedTags={state.selectedTags}
        roleFocus={state.roleFocus}
        interviewType={state.interviewType}
        expandedCategories={state.expandedCategories}
        isCreating={state.isCreating}
        onTrackChange={state.setTrack}
        onLevelChange={state.setLevel}
        onRoleFocusChange={state.setRoleFocus}
        onInterviewTypeChange={state.setInterviewType}
        onToggleTag={state.toggleTag}
        onToggleCategory={state.toggleCategory}
        onCreateSession={state.handleCreateSession}
        selectedInterviewerId={state.selectedInterviewerId}
        onInterviewerChange={state.setSelectedInterviewerId}
        isPremium={isPremium}
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
        selectedInterviewer={selectedInterviewer}
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
