const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 1339;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:4040', 'http://localhost:4041', 'http://localhost:3000', '*'],
  credentials: true
}));

app.use(express.json());

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Query params:', req.query);
  console.log('Headers:', {
    'x-parse-application-id': req.headers['x-parse-application-id'],
    'x-parse-master-key': req.headers['x-parse-master-key'] ? '[REDACTED]' : undefined
  });
  next();
});

// Helper functions
function generateMockData(type, count = 100) {
  const data = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < count; i++) {
    const timestamp = now - (i * dayMs);
    let value;
    
    switch (type) {
      case 'users':
        value = Math.floor(Math.random() * 1000) + 500;
        break;
      case 'installations':
        value = Math.floor(Math.random() * 2000) + 1000;
        break;
      case 'api_requests':
        value = Math.floor(Math.random() * 10000) + 5000;
        break;
      case 'push_notifications':
        value = Math.floor(Math.random() * 500) + 100;
        break;
      case 'app_opens':
        value = Math.floor(Math.random() * 3000) + 1500;
        break;
      default:
        value = Math.floor(Math.random() * 100);
    }
    
    data.push([timestamp, value]);
  }
  
  return data.reverse(); // Chronological order
}

function getBaseCount(type) {
  const baseCounts = {
    total_users: 15420,
    daily_users: 3240,
    weekly_users: 8930,
    monthly_users: 12180,
    total_installations: 28750,
    daily_installations: 1820,
    weekly_installations: 5640,
    monthly_installations: 11230
  };
  
  return baseCounts[type] || 0;
}

// Parse Server Info
app.get('/parse/serverInfo', (req, res) => {
  res.json({
    parseServerVersion: '6.0.0',
    features: {
      schemas: true,
      hooks: true,
      cloudCode: true,
      push: true,
      analytics: true // Important for analytics features
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
      push: true,
      analytics: true
    }
  });
});

// Health check
app.get('/parse/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ============= ANALYTICS ENDPOINTS =============

// Analytics Overview - Audience Metrics
app.get('/apps/:appSlug/analytics_content_audience', (req, res) => {
  const { audienceType, at } = req.query;
  console.log(`Analytics audience request: ${audienceType} at ${at}`);
  
  const baseCount = getBaseCount(audienceType);
  const variation = Math.floor(Math.random() * 200) - 100; // ±100 variation
  const total = Math.max(0, baseCount + variation);
  
  res.json({
    total: total,
    content: total
  });
});

// Billing Metrics
app.get('/apps/:appSlug/billing_file_storage', (req, res) => {
  const usage = 2.3 + (Math.random() * 0.5); // 2.3-2.8 GB
  res.json({
    total: Math.round(usage * 100) / 100,
    limit: 10,
    units: 'GB'
  });
});

app.get('/apps/:appSlug/billing_database_storage', (req, res) => {
  const usage = 0.8 + (Math.random() * 0.3); // 0.8-1.1 GB
  res.json({
    total: Math.round(usage * 100) / 100,
    limit: 5,
    units: 'GB'
  });
});

app.get('/apps/:appSlug/billing_data_transfer', (req, res) => {
  const usage = 0.05 + (Math.random() * 0.02); // 50-70 GB in TB
  res.json({
    total: Math.round(usage * 1000) / 1000,
    limit: 1,
    units: 'TB'
  });
});

// Analytics Time Series
app.get('/apps/:appSlug/analytics', (req, res) => {
  const { endpoint, audienceType, stride, from, to, pushStatusID } = req.query;
  
  console.log(`Analytics time series: ${endpoint}, ${audienceType}, ${stride}`);
  
  let dataType = 'users';
  
  // Map endpoint to data type
  switch (endpoint) {
    case 'audience':
      dataType = audienceType?.includes('installation') ? 'installations' : 'users';
      break;
    case 'api_request':
      dataType = 'api_requests';
      break;
    case 'push':
    case 'push_opened':
      dataType = 'push_notifications';
      break;
    case 'app_opened':
    case 'app_opened_from_push':
      dataType = 'app_opens';
      break;
    default:
      dataType = 'users';
  }
  
  const days = stride === 'day' ? 30 : 7; // Show 30 days for daily, 7 for hourly
  const requested_data = generateMockData(dataType, days);
  
  res.json({
    requested_data: requested_data
  });
});

// Analytics Retention
app.get('/apps/:appSlug/analytics_retention', (req, res) => {
  const { at } = req.query;
  
  // Generate realistic retention data
  const retention = {
    day1: Math.random() * 0.3 + 0.6,   // 60-90% day 1 retention
    day7: Math.random() * 0.2 + 0.3,   // 30-50% day 7 retention
    day30: Math.random() * 0.15 + 0.15, // 15-30% day 30 retention
  };
  
  res.json(retention);
});

// Slow Queries
app.get('/apps/:appSlug/slow_queries', (req, res) => {
  const { className, os, version, from, to } = req.query;
  
  // Generate mock slow query data
  const result = [
    {
      className: className || '_User',
      query: 'find',
      averageTime: 250 + Math.random() * 500,
      count: Math.floor(Math.random() * 50) + 10,
      os: os || 'iOS',
      version: version || '1.0.0'
    },
    {
      className: className || 'GameScore',
      query: 'find',
      averageTime: 180 + Math.random() * 300,
      count: Math.floor(Math.random() * 30) + 5,
      os: os || 'Android',
      version: version || '1.0.0'
    }
  ];
  
  res.json({ result });
});

// ============= ADDITIONAL DASHBOARD ENDPOINTS =============

// Config
app.get('/parse/config', (req, res) => {
  res.json({
    params: {
      appId: 'analytics-demo-app',
      masterKey: '[REDACTED]',
      serverURL: `http://localhost:${PORT}/parse`
    }
  });
});

app.post('/parse/config', (req, res) => {
  res.json({
    params: {
      appId: 'analytics-demo-app', 
      masterKey: '[REDACTED]',
      serverURL: `http://localhost:${PORT}/parse`
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
        className: 'GameScore',
        fields: {
          objectId: { type: 'String' },
          createdAt: { type: 'Date' },
          updatedAt: { type: 'Date' },
          score: { type: 'Number' },
          playerName: { type: 'String' }
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

// Classes - Mock data
app.get('/parse/classes/:className', (req, res) => {
  const className = req.params.className;
  const { limit = 100, skip = 0 } = req.query;
  
  let results = [];
  
  if (className === '_User') {
    // Generate mock users
    for (let i = 0; i < Math.min(limit, 20); i++) {
      results.push({
        objectId: `user${i + skip}`,
        username: `user${i + skip}`,
        email: `user${i + skip}@example.com`,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  } else if (className === '_Installation') {
    // Generate mock installations
    const deviceTypes = ['ios', 'android', 'web'];
    for (let i = 0; i < Math.min(limit, 20); i++) {
      results.push({
        objectId: `install${i + skip}`,
        installationId: `installation-${i + skip}`,
        deviceType: deviceTypes[i % 3],
        deviceToken: `token-${i + skip}`,
        channels: ['global', 'updates'],
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  } else if (className === 'GameScore') {
    // Generate mock game scores
    const playerNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    for (let i = 0; i < Math.min(limit, 20); i++) {
      results.push({
        objectId: `score${i + skip}`,
        score: Math.floor(Math.random() * 10000),
        playerName: playerNames[i % 5],
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }
  
  res.json({ results });
});

// Cloud Functions
app.get('/parse/functions', (req, res) => {
  res.json({
    results: [
      'hello',
      'getUserStats',
      'calculateAnalytics',
      'sendPushNotification'
    ]
  });
});

app.post('/parse/functions/:functionName', (req, res) => {
  const functionName = req.params.functionName;
  
  switch (functionName) {
    case 'hello':
      res.json({ result: 'Hello from Parse Cloud Function!' });
      break;
    case 'getUserStats':
      res.json({ 
        result: {
          totalUsers: 15420,
          activeUsers: 3240,
          newUsersToday: 127
        }
      });
      break;
    case 'calculateAnalytics':
      res.json({
        result: {
          dailyActiveUsers: 3240,
          weeklyActiveUsers: 8930,
          monthlyActiveUsers: 12180,
          retention: {
            day1: 0.75,
            day7: 0.45,
            day30: 0.28
          }
        }
      });
      break;
    default:
      res.json({ result: `Function ${functionName} executed successfully` });
  }
});

// Jobs
app.get('/parse/jobs', (req, res) => {
  res.json({
    results: [
      {
        objectId: 'job1',
        jobName: 'cleanupOldData',
        status: 'succeeded',
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        finishedAt: new Date(Date.now() - 59 * 60 * 1000).toISOString()
      },
      {
        objectId: 'job2',
        jobName: 'sendWeeklyReport',
        status: 'running',
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      },
      {
        objectId: 'job3',
        jobName: 'updateUserStats',
        status: 'failed',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        finishedAt: new Date(Date.now() - 119 * 60 * 1000).toISOString(),
        error: 'Database connection timeout'
      }
    ]
  });
});

// Logs
app.get('/parse/scriptlog', (req, res) => {
  const logs = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Analytics data updated successfully',
      functionName: 'calculateAnalytics'
    },
    {
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      level: 'warn', 
      message: 'High memory usage detected',
      functionName: 'system'
    },
    {
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      level: 'error',
      message: 'Failed to send push notification',
      functionName: 'sendPush',
      error: 'Invalid device token'
    }
  ];
  
  res.json({ results: logs });
});

// Push Notifications
app.get('/parse/push', (req, res) => {
  res.json({
    results: [
      {
        objectId: 'push1',
        data: { alert: 'Welcome to our app!' },
        where: { deviceType: 'ios' },
        status: 'succeeded',
        numSent: 1247,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        objectId: 'push2', 
        data: { alert: 'New features available!' },
        where: {},
        status: 'running',
        numSent: 856,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ]
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Parse Analytics Demo Server',
    version: '1.0.0',
    features: ['analytics', 'dashboard-integration'],
    endpoints: {
      analytics: [
        '/apps/:appSlug/analytics_content_audience',
        '/apps/:appSlug/billing_file_storage',
        '/apps/:appSlug/billing_database_storage',
        '/apps/:appSlug/billing_data_transfer',
        '/apps/:appSlug/analytics',
        '/apps/:appSlug/analytics_retention',
        '/apps/:appSlug/slow_queries'
      ],
      parse: [
        '/parse/serverInfo',
        '/parse/config',
        '/parse/schemas',
        '/parse/classes/:className',
        '/parse/functions/:functionName',
        '/parse/jobs',
        '/parse/scriptlog',
        '/parse/push',
        '/parse/health'
      ]
    },
    usage: {
      dashboard: 'Configure Parse Dashboard to point to this server',
      serverURL: `http://localhost:${PORT}/parse`,
      appId: 'analytics-demo-app',
      masterKey: 'your-master-key-here'
    }
  });
});

// Catch all for debugging
app.all('*', (req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.path}`);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  
  res.status(404).json({ 
    error: 'Endpoint not found',
    method: req.method,
    path: req.path,
    suggestion: 'Check the analytics integration guide for available endpoints'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Parse Analytics Demo Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('📊 Analytics endpoints ready:');
  console.log(`   - Overview: http://localhost:${PORT}/apps/demo/analytics_content_audience`);
  console.log(`   - Time series: http://localhost:${PORT}/apps/demo/analytics`);
  console.log(`   - Billing: http://localhost:${PORT}/apps/demo/billing_file_storage`);
  console.log('');
  console.log('🔧 Configure Parse Dashboard with:');
  console.log(`   - Server URL: http://localhost:${PORT}/parse`);
  console.log('   - App ID: analytics-demo-app');
  console.log('   - Master Key: your-master-key-here');
  console.log('');
  console.log('📖 Full endpoint documentation: http://localhost:' + PORT);
});
