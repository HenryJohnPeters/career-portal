import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { isActivePremium, isMeterExhausted } from "@careerportal/shared/types";
import { usePlanUsage } from "@careerportal/web/data-access";
import { useAuth } from "../../lib/auth";
import { useInterviewSetup } from "./hooks/useInterviewSetup";
import { useVoiceMuted } from "./hooks/useVoiceMuted";
import { InterviewSetup } from "./components/InterviewSetup";
import { InterviewSession } from "./components/InterviewSession";
import { InterviewReportView } from "./components/InterviewReport";
import type { PracticeTab } from "./types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * /app/practice — URL-driven so refresh, back and deep links work:
 *   (none) | ?tab=progress    setup / progress
 *   ?session=<id>             the interview (resumes where it stopped)
 *   ?session=<id>&view=report the report
 */
export function InterviewPrepPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { data: usageData } = usePlanUsage();
  const usage = usageData?.data;
  const isPremium = usage?.isPremium ?? isActivePremium(user);
  const [voiceMuted, toggleVoiceMuted] = useVoiceMuted();

  const rawSessionId = params.get("session");
  const sessionId = rawSessionId && UUID_PATTERN.test(rawSessionId) ? rawSessionId : null;
  const showReport = params.get("view") === "report";
  const tab: PracticeTab = params.get("tab") === "progress" ? "progress" : "practice";

  const openSession = useCallback((id: string) => setParams({ session: id }), [setParams]);
  const openReport = useCallback((id: string) => setParams({ session: id, view: "report" }), [setParams]);
  const backToSetup = useCallback(() => setParams({}), [setParams]);
  const changeTab = useCallback(
    (next: PracticeTab) => setParams(next === "progress" ? { tab: "progress" } : {}),
    [setParams],
  );

  const setup = useInterviewSetup({
    allInterviewers: usage?.features.allInterviewers ?? isPremium,
    onCreated: openSession,
  });

  if (sessionId && showReport) {
    return (
      <InterviewReportView
        sessionId={sessionId}
        onBack={backToSetup}
        onResume={() => openSession(sessionId)}
      />
    );
  }

  if (sessionId) {
    return (
      <InterviewSession
        key={sessionId}
        sessionId={sessionId}
        voiceMuted={voiceMuted}
        onToggleVoiceMute={toggleVoiceMuted}
        questionsExhausted={isMeterExhausted(usage?.meters.questions)}
        onViewReport={() => openReport(sessionId)}
        onLeave={backToSetup}
      />
    );
  }

  return (
    <InterviewSetup
      setup={setup}
      tab={tab}
      onTabChange={changeTab}
      isPremium={isPremium}
      usage={usage}
      voiceMuted={voiceMuted}
      onToggleVoiceMute={toggleVoiceMuted}
      onResumeSession={openSession}
      onViewReport={openReport}
      invalidSessionLink={!!rawSessionId && !sessionId}
    />
  );
}
