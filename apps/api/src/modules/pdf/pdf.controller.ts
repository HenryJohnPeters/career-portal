import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUserId } from "../../common/current-user.decorator";
import { PdfService, type PdfDocument } from "./pdf.service";
import { contentDisposition } from "./pdf-filename";

const uuid = () => new ParseUUIDPipe({ version: "4" });
const optionalUuid = () => new ParseUUIDPipe({ version: "4", optional: true });

/** PDF renders drive a headless browser; previews are plain string rendering. */
const PDF_THROTTLE = { default: { limit: 20, ttl: 60_000 } };

/**
 * The preview is self-contained HTML (photo inlined, no scripts). If it is
 * ever opened directly, nothing in it may run or load except fonts.
 */
const PREVIEW_CSP = [
  "default-src 'none'",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src data:",
  "sandbox",
].join("; ");

function sendHtml(res: Response, html: string): void {
  res.set({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Security-Policy": PREVIEW_CSP,
  });
  res.send(html);
}

function sendPdf(res: Response, doc: PdfDocument, download: string | undefined): void {
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": contentDisposition(
      download === "1" ? "attachment" : "inline",
      doc.filename,
    ),
    "Content-Length": String(doc.buffer.length),
    "Cache-Control": "private, no-store",
    "X-Cache": doc.cacheHit ? "HIT" : "MISS",
  });
  res.end(doc.buffer);
}

@ApiTags("pdf")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("pdf")
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get("cv/:cvVersionId/html")
  async getCvHtmlPreview(
    @CurrentUserId() userId: string,
    @Param("cvVersionId", uuid()) cvVersionId: string,
    @Res() res: Response,
  ) {
    sendHtml(res, await this.pdfService.getCvHtml(userId, cvVersionId));
  }

  @Get("cv/:cvVersionId")
  @Throttle(PDF_THROTTLE)
  @ApiQuery({ name: "download", required: false, enum: ["1"] })
  async getCvPdf(
    @CurrentUserId() userId: string,
    @Param("cvVersionId", uuid()) cvVersionId: string,
    @Query("download") download: string | undefined,
    @Res() res: Response,
  ) {
    sendPdf(res, await this.pdfService.getCvPdf(userId, cvVersionId), download);
  }

  @Get("cover-letter/:coverLetterId/html")
  @ApiQuery({ name: "cvVersionId", required: false })
  async getCoverLetterHtmlPreview(
    @CurrentUserId() userId: string,
    @Param("coverLetterId", uuid()) coverLetterId: string,
    @Query("cvVersionId", optionalUuid()) cvVersionId: string | undefined,
    @Res() res: Response,
  ) {
    sendHtml(
      res,
      await this.pdfService.getCoverLetterHtml(userId, coverLetterId, cvVersionId),
    );
  }

  @Get("cover-letter/:coverLetterId")
  @Throttle(PDF_THROTTLE)
  @ApiQuery({ name: "cvVersionId", required: false })
  @ApiQuery({ name: "download", required: false, enum: ["1"] })
  async getCoverLetterPdf(
    @CurrentUserId() userId: string,
    @Param("coverLetterId", uuid()) coverLetterId: string,
    @Query("cvVersionId", optionalUuid()) cvVersionId: string | undefined,
    @Query("download") download: string | undefined,
    @Res() res: Response,
  ) {
    sendPdf(
      res,
      await this.pdfService.getCoverLetterPdf(userId, coverLetterId, cvVersionId),
      download,
    );
  }
}
