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
import { CvService } from "./cv.service";
import {
  CreateCvVersionDto,
  UpdateCvVersionDto,
  CreateCvSectionDto,
  UpdateCvSectionDto,
  MoveSectionDto,
  ReorderSectionsDto,
  AiGenerateCvSectionDto,
  AiGenerateFullCvDto,
} from "./cv.dto";
import { CurrentUserId } from "../../common/current-user.decorator";
import { DELETED_RESPONSE } from "../../common/constants";

@ApiTags("cv")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("cv")
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Get("versions")
  async getVersions(@CurrentUserId() userId: string) {
    const data = await this.cvService.getVersions(userId);
    return { data };
  }

  @Post("versions")
  async createVersion(
    @CurrentUserId() userId: string,
    @Body() dto: CreateCvVersionDto
  ) {
    const data = await this.cvService.createVersion(userId, dto.title);
    return { data };
  }

  @Patch("versions/:id")
  async updateVersion(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateCvVersionDto
  ) {
    const data = await this.cvService.updateVersion(userId, id, dto);
    return { data };
  }

  @Delete("versions/:id")
  async deleteVersion(
    @CurrentUserId() userId: string,
    @Param("id") id: string
  ) {
    await this.cvService.deleteVersion(userId, id);
    return { data: DELETED_RESPONSE };
  }

  @Post("versions/:id/duplicate")
  async duplicateVersion(
    @CurrentUserId() userId: string,
    @Param("id") id: string
  ) {
    const data = await this.cvService.duplicateVersion(userId, id);
    return { data };
  }

  @Post("versions/:id/ai-generate-full")
  @UseGuards(PremiumGuard)
  async aiGenerateFullCv(
    @CurrentUserId() userId: string,
    @Param("id") _id: string,
    @Body() dto: AiGenerateFullCvDto
  ) {
    const data = await this.cvService.aiGenerateFullCv(userId, dto);
    return { data };
  }

  @Get("versions/:id/sections")
  async getSections(@CurrentUserId() userId: string, @Param("id") id: string) {
    const data = await this.cvService.getSections(userId, id);
    return { data };
  }

  @Post("versions/:id/sections")
  async createSection(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: CreateCvSectionDto
  ) {
    const data = await this.cvService.createSection(
      userId,
      id,
      dto.title,
      dto.content,
      dto.sectionType
    );
    return { data };
  }

  @Post("versions/:id/sections/reorder")
  async reorderSections(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: ReorderSectionsDto
  ) {
    const data = await this.cvService.reorderSections(
      userId,
      id,
      dto.sectionIds
    );
    return { data };
  }

  @Patch("sections/:id")
  async updateSection(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateCvSectionDto
  ) {
    const data = await this.cvService.updateSection(userId, id, dto);
    return { data };
  }

  @Delete("sections/:id")
  async deleteSection(
    @CurrentUserId() userId: string,
    @Param("id") id: string
  ) {
    await this.cvService.deleteSection(userId, id);
    return { data: DELETED_RESPONSE };
  }

  @Post("sections/:id/move")
  async moveSection(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: MoveSectionDto
  ) {
    const data = await this.cvService.moveSection(userId, id, dto.direction);
    return { data };
  }

  @Post("sections/:id/ai-generate")
  @UseGuards(PremiumGuard)
  async aiGenerateSection(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: AiGenerateCvSectionDto
  ) {
    const data = await this.cvService.aiGenerateSection(userId, id, dto);
    return { data };
  }
}
