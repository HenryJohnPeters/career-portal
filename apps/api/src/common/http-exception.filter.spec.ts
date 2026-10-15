import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { Prisma } from "@prisma/client";
import { HttpExceptionFilter } from "./http-exception.filter";
import { FairUseLimitException, QuotaExceededException } from "./errors";

// Keep test output clean; assertions below check what is logged.
Logger.overrideLogger(false);

interface Captured {
  status?: number;
  body?: { code: number; message: string; details?: unknown };
  headers: Record<string, string>;
}

function run(exception: unknown, preset: Record<string, string> = {}) {
  const captured: Captured = { headers: { ...preset } };
  const response = {
    headersSent: false,
    getHeaders: () => ({ ...captured.headers }),
    setHeader: (name: string, value: string) => {
      captured.headers[name.toLowerCase()] = value;
    },
    status(code: number) {
      captured.status = code;
      return this;
    },
    json(payload: Captured["body"]) {
      captured.body = payload;
      return this;
    },
  };
  const request = {
    method: "POST",
    path: "/cv/versions/123",
    route: { path: "/cv/versions/:id" },
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  const filter = new HttpExceptionFilter();
  const logs: { level: string; message: string }[] = [];
  const logger = (filter as unknown as { logger: Logger }).logger;
  logger.error = ((message: string) => {
    logs.push({ level: "error", message });
  }) as Logger["error"];
  logger.warn = ((message: string) => {
    logs.push({ level: "warn", message });
  }) as Logger["warn"];

  filter.catch(exception, host);
  return { ...captured, logs };
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError(
    `Invalid prisma.cvVersion.update() invocation: secret SQL detail (${code})`,
    { code, clientVersion: "5.22.0", meta: { target: ["email"] } },
  );
}

describe("HttpExceptionFilter", () => {
  test("keeps the body shape for HttpExceptions", () => {
    const res = run(new NotFoundException("CV not found"));
    assert.equal(res.status, 404);
    assert.equal(res.body?.code, 404);
    assert.equal(res.body?.message, "CV not found");
    assert.equal(res.body?.details, undefined);
    assert.equal(typeof (res.body as { timestamp?: unknown }).timestamp, "string");
  });

  test("joins validation message arrays", () => {
    const res = run(new BadRequestException(["a is required", "b too long"]));
    assert.equal(res.status, 400);
    assert.equal(res.body?.message, "a is required, b too long");
  });

  test("passes quota details through", () => {
    const res = run(new QuotaExceededException("cvVersions", 2, 2, null));
    assert.equal(res.status, 403);
    assert.deepEqual(res.body?.details, {
      reason: "quota_exceeded",
      quota: "cvVersions",
      limit: 2,
      used: 2,
      resetsAt: null,
    });
    assert.equal(res.headers["retry-after"], undefined);
  });

  test("sets Retry-After from details.retryAfterSeconds", () => {
    const res = run(new FairUseLimitException(90));
    assert.equal(res.status, 429);
    assert.equal(res.headers["retry-after"], "90");
  });

  for (const [code, status, message] of [
    ["P2002", 409, "Already exists"],
    ["P2025", 404, "Not found"],
    ["P2034", 409, "Conflict, please retry"],
  ] as const) {
    test(`maps Prisma ${code} to ${status} without leaking internals`, () => {
      const res = run(prismaError(code));
      assert.equal(res.status, status);
      assert.equal(res.body?.message, message);
      assert.equal(res.body?.details, undefined);
      assert.ok(!JSON.stringify(res.body).includes("secret"));
    });
  }

  for (const [label, error, status, message] of [
    [
      "a NUL byte in text (22021)",
      new Prisma.PrismaClientUnknownRequestError(
        'Error occurred during query execution:\nConnectorError(ConnectorError { kind: QueryError(PostgresError { code: "22021", message: "invalid byte sequence for encoding \\"UTF8\\": 0x00" }) })',
        { clientVersion: "5.22.0" },
      ),
      400,
      "Text contains unsupported characters",
    ],
    [
      "a deadlock (40P01)",
      new Prisma.PrismaClientUnknownRequestError(
        'ConnectorError { kind: QueryError(PostgresError { code: "40P01", message: "deadlock detected" }) }',
        { clientVersion: "5.22.0" },
      ),
      409,
      "Conflict, please retry",
    ],
    [
      "a raw-query \\u0000 in jsonb (P2010 / 22P05)",
      new Prisma.PrismaClientKnownRequestError(
        "Raw query failed. Code: `22P05`. Message: `ERROR: unsupported Unicode escape sequence`",
        { code: "P2010", clientVersion: "5.22.0" },
      ),
      400,
      "Text contains unsupported characters",
    ],
  ] as const) {
    test(`maps ${label} to ${status} without leaking internals`, () => {
      const res = run(error);
      assert.equal(res.status, status);
      assert.equal(res.body?.message, message);
      assert.ok(!JSON.stringify(res.body).includes("Postgres"));
      assert.equal(res.logs[0].level, "warn");
    });
  }

  test("other unknown Prisma request errors stay generic 500s", () => {
    const res = run(
      new Prisma.PrismaClientUnknownRequestError(
        'PostgresError { code: "53300", message: "too many connections" }',
        { clientVersion: "5.22.0" },
      ),
    );
    assert.equal(res.status, 500);
    assert.equal(res.body?.message, "Internal server error");
    assert.equal(res.logs[0].level, "error");
  });

  test("unknown Prisma errors are generic 500s, logged with method and route", () => {
    const res = run(prismaError("P2003"));
    assert.equal(res.status, 500);
    assert.equal(res.body?.message, "Internal server error");
    assert.equal(res.logs.length, 1);
    assert.equal(res.logs[0].level, "error");
    assert.match(res.logs[0].message, /POST \/cv\/versions\/:id/);
  });

  test("unhandled errors never expose their message", () => {
    const res = run(new Error("connect ECONNREFUSED 10.0.0.5:5432"));
    assert.equal(res.status, 500);
    assert.equal(res.body?.message, "Internal server error");
    assert.ok(!JSON.stringify(res.body).includes("ECONNREFUSED"));
    assert.equal(res.logs[0].level, "error");
  });

  test("deliberate 5xx HttpExceptions keep their message but drop details", () => {
    const res = run(
      new ServiceUnavailableException({
        message: "AI service is temporarily unavailable",
        details: { internal: "upstream 503" },
      }),
    );
    assert.equal(res.status, 503);
    assert.equal(res.body?.message, "AI service is temporarily unavailable");
    assert.equal(res.body?.details, undefined);
  });

  test("honours http-errors client statuses (body too large)", () => {
    const err = Object.assign(new Error("request entity too large"), {
      status: 413,
      statusCode: 413,
      expose: true,
      type: "entity.too.large",
    });
    const res = run(err);
    assert.equal(res.status, 413);
    assert.equal(res.body?.message, "Request is too large");
    assert.equal(res.logs[0].level, "warn");
  });

  test("malformed JSON bodies are 400s", () => {
    const err = Object.assign(new SyntaxError("Unexpected token } in JSON"), {
      status: 400,
      expose: true,
      type: "entity.parse.failed",
    });
    const res = run(err);
    assert.equal(res.status, 400);
    assert.equal(res.body?.message, "Malformed JSON body");
  });

  test("throttling gets a friendly message and a standard Retry-After", () => {
    const res = run(new ThrottlerException(), { "retry-after-short": "1", "retry-after-long": "42" });
    assert.equal(res.status, 429);
    assert.doesNotMatch(res.body?.message ?? "", /ThrottlerException/);
    assert.equal(res.headers["retry-after"], "42");
    assert.deepEqual(res.body?.details, {
      reason: "cooldown",
      retryAfterSeconds: 42,
    });
  });
});
