import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { isActivePremium, isMeterExhausted } from "@careerportal/shared/types";
import { usePlanUsage } from "@careerportal/web/data-access";
import { useAuth } from "../../lib/auth";
import { idParam } from "../../lib/ids";
import { useInterviewSetup, type QuestionShortfall } from "./hooks/useInterviewSetup";
import { useVoiceMuted } from "./hooks/useVoiceMuted";
import { InterviewSetup } from "./components/InterviewSetup";
import { InterviewSession } from "./components/InterviewSession";
import { InterviewReportView } from "./components/InterviewReport";
import type { PracticeTab } from "./types";

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
  const sessionId = idParam(rawSessionId);
  const showReport = params.get("view") === "report";
  const tab: PracticeTab = params.get("tab") === "progress" ? "progress" : "practice";

  // Set when a new session got fewer questions than the interviewer offers.
  const [shortfall, setShortfall] = useState<QuestionShortfall | null>(null);

  const openSession = useCallback((id: string) => setParams({ session: id }), [setParams]);
  const openNewSession = useCallback(
    (id: string, next?: QuestionShortfall) => {
      setShortfall(next ?? null);
      openSession(id);
    },
    [openSession],
  );
  const openReport = useCallback((id: string) => setParams({ session: id, view: "report" }), [setParams]);
  const backToSetup = useCallback(() => setParams({}), [setParams]);
  const changeTab = useCallback(
    (next: PracticeTab) => setParams(next === "progress" ? { tab: "progress" } : {}),
    [setParams],
  );

  const setup = useInterviewSetup({
    allInterviewers: usage?.features.allInterviewers ?? isPremium,
    onCreated: openNewSession,
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
        shortfall={shortfall?.sessionId === sessionId ? shortfall : null}
        onDismissShortfall={() => setShortfall(null)}
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
