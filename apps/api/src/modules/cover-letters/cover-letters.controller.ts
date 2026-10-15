import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { PremiumGuard } from "../ai/premium.guard";
import { CurrentUserId } from "../../common/current-user.decorator";
import { DELETED_RESPONSE } from "../../common/constants";
import { CoverLettersService } from "./cover-letters.service";
import {
  AiGenerateCoverLetterDto,
  CreateCoverLetterDto,
  RewriteDto,
  SuggestCoverLetterDto,
  UpdateCoverLetterDto,
} from "./cover-letters.dto";

const uuid = () => new ParseUUIDPipe({ version: "4" });

@ApiTags("cover-letters")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("cover-letters")
export class CoverLettersController {
  constructor(private readonly service: CoverLettersService) {}

  /** `?summary=1` returns `{ id, title, jobId, updatedAt }` rows without bodies. */
  @Get()
  @ApiQuery({ name: "summary", required: false, enum: ["1", "true"] })
  async findAll(@CurrentUserId() userId: string, @Query("summary") summary?: string) {
    const data =
      summary === "1" || summary === "true"
        ? await this.service.findSummaries(userId)
        : await this.service.findAll(userId);
    return { data };
  }

  @Post()
  async create(@CurrentUserId() userId: string, @Body() dto: CreateCoverLetterDto) {
    const data = await this.service.create(userId, dto);
    return { data };
  }

  @Patch(":id")
  async update(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: UpdateCoverLetterDto,
  ) {
    const data = await this.service.update(userId, id, dto);
    return { data };
  }

  @Delete(":id")
  async delete(@CurrentUserId() userId: string, @Param("id", uuid()) id: string) {
    await this.service.delete(userId, id);
    return { data: DELETED_RESPONSE };
  }

  @Post(":id/suggest")
  @UseGuards(PremiumGuard)
  async suggest(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: SuggestCoverLetterDto,
  ) {
    const data = await this.service.suggest(userId, id, dto);
    return { data };
  }

  @Post(":id/rewrite")
  @UseGuards(PremiumGuard)
  async rewrite(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: RewriteDto,
  ) {
    const data = await this.service.rewrite(userId, id, dto);
    return { data };
  }

  @Post(":id/ai-generate")
  @UseGuards(PremiumGuard)
  async aiGenerate(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: AiGenerateCoverLetterDto,
  ) {
    const data = await this.service.aiGenerate(userId, id, dto);
    return { data };
  }
}
