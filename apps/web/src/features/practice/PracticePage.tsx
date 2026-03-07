import { Spinner, ErrorState } from "@careerportal/web/ui";
import { usePracticeState } from "./hooks/usePracticeState";
import { PracticeSetup } from "./components/PracticeSetup";
import { PracticeQuiz } from "./components/PracticeQuiz";

export function PracticePage() {
  const state = usePracticeState();

  if (state.isLoadingOptions) return <Spinner />;
  if (state.isError)
    return (
      <ErrorState
        message={(state.error as Error).message}
        onRetry={state.refetch}
      />
    );

  if (state.view === "setup") {
    return <PracticeSetup state={state} onStart={state.handleStart} />;
  }

  return <PracticeQuiz state={state} />;
}
