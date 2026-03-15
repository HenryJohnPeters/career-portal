import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AuthGuard } from "../auth/auth.guard";
import { QuestionsService } from "./questions.service";
import {
  AnswerQuestionDto,
  PracticeNextDto,
  PracticeCheckDto,
} from "./questions.dto";
import { CurrentUserId } from "../../common/current-user.decorator";

@ApiTags("questions")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("questions")
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async getQuestions(@Query("category") category?: string) {
    const data = await this.questionsService.getQuestions(category);
    return { data };
  }

  @Get("answers")
  async getAnswers(@CurrentUserId() userId: string) {
    const data = await this.questionsService.getAnswers(userId);
    return { data };
  }

  @Put(":id/answer")
  async answer(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: AnswerQuestionDto
  ) {
    const data = await this.questionsService.answerQuestion(userId, id, dto);
    return { data };
  }

  @Get("practice/usage")
  async practiceUsage(@CurrentUserId() userId: string) {
    const data = await this.questionsService.getPracticeUsageStatus(userId);
    return { data };
  }

  // 30 requests per minute, max 1 per second — prevents pool-drain / AI-spam
  @Throttle({ short: { ttl: 1000, limit: 1 }, long: { ttl: 60000, limit: 30 } })
  @Post("practice/next")
  async practiceNext(
    @CurrentUserId() userId: string,
    @Body() dto: PracticeNextDto
  ) {
    const data = await this.questionsService.getRandomPracticeQuestion(userId, {
      track: dto.track,
      level: dto.level,
      difficulty: dto.difficulty,
      tags: dto.tags,
      excludeIds: dto.excludeIds,
    });
    return { data };
  }

  // 60 per minute, max 2 per second — generous for UX, but blocks hammering
  @Throttle({ short: { ttl: 1000, limit: 2 }, long: { ttl: 60000, limit: 60 } })
  @Post("practice/check")
  async practiceCheck(@Body() dto: PracticeCheckDto) {
    const data = await this.questionsService.checkPracticeAnswer(
      dto.questionId,
      dto.selectedOptionIndex,
      dto.selectedOptionIndices
    );
    return { data };
  }
}
