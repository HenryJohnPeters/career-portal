import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { BillingWebhookService } from "./billing-webhook.service";
import { billingProviders } from "./stripe.client";
import { SubscriptionSyncService } from "./subscription-sync.service";

@Module({
  imports: [AuthModule],
  providers: [
    ...billingProviders,
    SubscriptionSyncService,
    BillingWebhookService,
    BillingService,
  ],
  controllers: [BillingController],
  exports: [BillingService],
})
export class BillingModule {}
