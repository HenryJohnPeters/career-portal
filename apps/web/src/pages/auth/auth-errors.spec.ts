import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { authErrorMessage, authLinkErrorMessage, isEmailNotConfirmedError } from "./auth-errors";

describe("authErrorMessage", () => {
  test("wrong credentials, worded for the action", () => {
    const error = { code: "invalid_credentials", message: "Invalid login credentials", status: 400 };
    assert.equal(authErrorMessage(error, "signIn"), "Incorrect email or password.");
    assert.equal(authErrorMessage(error, "reauthenticate"), "Your current password is incorrect.");
    // Older servers without codes.
    assert.equal(authErrorMessage({ message: "Invalid login credentials" }, "signIn"), "Incorrect email or password.");
  });

  test("sign-up never confirms that an account exists", () => {
    for (const error of [
      { code: "user_already_exists", message: "User already registered" },
      { message: "User already registered" },
      { code: "email_exists", message: "A user with this email address has already been registered" },
    ]) {
      const message = authErrorMessage(error, "signUp");
      assert.doesNotMatch(message, /already exists|already registered/i);
      assert.match(message, /sign in or reset your password/);
    }
  });

  test("rate limits", () => {
    assert.match(authErrorMessage({ code: "over_email_send_rate_limit" }, "resend"), /several emails/);
    assert.match(
      authErrorMessage({ message: "For security purposes, you can only request this after 42 seconds." }, "resetRequest"),
      /several emails/,
    );
    assert.match(authErrorMessage({ code: "over_request_rate_limit" }, "signIn"), /Too many attempts/);
    assert.match(authErrorMessage({ status: 429, message: "Too Many Requests" }, "signIn"), /Too many attempts/);
  });

  test("password policy errors", () => {
    assert.match(
      authErrorMessage({ code: "weak_password", reasons: ["pwned"], message: "Password is known to be weak" }, "signUp"),
      /data breach/,
    );
    assert.match(
      authErrorMessage({ name: "AuthWeakPasswordError", reasons: ["characters"], message: "x" }, "updatePassword"),
      /stronger password/,
    );
    assert.match(
      authErrorMessage({ message: "Password should be at least 6 characters." }, "signUp"),
      /too short|too weak/,
    );
  });

  test("same password is not mistaken for a weak one", () => {
    assert.equal(
      authErrorMessage({ message: "New password should be different from the old password." }, "updatePassword"),
      "Your new password must be different from your current one.",
    );
    assert.equal(
      authErrorMessage({ code: "same_password" }, "updatePassword"),
      "Your new password must be different from your current one.",
    );
  });

  test("network failures", () => {
    for (const error of [
      { name: "AuthRetryableFetchError", message: "Failed to fetch", status: 0 },
      new TypeError("Failed to fetch"),
      { message: "NetworkError when attempting to fetch resource." },
    ]) {
      assert.match(authErrorMessage(error, "signIn"), /couldn't reach/);
    }
  });

  test("unknown errors never echo the raw message", () => {
    const message = authErrorMessage(
      { code: "unexpected_failure", message: "pq: relation auth.users does not exist" },
      "signIn",
    );
    assert.equal(message, "Something went wrong. Please try again.");
    assert.equal(authErrorMessage(undefined, "signIn"), "Something went wrong. Please try again.");
    assert.equal(authErrorMessage("boom", "signIn"), "Something went wrong. Please try again.");
  });

  test("session and email problems", () => {
    assert.match(authErrorMessage({ message: "Auth session missing!" }, "updatePassword"), /session has expired/);
    assert.match(authErrorMessage({ code: "email_address_invalid" }, "signUp"), /valid email/);
    assert.match(authErrorMessage({ code: "signup_disabled" }, "signUp"), /closed/);
    assert.match(authErrorMessage({ code: "email_exists" }, "updateEmail"), /different one/);
  });
});

describe("isEmailNotConfirmedError", () => {
  test("by code or message", () => {
    assert.equal(isEmailNotConfirmedError({ code: "email_not_confirmed" }), true);
    assert.equal(isEmailNotConfirmedError({ message: "Email not confirmed" }), true);
    assert.equal(isEmailNotConfirmedError({ code: "invalid_credentials" }), false);
    assert.equal(isEmailNotConfirmedError(null), false);
  });
});

describe("authLinkErrorMessage", () => {
  test("known codes get specific copy; anything else is generic", () => {
    assert.match(authLinkErrorMessage("otp_expired"), /expired or has already been used/);
    assert.match(authLinkErrorMessage("flow_state_expired"), /different browser/);
    assert.equal(authLinkErrorMessage("<script>"), "This link is invalid or has expired.");
    assert.equal(authLinkErrorMessage(null), "This link is invalid or has expired.");
  });
});
