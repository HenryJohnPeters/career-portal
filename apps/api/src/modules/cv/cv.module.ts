import { Module } from "@nestjs/common";
import { CvController } from "./cv.controller";
import { CvService } from "./cv.service";
import { CvSectionsService } from "./cv-sections.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [CvController],
  providers: [CvService, CvSectionsService],
  exports: [CvService, CvSectionsService],
})
export class CvModule {}
