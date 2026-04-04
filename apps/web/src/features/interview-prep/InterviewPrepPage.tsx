import { Spinner, ErrorState } from "@careerportal/web/ui";
import { useInterviewState } from "./hooks/useInterviewState";
import { InterviewSetup } from "./components/InterviewSetup";
import { InterviewSession } from "./components/InterviewSession";
import { InterviewReport } from "./components/InterviewReport";
import { getInterviewerById } from "./interviewer-configs";
import { useAuth } from "../../lib/auth";
import {
  getInterviewerPreviewText,
  playInterviewerSpeech,
} from "./voice-utils";
import { useEffect, useRef } from "react";

export function InterviewPrepPage() {
  const state = useInterviewState();
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const previewPlaybackRef = useRef<{ cancel: () => void } | null>(null);

  // Resolve the full interviewer config object from the selected ID
  const selectedInterviewer =
    getInterviewerById(state.selectedInterviewerId) ?? null;

  const handlePreviewInterviewerVoice = () => {
    if (!selectedInterviewer || selectedInterviewer.id === "none") return;
    previewPlaybackRef.current?.cancel();
    previewPlaybackRef.current = playInterviewerSpeech({
      interviewer: selectedInterviewer,
      text: getInterviewerPreviewText(selectedInterviewer),
      muted: state.voiceMuted,
    });
  };

  useEffect(() => {
    return () => {
      previewPlaybackRef.current?.cancel();
    };
  }, []);

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
        track={state.track}
        level={state.level}
        selectedTags={state.selectedTags}
        isCreating={state.isCreating}
        onTrackChange={state.setTrack}
        onLevelChange={state.setLevel}
        onToggleTag={state.toggleTag}
        onCreateSession={state.handleCreateSession}
        selectedInterviewerId={state.selectedInterviewerId}
        onInterviewerChange={state.setSelectedInterviewerId}
        voiceMuted={state.voiceMuted}
        onToggleVoiceMute={() => state.setVoiceMuted((prev: boolean) => !prev)}
        onPreviewInterviewerVoice={handlePreviewInterviewerVoice}
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
        voiceMuted={state.voiceMuted}
        onToggleVoiceMute={() => state.setVoiceMuted((prev: boolean) => !prev)}
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
