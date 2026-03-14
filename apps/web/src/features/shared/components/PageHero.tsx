import type { LucideIcon } from "lucide-react";

interface HeroStat {
  value: string | number;
  label: string;
}

interface PageHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Optional action slot (buttons, etc.) rendered on the right */
  action?: React.ReactNode;
  /** Optional numeric stats rendered on the right */
  stats?: HeroStat[];
}

export function PageHero({
  icon: Icon,
  title,
  subtitle,
  action,
  stats,
}: PageHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Subtle accent glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent/8 dark:bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-accent/5 dark:bg-accent/8 blur-3xl" />
      </div>

      {/* Top accent line */}
      <div className="h-[2px] bg-primary-600 opacity-60" />

      <div className="relative px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted dark:bg-accent-muted/60">
                <Icon className="h-4.5 w-4.5 text-accent" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white truncate">
                {title}
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed ml-12">
              {subtitle}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            {stats && stats.length > 0 && (
              <div className="flex items-center gap-5">
                {stats.map((stat, i) => (
                  <div key={i} className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {action && <div>{action}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
