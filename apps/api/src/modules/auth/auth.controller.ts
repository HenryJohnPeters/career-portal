import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUserId } from "../../common/current-user.decorator";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly entitlements: EntitlementsService,
  ) {}

  @Get("me")
  async me(@CurrentUserId() userId: string) {
    return { data: await this.authService.getProfile(userId) };
  }

  /** Legacy AI usage shape; the web now reads GET /account/usage. */
  @Get("ai-usage")
  async aiUsageStatus(@CurrentUserId() userId: string) {
    return { data: await this.entitlements.getLegacyAiUsageStatus(userId) };
  }
}
