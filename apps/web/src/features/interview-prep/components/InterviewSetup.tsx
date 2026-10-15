import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AlertCircle, BarChart3, Briefcase, Mic, Play, TrendingUp, Volume2, VolumeX } from "lucide-react";
import { formatResetDate } from "../../../lib/plan-usage";
import { isMeterExhausted, type PlanUsage } from "@careerportal/shared/types";
import { Alert, Button } from "@careerportal/web/ui";
import { PageHero } from "../../shared";
import type { InterviewSetupState } from "../hooks/useInterviewSetup";
import type { PracticeTab } from "../types";
import { LEVELS, LEVEL_META, TRACKS, TRACK_META } from "../meta";
import { TRACK_TO_ROLE_FOCUS } from "../tech-pathways";
import { getInterviewerById, hasPersona } from "../interviewer-configs";
import {
  getInterviewerPreviewText,
  getVoiceSelectionDiagnostics,
  isSpeechSynthesisSupported,
  playInterviewerSpeech,
  type SpeechPlayback,
  type VoiceSelectionDiagnostics,
} from "../voice/playback";
import { ActionError, AllowanceMeter, ChoiceGrid, requestQuotaUpgrade, type Choice } from "./common";
import { InterviewerSelector } from "./InterviewerSelector";
import { TechStackPicker } from "./TechStackPicker";
import { SessionHistory } from "./SessionHistory";
import { InterviewProgressPanel } from "./InterviewProgressPanel";

const LEVEL_CHOICES: Choice<(typeof LEVELS)[number]>[] = LEVELS.map((level) => ({
  value: level,
  ...LEVEL_META[level],
}));

const TRACK_CHOICES: Choice<(typeof TRACKS)[number]>[] = TRACKS.map((track) => ({
  value: track,
  ...TRACK_META[track],
}));

const TABS: { id: PracticeTab; label: string; icon: typeof Mic }[] = [
  { id: "practice", label: "Practice", icon: Mic },
  { id: "progress", label: "Progress", icon: BarChart3 },
];

interface InterviewSetupProps {
  setup: InterviewSetupState;
  tab: PracticeTab;
  onTabChange: (tab: PracticeTab) => void;
  isPremium: boolean;
  usage: PlanUsage | undefined;
  voiceMuted: boolean;
  onToggleVoiceMute: () => void;
  onResumeSession: (sessionId: string) => void;
  onViewReport: (sessionId: string) => void;
  /** The URL named a session that isn't a valid id. */
  invalidSessionLink: boolean;
}

export function InterviewSetup({
  setup,
  tab,
  onTabChange,
  isPremium,
  usage,
  voiceMuted,
  onToggleVoiceMute,
  onResumeSession,
  onViewReport,
  invalidSessionLink,
}: InterviewSetupProps) {
  const tabRefs = useRef<Record<PracticeTab, HTMLButtonElement | null>>({ practice: null, progress: null });

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next: PracticeTab = tab === "practice" ? "progress" : "practice";
    onTabChange(next);
    tabRefs.current[next]?.focus();
  };

  const practiseTopic = (tag: string) => {
    setup.focusTopic(tag);
    onTabChange("practice");
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="w-full space-y-6">
      <PageHero
        icon={Mic}
        title="Practice"
        subtitle="Mock interviews tailored to your role, level and tech stack"
      />

      {invalidSessionLink && (
        <Alert variant="warning">That interview link isn't valid. Pick a session below or start a new one.</Alert>
      )}

      <div role="tablist" aria-label="Practice sections" className="inline-flex rounded-xl border border-border bg-bg-secondary p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[id] = el;
            }}
            type="button"
            role="tab"
            id={`practice-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={tab === id ? `practice-panel-${id}` : undefined}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => onTabChange(id)}
            onKeyDown={onTabKeyDown}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === id ? "bg-bg-elevated text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`practice-panel-${tab}`} aria-labelledby={`practice-tab-${tab}`}>
        {tab === "progress" ? (
          <InterviewProgressPanel onPracticeTopic={practiseTopic} />
        ) : (
          <PracticeForm
            setup={setup}
            isPremium={isPremium}
            usage={usage}
            voiceMuted={voiceMuted}
            onToggleVoiceMute={onToggleVoiceMute}
            onResumeSession={onResumeSession}
            onViewReport={onViewReport}
          />
        )}
      </div>
    </div>
  );
}

function PracticeForm({
  setup,
  isPremium,
  usage,
  voiceMuted,
  onToggleVoiceMute,
  onResumeSession,
  onViewReport,
}: Omit<InterviewSetupProps, "tab" | "onTabChange" | "invalidSessionLink">) {
  // The API refuses a new session when either free allowance is used up.
  const blocked = isMeterExhausted(usage?.meters.mockSessions)
    ? { quota: "mockSessions" as const, title: "You've used this month's free mock interviews" }
    : isMeterExhausted(usage?.meters.questions)
      ? { quota: "questions" as const, title: "You've used this month's free practice questions" }
      : null;
  const blockedMeter = blocked ? usage?.meters[blocked.quota] : undefined;
  const resetLabel = formatResetDate(blockedMeter?.resetsAt ?? usage?.periodResetsAt);
  const canStart = setup.selectedTags.length > 0 && !blocked;

  return (
    <div className="space-y-6">
      {!isPremium && usage && (
        <section aria-label="Your free allowance" className="rounded-2xl border border-border bg-bg-elevated p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <AllowanceMeter quota="mockSessions" meter={usage.meters.mockSessions} />
            <AllowanceMeter quota="questions" meter={usage.meters.questions} />
          </div>
          <p className="text-xs text-text-secondary">
            Free plan · Premium removes the monthly limits and unlocks every interviewer and the full progress breakdown.
          </p>
        </section>
      )}

      <SessionHistory onResume={onResumeSession} onViewReport={onViewReport} />

      <InterviewerSelector
        selectedId={setup.interviewerId}
        onSelect={setup.setInterviewerId}
        allInterviewers={usage?.features.allInterviewers ?? isPremium}
      />

      <VoiceSettings interviewerId={setup.interviewerId} muted={voiceMuted} onToggleMute={onToggleVoiceMute} />

      <ChoiceGrid
        label="Level"
        icon={TrendingUp}
        choices={LEVEL_CHOICES}
        value={setup.level}
        onChange={setup.setLevel}
        columns="grid-cols-1 sm:grid-cols-3"
      />

      <section className="rounded-xl border border-border bg-bg-secondary p-4 space-y-4">
        <ChoiceGrid
          label="Role"
          icon={Briefcase}
          hint="Sets which tech-stack options appear below"
          choices={TRACK_CHOICES}
          value={setup.track}
          onChange={setup.setTrack}
          columns="grid-cols-2 sm:grid-cols-4"
        />
        <div className="border-t border-border pt-4">
          <TechStackPicker
            role={TRACK_TO_ROLE_FOCUS[setup.track]}
            selectedTags={setup.selectedTags}
            onToggleTag={setup.toggleTag}
            onAddTags={setup.addTags}
            onRemoveTags={setup.removeTags}
            onClear={setup.clearTags}
            limitReached={setup.tagLimitReached}
          />
        </div>
      </section>

      <div className="space-y-3">
        <ActionError error={setup.error} title="Couldn't start the interview" onDismiss={setup.dismissError} />

        {blocked ? (
          <Alert
            variant="warning"
            title={blocked.title}
            action={
              <Button size="sm" onClick={() => requestQuotaUpgrade(blocked.quota, blockedMeter)}>
                See upgrade options
              </Button>
            }
          >
            {resetLabel ? `Your allowance resets on ${resetLabel}. ` : ""}
            {blocked.quota === "mockSessions"
              ? "You can still resume unfinished sessions and review your reports."
              : "You can still review your reports and progress."}
          </Alert>
        ) : (
          setup.selectedTags.length === 0 && (
            <p className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 px-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Select at least one technology to start your interview
            </p>
          )
        )}

        <Button size="lg" onClick={setup.start} loading={setup.isStarting} disabled={!canStart} className="w-full">
          <Play className="h-4 w-4" aria-hidden="true" />
          {setup.isStarting ? "Preparing your questions…" : "Start interview"}
        </Button>
      </div>
    </div>
  );
}

function VoiceSettings({
  interviewerId,
  muted,
  onToggleMute,
}: {
  interviewerId: string;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const interviewer = getInterviewerById(interviewerId);
  const supported = isSpeechSynthesisSupported();
  const [diagnostics, setDiagnostics] = useState<VoiceSelectionDiagnostics | null>(null);
  const previewRef = useRef<SpeechPlayback | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDiagnostics(null);
    if (!supported || !hasPersona(interviewer)) return;
    getVoiceSelectionDiagnostics(interviewer)
      .then((d) => {
        if (!cancelled) setDiagnostics(d);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [interviewer, supported]);

  // Stop a running preview on mute, a different interviewer, or unmount.
  useEffect(() => () => previewRef.current?.cancel(), [interviewerId, muted]);

  const preview = () => {
    if (!hasPersona(interviewer)) return;
    previewRef.current?.cancel();
    previewRef.current = playInterviewerSpeech({
      interviewer,
      text: getInterviewerPreviewText(interviewer),
      onEnd: () => {
        previewRef.current = null;
      },
    });
  };

  let detail: string;
  if (!supported) detail = "Your browser doesn't support spoken questions — they'll appear as text only.";
  else if (!hasPersona(interviewer)) detail = "Quick practice has no interviewer voice.";
  else if (!diagnostics) detail = "Choosing the most natural voice on this device…";
  else if (diagnostics.selectedVoiceName) {
    const quality =
      diagnostics.qualityTier === "high" ? "Natural quality" : diagnostics.qualityTier === "standard" ? "Standard quality" : "Basic quality";
    detail = `${quality} · ${diagnostics.selectedVoiceName}`;
  } else detail = "No suitable system voice found; your browser's default voice will be used.";

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-text-primary">Interviewer voice</p>
        <p className="text-xs text-text-secondary">{muted ? "Muted — questions appear as text only" : "Questions are read aloud"}</p>
        <p className="text-[11px] text-text-tertiary mt-1">{detail}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={onToggleMute} aria-pressed={muted} disabled={!supported}>
          {muted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
          {muted ? "Voice muted" : "Voice on"}
        </Button>
        <Button type="button" variant="ghost" onClick={preview} disabled={!supported || muted || !hasPersona(interviewer)}>
          Preview voice
        </Button>
      </div>
    </div>
  );
}
