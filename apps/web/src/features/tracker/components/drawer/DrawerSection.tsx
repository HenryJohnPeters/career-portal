import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface DrawerSectionProps {
  title: string;
  icon: LucideIcon;
  /** Right-aligned next to the heading (e.g. a badge or an Edit button). */
  aside?: ReactNode;
  children: ReactNode;
}

/** A titled block inside the job drawer. */
export function DrawerSection({ title, icon: Icon, aside, children }: DrawerSectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 id={headingId} className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Option shape for the CV / cover-letter pickers. */
export interface DocumentOption {
  id: string;
  title: string;
  isActive?: boolean;
}
