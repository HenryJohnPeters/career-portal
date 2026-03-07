import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
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
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule {}
