import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BillingModule } from "../billing/billing.module";
import { AccountController } from "./account.controller";
import { AccountExportService } from "./account-export.service";
import { AccountService } from "./account.service";
import { SupabaseAdminClient } from "./supabase-admin.client";

@Module({
  imports: [AuthModule, BillingModule],
  controllers: [AccountController],
  providers: [AccountService, AccountExportService, SupabaseAdminClient],
})
export class AccountModule {}
