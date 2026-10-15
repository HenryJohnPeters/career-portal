// Production web server (Railway "web" service, see railway.json): serves the
// Vite build in apps/web/dist with strict security headers and cache rules.
const fs = require("fs");
const path = require("path");
const express = require("express");

const PORT = Number(process.env.PORT) || 3000;
const DIST = path.join(__dirname, "apps/web/dist");
const INDEX_HTML = path.join(DIST, "index.html");
const SHUTDOWN_GRACE_MS = 10_000;

const CACHE = {
  /** Content-hashed build output: never changes under the same name. */
  hashed: "public, max-age=31536000, immutable",
  /** Fonts carry their version in the file name. */
  fonts: "public, max-age=2592000",
  /** Other public/ files (favicon, robots.txt, theme-init.js) keep their name across deploys. */
  other: "public, max-age=3600",
  /** Always revalidated, so a deploy is picked up on the next load. */
  html: "no-cache",
};

if (!fs.existsSync(INDEX_HTML)) {
  console.error(`No web build at ${DIST}; run the web build before starting the server.`);
  process.exit(1);
}

function originOf(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

/** The origins the bundle talks to (same VITE_* values the build used). */
function connectSources() {
  const api = originOf(process.env.VITE_API_URL);
  const supabase = originOf(process.env.VITE_SUPABASE_URL);
  // Optional client error reports (apps/web/src/lib/report-error.ts).
  const errorReports = originOf(process.env.VITE_ERROR_REPORT_URL);
  const sources = [api ?? "https://*.railway.app", supabase ?? "https://*.supabase.co"];
  if (errorReports && !sources.includes(errorReports)) sources.push(errorReports);
  return sources;
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // Inline style attributes (React) and the CV preview's <style>/Google Fonts.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // CV photos may be hosted anywhere over https.
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${connectSources().join(" ")}`,
  // PDF previews are blob: URLs.
  "frame-src 'self' blob:",
  "object-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

/** gzip/brotli when the optional `compression` package is installed. */
function optionalCompression() {
  try {
    return require("compression")();
  } catch {
    console.warn("compression is not installed; serving uncompressed responses");
    return null;
  }
}

const app = express();
app.disable("x-powered-by");

app.get("/healthz", (_req, res) => {
  res.set("Cache-Control", "no-store").type("text/plain").send("ok");
});

app.use((_req, res, next) => {
  res.set(SECURITY_HEADERS);
  next();
});

const compression = optionalCompression();
if (compression) app.use(compression);

// Hashed bundles: a missing file is a 404, never index.html (a stale tab
// asking for an old chunk must fail cleanly instead of parsing HTML as JS).
app.use(
  "/assets",
  express.static(path.join(DIST, "assets"), {
    fallthrough: false,
    index: false,
    setHeaders: (res) => res.set("Cache-Control", CACHE.hashed),
  }),
);

app.use(
  express.static(DIST, {
    index: false,
    setHeaders: (res, filePath) => {
      const rel = path.relative(DIST, filePath);
      if (rel === "index.html") res.set("Cache-Control", CACHE.html);
      else if (rel.startsWith(`fonts${path.sep}`)) res.set("Cache-Control", CACHE.fonts);
      else res.set("Cache-Control", CACHE.other);
    },
  }),
);

// Client-side routes (no file extension) get the SPA shell; anything else is a 404.
app.use((req, res) => {
  const isPageRoute =
    (req.method === "GET" || req.method === "HEAD") && path.extname(req.path) === "";
  if (!isPageRoute) {
    res.status(404).type("text/plain").send("Not found");
    return;
  }
  res.set("Cache-Control", CACHE.html);
  res.sendFile(INDEX_HTML);
});

// express.static (fallthrough: false) reports a missing asset as a 404 error.
app.use((err, _req, res, _next) => {
  const status = err && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) console.error("Request failed:", err);
  res.status(status).type("text/plain").send(status === 404 ? "Not found" : "Error");
});

const server = app.listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});
// Longer than the edge proxy's idle timeout, to avoid 502s on reused sockets.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

function shutdown(signal) {
  console.log(`${signal} received: finishing in-flight requests`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), SHUTDOWN_GRACE_MS).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
