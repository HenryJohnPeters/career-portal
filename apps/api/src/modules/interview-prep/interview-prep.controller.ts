import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CurrentUserId } from "../../common/current-user.decorator";
import { AuthGuard } from "../auth/auth.guard";
import { InterviewAnswersService } from "./interview-answers.service";
import { INTERVIEW_OPTIONS } from "./interview-options";
import { CreateInterviewSessionDto, SubmitAnswerDto } from "./interview-prep.dto";
import { InterviewProgressService } from "./interview-progress.service";
import { InterviewSessionsService } from "./interview-sessions.service";

const uuid = () => new ParseUUIDPipe({ version: "4" });

/** Session creation can trigger pool work; well above any real practice pace. */
const CREATE_SESSION_THROTTLE = { default: { limit: 10, ttl: 60_000 } } as const;

@ApiTags("interview-prep")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("interview-prep")
export class InterviewPrepController {
  constructor(
    private readonly sessions: InterviewSessionsService,
    private readonly answers: InterviewAnswersService,
    private readonly progress: InterviewProgressService,
  ) {}

  @Get("options")
  getOptions() {
    return { data: INTERVIEW_OPTIONS };
  }

  @Get("progress")
  async getProgress(@CurrentUserId() userId: string) {
    const data = await this.progress.getProgress(userId);
    return { data };
  }

  @Get("sessions")
  async getSessions(@CurrentUserId() userId: string) {
    const data = await this.sessions.listSummaries(userId);
    return { data };
  }

  @Post("sessions")
  @Throttle(CREATE_SESSION_THROTTLE)
  async createSession(
    @CurrentUserId() userId: string,
    @Body() dto: CreateInterviewSessionDto,
  ) {
    const data = await this.sessions.createSession(userId, dto);
    return { data };
  }

  @Get("sessions/:id")
  async getSession(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
  ) {
    const data = await this.sessions.getSession(userId, id);
    return { data };
  }

  @Get("sessions/:id/next")
  async getNextQuestion(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
  ) {
    const data = await this.answers.getNextQuestion(userId, id);
    return { data };
  }

  @Post("sessions/:id/questions/:questionId/answer")
  async submitAnswer(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Param("questionId", uuid()) questionId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    const data = await this.answers.submitAnswer(userId, id, questionId, dto.answer);
    return { data };
  }

  @Post("sessions/:id/complete")
  async completeSession(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
  ) {
    const data = await this.sessions.completeSession(userId, id);
    return { data };
  }
}
