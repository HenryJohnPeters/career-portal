import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  UseGuards,
  type RawBodyRequest,
} from "@nestjs/common";
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import type Stripe from "stripe";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUserId } from "../../common/current-user.decorator";
import { VerifyCheckoutSessionDto } from "./billing.dto";
import { BillingService } from "./billing.service";
import { BillingWebhookService } from "./billing-webhook.service";

/** Per client: these routes each make several Stripe calls. */
const STRIPE_ROUTE_THROTTLE = { default: { limit: 10, ttl: 60_000 } };
const FORGED_WEBHOOK_LOG_INTERVAL_MS = 60_000;

@ApiTags("billing")
@Controller("billing")
export class BillingController {
  private readonly logger = new Logger(BillingController.name);
  /** The webhook is unthrottled, so forged requests are logged as a count, not one line each. */
  private forgedWebhooks = { count: 0, since: 0 };

  constructor(
    private readonly billingService: BillingService,
    private readonly webhookService: BillingWebhookService,
  ) {}

  @Post("checkout")
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Throttle(STRIPE_ROUTE_THROTTLE)
  async createCheckout(@CurrentUserId() userId: string) {
    return { data: await this.billingService.createCheckoutSession(userId) };
  }

  @Post("checkout/verify")
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Throttle(STRIPE_ROUTE_THROTTLE)
  async verifyCheckout(
    @CurrentUserId() userId: string,
    @Body() dto: VerifyCheckoutSessionDto,
  ) {
    return {
      data: await this.billingService.verifyCheckoutSession(
        userId,
        dto.sessionId,
      ),
    };
  }

  @Post("portal")
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Throttle(STRIPE_ROUTE_THROTTLE)
  async createPortal(@CurrentUserId() userId: string) {
    return { data: await this.billingService.createPortalSession(userId) };
  }

  @Get("status")
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getStatus(@CurrentUserId() userId: string) {
    return { data: await this.billingService.getSubscriptionStatus(userId) };
  }

  /**
   * Stripe webhook: authenticated by signature, never throttled (Stripe sends
   * bursts). Non-2xx makes Stripe retry: 409 while the same event is still
   * being processed, 5xx when processing failed.
   */
  @Post("webhook")
  @HttpCode(200)
  @SkipThrottle({ default: true, burst: true })
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string | undefined,
  ) {
    if (!signature) {
      throw new BadRequestException("Missing stripe-signature header");
    }
    if (!req.rawBody) {
      throw new BadRequestException("Invalid webhook payload");
    }

    let event: Stripe.Event;
    try {
      event = this.webhookService.constructEvent(req.rawBody, signature);
    } catch {
      this.noteForgedWebhook();
      throw new BadRequestException("Invalid signature");
    }

    const outcome = await this.webhookService.handle(event);
    if (outcome === "in_progress") {
      throw new ConflictException("Event is already being processed");
    }
    return { received: true };
  }

  private noteForgedWebhook(): void {
    const now = Date.now();
    const tally = this.forgedWebhooks;
    tally.count++;
    if (now - tally.since < FORGED_WEBHOOK_LOG_INTERVAL_MS) return;
    this.logger.warn(
      `Rejected ${tally.count} webhook request(s) with an invalid Stripe signature (check STRIPE_WEBHOOK_SECRET if this persists)`,
    );
    this.forgedWebhooks = { count: 0, since: now };
  }
}
