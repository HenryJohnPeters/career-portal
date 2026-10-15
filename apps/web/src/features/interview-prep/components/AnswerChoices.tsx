import { useId } from "react";
import { Check, X } from "lucide-react";
import { optionLetter } from "../answer";
import { InlineRichText } from "./RichText";

interface AnswerChoicesProps {
  options: readonly string[];
  multiSelect: boolean;
  selected: readonly number[];
  onChoose: (index: number) => void;
  /** Options removed by a 50/50 hint. */
  eliminated?: readonly number[];
  disabled?: boolean;
}

/**
 * Answer options as native radios (single answer) or checkboxes ("select all
 * that apply"), so keyboard and screen-reader behaviour comes for free.
 */
export function AnswerChoices({
  options,
  multiSelect,
  selected,
  onChoose,
  eliminated = [],
  disabled = false,
}: AnswerChoicesProps) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="space-y-2.5">
      <legend className={multiSelect ? "text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2" : "sr-only"}>
        {multiSelect ? "Select all that apply" : "Choose one answer"}
      </legend>
      {options.map((text, index) => {
        const isEliminated = eliminated.includes(index);
        const checked = selected.includes(index);
        return (
          <label
            key={index}
            className={`flex items-start gap-3 rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg-primary ${
              isEliminated
                ? "opacity-40 cursor-not-allowed border-border"
                : checked
                  ? "cursor-pointer border-accent bg-accent-muted"
                  : "cursor-pointer border-border bg-bg-elevated hover:border-neutral-300 dark:hover:border-neutral-700"
            }`}
          >
            <input
              type={multiSelect ? "checkbox" : "radio"}
              name={name}
              checked={checked}
              disabled={isEliminated}
              onChange={() => onChoose(index)}
              className="sr-only"
            />
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center border-2 text-xs font-bold ${
                multiSelect ? "rounded-md" : "rounded-full"
              } ${checked ? "border-accent bg-accent text-white" : "border-neutral-300 dark:border-neutral-600 text-text-tertiary"}`}
              aria-hidden="true"
            >
              {optionLetter(index)}
            </span>
            <span className={`text-sm text-text-primary leading-relaxed pt-0.5 ${isEliminated ? "line-through decoration-2" : ""}`}>
              <InlineRichText text={text} />
              {isEliminated && <span className="sr-only"> (eliminated by the 50/50 hint)</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

/** Read-only options after answering: correct ones ticked, wrong picks crossed. */
export function ReviewedChoices({
  options,
  correct,
  selected,
}: {
  options: readonly string[];
  correct: readonly number[];
  selected: readonly number[];
}) {
  return (
    <ul className="space-y-2" aria-label="Answer review">
      {options.map((text, index) => {
        const isCorrect = correct.includes(index);
        const isPicked = selected.includes(index);
        const state = isCorrect ? (isPicked ? "picked-correct" : "missed") : isPicked ? "picked-wrong" : "other";
        const styles = {
          "picked-correct": "border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20",
          missed: "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20",
          "picked-wrong": "border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-950/20",
          other: "border-border bg-bg-elevated opacity-70",
        }[state];
        const note = {
          "picked-correct": "Your answer — correct",
          missed: "Correct answer",
          "picked-wrong": "Your answer — incorrect",
          other: "",
        }[state];
        return (
          <li key={index} className={`flex items-start gap-3 rounded-xl border-2 px-3 py-2.5 ${styles}`}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold text-text-secondary" aria-hidden="true">
              {optionLetter(index)}
            </span>
            <span className="flex-1 text-sm text-text-primary leading-relaxed">
              <InlineRichText text={text} />
              {note && <span className="sr-only"> ({note})</span>}
            </span>
            {isCorrect && <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />}
            {!isCorrect && isPicked && <X className="h-4 w-4 shrink-0 text-red-500 mt-0.5" aria-hidden="true" />}
          </li>
        );
      })}
    </ul>
  );
}
