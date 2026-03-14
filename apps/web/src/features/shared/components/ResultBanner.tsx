import { CheckCircle2, XCircle, Flame } from "lucide-react";

interface ResultBannerProps {
  isCorrect: boolean;
  streak?: number;
  incorrectHint?: string;
}

export function ResultBanner({
  isCorrect,
  streak = 0,
  incorrectHint = "Don't worry — review the explanation below",
}: ResultBannerProps) {
  return (
    <div
      className={`rounded-2xl border-2 p-6 ${
        isCorrect
          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
          : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
            isCorrect
              ? "bg-emerald-100 dark:bg-emerald-900/40"
              : "bg-red-100 dark:bg-red-900/40"
          }`}
        >
          {isCorrect ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="h-7 w-7 text-red-500 dark:text-red-400" />
          )}
        </div>
        <div>
          <p
            className={`text-xl font-bold ${
              isCorrect
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-700 dark:text-red-400"
            }`}
          >
            {isCorrect ? "Correct! 🎉" : "Incorrect"}
          </p>
          {streak > 1 && isCorrect && (
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1 mt-1">
              <Flame className="h-3 w-3" /> {streak} in a row!
            </p>
          )}
          {!isCorrect && (
            <p className="text-xs text-red-500/70 dark:text-red-400/70 mt-1">
              {incorrectHint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
