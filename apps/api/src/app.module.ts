import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { validateEnv } from "./common/env.config";
import { PrismaModule } from "./common/prisma.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";
import { AuthModule } from "./modules/auth/auth.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { CvModule } from "./modules/cv/cv.module";
import { QuestionsModule } from "./modules/questions/questions.module";
import { CoverLettersModule } from "./modules/cover-letters/cover-letters.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { InterviewPrepModule } from "./modules/interview-prep/interview-prep.module";
import { TechnicalTestsModule } from "./modules/technical-tests/technical-tests.module";
import { AiModule } from "./modules/ai/ai.module";
import { PdfModule } from "./pdf/pdf.module";
import { BillingModule } from "./modules/billing/billing.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,   // 1 second
        limit: 3,    // 3 requests per second
      },
      {
        name: "medium",
        ttl: 10000,  // 10 seconds
        limit: 20,   // 20 requests per 10s
      },
      {
        name: "long",
        ttl: 60000,  // 1 minute
        limit: 100,  // 100 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    DashboardModule,
    CvModule,
    QuestionsModule,
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
