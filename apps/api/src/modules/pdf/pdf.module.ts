import { Module } from "@nestjs/common";
import { PdfController } from "./pdf.controller";
import { PdfService } from "./pdf.service";
import { CvModule } from "../cv/cv.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [CvModule, AuthModule],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}
