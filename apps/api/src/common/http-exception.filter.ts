import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object" && res !== null) {
        const body = res as Record<string, unknown>;
        message = (body.message as string) ?? message;
        details = body.details;
      }
    } else {
      this.logger.error(
        "Unhandled exception",
        exception instanceof Error ? exception.stack : String(exception)
      );
    }

    response.status(status).json({
      code: status,
      message: Array.isArray(message) ? message.join(", ") : message,
      ...(details !== undefined && { details }),
      timestamp: new Date().toISOString(),
    });
  }
}
