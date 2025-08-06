const express = require('express');
const ParseServer = require('parse-server').ParseServer;

const app = express();

// Simple in-memory database for testing
const api = new ParseServer({
  databaseURI: 'postgres://localhost:5432/parse-test', // This will fail gracefully and use memory
  appId: 'test-app-id',
  masterKey: 'test-master-key',
  serverURL: 'http://localhost:1337/parse',
  // Use memory database when Postgres/MongoDB is not available
  databaseOptions: {
    enableSchemaHooks: false
  }
});

// Serve the Parse API on the /parse URL prefix
app.use('/parse', api.app);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Parse Server is running!',
    appId: 'test-app-id',
    serverURL: 'http://localhost:1337/parse'
  });
});

const port = 1337;
app.listen(port, () => {
  console.log(`🚀 Parse Server running on http://localhost:${port}/parse`);
  console.log('🎛️  Dashboard Config:');
  console.log('   - App ID: test-app-id');
  console.log('   - Master Key: test-master-key');
  console.log('   - Server URL: http://localhost:1337/parse');
  console.log('');
  console.log('🔗 Now run your Parse Dashboard with:');
  console.log('   node ../Parse-Dashboard/index.js --dev --config ../test-config.json --port 4042');
});
