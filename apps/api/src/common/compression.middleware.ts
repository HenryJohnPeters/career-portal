import type { NextFunction, Request, Response } from "express";
import { brotliCompress, constants as zlib, gzip } from "node:zlib";

/** Smaller bodies gain too little to be worth compressing. */
export const COMPRESSION_THRESHOLD_BYTES = 1024;

/** JSON and text (the HTML previews); never PDFs, images or streamed files. */
const COMPRESSIBLE_TYPE = /^\s*(application\/json|text\/)/i;

/** Low brotli quality: well ahead of gzip on JSON, at a similar CPU cost. */
const BROTLI_QUALITY = 4;

export type ResponseEncoding = "br" | "gzip";

/** Brotli when the client accepts it at all, else gzip, else none. */
export function chooseEncoding(req: Pick<Request, "acceptsEncodings">): ResponseEncoding | null {
  if (req.acceptsEncodings("br") === "br") return "br";
  if (req.acceptsEncodings("gzip") === "gzip") return "gzip";
  return null;
}

function compress(encoding: ResponseEncoding, input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const done = (error: Error | null, output: Buffer) => (error ? reject(error) : resolve(output));
    if (encoding === "br") {
      brotliCompress(
        input,
        {
          params: {
            [zlib.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY,
            [zlib.BROTLI_PARAM_SIZE_HINT]: input.length,
          },
        },
        done,
      );
    } else {
      gzip(input, done);
    }
  });
}

/**
 * Compresses JSON and text responses sent through `res.send`/`res.json`
 * (every Nest handler and the error filter) with brotli or gzip, off the
 * event loop. Streams (StreamableFile) and binary bodies pass through.
 */
export function responseCompression(threshold = COMPRESSION_THRESHOLD_BYTES) {
  return (req: Request, res: Response, next: NextFunction) => {
    const send = res.send;
    res.send = function compressedSend(this: Response, body?: unknown) {
      // Objects go through res.json, which calls back here with a string.
      if (typeof body !== "string" && !Buffer.isBuffer(body)) return send.call(this, body);

      const type = res.getHeader("Content-Type");
      const size = typeof body === "string" ? Buffer.byteLength(body) : body.length;
      if (
        req.method === "HEAD" ||
        typeof type !== "string" ||
        !COMPRESSIBLE_TYPE.test(type) ||
        res.getHeader("Content-Encoding") !== undefined ||
        res.statusCode === 204 ||
        res.statusCode === 304 ||
        size < threshold
      ) {
        return send.call(this, body);
      }

      res.vary("Accept-Encoding");
      const encoding = chooseEncoding(req);
      if (!encoding) return send.call(this, body);

      const input = typeof body === "string" ? Buffer.from(body, "utf8") : body;
      compress(encoding, input).then(
        (output) => {
          if (res.headersSent || res.destroyed) return;
          res.setHeader("Content-Encoding", encoding);
          send.call(this, output);
        },
        () => {
          if (res.headersSent || res.destroyed) return;
          send.call(this, body);
        },
      );
      return this;
    };
    next();
  };
}
