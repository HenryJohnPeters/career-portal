import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CurrentUserId } from "../../common/current-user.decorator";
import { ACCOUNT_ACTION_THROTTLE } from "../../common/throttler.config";
import { AuthGuard } from "../auth/auth.guard";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { DeleteAccountDto, UpdateProfileDto } from "./account.dto";
import {
  AccountExportService,
  exportFilename,
} from "./account-export.service";
import { AccountService } from "./account.service";

@ApiTags("account")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("account")
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly exportService: AccountExportService,
    private readonly entitlements: EntitlementsService,
  ) {}

  /** Every quota meter, fair-use status and premium feature flag (PLAN §2.2). */
  @Get("usage")
  async usage(@CurrentUserId() userId: string) {
    return { data: await this.entitlements.getPlanUsage(userId) };
  }

  @Patch("profile")
  async updateProfile(
    @CurrentUserId() userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return { data: await this.accountService.updateProfile(userId, dto.name) };
  }

  @Post("onboarding/dismiss")
  @HttpCode(200)
  async dismissOnboarding(@CurrentUserId() userId: string) {
    return { data: await this.accountService.dismissOnboarding(userId) };
  }

  /** JSON download of all the user's data. */
  @Get("export")
  @Throttle(ACCOUNT_ACTION_THROTTLE)
  async export(@CurrentUserId() userId: string): Promise<StreamableFile> {
    const now = new Date();
    const data = await this.exportService.buildExport(userId, now);
    const body = Buffer.from(JSON.stringify(data, null, 2), "utf8");
    return new StreamableFile(body, {
      type: "application/json; charset=utf-8",
      disposition: `attachment; filename="${exportFilename(now)}"`,
      length: body.length,
    });
  }

  /** Body `{ confirmEmail }`; cancels billing, deletes all data and the sign-in identity. */
  @Delete()
  @Throttle(ACCOUNT_ACTION_THROTTLE)
  async deleteAccount(
    @CurrentUserId() userId: string,
    @Body() dto: DeleteAccountDto,
  ) {
    return {
      data: await this.accountService.deleteAccount(userId, dto.confirmEmail),
    };
  }
}
