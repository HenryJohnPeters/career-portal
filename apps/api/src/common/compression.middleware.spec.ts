import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { brotliDecompressSync, gunzipSync } from "node:zlib";
import express from "express";
import { chooseEncoding, responseCompression } from "./compression.middleware";

const BIG = { items: Array.from({ length: 200 }, (_, i) => ({ id: i, text: `item number ${i}` })) };

interface RawResponse {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
}

function get(port: number, path: string, headers: Record<string, string> = {}, method = "GET") {
  return new Promise<RawResponse>((resolve, reject) => {
    const req = httpRequest({ port, path, headers, method }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () =>
        resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }),
      );
    });
    req.on("error", reject);
    req.end();
  });
}

describe("responseCompression", () => {
  let server: Server;
  let port: number;

  before(async () => {
    const app = express();
    app.use(responseCompression());
    app.get("/big", (_req, res) => {
      res.json(BIG);
    });
    app.get("/small", (_req, res) => {
      res.json({ ok: true });
    });
    app.get("/error", (_req, res) => {
      res.status(404).json({ code: 404, message: "x".repeat(2000) });
    });
    app.get("/pdf", (_req, res) => {
      res.type("application/pdf").send(Buffer.alloc(5000, 1));
    });
    app.get("/html", (_req, res) => {
      res.type("html").send(`<p>${"preview ".repeat(500)}</p>`);
    });
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    port = (server.address() as AddressInfo).port;
  });

  after(() => new Promise<void>((resolve) => server.close(() => resolve())));

  test("brotli when accepted, with a correct length and Vary", async () => {
    const res = await get(port, "/big", { "accept-encoding": "gzip, deflate, br" });
    assert.equal(res.status, 200);
    assert.equal(res.headers["content-encoding"], "br");
    assert.match(String(res.headers.vary), /Accept-Encoding/i);
    assert.equal(Number(res.headers["content-length"]), res.body.length);
    assert.deepEqual(JSON.parse(brotliDecompressSync(res.body).toString("utf8")), BIG);
    assert.ok(res.body.length < JSON.stringify(BIG).length / 3);
  });

  test("gzip when brotli is not accepted", async () => {
    const res = await get(port, "/big", { "accept-encoding": "gzip" });
    assert.equal(res.headers["content-encoding"], "gzip");
    assert.match(String(res.headers["content-type"]), /application\/json/);
    assert.deepEqual(JSON.parse(gunzipSync(res.body).toString("utf8")), BIG);
  });

  test("error bodies keep their status", async () => {
    const res = await get(port, "/error", { "accept-encoding": "gzip" });
    assert.equal(res.status, 404);
    assert.equal(JSON.parse(gunzipSync(res.body).toString("utf8")).code, 404);
  });

  test("identity without Accept-Encoding, for small bodies and for PDFs", async () => {
    const plain = await get(port, "/big");
    assert.equal(plain.headers["content-encoding"], undefined);
    assert.deepEqual(JSON.parse(plain.body.toString("utf8")), BIG);

    const small = await get(port, "/small", { "accept-encoding": "br" });
    assert.equal(small.headers["content-encoding"], undefined);
    assert.deepEqual(JSON.parse(small.body.toString("utf8")), { ok: true });

    const pdf = await get(port, "/pdf", { "accept-encoding": "br" });
    assert.equal(pdf.headers["content-encoding"], undefined);
    assert.equal(pdf.body.length, 5000);
  });

  test("HTML previews are compressed too", async () => {
    const res = await get(port, "/html", { "accept-encoding": "gzip" });
    assert.equal(res.headers["content-encoding"], "gzip");
    assert.match(gunzipSync(res.body).toString("utf8"), /^<p>preview/);
  });

  test("HEAD responses are not compressed", async () => {
    const res = await get(port, "/big", { "accept-encoding": "br" }, "HEAD");
    assert.equal(res.status, 200);
    assert.equal(res.headers["content-encoding"], undefined);
  });
});

describe("chooseEncoding", () => {
  const req = (header?: string) =>
    ({
      acceptsEncodings: (encoding: string) => {
        const accepted = (header ?? "")
          .split(",")
          .map((part) => part.trim().split(";"))
          .filter(([name, q]) => (name === encoding || name === "*") && q?.trim() !== "q=0");
        return accepted.length > 0 ? encoding : false;
      },
    }) as never;

  test("prefers brotli, falls back to gzip, else none", () => {
    assert.equal(chooseEncoding(req("gzip, deflate, br, zstd")), "br");
    assert.equal(chooseEncoding(req("gzip")), "gzip");
    assert.equal(chooseEncoding(req("br;q=0, gzip")), "gzip");
    assert.equal(chooseEncoding(req("deflate")), null);
    assert.equal(chooseEncoding(req()), null);
  });
});
