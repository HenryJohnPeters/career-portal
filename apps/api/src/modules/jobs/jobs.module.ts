import { Module } from "@nestjs/common";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { JobsAiService } from "./jobs-ai.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [JobsController],
  providers: [JobsService, JobsAiService],
})
export class JobsModule {}
