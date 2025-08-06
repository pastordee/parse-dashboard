const express = require('express');
const app = express();

// CORS middleware
app.use((req, res, next) => {
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
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
    headers: req.headers,
    query: req.query,
    body: req.method === 'POST' ? req.body : 'N/A'
  });
  next();
});

// Root endpoint for basic info
app.get('/', (req, res) => {
  res.json({
    name: 'Comprehensive Mock Parse Server',
    version: '1.0.0',
    endpoints: [
      '/parse/serverInfo',
      '/parse/config', 
      '/parse/schemas',
      '/parse/classes/:className',
      '/parse/jobs',
      '/parse/functions',
      '/parse/hooks/functions',
      '/parse/hooks/triggers',
      '/parse/batch',
      '/parse/files/:fileName',
      '/parse/health'
    ]
  });
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

// Config - handle both GET and POST
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
        className: '_Installation',
        fields: {
          objectId: { type: 'String' },
          createdAt: { type: 'Date' },
          updatedAt: { type: 'Date' },
          installationId: { type: 'String' },
          deviceType: { type: 'String' },
          deviceToken: { type: 'String' },
          channels: { type: 'Array' }
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

// POST handler for schemas (same response as GET)
app.post('/parse/schemas', (req, res) => {
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
        className: '_Installation',
        fields: {
          objectId: { type: 'String' },
          createdAt: { type: 'Date' },
          updatedAt: { type: 'Date' },
          installationId: { type: 'String' },
          deviceType: { type: 'String' },
          deviceToken: { type: 'String' },
          channels: { type: 'Array' }
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

// Authentication endpoints
app.post('/parse/login', (req, res) => {
  res.json({
    objectId: 'mock-user-id',
    username: req.body.username || 'admin',
    sessionToken: 'mock-session-token-' + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
});

app.post('/parse/logout', (req, res) => {
  res.json({});
});

// User session validation
app.get('/parse/users/me', (req, res) => {
  res.json({
    objectId: 'mock-user-id',
    username: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
});

// Classes
app.get('/parse/classes/:className', (req, res) => {
  const className = req.params.className;
  
  // Return some mock data for different classes
  if (className === '_User') {
    res.json({
      results: [
        {
          objectId: 'user1',
          username: 'admin',
          email: 'admin@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          objectId: 'user2',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z'
        }
      ]
    });
  } else if (className === '_Installation') {
    res.json({
      results: [
        {
          objectId: 'install1',
          installationId: 'ios-installation-1',
          deviceType: 'ios',
          deviceToken: 'mock-ios-token',
          channels: ['global', 'news'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          objectId: 'install2',
          installationId: 'android-installation-1',
          deviceType: 'android',
          deviceToken: 'mock-android-token',
          channels: ['global'],
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z'
        }
      ]
    });
  } else if (className === 'TestClass') {
    res.json({
      results: [
        {
          objectId: 'test1',
          name: 'Test Object 1',
          description: 'This is a test object',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          objectId: 'test2', 
          name: 'Test Object 2',
          description: 'Another test object',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z'
        }
      ]
    });
  } else {
    res.json({
      results: []
    });
  }
});

// POST handler for classes (create objects)
app.post('/parse/classes/:className', (req, res) => {
  const className = req.params.className;
  const data = req.body;
  
  // Generate a mock response for object creation
  const mockObject = {
    ...data,
    objectId: 'mock_' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json(mockObject);
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

// Push notifications
app.get('/parse/push', (req, res) => {
  res.json({
    results: []
  });
});

// Installations
app.get('/parse/classes/_Installation', (req, res) => {
  res.json({
    results: [
      {
        objectId: 'install1',
        installationId: 'ios-installation-1',
        deviceType: 'ios',
        deviceToken: 'mock-ios-token',
        channels: ['global', 'news'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        objectId: 'install2',
        installationId: 'android-installation-1',
        deviceType: 'android',
        deviceToken: 'mock-android-token',
        channels: ['global'],
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      }
    ]
  });
});

// Sessions
app.get('/parse/classes/_Session', (req, res) => {
  res.json({
    results: []
  });
});

// Parse Dashboard specific endpoints
app.get('/parse/apps', (req, res) => {
  res.json({
    results: [{
      appId: 'mock-app-id',
      appName: 'Analytics Demo'
    }]
  });
});

// Webhooks
app.get('/parse/webhooks', (req, res) => {
  res.json({
    results: []
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
