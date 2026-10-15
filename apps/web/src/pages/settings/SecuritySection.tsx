import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@careerportal/web/data-access";
import { Alert, Button, PasswordField } from "@careerportal/web/ui";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useAuth } from "../../lib/auth";
import { PasswordRulesList } from "../auth/PasswordRulesList";
import { authErrorMessage } from "../auth/auth-errors";
import { withPasswordConfirmation } from "../auth/password-rules";
import { SettingsSection, SettingsSubheading } from "./SettingsSection";
import { verifyCurrentPassword } from "./reauthenticate";

const passwordChangeSchema = withPasswordConfirmation({
  currentPassword: z.string().min(1, "Enter your current password"),
});
type PasswordChangeForm = { currentPassword: string; password: string; confirmPassword: string };

function ChangePasswordForm() {
  const rulesId = useId();
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordChangeForm>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });
  const password = watch("password");

  const onSubmit = async (data: PasswordChangeForm) => {
    setError(null);
    setChanged(false);
    setSaving(true);
    try {
      const reauthError = await verifyCurrentPassword(data.currentPassword);
      if (reauthError) {
        setError(reauthError);
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: data.password });
      if (updateError) {
        setError(authErrorMessage(updateError, "updatePassword"));
        return;
      }
      reset();
      setChanged(true);
    } catch (err) {
      setError(authErrorMessage(err, "updatePassword"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <PasswordField
        label="Current password"
        autoComplete="current-password"
        icon={<Lock />}
        containerClassName="sm:max-w-sm"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <PasswordField
            label="New password"
            autoComplete="new-password"
            icon={<Lock />}
            error={errors.password?.message}
            aria-describedby={rulesId}
            {...register("password")}
          />
          <PasswordRulesList id={rulesId} value={password ?? ""} />
        </div>
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          icon={<Lock />}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {changed && <Alert variant="success">Your password has been changed.</Alert>}
      <Button type="submit" size="sm" loading={saving}>
        Change password
      </Button>
    </form>
  );
}

function SignOutEverywhere() {
  const { logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOutEverywhere = async () => {
    setSigningOut(true);
    // On success this navigates away; on failure it has already shown a toast.
    const signedOut = await logout({ everywhere: true });
    if (!signedOut) {
      setSigningOut(false);
      setConfirming(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-secondary">
        Lost a device or signed in on a shared computer? Sign out of every browser and device, including this one.
      </p>
      <Button variant="outline" size="sm" className="shrink-0" onClick={() => setConfirming(true)}>
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        Sign out everywhere
      </Button>
      <ConfirmDialog
        open={confirming}
        title="Sign out of all devices?"
        description="You'll be signed out here and on every other browser and device. You can sign in again with your password."
        confirmLabel="Sign out everywhere"
        loading={signingOut}
        onConfirm={() => void signOutEverywhere()}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

export function SecuritySection() {
  return (
    <SettingsSection
      id="security"
      title="Security"
      description="Change your password and manage where you're signed in."
      icon={<ShieldCheck />}
    >
      <div className="space-y-3">
        <SettingsSubheading>Change password</SettingsSubheading>
        <ChangePasswordForm />
      </div>
      <div className="space-y-3 border-t border-border pt-5">
        <SettingsSubheading>Signed-in devices</SettingsSubheading>
        <SignOutEverywhere />
      </div>
    </SettingsSection>
  );
}
