import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "./password-rules";

/**
 * The password policy as a live checklist. Give the password input
 * `aria-describedby={id}` so screen readers read the rules with the field.
 */
export function PasswordRulesList({ id, value }: { id: string; value: string }) {
  return (
    <ul id={id} className="mt-2 space-y-1 text-xs">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 ${met ? "text-emerald-700 dark:text-emerald-400" : "text-text-tertiary"}`}
          >
            {met ? (
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Circle className="h-3 w-3 shrink-0" aria-hidden="true" />
            )}
            <span>
              {rule.label}
              <span className="sr-only">{met ? " (done)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
