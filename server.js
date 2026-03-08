const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from apps/web/dist (where vite outputs the build)
app.use(express.static(path.join(__dirname, "apps/web/dist")));

// Handle client-side routing - return index.html for all routes that don't match static files
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "apps/web/dist/index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
