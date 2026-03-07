interface AnswerOptionProps {
  index: number;
  text: string;
  selected: boolean;
  state?: "default" | "correct" | "incorrect" | "missed";
  onSelect: () => void;
  disabled?: boolean;
}

export function AnswerOption({
  index,
  text,
  selected,
  state = "default",
  onSelect,
  disabled = false,
}: AnswerOptionProps) {
  const letter = String.fromCharCode(65 + index);

  const stateStyles = {
    default: selected
      ? "border-accent bg-accent-muted ring-2 ring-accent/20"
      : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700",
    correct:
      "border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20",
    incorrect:
      "border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-950/20",
    missed:
      "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20",
  };

  const dotStyles = {
    default: selected
      ? "border-accent bg-accent text-white"
      : "border-gray-300 dark:border-gray-600 text-gray-400",
    correct: "border-emerald-500 bg-emerald-500 text-white",
    incorrect: "border-red-500 bg-red-500 text-white",
    missed: "border-amber-500 bg-amber-500 text-white",
  };

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 flex items-start gap-3 ${
        stateStyles[state]
      } ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${dotStyles[state]}`}
      >
        {letter}
      </span>
      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">
        {text}
      </span>
    </button>
  );
}
