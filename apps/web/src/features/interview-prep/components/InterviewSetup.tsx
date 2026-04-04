import { Button } from "@careerportal/web/ui";
import type { InterviewLevel, InterviewTrack } from "@careerportal/shared/types";
import { Mic, TrendingUp, Play, Volume2, VolumeX, AlertCircle } from "lucide-react";
import { PageHero, OptionGrid, SectionHeading, LEVEL_META, TRACK_META } from "../../shared";
import type { OptionItem } from "../../shared";
import type { InterviewSetupProps } from "../types";
import { TechStackPicker } from "./TechStackPicker";
import { InterviewerSelector } from "./InterviewerSelector";
import { getInterviewerById } from "../interviewer-configs";

const LEVEL_ITEMS: OptionItem[] = Object.entries(LEVEL_META).map(
  ([key, m]) => ({
    key,
    icon: m.icon,
    label: m.label,
    description: m.description,
  }),
);

const TRACK_ITEMS: OptionItem[] = Object.entries(TRACK_META).map(([key, m]) => ({
  key,
  icon: m.icon,
  label: m.label,
  description: m.description,
}));

export function InterviewSetup({
  track,
  level,
  selectedTags,
  isCreating,
  onTrackChange,
  onLevelChange,
  onToggleTag,
  onCreateSession,
  selectedInterviewerId,
  onInterviewerChange,
  voiceMuted,
  onToggleVoiceMute,
  onPreviewInterviewerVoice,
  isPremium,
}: InterviewSetupProps) {
  const selectedInterviewer = getInterviewerById(selectedInterviewerId) ?? null;
  const canPreview = !!selectedInterviewer && selectedInterviewer.id !== "none";
  const canStart = selectedTags.length > 0;

  return (
    <div className="w-full space-y-6">
      <PageHero
        icon={Mic}
        title="Practice"
        subtitle="Configure your practice session · Questions adapt to your selections"
      />

      {/* INTERVIEWER SELECTOR - FULL WIDTH AT TOP */}
      <div className="w-full">
        <InterviewerSelector
          selectedId={selectedInterviewerId}
          onSelect={onInterviewerChange}
        />
      </div>

      <div className="rounded-xl border border-border bg-bg-secondary p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            Interviewer Voice
          </p>
          <p className="text-xs text-text-tertiary">
            {voiceMuted
              ? "Voice is muted before start"
              : "Voice is enabled for this interview"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onToggleVoiceMute}
            className="whitespace-nowrap"
          >
            {voiceMuted ? (
              <>
                <VolumeX className="h-4 w-4" /> Muted
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" /> Voice On
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onPreviewInterviewerVoice}
            disabled={!canPreview || voiceMuted}
            className="whitespace-nowrap"
          >
            Preview Voice
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT - FULL WIDTH */}
      <div className="w-full space-y-4">
        <section>
          <SectionHeading icon={TrendingUp} label="Level" />
          <OptionGrid
            items={LEVEL_ITEMS}
            value={level}
            onChange={(v) => onLevelChange(v as InterviewLevel)}
            columns="grid-cols-1 sm:grid-cols-3"
          />
        </section>

        {/* Track + Tech Stack — single connected section */}
        <section className="rounded-xl border border-border bg-bg-secondary p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-text-primary">Role</p>
            <p className="text-xs text-text-tertiary mt-0.5">
              Sets which tech stack options appear below
            </p>
          </div>
          <OptionGrid
            items={TRACK_ITEMS}
            value={track}
            onChange={(v) => onTrackChange(v as InterviewTrack)}
            columns="grid-cols-2 sm:grid-cols-4"
          />
          <div className="border-t border-border pt-4">
            {/* ROLE_TECH_PATHWAYS keys use "platform" not "devops" — map accordingly */}
            <TechStackPicker
              selectedTags={selectedTags}
              onToggleTag={onToggleTag}
              isPremium={isPremium}
              roleFocus={track === "devops" ? "platform" : track}
            />
          </div>
        </section>

        {/* START INTERVIEW BUTTON */}
        <div className="pt-2 w-full">
          {!canStart && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mb-2 px-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Select at least one technology to start your interview
            </div>
          )}
          <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden shadow-sm">
            <Button
              size="lg"
              onClick={onCreateSession}
              loading={isCreating}
              disabled={!canStart}
              className="w-full"
            >
              <Play className="h-4 w-4" /> Start Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
