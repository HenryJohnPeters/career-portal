import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AuthService } from "../auth/auth.service";
import {
  toUserResponse,
  USER_RESPONSE_SELECT,
  type UserResponse,
} from "../auth/user-profile";
import { BillingService } from "../billing/billing.service";
import { SupabaseAdminClient } from "./supabase-admin.client";

/** Replaces a deleted user's id where rows without a foreign key must stay countable. */
export const DELETED_USER_MARKER = "deleted-user";

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly billing: BillingService,
    private readonly supabaseAdmin: SupabaseAdminClient,
  ) {}

  async updateProfile(userId: string, name: string): Promise<UserResponse> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name },
      select: USER_RESPONSE_SELECT,
    });
    return toUserResponse(user);
  }

  /** Idempotent: keeps the first dismissal time. */
  async dismissOnboarding(userId: string): Promise<{ dismissed: true }> {
    await this.prisma.user.updateMany({
      where: { id: userId, onboardingDismissedAt: null },
      data: { onboardingDismissedAt: new Date() },
    });
    return { dismissed: true };
  }

  /**
   * Permanently deletes the account (PLAN §2.3), in an order that never
   * leaves a paying subscription behind:
   * 1. Cancel Stripe subscriptions now. Any failure aborts before data is touched.
   * 2. Refuse the identity's existing tokens, then delete the user; every
   *    user-owned row cascades and AuditLog rows are de-identified (SET NULL).
   *    Tables without a foreign key are handled here.
   * 3. Delete the Supabase auth user when the service-role key is set. A
   *    failure here is logged, not returned: the data is already gone.
   */
  async deleteAccount(
    userId: string,
    confirmEmail: string,
  ): Promise<{ deleted: true }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, supabaseId: true },
    });
    if (!user) throw new NotFoundException("Account not found");
    if (!emailsMatch(confirmEmail, user.email)) {
      throw new BadRequestException(
        "The email you entered does not match your account email.",
      );
    }

    await this.billing.cancelSubscriptionsForAccountDeletion(userId);

    // Before the delete, so a request resolving this user concurrently can
    // never recreate an empty account once it commits.
    if (user.supabaseId) this.authService.forgetIdentity(user.supabaseId);
    try {
      await this.prisma.$transaction([
        // Question-generation reservations count toward a global budget: keep them, anonymised.
        this.prisma.questionGenerationLog.updateMany({
          where: { triggeredBy: userId },
          data: { triggeredBy: DELETED_USER_MARKER },
        }),
        this.prisma.practiceQuestionUsage.deleteMany({ where: { userId } }),
        this.prisma.user.delete({ where: { id: userId } }),
        this.prisma.auditLog.create({
          data: { action: "account.deleted", reason: "user_request" },
        }),
      ]);
    } catch (err) {
      // Nothing was deleted: the user's tokens work again. If the row is gone
      // anyway (a concurrent deletion won) or that is unknown, keep refusing them.
      if (user.supabaseId && (await this.accountExists(userId))) {
        this.authService.restoreIdentity(user.supabaseId);
      }
      throw err;
    }

    let authUser = "no_identity";
    if (user.supabaseId) {
      const result = await this.supabaseAdmin.deleteAuthUser(user.supabaseId);
      authUser = typeof result === "string" ? result : "failed";
    }
    this.logger.log(`Account deleted (auth user: ${authUser})`);
    return { deleted: true };
  }

  private async accountExists(userId: string): Promise<boolean> {
    try {
      return (await this.prisma.user.count({ where: { id: userId } })) > 0;
    } catch {
      return false;
    }
  }
}

function emailsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
