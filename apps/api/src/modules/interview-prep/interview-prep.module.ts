import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { InterviewAdminController } from "./interview-admin.controller";
import { InterviewAnswersService } from "./interview-answers.service";
import { InterviewPrepController } from "./interview-prep.controller";
import { InterviewProgressService } from "./interview-progress.service";
import { InterviewSessionsService } from "./interview-sessions.service";
import { QuestionPoolService } from "./question-pool.service";

/** AiModule and EntitlementsModule are global. */
@Module({
  imports: [AuthModule],
  controllers: [InterviewPrepController, InterviewAdminController],
  providers: [
    QuestionPoolService,
    InterviewSessionsService,
    InterviewAnswersService,
    InterviewProgressService,
  ],
})
export class InterviewPrepModule {}
