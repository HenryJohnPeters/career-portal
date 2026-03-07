import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { PremiumGuard } from "../ai/premium.guard";
import { CoverLettersService } from "./cover-letters.service";
import {
  CreateCoverLetterDto,
  UpdateCoverLetterDto,
  RewriteDto,
  AiGenerateCoverLetterDto,
} from "./cover-letters.dto";
import { CurrentUserId } from "../../common/current-user.decorator";
import { DELETED_RESPONSE } from "../../common/constants";

@ApiTags("cover-letters")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("cover-letters")
export class CoverLettersController {
  constructor(private readonly service: CoverLettersService) {}

  @Get()
  async findAll(@CurrentUserId() userId: string) {
    const data = await this.service.findAll(userId);
    return { data };
  }

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateCoverLetterDto
  ) {
    const data = await this.service.create(userId, dto);
    return { data };
  }

  @Patch(":id")
  async update(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateCoverLetterDto
  ) {
    const data = await this.service.update(userId, id, dto);
    return { data };
  }

  @Delete(":id")
  async delete(@CurrentUserId() userId: string, @Param("id") id: string) {
    await this.service.delete(userId, id);
    return { data: DELETED_RESPONSE };
  }

  @Post(":id/suggest")
  @UseGuards(PremiumGuard)
  async suggest(@CurrentUserId() userId: string, @Param("id") id: string) {
    const data = await this.service.suggest(userId, id);
    return { data };
  }

  @Post(":id/rewrite")
  @UseGuards(PremiumGuard)
  async rewrite(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: RewriteDto
  ) {
    const data = await this.service.rewrite(userId, id, dto.tone);
    return { data };
  }

  @Post(":id/ai-generate")
  @UseGuards(PremiumGuard)
  async aiGenerate(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: AiGenerateCoverLetterDto
  ) {
    const data = await this.service.aiGenerate(userId, id, dto);
    return { data };
  }
}
