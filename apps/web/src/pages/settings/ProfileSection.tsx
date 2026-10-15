import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Mail, UserRound } from "lucide-react";
import type { User } from "@careerportal/shared/types";
import { supabase, useUpdateProfile } from "@careerportal/web/data-access";
import { Alert, Button, PasswordField, TextField } from "@careerportal/web/ui";
import { useToast } from "../../lib/toast";
import { authErrorMessage } from "../auth/auth-errors";
import { authCallbackUrl } from "../auth/auth-redirect";
import { emailSchema } from "../auth/password-rules";
import { SettingsSection, SettingsSubheading } from "./SettingsSection";
import { verifyCurrentPassword } from "./reauthenticate";

/** Mirrors PATCH /account/profile: 1..80 characters after trimming, no control characters. */
const NAME_MAX_LENGTH = 80;
const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(NAME_MAX_LENGTH, `Use ${NAME_MAX_LENGTH} characters or fewer`)
    .regex(/^[^\p{Cc}]*$/u, "Remove unsupported characters"),
});
type NameForm = z.infer<typeof nameSchema>;

function NameForm({ user }: { user: User }) {
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<NameForm>({ resolver: zodResolver(nameSchema), defaultValues: { name: user.name } });

  // Follow changes made elsewhere (another tab, a refetch) unless the user is editing.
  useEffect(() => {
    if (!isDirty) reset({ name: user.name });
  }, [user.name, isDirty, reset]);

  const onSubmit = (data: NameForm) => {
    // Errors are toasted by the global mutation handler.
    updateProfile.mutate(data, {
      onSuccess: (res) => {
        reset({ name: res.data.name });
        toast("success", "Your name has been updated.");
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <TextField
        label="Name"
        autoComplete="name"
        maxLength={NAME_MAX_LENGTH}
        icon={<UserRound />}
        hint="Shown in the app and used in AI-written cover letters."
        error={errors.name?.message}
        {...register("name")}
      />
      <Button type="submit" size="sm" loading={updateProfile.isPending} disabled={!isDirty}>
        Save name
      </Button>
    </form>
  );
}

const emailChangeSchema = z.object({
  email: emailSchema,
  currentPassword: z.string().min(1, "Enter your current password"),
});
type EmailChangeForm = z.infer<typeof emailChangeSchema>;

function EmailChangeForm({ currentEmail }: { currentEmail: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors },
  } = useForm<EmailChangeForm>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: { email: "", currentPassword: "" },
  });

  const onSubmit = async (data: EmailChangeForm) => {
    setError(null);
    setPendingEmail(null);
    if (data.email.toLowerCase() === currentEmail.toLowerCase()) {
      setFieldError("email", { message: "That's already your email address" });
      return;
    }
    setSaving(true);
    try {
      const reauthError = await verifyCurrentPassword(data.currentPassword);
      if (reauthError) {
        setError(reauthError);
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser(
        { email: data.email },
        { emailRedirectTo: authCallbackUrl(window.location.origin, { next: "/app/settings" }) },
      );
      if (updateError) {
        setError(authErrorMessage(updateError, "updateEmail"));
        return;
      }
      setPendingEmail(data.email);
      reset();
    } catch (err) {
      setError(authErrorMessage(err, "updateEmail"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <p className="text-sm text-text-secondary">
        You sign in with <span className="font-semibold text-text-primary break-all">{currentEmail}</span>.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="New email address"
          type="email"
          autoComplete="email"
          icon={<Mail />}
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordField
          label="Current password"
          autoComplete="current-password"
          icon={<Lock />}
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {pendingEmail && (
        <Alert variant="success" title="Check your inbox">
          We've sent a confirmation link to <span className="font-semibold break-all">{pendingEmail}</span>. If we also
          email {currentEmail}, open that link too. Your sign-in email changes once the change is confirmed; until
          then, keep using your current one.
        </Alert>
      )}
      <Button type="submit" size="sm" variant="outline" loading={saving}>
        Change email
      </Button>
    </form>
  );
}

export function ProfileSection({ user }: { user: User }) {
  return (
    <SettingsSection id="profile" title="Profile" description="Your name and sign-in email." icon={<UserRound />}>
      <NameForm user={user} />
      <div className="space-y-3 border-t border-border pt-5">
        <SettingsSubheading>Email address</SettingsSubheading>
        <EmailChangeForm currentEmail={user.email} />
      </div>
    </SettingsSection>
  );
}
