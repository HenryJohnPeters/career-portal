import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AuthGuard } from "../auth/auth.guard";
import { PremiumGuard } from "../ai/premium.guard";
import { CurrentUserId } from "../../common/current-user.decorator";
import { DELETED_RESPONSE } from "../../common/constants";
import { JobsService } from "./jobs.service";
import { JobsAiService } from "./jobs-ai.service";
import {
  AnalyzeJobDto,
  CreateJobDto,
  MatchJobDto,
  MatchTextDto,
  TailorApplicationDto,
  UpdateJobDto,
} from "./jobs.dto";

const uuid = () => new ParseUUIDPipe({ version: "4" });

/** The keyword match is CPU-only but not free: keep scripted loops in check. */
const MATCH_THROTTLE = { default: { limit: 30, ttl: 60_000 } };
const TAILOR_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@ApiTags("jobs")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("jobs")
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobsAi: JobsAiService,
  ) {}

  // Static paths are declared before ":id" so they are matched first.

  @Get()
  @ApiOperation({ summary: "List jobs (newest activity first, without job descriptions)" })
  async findAll(@CurrentUserId() userId: string) {
    const data = await this.jobsService.findAll(userId);
    return { data };
  }

  @Get("insights")
  @ApiOperation({ summary: "Application funnel and weekly volume; per-CV breakdown is Premium" })
  async insights(@CurrentUserId() userId: string) {
    const data = await this.jobsService.insights(userId);
    return { data };
  }

  @Post()
  async create(@CurrentUserId() userId: string, @Body() dto: CreateJobDto) {
    const data = await this.jobsService.create(userId, dto);
    return { data };
  }

  @Post("match-text")
  @Throttle(MATCH_THROTTLE)
  @ApiOperation({ summary: "Keyword match of a CV against pasted text (not saved)" })
  async matchText(@CurrentUserId() userId: string, @Body() dto: MatchTextDto) {
    const data = await this.jobsService.matchText(userId, dto);
    return { data };
  }

  @Post("analyze")
  @UseGuards(PremiumGuard)
  @ApiOperation({ summary: "AI extraction of job details from a job advert (1 AI action)" })
  async analyze(@CurrentUserId() userId: string, @Body() dto: AnalyzeJobDto) {
    const data = await this.jobsAi.analyze(userId, dto.jobDescription);
    return { data };
  }

  @Get(":id")
  async findOne(@CurrentUserId() userId: string, @Param("id", uuid()) id: string) {
    const data = await this.jobsService.findOne(userId, id);
    return { data };
  }

  @Patch(":id")
  async update(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: UpdateJobDto,
  ) {
    const data = await this.jobsService.update(userId, id, dto);
    return { data };
  }

  @Delete(":id")
  async remove(@CurrentUserId() userId: string, @Param("id", uuid()) id: string) {
    await this.jobsService.remove(userId, id);
    return { data: DELETED_RESPONSE };
  }

  @Post(":id/match")
  @Throttle(MATCH_THROTTLE)
  @ApiOperation({ summary: "Keyword match of a CV against the job's description (score saved)" })
  async match(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: MatchJobDto,
  ) {
    const data = await this.jobsService.match(userId, id, dto);
    return { data };
  }

  @Post(":id/tailor")
  @Throttle(TAILOR_THROTTLE)
  @ApiOperation({ summary: "Premium: tailored CV version and optional cover letter for this job" })
  async tailor(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: TailorApplicationDto,
  ) {
    const data = await this.jobsAi.tailor(userId, id, dto);
    return { data };
  }
}
