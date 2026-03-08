const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist/apps/web
app.use(express.static(path.join(__dirname, 'dist/apps/web')));

// Handle client-side routing - return index.html for all routes that don't match static files
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist/apps/web/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
