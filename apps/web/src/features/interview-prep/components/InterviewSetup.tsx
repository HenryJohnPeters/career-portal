import { Button } from "@careerportal/web/ui";
import type {
  InterviewLevel,
  InterviewRoleFocus,
  InterviewType,
} from "@careerportal/shared/types";
import {
  Mic,
  Hash,
  TrendingUp,
  Briefcase,
  MessageSquare,
  SlidersHorizontal,
  Sparkles,
  Play,
  Brain,
  Target,
  Zap,
  CheckCircle2,
  Users,
  Settings2,
} from "lucide-react";
import { PageHero, OptionGrid, SectionHeading, LEVEL_META } from "../../shared";
import type { OptionItem } from "../../shared";
import { ROLE_FOCUS_ITEMS, INTERVIEW_TYPE_ITEMS } from "../constants";
import type { InterviewSetupProps } from "../types";
import { TechStackPicker } from "./TechStackPicker";
import { InterviewerSelector } from "./InterviewerSelector";
import { useAuth } from "../../../lib/auth";

const LEVEL_ITEMS: OptionItem[] = Object.entries(LEVEL_META).map(
  ([key, m]) => ({
    key,
    icon: m.icon,
    label: m.label,
    description: m.description,
  })
);

export function InterviewSetup({
  options,
  level,
  selectedTags,
  roleFocus,
  interviewType,
  expandedCategories,
  isCreating,
  onLevelChange,
  onRoleFocusChange,
  onInterviewTypeChange,
  onToggleTag,
  onToggleCategory,
  onCreateSession,
  selectedInterviewerId,
  onInterviewerChange,
  isPremium,
}: InterviewSetupProps) {
  const { user } = useAuth();
  const levelMeta = LEVEL_META[level] ?? LEVEL_META.mid;
  const roleMeta = ROLE_FOCUS_ITEMS.find((r) => r.key === roleFocus);

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

        <section>
          <SectionHeading icon={Briefcase} label="Role Focus" />
          <OptionGrid
            items={ROLE_FOCUS_ITEMS}
            value={roleFocus}
            onChange={(v) => onRoleFocusChange(v as InterviewRoleFocus)}
          />
        </section>

        <section>
          <TechStackPicker
            roleFocus={roleFocus}
            selectedTags={selectedTags}
            onToggleTag={onToggleTag}
            isPremium={isPremium}
          />
        </section>

        {/* START INTERVIEW BUTTON - SINGLE UNIFIED ACTION */}
        <div className="pt-4 w-full">
          <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden shadow-sm">
            <Button
              size="lg"
              onClick={onCreateSession}
              loading={isCreating}
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

/* ── Preview Row (local to setup) ── */

function PreviewRow({
  icon: Icon,
  label,
  value,
  valueClass = "text-text-primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-primary">
        <Icon className="h-3.5 w-3.5 text-text-tertiary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-text-tertiary">{label}</p>
        <p className={`text-sm font-semibold ${valueClass} truncate`}>
          {value}
        </p>
      </div>
    </div>
  );
}
