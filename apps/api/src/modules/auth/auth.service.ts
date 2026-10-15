import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, type User } from "@prisma/client";
import type { EnvConfig } from "../../common/env.config";
import { PrismaService } from "../../common/prisma.service";
import {
  AuthUnavailableError,
  InvalidTokenError,
  SupabaseTokenVerifier,
  type SupabaseIdentity,
} from "./token-verifier";
import { TtlCache } from "./ttl-cache";
import {
  defaultDisplayName,
  toUserResponse,
  USER_RESPONSE_SELECT,
  type UserResponse,
} from "./user-profile";

/** Resolved supabaseId → local user, so most requests make no DB call at all. */
const USER_CACHE_TTL_MS = 60_000;
const USER_CACHE_MAX_ENTRIES = 5_000;
/** Covers the longest-lived access token issued before an account was deleted. */
const DELETED_IDENTITY_TTL_MS = 24 * 60 * 60_000;
const DELETED_IDENTITY_MAX_ENTRIES = 10_000;
/** Each failure reason is logged at most once per window, with a count of the rest. */
const FAILURE_LOG_INTERVAL_MS = 60_000;
/** Reasons are error codes (a small set); the cap is a backstop. */
const FAILURE_LOG_MAX_REASONS = 100;

const AUTH_UNAVAILABLE =
  "Sign-in is temporarily unavailable. Please try again shortly.";
const ACCOUNT_DELETED = "This account has been deleted.";

interface CachedUser {
  id: string;
  /** The token email this entry was reconciled against; a change re-syncs. */
  tokenEmail: string;
}

/**
 * Verifies Supabase access tokens and maps them to local User rows.
 * Find-or-create is race-safe and keeps the local email in step with Supabase.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly verifier: SupabaseTokenVerifier;
  private readonly users = new TtlCache<CachedUser>(
    USER_CACHE_MAX_ENTRIES,
    USER_CACHE_TTL_MS,
  );
  /** supabaseId → deletion time (ms); tokens issued before it are refused. */
  private readonly deletedIdentities = new TtlCache<number>(
    DELETED_IDENTITY_MAX_ENTRIES,
    DELETED_IDENTITY_TTL_MS,
  );
  private readonly failureLog = new Map<string, { at: number; suppressed: number }>();

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<EnvConfig, true>,
  ) {
    this.verifier = new SupabaseTokenVerifier({
      supabaseUrl: config.get("SUPABASE_URL", { infer: true }),
      jwtSecret: config.get("SUPABASE_JWT_SECRET", { infer: true }),
    });
  }

  /** Verifies a bearer token and returns the local user id (creating the user on first sight). */
  async authenticate(token: string): Promise<string> {
    const identity = await this.verify(token);
    if (this.isRevoked(identity)) throw new UnauthorizedException(ACCOUNT_DELETED);

    const cached = this.users.get(identity.supabaseId);
    if (cached && cached.tokenEmail === identity.email) return cached.id;

    const user = await this.findOrCreateUser(identity);
    this.users.set(identity.supabaseId, {
      id: user.id,
      tokenEmail: identity.email,
    });
    return user.id;
  }

  /**
   * Called just before an account is deleted: drops the cached mapping and
   * refuses the identity's existing tokens, so a request resolving the user
   * concurrently cannot recreate an empty account once the delete commits.
   * A fresh sign-in (if the Supabase user still exists) starts a new account.
   */
  forgetIdentity(supabaseId: string): void {
    this.users.delete(supabaseId);
    this.deletedIdentities.set(supabaseId, Date.now());
  }

  /** Undoes forgetIdentity when the deletion did not happen after all. */
  restoreIdentity(supabaseId: string): void {
    this.deletedIdentities.delete(supabaseId);
  }

  /**
   * Find-or-create the local User for a verified identity. Concurrent first
   * requests (two tabs, or the auth callback firing twice) race on the unique
   * keys; the loser re-reads instead of failing.
   */
  async findOrCreateUser(identity: SupabaseIdentity): Promise<User> {
    try {
      return await this.resolveUser(identity);
    } catch (err) {
      if (!isConcurrentWriteConflict(err)) throw err;
      return this.resolveUser(identity);
    }
  }

  /** GET /auth/me. */
  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_RESPONSE_SELECT,
    });
    if (!user) throw new UnauthorizedException("User not found");
    return toUserResponse(user);
  }

  private async verify(token: string): Promise<SupabaseIdentity> {
    try {
      return await this.verifier.verify(token);
    } catch (err) {
      if (err instanceof InvalidTokenError) {
        this.logFailure(err.reason === "ERR_JWT_EXPIRED" ? "debug" : "warn", err.reason);
        throw new UnauthorizedException(err.publicMessage);
      }
      if (err instanceof AuthUnavailableError) {
        this.logFailure("error", err.reason);
        throw new ServiceUnavailableException(AUTH_UNAVAILABLE);
      }
      throw err;
    }
  }

  /** Tokens issued before the identity's account was deleted. */
  private isRevoked(identity: SupabaseIdentity): boolean {
    const deletedAt = this.deletedIdentities.get(identity.supabaseId);
    return deletedAt !== undefined && (identity.issuedAt ?? 0) * 1000 <= deletedAt;
  }

  private async resolveUser(identity: SupabaseIdentity): Promise<User> {
    const { supabaseId, email, name } = identity;

    const linked = await this.prisma.user.findUnique({ where: { supabaseId } });
    if (linked) {
      return linked.email === email ? linked : this.syncEmail(linked, email);
    }

    const byEmail = await this.prisma.user.findUnique({ where: { email } });
    if (byEmail?.supabaseId === supabaseId) return byEmail;
    if (byEmail?.supabaseId) {
      // Never re-point or alter another identity's account automatically:
      // Supabase can hold separate identities with the same (unverified) email.
      this.logger.warn(
        `Sign-in refused: email of user ${byEmail.id} is claimed by a different Supabase identity`,
      );
      throw new UnauthorizedException(
        "This email address is linked to a different sign-in. Please contact support.",
      );
    }
    if (byEmail) return this.linkLegacyUser(byEmail, supabaseId);

    // The account may have been deleted while this request was resolving it.
    if (this.isRevoked(identity)) throw new UnauthorizedException(ACCOUNT_DELETED);
    return this.prisma.user.create({
      data: { supabaseId, email, name: name ?? defaultDisplayName(email) },
    });
  }

  /** Rows created before Supabase auth (seed/legacy) are linked only while they hold no data. */
  private async linkLegacyUser(user: User, supabaseId: string): Promise<User> {
    if (!(await this.canAutoLinkLegacyUser(user.id))) {
      throw new UnauthorizedException(
        "Account recovery required. Please contact support to link this account securely.",
      );
    }
    const { count } = await this.prisma.user.updateMany({
      where: { id: user.id, supabaseId: null },
      data: { supabaseId },
    });
    // Linked by a concurrent request meanwhile: resolve again from the top.
    if (count === 0) throw new ConcurrentLinkError();
    return { ...user, supabaseId };
  }

  private async canAutoLinkLegacyUser(userId: string): Promise<boolean> {
    const counts = await Promise.all([
      this.prisma.cvVersion.count({ where: { userId } }),
      this.prisma.coverLetter.count({ where: { userId } }),
      this.prisma.job.count({ where: { userId } }),
      this.prisma.interviewSession.count({ where: { userId } }),
      this.prisma.technicalTest.count({ where: { userId } }),
      this.prisma.aiUsage.count({ where: { userId } }),
    ]);
    return counts.every((count) => count === 0);
  }

  /** The user changed their email in Supabase: follow it unless another row holds it. */
  private async syncEmail(user: User, email: string): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: user.id },
        data: { email },
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      this.logger.warn(
        `Email change for user ${user.id} not synced: the address is held by another account`,
      );
      return user;
    }
  }

  private logFailure(level: "debug" | "warn" | "error", reason: string): void {
    const now = Date.now();
    const entry = this.failureLog.get(reason);
    if (entry && now - entry.at < FAILURE_LOG_INTERVAL_MS) {
      entry.suppressed++;
      return;
    }
    const more = entry?.suppressed ? ` (+${entry.suppressed} more since last report)` : "";
    if (!entry && this.failureLog.size >= FAILURE_LOG_MAX_REASONS) this.failureLog.clear();
    this.failureLog.set(reason, { at: now, suppressed: 0 });
    this.logger[level](`Authentication failed: ${reason}${more}`);
  }
}

class ConcurrentLinkError extends Error {}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

/** A unique-key race, or the row we meant to link was changed by a concurrent request. */
function isConcurrentWriteConflict(err: unknown): boolean {
  return (
    err instanceof ConcurrentLinkError ||
    (err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2002" || err.code === "P2025"))
  );
}
