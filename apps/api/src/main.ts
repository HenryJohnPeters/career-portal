import "reflect-metadata";
import { BadRequestException, Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import type { Server } from "node:http";
import { AppModule } from "./app.module";
import {
  corsAllowedOrigins,
  isCorsOriginAllowed,
  type EnvConfig,
} from "./common/env.config";

/** The largest legitimate body (a 30-section CV apply) is well under this. */
const JSON_BODY_LIMIT = "1mb";
/**
 * Longer than the edge proxy's idle timeout, so the proxy never reuses a
 * keep-alive socket Node has just closed (which surfaces as random 502s).
 */
const KEEP_ALIVE_TIMEOUT_MS = 65_000;
/** Distinct blocked origins logged per process (each once). */
const MAX_REPORTED_CORS_ORIGINS = 100;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Stripe webhook signatures are computed over the exact raw body.
    rawBody: true,
  });
  const logger = new Logger("Bootstrap");
  const config = app.get(ConfigService<EnvConfig, true>);
  const isProduction = config.get("NODE_ENV", { infer: true }) === "production";

  // req.ip = the real client behind Railway's proxy (rate limiting keys on it).
  // A hop count, never `true`: the left-most X-Forwarded-For is client-controlled.
  app.set("trust proxy", config.get("TRUST_PROXY_HOPS", { infer: true }));

  app.use(
    helmet({
      // JSON API: nothing it serves should ever run script or be framed.
      // Development keeps helmet's default CSP so Swagger UI at /docs works.
      contentSecurityPolicy: isProduction
        ? {
            useDefaults: false,
            directives: {
              defaultSrc: ["'none'"],
              frameAncestors: ["'none'"],
              baseUri: ["'none'"],
              formAction: ["'none'"],
            },
          }
        : undefined,
      frameguard: { action: "deny" },
    }),
  );

  // Responses are per-user; keep them out of browser and proxy caches.
  // Handlers that set their own Cache-Control (e.g. PDFs) override this.
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  const allowedOrigins = corsAllowedOrigins({
    CLIENT_URL: config.get("CLIENT_URL", { infer: true }),
    CORS_ORIGINS: config.get("CORS_ORIGINS", { infer: true }),
    NODE_ENV: config.get("NODE_ENV", { infer: true }),
  });
  const reportedOrigins = new Set<string>();
  app.enableCors({
    // Requests without an Origin (Stripe, health checks, cron) and unknown
    // origins simply get no CORS headers; neither is ever turned into an error.
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowed = isCorsOriginAllowed(origin, allowedOrigins);
      if (
        origin &&
        !allowed &&
        !reportedOrigins.has(origin) &&
        reportedOrigins.size < MAX_REPORTED_CORS_ORIGINS
      ) {
        reportedOrigins.add(origin);
        logger.warn(`CORS: origin not allowed: ${origin.slice(0, 200)}`);
      }
      callback(null, allowed);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    // The web app reads download filenames and rate-limit back-off.
    exposedHeaders: ["Content-Disposition", "Retry-After"],
    maxAge: 3600,
  });
  logger.log(`Allowed CORS origins: ${[...allowedOrigins].join(", ")}`);

  // After CORS, so body errors (413, malformed JSON) stay readable cross-origin.
  app.useBodyParser("json", { limit: JSON_BODY_LIMIT });
  app.use(
    (err: unknown, _req: Request, _res: Response, next: NextFunction) => {
      const isParseError =
        (err as { type?: unknown } | null)?.type === "entity.parse.failed";
      next(isParseError ? new BadRequestException("Malformed JSON body") : err);
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Career Portal API")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  // SIGTERM (redeploys): stop accepting connections, let in-flight requests
  // finish, then close Prisma and the PDF browser.
  app.enableShutdownHooks();

  const server = app.getHttpServer() as Server;
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  server.headersTimeout = KEEP_ALIVE_TIMEOUT_MS + 1_000;

  const port = config.get("PORT", { infer: true });
  await app.listen(port);
  logger.log(`API listening on port ${port}`);
}

bootstrap().catch((error: unknown) => {
  // Env validation messages name the variables, never their values.
  console.error("Failed to start the API:", error);
  process.exit(1);
});
