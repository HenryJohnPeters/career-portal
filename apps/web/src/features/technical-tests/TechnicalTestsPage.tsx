import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { isActivePremium } from "@careerportal/shared/types";
import { Alert, Button, ErrorState, Spinner } from "@careerportal/web/ui";
import { getErrorMessage, isApiError, usePlanUsage, useTechnicalTest } from "@careerportal/web/data-access";
import { useAuth } from "../../lib/auth";
import { idParam } from "../../lib/ids";
import { useTechTestSetup } from "./hooks/useTechTestSetup";
import { TechTestSetup } from "./components/TechTestSetup";
import { TechTestBrief } from "./components/TechTestBrief";
import { TechTestSession } from "./components/TechTestSession";
import { TechTestResults } from "./components/TechTestResults";
import { TechTestHistory } from "./components/TechTestHistory";

/**
 * /app/technical-tests — URL-driven so refresh and back work:
 *   (none)          setup
 *   ?view=history   past tests
 *   ?test=<id>      a test: brief → editor → results, by its status
 */
export function TechnicalTestsPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { data: usageData } = usePlanUsage();
  const usage = usageData?.data;
  const isPremium = usage?.isPremium ?? isActivePremium(user);

  const rawTestId = params.get("test");
  const testId = idParam(rawTestId);

  const openTest = useCallback((id: string) => setParams({ test: id }), [setParams]);
  const showHistory = useCallback(() => setParams({ view: "history" }), [setParams]);
  const backToSetup = useCallback(() => setParams({}), [setParams]);

  const setup = useTechTestSetup(openTest);

  if (testId) {
    return (
      <TechTestDetail
        key={testId}
        testId={testId}
        canUseAiReview={usage?.features.aiTechReview ?? isPremium}
        onBack={backToSetup}
        onShowHistory={showHistory}
      />
    );
  }

  if (params.get("view") === "history") {
    return <TechTestHistory isPremium={isPremium} onOpen={openTest} onBack={backToSetup} />;
  }

  return (
    <div className="space-y-4">
      {rawTestId && <Alert variant="warning">That test link isn't valid. Open a test from your past tests.</Alert>}
      <TechTestSetup setup={setup} isPremium={isPremium} usage={usage} onShowHistory={showHistory} />
    </div>
  );
}

function TechTestDetail({
  testId,
  canUseAiReview,
  onBack,
  onShowHistory,
}: {
  testId: string;
  canUseAiReview: boolean;
  onBack: () => void;
  onShowHistory: () => void;
}) {
  const { data, isPending, error, refetch } = useTechnicalTest(testId);
  const test = data?.data;

  if (isPending) return <Spinner label="Loading the test" />;
  // Only a failed first load replaces the view; a failed background refetch keeps the editor on screen.
  if (!test) {
    const notFound = isApiError(error) && error.status === 404;
    return (
      <div className="space-y-4">
        <ErrorState
          message={notFound ? "We couldn't find that test. It may have been deleted." : getErrorMessage(error, "Couldn't load this test.")}
          onRetry={notFound ? undefined : () => void refetch()}
        />
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to technical tests
          </Button>
        </div>
      </div>
    );
  }

  switch (test.status) {
    case "not_started":
      return <TechTestBrief test={test} onBack={onBack} />;
    case "in_progress":
      return <TechTestSession test={test} onBack={onBack} />;
    default:
      return <TechTestResults test={test} canUseAiReview={canUseAiReview} onBack={onBack} onShowHistory={onShowHistory} />;
  }
}
