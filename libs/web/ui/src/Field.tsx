import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Eye, EyeOff } from "lucide-react";

/*
 * Labelled form controls. Each one wires <label htmlFor>, aria-invalid and
 * aria-describedby (hint + error) automatically, and forwards its ref so it
 * works with react-hook-form's register().
 */

interface FieldChromeProps {
  label: ReactNode;
  /** Validation message; marks the control invalid and is announced. */
  error?: string | null;
  /** Helper text under the control. */
  hint?: ReactNode;
  /** Visually hide the label (it stays available to screen readers). */
  hideLabel?: boolean;
  containerClassName?: string;
}

function useFieldIds(id: string | undefined) {
  const generated = useId();
  const fieldId = id ?? generated;
  return { fieldId, hintId: `${fieldId}-hint`, errorId: `${fieldId}-error` };
}

function joinIds(...ids: (string | false | null | undefined)[]): string | undefined {
  const joined = ids.filter(Boolean).join(" ");
  return joined || undefined;
}

const ERROR_RING = "border-red-400 focus:border-red-500 focus:ring-red-500/20";

function FieldLabel({ htmlFor, hidden, children }: { htmlFor: string; hidden?: boolean; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={hidden ? "sr-only" : "label"}>
      {children}
    </label>
  );
}

function FieldMessages({ hint, hintId, error, errorId }: { hint?: ReactNode; hintId: string; error?: string | null; errorId: string }) {
  return (
    <>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-text-tertiary">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </>
  );
}

export interface TextFieldProps extends FieldChromeProps, InputHTMLAttributes<HTMLInputElement> {
  /** Decorative icon inside the input, on the left. */
  icon?: ReactNode;
  /** Element inside the input, on the right (e.g. a toggle button). */
  trailing?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    error,
    hint,
    hideLabel,
    containerClassName = "",
    icon,
    trailing,
    id,
    className = "",
    "aria-describedby": describedBy,
    ...inputProps
  },
  ref,
) {
  const { fieldId, hintId, errorId } = useFieldIds(id);
  return (
    <div className={containerClassName}>
      <FieldLabel htmlFor={fieldId} hidden={hideLabel}>
        {label}
      </FieldLabel>
      <div className="relative">
        {icon && (
          <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={joinIds(hint && !error ? hintId : undefined, error ? errorId : undefined, describedBy)}
          className={`input-base ${icon ? "input-icon" : ""} ${trailing ? "pr-11" : ""} ${error ? ERROR_RING : ""} ${className}`}
          {...inputProps}
        />
        {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      <FieldMessages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
});

export type PasswordFieldProps = Omit<TextFieldProps, "type" | "trailing">;

/** Password input with an accessible show/hide toggle. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <TextField
        ref={ref}
        {...props}
        type={visible ? "text" : "password"}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="rounded-lg p-1.5 text-text-tertiary hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        }
      />
    );
  },
);

export type TextareaFieldProps = FieldChromeProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField(
    { label, error, hint, hideLabel, containerClassName = "", id, className = "", "aria-describedby": describedBy, ...textareaProps },
    ref,
  ) {
    const { fieldId, hintId, errorId } = useFieldIds(id);
    return (
      <div className={containerClassName}>
        <FieldLabel htmlFor={fieldId} hidden={hideLabel}>
          {label}
        </FieldLabel>
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={joinIds(hint && !error ? hintId : undefined, error ? errorId : undefined, describedBy)}
          className={`input-base resize-y ${error ? ERROR_RING : ""} ${className}`}
          {...textareaProps}
        />
        <FieldMessages hint={hint} hintId={hintId} error={error} errorId={errorId} />
      </div>
    );
  },
);

export type SelectFieldProps = FieldChromeProps & SelectHTMLAttributes<HTMLSelectElement>;

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    { label, error, hint, hideLabel, containerClassName = "", id, className = "", children, "aria-describedby": describedBy, ...selectProps },
    ref,
  ) {
    const { fieldId, hintId, errorId } = useFieldIds(id);
    return (
      <div className={containerClassName}>
        <FieldLabel htmlFor={fieldId} hidden={hideLabel}>
          {label}
        </FieldLabel>
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={joinIds(hint && !error ? hintId : undefined, error ? errorId : undefined, describedBy)}
          className={`input-base ${error ? ERROR_RING : ""} ${className}`}
          {...selectProps}
        >
          {children}
        </select>
        <FieldMessages hint={hint} hintId={hintId} error={error} errorId={errorId} />
      </div>
    );
  },
);
