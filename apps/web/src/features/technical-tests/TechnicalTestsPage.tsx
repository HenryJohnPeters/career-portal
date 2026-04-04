import { useAuth } from "../../lib/auth";
import { isActivePremium } from "@careerportal/shared/types";
import { useAiUsage } from "@careerportal/web/data-access";
import { useTechTestState } from "./hooks/useTechTestState";
import { TechTestSetup } from "./components/TechTestSetup";
import { TechTestBrief } from "./components/TechTestBrief";
import { TechTestSession } from "./components/TechTestSession";
import { TechTestHistory } from "./components/TechTestHistory";

export function TechnicalTestsPage() {
  const { user } = useAuth();
  const { data: usageData } = useAiUsage();
  const usage = usageData?.data;
  const isPremium = usage?.isPremium ?? isActivePremium(user);
  const state = useTechTestState();

  if (state.view === "setup")
    return <TechTestSetup state={state} isPremium={isPremium} usage={usage} />;
  if (state.view === "brief") return <TechTestBrief state={state} />;
  if (state.view === "working") return <TechTestSession state={state} />;
  if (state.view === "history") return <TechTestHistory state={state} />;

  return null;
}
