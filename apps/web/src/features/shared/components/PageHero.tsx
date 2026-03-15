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

      <div className="relative px-4 py-5 sm:px-8 sm:py-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted dark:bg-accent-muted/60">
                <Icon className="h-4.5 w-4.5 text-accent" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white truncate">
                {title}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed ml-12">
              {subtitle}
            </p>
          </div>

          {/* Stats & action - visible on all screen sizes */}
          {(stats?.length || action) && (
            <div className="flex items-center gap-4 shrink-0 ml-12 sm:ml-0">
              {stats && stats.length > 0 && (
                <div className="flex items-center gap-5">
                  {stats.map((stat, i) => (
                    <div key={i} className="text-left sm:text-right">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {action && <div className="hidden sm:block">{action}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
