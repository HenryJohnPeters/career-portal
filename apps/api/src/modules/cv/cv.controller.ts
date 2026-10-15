import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { PremiumGuard } from "../ai/premium.guard";
import { CvService } from "./cv.service";
import { CvSectionsService } from "./cv-sections.service";
import {
  CreateCvVersionDto,
  UpdateCvVersionDto,
  CreateCvSectionDto,
  UpdateCvSectionDto,
  MoveSectionDto,
  ReorderSectionsDto,
  ApplyCvContentDto,
  AiGenerateCvSectionDto,
  AiGenerateFullCvDto,
} from "./cv.dto";
import { CurrentUserId } from "../../common/current-user.decorator";
import { DELETED_RESPONSE } from "../../common/constants";

const uuid = () => new ParseUUIDPipe({ version: "4" });

@ApiTags("cv")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("cv")
export class CvController {
  constructor(
    private readonly cvService: CvService,
    private readonly sections: CvSectionsService,
  ) {}

  /* ── Versions ───────────────────────────────────────────────────── */

  @Get("versions")
  async getVersions(@CurrentUserId() userId: string) {
    const data = await this.cvService.getVersions(userId);
    return { data };
  }

  @Post("versions")
  async createVersion(
    @CurrentUserId() userId: string,
    @Body() dto: CreateCvVersionDto,
  ) {
    const data = await this.cvService.createVersion(userId, dto.title);
    return { data };
  }

  @Patch("versions/:id")
  async updateVersion(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: UpdateCvVersionDto,
  ) {
    const data = await this.cvService.updateVersion(userId, id, dto);
    return { data };
  }

  @Delete("versions/:id")
  async deleteVersion(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
  ) {
    await this.cvService.deleteVersion(userId, id);
    return { data: DELETED_RESPONSE };
  }

  @Post("versions/:id/duplicate")
  async duplicateVersion(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
  ) {
    const data = await this.cvService.duplicateVersion(userId, id);
    return { data };
  }

  /** Replaces contact + all sections at once; the previous content becomes the undo snapshot. */
  @Put("versions/:id/content")
  async applyContent(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: ApplyCvContentDto,
  ) {
    const data = await this.cvService.applyContent(userId, id, dto);
    return { data };
  }

  @Post("versions/:id/restore-snapshot")
  async restoreSnapshot(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
  ) {
    const data = await this.cvService.restoreSnapshot(userId, id);
    return { data };
  }

  @Post("versions/:id/ai-generate-full")
  @UseGuards(PremiumGuard)
  async aiGenerateFullCv(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: AiGenerateFullCvDto,
  ) {
    const data = await this.cvService.aiGenerateFullCv(userId, id, dto);
    return { data };
  }

  /* ── Sections ───────────────────────────────────────────────────── */

  @Get("versions/:id/sections")
  async getSections(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
  ) {
    const data = await this.sections.getSections(userId, id);
    return { data };
  }

  @Post("versions/:id/sections")
  async createSection(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: CreateCvSectionDto,
  ) {
    const data = await this.sections.createSection(userId, id, dto);
    return { data };
  }

  @Post("versions/:id/sections/reorder")
  async reorderSections(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: ReorderSectionsDto,
  ) {
    const data = await this.sections.reorderSections(userId, id, dto.sectionIds);
    return { data };
  }

  @Patch("sections/:id")
  async updateSection(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: UpdateCvSectionDto,
  ) {
    const data = await this.sections.updateSection(userId, id, dto);
    return { data };
  }

  @Delete("sections/:id")
  async deleteSection(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
  ) {
    await this.sections.deleteSection(userId, id);
    return { data: DELETED_RESPONSE };
  }

  @Post("sections/:id/move")
  async moveSection(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: MoveSectionDto,
  ) {
    const data = await this.sections.moveSection(userId, id, dto.direction);
    return { data };
  }

  @Post("sections/:id/ai-generate")
  @UseGuards(PremiumGuard)
  async aiGenerateSection(
    @CurrentUserId() userId: string,
    @Param("id", uuid()) id: string,
    @Body() dto: AiGenerateCvSectionDto,
  ) {
    const data = await this.cvService.aiGenerateSection(userId, id, dto);
    return { data };
  }
}
