import { Module } from "@nestjs/common";
import { PdfController } from "./pdf.controller";
import { PdfService } from "./pdf.service";
import { CvModule } from "../modules/cv/cv.module";
import { AuthModule } from "../modules/auth/auth.module";

@Module({
  imports: [CvModule, AuthModule],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}
