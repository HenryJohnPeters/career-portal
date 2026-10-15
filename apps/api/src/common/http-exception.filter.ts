import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import type { ApiErrorDetails } from "./errors";

interface ErrorResolution {
  status: number;
  message: string;
  details?: ApiErrorDetails;
  /** Log line for this error; omitted for ordinary client errors. */
  log?: { level: "warn" | "error"; text: string; stack?: string };
}

/** Prisma errors that are client-visible conditions rather than bugs. */
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> =
  {
    P2002: { status: HttpStatus.CONFLICT, message: "Already exists" },
    P2025: { status: HttpStatus.NOT_FOUND, message: "Not found" },
    P2034: { status: HttpStatus.CONFLICT, message: "Conflict, please retry" },
    P2028: { status: HttpStatus.CONFLICT, message: "Conflict, please retry" },
  };

const UNSUPPORTED_TEXT = {
  status: HttpStatus.BAD_REQUEST,
  message: "Text contains unsupported characters",
};
const CONFLICT_RETRY = { status: HttpStatus.CONFLICT, message: "Conflict, please retry" };

/**
 * Postgres errors Prisma does not map to a P-code (it reports them as unknown
 * request errors, or P2010 for raw queries) that are client conditions.
 * The JSON body reviver strips NULs, so the text codes are a backstop.
 */
const POSTGRES_ERROR_MAP: Record<string, { status: number; message: string }> = {
  "22021": UNSUPPORTED_TEXT, // NUL byte in a text column
  "22P05": UNSUPPORTED_TEXT, // \u0000 in a jsonb value
  "40P01": CONFLICT_RETRY, // deadlock detected
  "40001": CONFLICT_RETRY, // serialization failure
};

/** The SQLSTATE in a Prisma error message (`code: "22021"` or ``Code: `22P05` ``). */
function postgresCodeOf(message: string): string | undefined {
  return /\bcode: (?:"|`)([0-9A-Z]{5})(?:"|`)/i.exec(message)?.[1];
}

/** Errors from Express middleware (body-parser etc.) carry an http-errors status. */
interface HttpLikeError {
  status?: number;
  statusCode?: number;
  expose?: boolean;
  type?: string;
  message?: string;
}

/**
 * Global error serialiser. Body shape: `{ code, message, details?, timestamp }`.
 * 5xx responses never carry internals (stack, SQL, upstream errors); those go
 * to the log with the method and route only (never request bodies).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const resolved = this.resolve(exception, response);
    if (resolved.log) {
      const where = `${request.method} ${routeOf(request)}`;
      if (resolved.log.level === "error") {
        this.logger.error(`${resolved.log.text} on ${where}`, resolved.log.stack);
      } else {
        this.logger.warn(`${resolved.log.text} on ${where}`);
      }
    }

    if (response.headersSent) return;

    const retryAfter =
      resolved.details && "retryAfterSeconds" in resolved.details
        ? resolved.details.retryAfterSeconds
        : undefined;
    if (retryAfter !== undefined) {
      response.setHeader("Retry-After", String(retryAfter));
    }

    response.status(resolved.status).json({
      code: resolved.status,
      message: resolved.message,
      ...(resolved.details !== undefined && { details: resolved.details }),
      timestamp: new Date().toISOString(),
    });
  }

  private resolve(exception: unknown, response: Response): ErrorResolution {
    if (exception instanceof ThrottlerException) {
      const retryAfterSeconds = throttlerRetryAfter(response);
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: "Too many requests. Please slow down and try again shortly.",
        ...(retryAfterSeconds !== undefined && {
          details: { reason: "cooldown", retryAfterSeconds },
        }),
      };
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    if (
      exception instanceof Prisma.PrismaClientUnknownRequestError ||
      (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === "P2010")
    ) {
      const code = postgresCodeOf(exception.message);
      const mapped = code ? POSTGRES_ERROR_MAP[code] : undefined;
      if (mapped) {
        return { ...mapped, log: { level: "warn", text: `Postgres ${code}` } };
      }
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR_MAP[exception.code];
      if (mapped) {
        return {
          ...mapped,
          log: { level: "warn", text: `Prisma ${exception.code}` },
        };
      }
      return internalError(`Prisma ${exception.code}`, exception.stack);
    }

    const httpLike = asHttpLikeError(exception);
    if (httpLike) return httpLike;

    return internalError(
      "Unhandled exception",
      exception instanceof Error ? exception.stack : String(exception),
    );
  }

  private fromHttpException(exception: HttpException): ErrorResolution {
    const status = exception.getStatus();
    const res = exception.getResponse();
    let message: string = exception.message;
    let details: ApiErrorDetails | undefined;

    if (typeof res === "string") {
      message = res;
    } else if (typeof res === "object" && res !== null) {
      const body = res as { message?: unknown; details?: unknown };
      if (Array.isArray(body.message)) message = body.message.join(", ");
      else if (typeof body.message === "string") message = body.message;
      if (body.details !== undefined) {
        details = body.details as ApiErrorDetails;
      }
    }

    if (status >= 500) {
      // Thrown deliberately with a user-facing message; details stay server-side.
      // A wrapped Error (e.g. `new InternalServerErrorException(err)`) is never echoed.
      return {
        status,
        message: res instanceof Error ? "Internal server error" : message,
        log: {
          level: "error",
          text: `${exception.name} (${status}): ${message}`,
          stack: exception.stack,
        },
      };
    }
    return { status, message, details };
  }
}

function internalError(text: string, stack?: string): ErrorResolution {
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: "Internal server error",
    log: { level: "error", text, stack },
  };
}

/** body-parser and other http-errors: honour 4xx, keep 5xx generic. */
function asHttpLikeError(exception: unknown): ErrorResolution | null {
  if (typeof exception !== "object" || exception === null) return null;
  const e = exception as HttpLikeError;
  const status = e.status ?? e.statusCode;
  if (!Number.isInteger(status) || status! < 400 || status! >= 500) return null;

  let message: string;
  if (status === HttpStatus.PAYLOAD_TOO_LARGE) message = "Request is too large";
  else if (e.type === "entity.parse.failed") message = "Malformed JSON body";
  else if (e.expose && typeof e.message === "string") message = e.message;
  else message = "Bad request";

  return {
    status: status!,
    message,
    log: { level: "warn", text: `${status} ${e.type ?? "client error"}` },
  };
}

/** @nestjs/throttler sets `Retry-After-<name>` headers before throwing. */
function throttlerRetryAfter(response: Response): number | undefined {
  let max: number | undefined;
  for (const [name, value] of Object.entries(response.getHeaders())) {
    if (!name.startsWith("retry-after")) continue;
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds > 0) {
      max = Math.max(max ?? 0, Math.ceil(seconds));
    }
  }
  return max;
}

/** Route pattern (e.g. `/cv/versions/:id`) when matched, else the path without query. */
function routeOf(request: Request): string {
  const pattern = (request.route as { path?: unknown } | undefined)?.path;
  return typeof pattern === "string" ? pattern : request.path;
}
