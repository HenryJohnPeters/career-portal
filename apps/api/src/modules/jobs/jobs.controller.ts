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
import { JobsService } from "./jobs.service";
import { CreateJobDto, UpdateJobDto } from "./jobs.dto";
import { CurrentUserId } from "../../common/current-user.decorator";
import { DELETED_RESPONSE } from "../../common/constants";

@ApiTags("jobs")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async findAll(@CurrentUserId() userId: string) {
    const data = await this.jobsService.findAll(userId);
    return { data };
  }

  @Post()
  async create(@CurrentUserId() userId: string, @Body() dto: CreateJobDto) {
    const data = await this.jobsService.create(userId, dto);
    return { data };
  }

  @Patch(":id")
  async update(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateJobDto
  ) {
    const data = await this.jobsService.update(userId, id, dto);
    return { data };
  }

  @Delete(":id")
  async remove(@CurrentUserId() userId: string, @Param("id") id: string) {
    await this.jobsService.remove(userId, id);
    return { data: DELETED_RESPONSE };
  }
}
