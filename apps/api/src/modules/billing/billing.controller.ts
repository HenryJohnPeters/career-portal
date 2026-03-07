import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
  Headers,
  BadRequestException,
  RawBodyRequest,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Request, Response } from "express";
import Stripe from "stripe";
import { AuthGuard } from "../auth/auth.guard";
import { BillingService } from "./billing.service";
import { CurrentUserId } from "../../common/current-user.decorator";

@ApiTags("billing")
@Controller("billing")
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  /* ── Create Stripe Checkout Session ─────────────────────── */
  @Post("checkout")
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async createCheckout(@CurrentUserId() userId: string) {
    const { url } = await this.billingService.createCheckoutSession(userId);
    return { data: { url } };
  }

  /* ── Create Stripe Customer Portal Session ──────────────── */
  @Post("portal")
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async createPortal(@CurrentUserId() userId: string) {
    const { url } = await this.billingService.createPortalSession(userId);
    return { data: { url } };
  }

  /* ── Get current subscription status ────────────────────── */
  @Get("status")
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getStatus(@CurrentUserId() userId: string) {
    const status = await this.billingService.getSubscriptionStatus(userId);
    return { data: status };
  }

  /* ── Stripe Webhook (no auth guard — verified by signature) */
  @Post("webhook")
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
    @Res() res: Response
  ) {
    if (!signature) {
      throw new BadRequestException("Missing stripe-signature header");
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException(
        "Missing raw body — ensure rawBody is enabled on the NestJS app"
      );
    }

    let event: Stripe.Event;
    try {
      event = this.billingService.constructEvent(rawBody, signature);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Webhook signature verification failed: ${message}`);
      return res.status(400).json({ error: "Invalid signature" });
    }

    try {
      await this.billingService.handleWebhookEvent(event);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Webhook handler error: ${message}`, stack);
      return res.status(500).json({ error: "Webhook handler failed" });
    }

    return res.status(200).json({ received: true });
  }
}
