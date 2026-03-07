import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { TechnicalTestsService } from "./technical-tests.service";
import {
  CreateTechnicalTestDto,
  SubmitTechnicalTestDto,
} from "./technical-tests.dto";
import { CurrentUserId } from "../../common/current-user.decorator";
import { DELETED_RESPONSE } from "../../common/constants";

@ApiTags("technical-tests")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("technical-tests")
export class TechnicalTestsController {
  constructor(private readonly service: TechnicalTestsService) {}

  @Get()
  async getTests(@CurrentUserId() userId: string) {
    const data = await this.service.getTests(userId);
    return { data };
  }

  @Post()
  async createTest(
    @CurrentUserId() userId: string,
    @Body() dto: CreateTechnicalTestDto
  ) {
    const data = await this.service.createTest(userId, dto);
    return { data };
  }

  @Get(":id")
  async getTest(@CurrentUserId() userId: string, @Param("id") id: string) {
    const data = await this.service.getTest(userId, id);
    return { data };
  }

  @Post(":id/start")
  async startTest(@CurrentUserId() userId: string, @Param("id") id: string) {
    const data = await this.service.startTest(userId, id);
    return { data };
  }

  @Post(":id/submit")
  async submitTest(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: SubmitTechnicalTestDto
  ) {
    const data = await this.service.submitTest(userId, id, dto.submission);
    return { data };
  }

  @Delete(":id")
  async deleteTest(@CurrentUserId() userId: string, @Param("id") id: string) {
    await this.service.deleteTest(userId, id);
    return { data: DELETED_RESPONSE };
  }
}
