import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  PhotoFetchError,
  fetchPhotoAsDataUri,
  parsePhotoUrl,
  publicOnlyLookup,
  sniffImageType,
} from "./photo-fetcher";

describe("parsePhotoUrl", () => {
  test("accepts public https URLs", () => {
    assert.equal(parsePhotoUrl("https://cdn.example.com/me.jpg").hostname, "cdn.example.com");
    assert.equal(parsePhotoUrl("https://cdn.example.com:443/me.jpg").port, "");
  });

  test("rejects non-https, credentials, odd ports and internal hosts", () => {
    for (const url of [
      "http://example.com/a.png",
      "file:///etc/passwd",
      "https://user:pw@example.com/a.png",
      "https://example.com:8443/a.png",
      "https://localhost/a.png",
      "https://db.internal/a.png",
      "https://127.0.0.1/a.png",
      "https://169.254.169.254/latest/meta-data/",
      "https://10.0.0.5/x.png",
      "https://[::1]/a.png",
      "https://[::ffff:127.0.0.1]/a.png",
      "not a url",
    ]) {
      assert.throws(() => parsePhotoUrl(url), PhotoFetchError, url);
    }
  });
});

describe("sniffImageType", () => {
  test("recognises JPEG, PNG, GIF and WebP by magic bytes", () => {
    assert.equal(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
    assert.equal(
      sniffImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])),
      "image/png",
    );
    assert.equal(sniffImageType(Buffer.from("GIF89a....")), "image/gif");
    assert.equal(sniffImageType(Buffer.from("RIFF\0\0\0\0WEBPVP8 ")), "image/webp");
  });

  test("rejects SVG, HTML and short buffers", () => {
    assert.equal(sniffImageType(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>")), null);
    assert.equal(sniffImageType(Buffer.from("<!DOCTYPE html>")), null);
    assert.equal(sniffImageType(Buffer.from([0xff])), null);
  });
});

describe("publicOnlyLookup", () => {
  test("refuses names that resolve to loopback", async () => {
    const err = await new Promise<NodeJS.ErrnoException | null>((resolve) =>
      publicOnlyLookup("localhost", {}, (e) => resolve(e)),
    );
    assert.equal(err?.code, "EADDRNOTPUBLIC");
  });
});

describe("fetchPhotoAsDataUri", () => {
  test("fails before any network access for blocked URLs", async () => {
    await assert.rejects(fetchPhotoAsDataUri("https://127.0.0.1/me.png"), PhotoFetchError);
  });
});
