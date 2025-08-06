const express = require('express');
const app = exp// Config - handle both GET and POST
app.get('/parse/config', (req, res) => {
  res.json({
    params: {
      appId: 'mock-app-id',
      masterKey: 'mock-master-key',
      serverURL: 'http://localhost:1338/parse'
    }
  });
});

app.post('/parse/config', (req, res) => {
  res.json({
    params: {
      appId: 'mock-app-id',
      masterKey: 'mock-master-key',
      serverURL: 'http://localhost:1338/parse'
    }
  });
});pp.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Parse-Application-Id, X-Parse-Master-Key, X-Parse-REST-API-Key, X-Parse-Session-Token');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.headers);
  next();
});

// Parse Server Info - handle both GET and POST
app.get('/parse/serverInfo', (req, res) => {
  res.json({
    parseServerVersion: '6.0.0',
    features: {
      schemas: true,
      hooks: true,
      cloudCode: true,
      push: true
    }
  });
});

app.post('/parse/serverInfo', (req, res) => {
  res.json({
    parseServerVersion: '6.0.0',
    features: {
      schemas: true,
      hooks: true,
      cloudCode: true,
      push: true
    }
  });
});

// Health check
app.get('/parse/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Config
app.get('/parse/config', (req, res) => {
  res.json({
    params: {
      appId: 'mock-app-id',
      masterKey: 'mock-master-key',
      serverURL: 'http://localhost:1337/parse'
    }
  });
});

// Schemas
app.get('/parse/schemas', (req, res) => {
  res.json({
    results: [
      {
        className: '_User',
        fields: {
          objectId: { type: 'String' },
          createdAt: { type: 'Date' },
          updatedAt: { type: 'Date' },
          username: { type: 'String' },
          email: { type: 'String' },
          emailVerified: { type: 'Boolean' }
        },
        classLevelPermissions: {
          find: { '*': true },
          create: { '*': true },
          get: { '*': true },
          update: { '*': true },
          delete: { '*': true }
        }
      },
      {
        className: 'TestClass',
        fields: {
          objectId: { type: 'String' },
          createdAt: { type: 'Date' },
          updatedAt: { type: 'Date' },
          name: { type: 'String' }
        },
        classLevelPermissions: {
          find: { '*': true },
          create: { '*': true },
          get: { '*': true },
          update: { '*': true },
          delete: { '*': true }
        }
      }
    ]
  });
});

// Classes
app.get('/parse/classes/:className', (req, res) => {
  const className = req.params.className;
  res.json({
    results: []
  });
});

// Jobs
app.get('/parse/jobs', (req, res) => {
  res.json({
    results: []
  });
});

// Cloud functions
app.get('/parse/functions', (req, res) => {
  res.json({
    results: []
  });
});

// Hooks
app.get('/parse/hooks/functions', (req, res) => {
  res.json({
    results: []
  });
});

app.get('/parse/hooks/triggers', (req, res) => {
  res.json({
    results: []
  });
});

// Batch operations
app.post('/parse/batch', (req, res) => {
  const requests = req.body.requests || [];
  const results = requests.map(() => ({ success: {} }));
  res.json(results);
});

// Aggregate
app.get('/parse/aggregate/:className', (req, res) => {
  res.json({
    results: []
  });
});

// Files
app.post('/parse/files/:fileName', (req, res) => {
  res.json({
    url: 'http://localhost:1337/parse/files/mock-file.txt',
    name: req.params.fileName
  });
});

// Logs (Parse Dashboard might request this)
app.get('/parse/scriptlog', (req, res) => {
  res.json({
    results: []
  });
});

// App stats
app.get('/parse/stats', (req, res) => {
  res.json({
    totalUsers: 100,
    totalObjects: 500,
    totalFiles: 50
  });
});

// Catch all for other endpoints
app.all('*', (req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found' });
});

const PORT = 1338;
app.listen(PORT, () => {
  console.log(`Comprehensive Mock Parse Server running on http://localhost:${PORT}`);
});
