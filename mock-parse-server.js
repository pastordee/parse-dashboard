const express = require('express');

const app = express();
const PORT = 8080;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Parse-Application-Id, X-Parse-Master-Key');
  next();
});
app.use(express.json());

// Mock Parse Server features endpoint
app.get('/serverInfo', (req, res) => {
  res.json({
    features: {
      analytics: true,
      globalConfig: true,
      hooks: true,
      logs: true,
      push: true
    },
    parseServerVersion: '6.0.0'
  });
});

// Mock Parse Server health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock Parse Server running at http://localhost:${PORT}`);
});
