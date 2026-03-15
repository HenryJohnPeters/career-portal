const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://*.railway.app;"
  );
  next();
});

// Serve static files from apps/web/dist (where vite outputs the build)
app.use(
  express.static(path.join(__dirname, "apps/web/dist"), {
    maxAge: "1y",
    immutable: true,
    index: false, // let the SPA fallback below handle /
  })
);

// Handle client-side routing - return index.html for all routes that don't match static files
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "apps/web/dist/index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
