import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { InterviewPrepService } from "./interview-prep.service";
import {
  CreateInterviewSessionDto,
  SubmitAnswerDto,
} from "./interview-prep.dto";
import { AiQuestionGeneratorService } from "../ai/ai-question-generator.service";
import { CurrentUserId } from "../../common/current-user.decorator";

@ApiTags("interview-prep")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("interview-prep")
export class InterviewPrepController {
  constructor(
    private readonly service: InterviewPrepService,
    private readonly aiQuestionGenerator: AiQuestionGeneratorService
  ) {}

  @Get("options")
  async getOptions() {
    const data = await this.service.getAvailableOptions();
    return { data };
  }

  @Get("sessions")
  async getSessions(@CurrentUserId() userId: string) {
    const data = await this.service.getSessions(userId);
    return { data };
  }

  @Post("sessions")
  async createSession(
    @CurrentUserId() userId: string,
    @Body() dto: CreateInterviewSessionDto
  ) {
    const data = await this.service.createSession(userId, dto);
    return { data };
  }

  @Get("sessions/:id")
  async getSession(@CurrentUserId() userId: string, @Param("id") id: string) {
    const data = await this.service.getSession(userId, id);
    return { data };
  }

  @Get("sessions/:id/next")
  async getNextQuestion(
    @CurrentUserId() userId: string,
    @Param("id") id: string
  ) {
    const data = await this.service.getNextQuestion(userId, id);
    return { data };
  }

  @Post("sessions/:id/questions/:questionId/answer")
  async submitAnswer(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Param("questionId") questionId: string,
    @Body() dto: SubmitAnswerDto
  ) {
    const data = await this.service.submitAnswer(
      userId,
      id,
      questionId,
      dto.answer
    );
    return { data };
  }

  @Post("sessions/:id/complete")
  async completeSession(
    @CurrentUserId() userId: string,
    @Param("id") id: string
  ) {
    const data = await this.service.completeSession(userId, id);
    return { data };
  }

  /**
   * Background fill endpoint — called by cron or admin to fill thin question pools.
   * In production, protect this with an API key or admin guard.
   */
  @Post("admin/background-fill")
  async backgroundFill() {
    const result = await this.aiQuestionGenerator.backgroundFill();
    return { data: result };
  }
}
