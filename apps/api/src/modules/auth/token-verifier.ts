import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  errors,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
  type JWTVerifyOptions,
} from "jose";
import { cleanDisplayName } from "./user-profile";

/** The verified, normalised claims the API relies on. */
export interface SupabaseIdentity {
  supabaseId: string;
  /** Lower-cased. */
  email: string;
  /** From user_metadata.name, cleaned; undefined when absent or blank. */
  name: string | undefined;
  /** `iat` in seconds, when present. */
  issuedAt: number | undefined;
}

/** The token is not acceptable: respond 401. `reason` is for logs only. */
export class InvalidTokenError extends Error {
  constructor(
    readonly reason: string,
    readonly publicMessage = "Invalid or expired token",
  ) {
    super(reason);
    this.name = "InvalidTokenError";
  }
}

/** The signing keys could not be fetched: respond 503 so clients don't sign the user out. */
export class AuthUnavailableError extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = "AuthUnavailableError";
  }
}

export interface TokenVerifierOptions {
  /** Supabase project origin; enables JWKS (ES256/RS256) and the issuer check. */
  supabaseUrl?: string;
  /** Legacy shared secret; enables HS256. */
  jwtSecret?: string;
  /** Key resolver for asymmetric tokens. Defaults to the project's remote JWKS. */
  jwks?: JWTVerifyGetKey;
}

const ASYMMETRIC_ALGORITHMS = ["ES256", "RS256"];
const AUDIENCE = "authenticated";
/** Allowance for clock drift between Supabase and this server. */
const CLOCK_TOLERANCE_SECONDS = 30;
/**
 * Known keys are served from memory for this long. Unknown `kid`s trigger at
 * most one refetch per cooldown, so forged tokens cannot exhaust anything or
 * evict the real keys. A revoked signing key stops verifying within an hour
 * (restart the API to drop it immediately).
 */
const JWKS_CACHE_MAX_AGE_MS = 60 * 60_000;
const JWKS_COOLDOWN_MS = 30_000;
const JWKS_TIMEOUT_MS = 5_000;

/** jose failures that mean "bad token" rather than "keys unavailable". */
const TOKEN_REJECTION_CODES: ReadonlySet<string> = new Set([
  errors.JWTExpired.code,
  errors.JWTClaimValidationFailed.code,
  errors.JWTInvalid.code,
  errors.JWSInvalid.code,
  errors.JWSSignatureVerificationFailed.code,
  errors.JOSEAlgNotAllowed.code,
  errors.JOSENotSupported.code,
  errors.JWKInvalid.code,
  errors.JWKSNoMatchingKey.code,
  errors.JWKSMultipleMatchingKeys.code,
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 255;
const EMAIL_ACCOUNT_REQUIRED = "Please sign in with an email account.";

/**
 * Verifies Supabase access tokens: ES256/RS256 against the project's JWKS,
 * HS256 against the legacy secret (only when configured). Every token must
 * carry `exp` and `sub`, the `authenticated` audience, the project issuer
 * (when SUPABASE_URL is set) and a real email; anonymous sessions are refused.
 */
export class SupabaseTokenVerifier {
  private readonly issuer: string | undefined;
  private readonly jwks: JWTVerifyGetKey | undefined;
  private readonly secret: Uint8Array | undefined;

  constructor(options: TokenVerifierOptions) {
    this.issuer = options.supabaseUrl
      ? `${options.supabaseUrl}/auth/v1`
      : undefined;
    this.jwks =
      options.jwks ??
      (options.supabaseUrl
        ? createRemoteJWKSet(
            new URL(`${options.supabaseUrl}/auth/v1/.well-known/jwks.json`),
            {
              cacheMaxAge: JWKS_CACHE_MAX_AGE_MS,
              cooldownDuration: JWKS_COOLDOWN_MS,
              timeoutDuration: JWKS_TIMEOUT_MS,
            },
          )
        : undefined);
    this.secret = options.jwtSecret
      ? new TextEncoder().encode(options.jwtSecret)
      : undefined;
  }

  async verify(token: string): Promise<SupabaseIdentity> {
    return toIdentity(await this.verifySignature(token));
  }

  private async verifySignature(token: string): Promise<JWTPayload> {
    let alg: string | undefined;
    try {
      alg = decodeProtectedHeader(token).alg;
    } catch {
      throw new InvalidTokenError("malformed");
    }

    const options: JWTVerifyOptions = {
      audience: AUDIENCE,
      requiredClaims: ["exp", "sub"],
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
      ...(this.issuer && { issuer: this.issuer }),
    };

    if (alg && ASYMMETRIC_ALGORITHMS.includes(alg) && this.jwks) {
      try {
        const { payload } = await jwtVerify(token, this.jwks, {
          ...options,
          algorithms: ASYMMETRIC_ALGORITHMS,
        });
        return payload;
      } catch (err) {
        if (isTokenRejection(err)) throw new InvalidTokenError(errorCode(err));
        throw new AuthUnavailableError(`jwks: ${errorCode(err)}`);
      }
    }

    if (alg === "HS256" && this.secret) {
      try {
        const { payload } = await jwtVerify(token, this.secret, {
          ...options,
          algorithms: ["HS256"],
        });
        return payload;
      } catch (err) {
        throw new InvalidTokenError(errorCode(err));
      }
    }

    throw new InvalidTokenError("alg_not_accepted");
  }
}

function toIdentity(payload: JWTPayload): SupabaseIdentity {
  const { sub } = payload;
  if (typeof sub !== "string" || !sub || sub.length > MAX_SUBJECT_LENGTH) {
    throw new InvalidTokenError("bad_sub");
  }
  if (payload.role !== undefined && payload.role !== AUDIENCE) {
    throw new InvalidTokenError("bad_role");
  }
  if (payload.is_anonymous === true) {
    throw new InvalidTokenError("anonymous", EMAIL_ACCOUNT_REQUIRED);
  }

  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH) {
    throw new InvalidTokenError("no_email", EMAIL_ACCOUNT_REQUIRED);
  }

  const metadata = payload.user_metadata;
  const rawName =
    typeof metadata === "object" && metadata !== null
      ? (metadata as { name?: unknown }).name
      : undefined;
  const name = typeof rawName === "string" ? cleanDisplayName(rawName) : "";

  return {
    supabaseId: sub,
    email,
    name: name || undefined,
    issuedAt: typeof payload.iat === "number" ? payload.iat : undefined,
  };
}

function isTokenRejection(err: unknown): boolean {
  return err instanceof errors.JOSEError && TOKEN_REJECTION_CODES.has(err.code);
}

function errorCode(err: unknown): string {
  if (err instanceof errors.JOSEError) return err.code;
  const code = (err as { code?: unknown } | null)?.code;
  if (typeof code === "string") return code;
  return err instanceof Error ? err.name : "unknown";
}
