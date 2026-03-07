import { Module } from "@nestjs/common";
import { TechnicalTestsController } from "./technical-tests.controller";
import { TechnicalTestsService } from "./technical-tests.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [TechnicalTestsController],
  providers: [TechnicalTestsService],
})
export class TechnicalTestsModule {}
