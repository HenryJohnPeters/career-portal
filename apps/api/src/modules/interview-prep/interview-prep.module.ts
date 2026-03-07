import { Module } from "@nestjs/common";
import { InterviewPrepController } from "./interview-prep.controller";
import { InterviewPrepService } from "./interview-prep.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [InterviewPrepController],
  providers: [InterviewPrepService],
})
export class InterviewPrepModule {}
