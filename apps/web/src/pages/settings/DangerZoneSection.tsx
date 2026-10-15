import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import type { User } from "@careerportal/shared/types";
import { useDeleteAccount } from "@careerportal/web/data-access";
import { Alert, Button } from "@careerportal/web/ui";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useAuth } from "../../lib/auth";
import { SettingsSection } from "./SettingsSection";

/** Permanent account deletion, confirmed by typing the account email. */
export function DangerZoneSection({ user }: { user: User }) {
  const { logout } = useAuth();
  const deleteAccount = useDeleteAccount();
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletedButSignedIn, setDeletedButSignedIn] = useState(false);

  const onConfirm = (confirmEmail: string) => {
    // A failure (e.g. Stripe couldn't confirm the cancellation) is toasted by the
    // global handler and nothing is deleted; the dialog stays open to retry.
    deleteAccount.mutate(
      { confirmEmail },
      {
        onSuccess: async () => {
          setSigningOut(true);
          const signedOut = await logout({ redirectTo: "/?deleted=1" });
          if (!signedOut) {
            setSigningOut(false);
            setConfirming(false);
            setDeletedButSignedIn(true);
          }
        },
      },
    );
  };

  return (
    <SettingsSection
      id="delete-account"
      title="Delete account"
      description="Permanently delete your account and everything in it."
      icon={<AlertTriangle />}
      tone="danger"
    >
      {deletedButSignedIn ? (
        <Alert variant="warning" title="Your account has been deleted">
          We couldn't finish signing you out. Close this tab, or reload the page once you're back online.
        </Alert>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 text-sm text-text-secondary">
            <p>
              This deletes your CVs, cover letters, tracked jobs, interview history and technical tests. It can't be
              undone, so download your data first if you want a copy.
            </p>
            <p>An active Premium subscription is cancelled immediately and you won't be charged again.</p>
          </div>
          <Button variant="danger" size="sm" className="shrink-0" onClick={() => setConfirming(true)}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete account
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        destructive
        title="Delete your account?"
        description="All your data is deleted permanently and any subscription is cancelled now. If you sign up again later, you'll start with an empty account."
        requireText={user.email}
        requireTextLabel="Type your email address to confirm"
        confirmLabel="Delete my account"
        loading={deleteAccount.isPending || signingOut}
        onConfirm={onConfirm}
        onCancel={() => setConfirming(false)}
      />
    </SettingsSection>
  );
}
