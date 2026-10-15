import { Module } from "@nestjs/common";
import { PdfController } from "./pdf.controller";
import { PdfService } from "./pdf.service";
import { PdfRenderer } from "./pdf-renderer";
import { PhotoService } from "./photo.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [PdfController],
  providers: [PdfService, PdfRenderer, PhotoService],
})
export class PdfModule {}
