import { Controller, Get, Param, Query, Res, UseGuards, ForbiddenException, NotFoundException } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { PdfService } from "./pdf.service";
import { AuthGuard } from "../modules/auth/auth.guard";
import { CurrentUserId } from "../common/current-user.decorator";
import { PrismaService } from "../common/prisma.service";

@ApiTags("pdf")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("pdf")
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  /** Verify the authenticated user owns the CV version */
  private async assertCvOwner(userId: string, cvVersionId: string): Promise<void> {
    const cv = await this.prisma.cvVersion.findUnique({
      where: { id: cvVersionId },
      select: { userId: true },
    });
    if (!cv) throw new NotFoundException("CV version not found");
    if (cv.userId !== userId) throw new ForbiddenException("Access denied");
  }

  @Get("cv/:cvVersionId/html")
  async getCvHtmlPreview(
    @CurrentUserId() userId: string,
    @Param("cvVersionId") cvVersionId: string,
    @Res() res: Response
  ) {
    await this.assertCvOwner(userId, cvVersionId);
    const html = await this.pdfService.generateCvHtml(cvVersionId);
    res.set({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    });
    res.send(html);
  }

  @Get("cv/:cvVersionId")
  async getCvPdf(
    @CurrentUserId() userId: string,
    @Param("cvVersionId") cvVersionId: string,
    @Query("download") download: string,
    @Res() res: Response
  ) {
    await this.assertCvOwner(userId, cvVersionId);
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
