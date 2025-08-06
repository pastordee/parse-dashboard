const express = require('express');
const ParseServer = require('parse-server').ParseServer;

const app = express();

// Create Parse Server with memory adapter (no database required)
const api = new ParseServer({
  databaseURI: 'memory://test',
  appId: 'test-app-id',
  masterKey: 'test-master-key',
  serverURL: 'http://localhost:3001/parse',
  allowClientClassCreation: true
});

// Serve the Parse API on the /parse URL prefix
app.use('/parse', api.app);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Parse Server is running!',
    appId: 'test-app-id',
    serverURL: 'http://localhost:3001/parse',
    version: require('parse-server/package.json').version
  });
});

const port = 3001;
app.listen(port, () => {
  console.log(`🚀 Parse Server running on http://localhost:${port}/parse`);
  console.log('📊 App ID: test-app-id');
  console.log('🔑 Master Key: test-master-key');
  console.log('🎛️  Dashboard should now connect successfully!');
});
