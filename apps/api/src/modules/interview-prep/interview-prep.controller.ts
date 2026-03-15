import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AuthGuard } from "../auth/auth.guard";
import { InterviewPrepService } from "./interview-prep.service";
import {
  CreateInterviewSessionDto,
  SubmitAnswerDto,
} from "./interview-prep.dto";
import { AiQuestionGeneratorService } from "../ai/ai-question-generator.service";
import { CurrentUserId } from "../../common/current-user.decorator";
import { ConfigService } from "@nestjs/config";

@ApiTags("interview-prep")
@ApiBearerAuth()
@Controller("interview-prep")
export class InterviewPrepController {
  constructor(
    private readonly service: InterviewPrepService,
    private readonly aiQuestionGenerator: AiQuestionGeneratorService,
    private readonly config: ConfigService
  ) {}

  @Get("options")
  @UseGuards(AuthGuard)
  async getOptions() {
    const data = await this.service.getAvailableOptions();
    return { data };
  }

  @Get("sessions")
  @UseGuards(AuthGuard)
  async getSessions(@CurrentUserId() userId: string) {
    const data = await this.service.getSessions(userId);
    return { data };
  }

  @Post("sessions")
  @UseGuards(AuthGuard)
  async createSession(
    @CurrentUserId() userId: string,
    @Body() dto: CreateInterviewSessionDto
  ) {
    const data = await this.service.createSession(userId, dto);
    return { data };
  }

  @Get("sessions/:id")
  @UseGuards(AuthGuard)
  async getSession(@CurrentUserId() userId: string, @Param("id") id: string) {
    const data = await this.service.getSession(userId, id);
    return { data };
  }

  @Get("sessions/:id/next")
  @UseGuards(AuthGuard)
  async getNextQuestion(
    @CurrentUserId() userId: string,
    @Param("id") id: string
  ) {
    const data = await this.service.getNextQuestion(userId, id);
    return { data };
  }

  @Post("sessions/:id/questions/:questionId/answer")
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
  async completeSession(
    @CurrentUserId() userId: string,
    @Param("id") id: string
  ) {
    const data = await this.service.completeSession(userId, id);
    return { data };
  }

  /**
   * Background fill endpoint — called by cron or admin to fill thin question pools.
   * Protected by a shared ADMIN_API_KEY.
   * Rate-limited to 1 call per minute to prevent bill-spiking if the key leaks.
   */
  @Post("admin/background-fill")
  @Throttle({ default: { ttl: 60000, limit: 1 } })
  async backgroundFill(@Headers("x-admin-key") adminKey: string) {
    const expectedKey = this.config.get<string>("ADMIN_API_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      throw new UnauthorizedException("Invalid or missing admin API key");
    }
    const result = await this.aiQuestionGenerator.backgroundFill();
    return { data: result };
  }
}
