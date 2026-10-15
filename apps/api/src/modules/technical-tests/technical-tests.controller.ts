import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { DELETED_RESPONSE } from "../../common/constants";
import { CurrentUserId } from "../../common/current-user.decorator";
import { AuthGuard } from "../auth/auth.guard";
import {
  CreateTechnicalTestDto,
  SelfReviewTechnicalTestDto,
  SubmitTechnicalTestDto,
} from "./technical-tests.dto";
import { TechnicalTestsService } from "./technical-tests.service";

const uuid = () => new ParseUUIDPipe({ version: "4" });

/** Creation may call AI for premium users; far above any real pace. */
const CREATE_TEST_THROTTLE = { default: { limit: 10, ttl: 60_000 } } as const;
/** AI review is once per test; this only bounds scripted retries. */
const AI_REVIEW_THROTTLE = { default: { limit: 6, ttl: 60_000 } } as const;

@ApiTags("technical-tests")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("technical-tests")
export class TechnicalTestsController {
  constructor(private readonly service: TechnicalTestsService) {}

  @Get()
  async listTests(@CurrentUserId() userId: string) {
    const data = await this.service.listSummaries(userId);
    return { data };
  }

  @Post()
  @Throttle(CREATE_TEST_THROTTLE)
  async createTest(
    @CurrentUserId() userId: string,
    @Body() dto: CreateTechnicalTestDto,
  ) {
    const data = await this.service.createTest(userId, dto);
    return { data };
  }

  @Get(":id")
  async getTest(@CurrentUserId() userId: string, @Param("id", uuid()) id: string) {
    const data = await this.service.getTest(userId, id);
    return { data };
  }

  @Post(":id/start")
  async startTest(@CurrentUserId() userId: string, @Param("id", uuid()) id: string) {
    const data = await this.service.startTest(userId, id);
    return { data };
  }

  @Post(":id/submit")
  async submitTest(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: SubmitTechnicalTestDto,
  ) {
    const data = await this.service.submitTest(userId, id, dto.submission);
    return { data };
  }

  @Put(":id/self-review")
  async saveSelfReview(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: SelfReviewTechnicalTestDto,
  ) {
    const data = await this.service.saveSelfReview(userId, id, dto);
    return { data };
  }

  @Post(":id/ai-review")
  @Throttle(AI_REVIEW_THROTTLE)
  async requestAiReview(@CurrentUserId() userId: string, @Param("id", uuid()) id: string) {
    const data = await this.service.requestAiReview(userId, id);
    return { data };
  }

  @Delete(":id")
  async deleteTest(@CurrentUserId() userId: string, @Param("id", uuid()) id: string) {
    await this.service.deleteTest(userId, id);
    return { data: DELETED_RESPONSE };
  }
}
