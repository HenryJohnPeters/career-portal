import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./auth.guard";
import { AiUsageService } from "../ai/ai-usage.service";
import { CurrentUserId } from "../../common/current-user.decorator";

@ApiTags("auth")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly aiUsage: AiUsageService
  ) {}

  @Get("me")
  async me(@CurrentUserId() userId: string) {
    const user = await this.authService.getUserById(userId);
    return { data: user };
  }

  @Get("ai-usage")
  async aiUsageStatus(@CurrentUserId() userId: string) {
    const status = await this.aiUsage.getUsageStatus(userId);
    return { data: status };
  }
}
