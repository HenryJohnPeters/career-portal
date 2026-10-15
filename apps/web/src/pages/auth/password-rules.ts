import { z } from "zod";

/*
 * Client-side mirror of the password policy. Supabase enforces its own
 * policy (configure it to at least the same minimum, with leaked-password
 * protection on); this only gives instant feedback.
 */

export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt, which Supabase uses, ignores everything after 72 bytes. */
export const PASSWORD_MAX_BYTES = 72;

export interface PasswordRule {
  id: "length" | "letter" | "number";
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  { id: "letter", label: "At least one letter", test: (value) => /\p{L}/u.test(value) },
  { id: "number", label: "At least one number", test: (value) => /\d/.test(value) },
];

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** A new password (sign-up, reset, change). Sign-in only checks that one was entered. */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .refine((value) => utf8Length(value) <= PASSWORD_MAX_BYTES, "That password is too long")
  .refine((value) => /\p{L}/u.test(value), "Include at least one letter")
  .refine((value) => /\d/.test(value), "Include at least one number");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .max(320, "That email address is too long")
  .email("Enter a valid email address");

/** New password + confirmation, as used by the sign-up, reset and change-password forms. */
export function withPasswordConfirmation<T extends z.ZodRawShape>(shape: T) {
  return z
    .object({ ...shape, password: newPasswordSchema, confirmPassword: z.string() })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
}
