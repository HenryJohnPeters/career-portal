// Only load dotenv in development (Railway injects env vars in production)
if (process.env.NODE_ENV !== "production") {
  require("dotenv/config");
}
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { Logger, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import type { EnvConfig } from "./common/env.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = new Logger("Bootstrap");
  const config = app.get(ConfigService<EnvConfig, true>);

  // Allow multiple origins for CORS
  const allowedOrigins = [
    config.get("CLIENT_URL"),
    "https://web-production-aac8a.up.railway.app",
    "http://localhost:4200",
  ].filter(Boolean);

  logger.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Swagger in dev only
  if (config.get("NODE_ENV") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Career Portal API")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, doc);
  }

  const port = config.get("PORT");
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}`);
}

bootstrap();
