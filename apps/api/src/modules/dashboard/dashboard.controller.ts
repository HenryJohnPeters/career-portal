import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { DashboardService } from "./dashboard.service";
import { CurrentUserId } from "../../common/current-user.decorator";

@ApiTags("dashboard")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  async summary(@CurrentUserId() userId: string) {
    const data = await this.dashboardService.getSummary(userId);
    return { data };
  }
}
