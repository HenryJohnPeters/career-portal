interface ProgressRingProps {
  /** 0-100; values outside the range are clamped. */
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

/** Circular percentage meter, announced as "72% match" (or the given label). */
export function ProgressRing({ percentage, size = 112, strokeWidth = 8, label = "accuracy" }: ProgressRingProps) {
  const value = Number.isFinite(percentage) ? Math.round(Math.min(100, Math.max(0, percentage))) : 0;
  const radius = (size - strokeWidth) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (value / 100) * circumference;

  return (
    <div className="flex justify-center">
      <div className="relative" style={{ height: size, width: size }} role="img" aria-label={`${value}% ${label}`}>
        <svg
          className="-rotate-90"
          style={{ height: size, width: size }}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-100 dark:text-gray-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            className="text-accent-500 transition-all duration-700 ease-out motion-reduce:transition-none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
          <span className={`font-bold text-gray-900 dark:text-white ${size < 96 ? "text-lg" : "text-2xl"}`}>
            {value}%
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
        </div>
      </div>
    </div>
  );
}
