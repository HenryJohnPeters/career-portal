import { Controller, Get, Param, Query, Res, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { PdfService } from "./pdf.service";
import { AuthGuard } from "../modules/auth/auth.guard";

@ApiTags("pdf")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("pdf")
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get("cv/:cvVersionId/html")
  async getCvHtmlPreview(
    @Param("cvVersionId") cvVersionId: string,
    @Res() res: Response
  ) {
    const html = await this.pdfService.generateCvHtml(cvVersionId);
    res.set({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    });
    res.send(html);
  }

  @Get("cv/:cvVersionId")
  async getCvPdf(
    @Param("cvVersionId") cvVersionId: string,
    @Query("download") download: string,
    @Res() res: Response
  ) {
    const { buffer, cacheHit } = await this.pdfService.generateCvPdf(
      cvVersionId
    );

    const disposition = download === "1" ? "attachment" : "inline";

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="cv-${cvVersionId}.pdf"`,
      "Content-Length": buffer.length,
      "X-Cache": cacheHit ? "HIT" : "MISS",
    });

    res.end(buffer);
  }
}
