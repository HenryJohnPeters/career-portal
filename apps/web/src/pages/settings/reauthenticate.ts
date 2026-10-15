import { supabase } from "@careerportal/web/data-access";
import { authErrorMessage } from "../auth/auth-errors";

/**
 * Re-checks the current password before a sensitive change (email or
 * password), so an unattended signed-in browser can't be used to take the
 * account over. Signing in again also gives a fresh session, which Supabase's
 * "secure password change" setting requires. Resolves to an error message, or
 * null when the password is correct.
 */
export async function verifyCurrentPassword(password: string): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user.email;
    if (!email) return authErrorMessage({ code: "session_not_found" }, "reauthenticate");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? authErrorMessage(error, "reauthenticate") : null;
  } catch (error) {
    return authErrorMessage(error, "reauthenticate");
  }
}
