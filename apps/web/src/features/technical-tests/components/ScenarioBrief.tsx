import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  Lightbulb,
  Lock,
  Package,
  Star,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { TechTestScenario } from "@careerportal/shared/types";
import { RichText } from "./RichText";

/** The full take-home brief. Used on the brief page and in the editor's "Brief" panel. */
export function ScenarioBrief({ scenario }: { scenario: TechTestScenario }) {
  // Stored JSON from older generators may lack optional lists.
  const requirements = scenario.requirements ?? [];
  const criteria = scenario.evaluationCriteria ?? [];
  return (
    <div className="space-y-4 sm:space-y-5">
      {scenario.companyContext && (
        <div className="rounded-2xl border border-violet-200/50 dark:border-violet-800/40 bg-violet-50/60 dark:bg-violet-950/20 p-5 flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30" aria-hidden="true">
            <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-violet-700 dark:text-violet-400 mb-1.5">
              Company context
            </h3>
            <p className="text-sm text-text-primary leading-relaxed">
              <RichText text={scenario.companyContext} />
            </p>
          </div>
        </div>
      )}

      <BriefSection icon={FileText} title="Problem brief">
        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
          <RichText text={scenario.brief} />
        </p>
        {scenario.background && (
          <p className="text-sm text-text-secondary leading-relaxed mt-3">
            <RichText text={scenario.background} />
          </p>
        )}
      </BriefSection>

      <BriefSection icon={CheckCircle2} title={`Requirements (${requirements.length})`}>
        <ol className="space-y-2.5">
          {requirements.map((req, idx) => (
            <li
              key={`${req.key}-${idx}`}
              className="flex items-start gap-3 p-3 rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-800/20"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[10px] font-bold mt-0.5" aria-hidden="true">
                {idx + 1}
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-400 mb-0.5">{req.key}</p>
                <p className="text-sm text-text-primary leading-relaxed">
                  <RichText text={req.text} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      </BriefSection>

      <IconList icon={AlertTriangle} iconClass="text-amber-500" title="Non-functional requirements" items={scenario.nonFunctional} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IconList icon={Target} iconClass="text-emerald-500" title="Acceptance criteria" items={scenario.acceptanceCriteria} />
        <IconList icon={Package} iconClass="text-blue-500" title="Deliverables" items={scenario.deliverables} />
        <IconList icon={Lock} iconClass="text-red-400" title="Constraints" items={scenario.constraints} />
        <IconList icon={Lightbulb} iconClass="text-amber-500" title="Hints" items={scenario.hints} />
      </div>

      <IconList icon={Star} iconClass="text-yellow-500" title="Bonus challenges" items={scenario.bonusChallenges} />

      {criteria.length > 0 && (
        <BriefSection icon={BarChart3} title="What reviewers look for">
          <ul className="space-y-2">
            {criteria.map((ec, idx) => (
              <li
                key={`${ec.name}-${idx}`}
                className="flex items-start gap-3 p-3 rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-800/20"
              >
                <span className="flex h-8 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white text-xs font-bold">
                  {ec.weight}%<span className="sr-only"> weight</span>
                </span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{ec.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    <RichText text={ec.description} />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </BriefSection>
      )}
    </div>
  );
}

function BriefSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-bg-elevated overflow-hidden">
      <h3 className="flex items-center gap-2 px-5 pt-4 pb-2.5 border-b border-border text-xs font-bold uppercase tracking-widest text-text-secondary">
        <Icon className="h-4 w-4 text-violet-500 dark:text-violet-400" aria-hidden="true" />
        {title}
      </h3>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function IconList({
  icon: Icon,
  iconClass,
  title,
  items,
}: {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  items: readonly string[] | undefined;
}) {
  if (!items || items.length === 0) return null;
  return (
    <BriefSection icon={Icon} title={title}>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
            <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${iconClass}`} aria-hidden="true" />
            <span>
              <RichText text={item} />
            </span>
          </li>
        ))}
      </ul>
    </BriefSection>
  );
}
