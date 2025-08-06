const express = require('express');
const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Parse-Application-Id, X-Parse-Master-Key, X-Parse-Session-Token');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Basic Parse Server API endpoints that return minimal responses
app.get('/parse/serverInfo', (req, res) => {
  console.log('📊 ServerInfo requested - returning full features object');
  const response = {
    parseServerVersion: '6.0.0',
    features: {
      globalConfig: {
        create: true,
        read: true,
        update: true,
        delete: true
      },
      schemas: {
        addField: true,
        removeField: true,
        addClass: true,
        removeClass: true
      },
      cloudCode: {
        viewCode: true,
        jobs: true
      },
      hooks: {
        create: true,
        read: true,
        update: true,
        delete: true
      },
      logs: {
        level: true,
        size: true,
        order: true,
        until: true,
        from: true
      },
      push: {
        immediatePush: false,
        storedPushData: false,
        pushAudiences: false
      }
    }
  };
  console.log('📋 Response:', JSON.stringify(response, null, 2));
  res.json(response);
});

app.post('/parse/batch', (req, res) => {
  res.json({ success: {} });
});

app.get('/parse/config', (req, res) => {
  res.json({ params: {} });
});

app.get('/parse/classes/:className', (req, res) => {
  // Return sample data for any class
  res.json({
    results: [
      {
        objectId: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  });
});

app.get('/parse/schemas', (req, res) => {
  res.json({
    results: [
      {
        className: '_User',
        fields: {
          objectId: { type: 'String' },
          username: { type: 'String' },
          email: { type: 'String' },
          createdAt: { type: 'Date' },
          updatedAt: { type: 'Date' }
        }
      }
    ]
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Mock Parse Server for Analytics Dashboard Testing',
    serverURL: 'http://localhost:1337/parse'
  });
});

// Catch all for Parse API
app.use('/parse/*', (req, res) => {
  res.json({ success: true, message: 'Mock response' });
});

const port = 1337;
app.listen(port, () => {
  console.log(`🚀 Mock Parse Server running on http://localhost:${port}`);
  console.log(`📊 Parse API available at http://localhost:${port}/parse`);
  console.log(`🎛️  Use this config in your dashboard:`);
  console.log(`   serverURL: "http://localhost:1337/parse"`);
  console.log(`   appId: "mock-app-id"`);
  console.log(`   masterKey: "mock-master-key"`);
});
