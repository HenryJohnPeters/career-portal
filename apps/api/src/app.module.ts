import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { validateEnv } from "./common/env.config";
import { HttpExceptionFilter } from "./common/http-exception.filter";
import { PrismaModule } from "./common/prisma.module";
import { THROTTLERS } from "./common/throttler.config";
import { AccountModule } from "./modules/account/account.module";
import { AiModule } from "./modules/ai/ai.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BillingModule } from "./modules/billing/billing.module";
import { CoverLettersModule } from "./modules/cover-letters/cover-letters.module";
import { CvModule } from "./modules/cv/cv.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { EntitlementsModule } from "./modules/entitlements/entitlements.module";
import { HealthModule } from "./modules/health/health.module";
import { InterviewPrepModule } from "./modules/interview-prep/interview-prep.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { PdfModule } from "./modules/pdf/pdf.module";
import { TechnicalTestsModule } from "./modules/technical-tests/technical-tests.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    ThrottlerModule.forRoot(THROTTLERS),
    PrismaModule,
    EntitlementsModule,
    HealthModule,
    AuthModule,
    AccountModule,
    DashboardModule,
    CvModule,
    CoverLettersModule,
    JobsModule,
    InterviewPrepModule,
    TechnicalTestsModule,
    PdfModule,
    AiModule,
    BillingModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
