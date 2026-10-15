import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Readable } from "node:stream";
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
  private readonly logger = new Logger(AccountController.name);

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

  /** JSON download of all the user's data, streamed in bounded pages. */
  @Get("export")
  @Throttle(ACCOUNT_ACTION_THROTTLE)
  async export(@CurrentUserId() userId: string): Promise<StreamableFile> {
    const now = new Date();
    const chunks = await this.exportService.openExport(userId, now);
    return new StreamableFile(Readable.from(chunks), {
      type: "application/json; charset=utf-8",
      disposition: `attachment; filename="${exportFilename(now)}"`,
    })
      .setErrorHandler((_err, res) => {
        // Once the download has started the response is aborted, never left
        // as a truncated file that looks complete; before that, a bare 500.
        if (res.destroyed || res.headersSent) return;
        res.statusCode = 500;
        res.end();
      })
      .setErrorLogger((err) => {
        // The client going away mid-download is not a server error.
        if ((err as NodeJS.ErrnoException).code === "ERR_STREAM_PREMATURE_CLOSE") return;
        this.logger.error(`Account export failed: ${err.name}`, err.stack);
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
