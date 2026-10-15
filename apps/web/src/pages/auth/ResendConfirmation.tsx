import { useEffect, useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { supabase } from "@careerportal/web/data-access";
import { Alert, Button, TextField } from "@careerportal/web/ui";
import { authErrorMessage } from "./auth-errors";
import { PREMIUM_INTENT_PARAM, PREMIUM_INTENT_VALUE, authCallbackUrl } from "./auth-redirect";
import { emailSchema } from "./password-rules";

/** Supabase only allows one confirmation email a minute per address. */
const COOLDOWN_SECONDS = 60;

interface ResendConfirmationProps {
  /** Known address (button only); without it the user types one. */
  email?: string;
  /** Carry "continue to checkout" through the new link. */
  premiumIntent?: boolean;
}

/** "Resend confirmation email" with a cooldown and non-enumerating feedback. */
export function ResendConfirmation({ email, premiumIntent = false }: ResendConfirmationProps) {
  const [typedEmail, setTypedEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const parsed = emailSchema.safeParse(email ?? typedEmail);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    setFieldError(null);
    setResult(null);
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: parsed.data,
        options: {
          emailRedirectTo: authCallbackUrl(
            window.location.origin,
            premiumIntent ? { [PREMIUM_INTENT_PARAM]: PREMIUM_INTENT_VALUE } : {},
          ),
        },
      });
      if (error) {
        setResult({ ok: false, message: authErrorMessage(error, "resend") });
        return;
      }
      setCooldown(COOLDOWN_SECONDS);
      setResult({
        ok: true,
        message: `If ${parsed.data} has an account waiting for confirmation, a new link is on its way. Check your spam folder too.`,
      });
    } catch (error) {
      setResult({ ok: false, message: authErrorMessage(error, "resend") });
    } finally {
      setSending(false);
    }
  };

  const label = cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend confirmation email";
  const feedback = result && (
    <Alert variant={result.ok ? "success" : "error"} className="mt-3 text-left">
      {result.message}
    </Alert>
  );

  if (email) {
    return (
      <div>
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || cooldown > 0}
          className="text-xs font-semibold text-primary-700 dark:text-primary-300 hover:underline disabled:opacity-60 disabled:no-underline disabled:cursor-not-allowed rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {sending ? "Sending…" : label}
        </button>
        {feedback}
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void send(event)} noValidate className="text-left">
      <TextField
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        icon={<Mail />}
        value={typedEmail}
        onChange={(event) => setTypedEmail(event.target.value)}
        error={fieldError}
      />
      <Button type="submit" variant="outline" className="mt-3 w-full" loading={sending} disabled={cooldown > 0}>
        {label}
      </Button>
      {feedback}
    </form>
  );
}
