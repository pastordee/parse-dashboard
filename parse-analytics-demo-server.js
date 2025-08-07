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
  
  // Return comprehensive user analytics data
  res.json({
    totalUsers: 15847,
    dailyActiveUsers: 3421,
    weeklyActiveUsers: 9234,
    monthlyActiveUsers: 13456,
    newUsers: 587,
    returningUsers: 2834,
    // Legacy fields for compatibility
    total: 15847,
    content: 15847
  });
});

// Analytics Overview - Installation Metrics
app.get('/apps/:appSlug/analytics_content_installation', (req, res) => {
  const { audienceType, at } = req.query;
  console.log(`Analytics installation request: ${audienceType} at ${at}`);
  
  // Return comprehensive installation analytics data
  res.json({
    totalInstallations: 28935,
    dailyActiveInstallations: 5678,
    weeklyActiveInstallations: 16234,
    monthlyActiveInstallations: 24567,
    newInstallations: 892,
    // Legacy fields for compatibility
    total: 28935,
    content: 28935
  });
});

// Overview endpoint for all metrics at once
app.get('/apps/:appSlug/overview', (req, res) => {
  console.log(`Overview request for app: ${req.params.appSlug}`);
  
  res.json({
    // User metrics with trend data [current, 1 week ago, 2 weeks ago]
    dailyActiveUsers: [3421, 3156, 2987],
    weeklyActiveUsers: [9234, 8567, 8123],
    monthlyActiveUsers: [13456, 12890, 12345],
    totalUsers: 15847,
    
    // Installation metrics with trend data
    dailyActiveInstallations: [5678, 5234, 4987],
    weeklyActiveInstallations: [16234, 15567, 14876],
    monthlyActiveInstallations: [24567, 23890, 23123],
    totalInstallations: 28935,
    
    // Billing metrics
    billingFileStorage: {
      total: Math.round((2.3 + Math.random() * 0.5) * 100) / 100,
      limit: 10
    },
    billingDatabasetorage: {
      total: Math.round((0.8 + Math.random() * 0.3) * 100) / 100,
      limit: 5
    },
    billingDataTransfer: {
      total: Math.round((0.05 + Math.random() * 0.02) * 1000) / 1000,
      limit: 1
    },
    
    // Health status
    healthy: true,
    errors: [],
    lastUpdated: new Date().toISOString()
  });
});

// Retention Analytics endpoint
app.get('/apps/:appSlug/analytics_retention', (req, res) => {
  const { date, period = '28_days', maxDays = '28' } = req.query;
  console.log(`Retention request for app: ${req.params.appSlug}, date: ${date}, period: ${period}, maxDays: ${maxDays}`);
  
  // Define retention periods and their corresponding days
  const retentionPeriods = {
    '28_days': [1, 2, 3, 4, 5, 6, 7, 8, 14, 21, 28],
    '3_months': [1, 2, 3, 7, 14, 21, 28, 30, 45, 60, 90],
    '6_months': [1, 7, 14, 30, 45, 60, 90, 120, 150, 180],
    '1_year': [1, 7, 14, 30, 60, 90, 120, 180, 240, 300, 365],
    '2_years': [1, 14, 30, 90, 180, 270, 365, 450, 540, 630, 730],
    '5_years': [1, 30, 90, 180, 365, 540, 730, 1095, 1460, 1825]
  };
  
  const retentionDays = retentionPeriods[period] || retentionPeriods['28_days'];
  const maxDaysNum = parseInt(maxDays, 10);
  const retentions = {};
  
  // Generate data for the selected period
  for (let daysAgo = 1; daysAgo <= maxDaysNum; daysAgo++) {
    const dayKey = `days_old_${daysAgo}`;
    retentions[dayKey] = {};
    
    // Base number of users who signed up that day (varies by period length)
    let baseUsers;
    if (maxDaysNum <= 28) {
      baseUsers = Math.floor(100 + Math.random() * 200 + (maxDaysNum - daysAgo) * 10);
    } else if (maxDaysNum <= 365) {
      baseUsers = Math.floor(50 + Math.random() * 150 + (maxDaysNum - daysAgo) * 2);
    } else {
      baseUsers = Math.floor(20 + Math.random() * 100 + (maxDaysNum - daysAgo) * 1);
    }
    
    // For each retention day, calculate how many users were still active
    // Generate data for ALL days up to daysAgo, not just the measurement points
    for (let day = 1; day <= daysAgo; day++) {
      // Retention typically decreases over time, adjusted for longer periods
      let retentionRate;
      
      if (day <= 1) {
        retentionRate = 0.8 + Math.random() * 0.1; // 80-90%
      } else if (day <= 7) {
        retentionRate = 0.4 + Math.random() * 0.2; // 40-60%
      } else if (day <= 30) {
        retentionRate = 0.2 + Math.random() * 0.15; // 20-35%
      } else if (day <= 90) {
        retentionRate = 0.1 + Math.random() * 0.1; // 10-20%
      } else if (day <= 365) {
        retentionRate = 0.05 + Math.random() * 0.08; // 5-13%
      } else if (day <= 730) {
        retentionRate = 0.02 + Math.random() * 0.05; // 2-7%
      } else {
        retentionRate = 0.01 + Math.random() * 0.03; // 1-4%
      }
      
      const activeUsers = Math.floor(baseUsers * retentionRate);
      
      retentions[dayKey][`day_${day}`] = {
        total: baseUsers,
        active: activeUsers
      };
    }
  }
  
  res.json({
    content: retentions,
    success: true,
    period: period,
    maxDays: maxDaysNum,
    generated: new Date().toISOString()
  });
});

// Slow Queries Analytics endpoint
app.get('/apps/:appSlug/analytics_slow_queries', (req, res) => {
  const { className, os, version, from, to } = req.query;
  console.log(`Slow queries request for app: ${req.params.appSlug}`, { className, os, version, from, to });
  
  // Sample Parse classes
  const classes = ['User', 'Post', 'Comment', 'Product', 'Order', 'Review', 'Category', 'Media'];
  
  // Generate realistic slow query data
  const slowQueries = [];
  const queryCount = Math.floor(5 + Math.random() * 15); // 5-20 slow queries
  
  for (let i = 0; i < queryCount; i++) {
    const randomClass = className || classes[Math.floor(Math.random() * classes.length)];
    
    // Generate realistic query patterns
    const queryPatterns = [
      `where={"status":"active"}`,
      `where={"createdAt":{"$gte":"2024-01-01"}}`,
      `where={"$or":[{"name":{"$regex":"test"}},{"email":{"$exists":true}}]}`,
      `where={"category":{"$in":["electronics","books"]}}`,
      `where={"price":{"$gte":100,"$lte":500}}`,
      `where={"userId":{"$exists":true}}&include=user,comments`,
      `where={"tags":{"$all":["featured","new"]}}&order=-createdAt`,
      `where={"location":{"$nearSphere":{"latitude":37.7749,"longitude":-122.4194}}}`,
    ];
    
    
    const query = queryPatterns[Math.floor(Math.random() * queryPatterns.length)];
    const count = Math.floor(50 + Math.random() * 500); // 50-550 executions
    const slowPercent = (5 + Math.random() * 25).toFixed(1); // 5-30% slow
    const timeouts = Math.floor(Math.random() * 10); // 0-10 timeouts
    const scannedAvg = Math.floor(1000 + Math.random() * 5000); // 1k-6k scanned
    const medianMs = Math.floor(100 + Math.random() * 400); // 100-500ms median
    const p90Ms = Math.floor(medianMs * 1.5 + Math.random() * 200); // P90 higher than median
    
    slowQueries.push([
      randomClass,
      query,
      count,
      `${slowPercent}%`,
      timeouts,
      scannedAvg.toLocaleString(),
      medianMs,
      p90Ms
    ]);
  }
  
  // Sort by slow percentage (descending)
  slowQueries.sort((a, b) => parseFloat(b[3]) - parseFloat(a[3]));
  
  res.json({
    content: slowQueries,
    success: true,
    generated: new Date().toISOString(),
    filters: { className, os, version, from, to }
  });
});

// App versions endpoint for slow queries filters
app.get('/apps/:appSlug/analytics_app_versions', (req, res) => {
  const { from, to } = req.query;
  console.log(`App versions request for app: ${req.params.appSlug}`, { from, to });
  
  // Generate realistic app version data
  const osVersions = {
    'iOS': ['1.0.0', '1.1.0', '1.2.0', '1.2.1', '1.3.0'],
    'Android': ['1.0.0', '1.1.0', '1.1.1', '1.2.0', '1.3.0'],
    'Web': ['1.0.0', '1.1.0', '1.2.0'],
    'Desktop': ['1.0.0', '1.1.0']
  };
  
  const result = [];
  Object.keys(osVersions).forEach(os => {
    osVersions[os].forEach(version => {
      result.push({
        'OS': os,
        'App Display Version': version
      });
    });
  });
  
  res.json({
    content: result,
    success: true,
    generated: new Date().toISOString()
  });
});

// Schema endpoint for analytics - returns class names for filtering
app.get('/apps/:appSlug/analytics_schema', (req, res) => {
  console.log(`Schema request for app: ${req.params.appSlug}`);
  
  // Generate realistic schema classes
  const schemaClasses = {
    '_User': {
      fields: {
        objectId: { type: 'String' },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
        username: { type: 'String' },
        email: { type: 'String' },
        emailVerified: { type: 'Boolean' }
      }
    },
    '_Installation': {
      fields: {
        objectId: { type: 'String' },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
        installationId: { type: 'String' },
        deviceType: { type: 'String' },
        channels: { type: 'Array' }
      }
    },
    '_Role': {
      fields: {
        objectId: { type: 'String' },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
        name: { type: 'String' },
        users: { type: 'Relation', targetClass: '_User' },
        roles: { type: 'Relation', targetClass: '_Role' }
      }
    },
    '_Session': {
      fields: {
        objectId: { type: 'String' },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
        user: { type: 'Pointer', targetClass: '_User' },
        sessionToken: { type: 'String' }
      }
    },
    'Post': {
      fields: {
        objectId: { type: 'String' },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
        title: { type: 'String' },
        content: { type: 'String' },
        author: { type: 'Pointer', targetClass: '_User' },
        likes: { type: 'Number' }
      }
    },
    'Comment': {
      fields: {
        objectId: { type: 'String' },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
        text: { type: 'String' },
        post: { type: 'Pointer', targetClass: 'Post' },
        author: { type: 'Pointer', targetClass: '_User' }
      }
    },
    'Product': {
      fields: {
        objectId: { type: 'String' },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
        name: { type: 'String' },
        description: { type: 'String' },
        price: { type: 'Number' },
        category: { type: 'String' }
      }
    },
    'Order': {
      fields: {
        objectId: { type: 'String' },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
        user: { type: 'Pointer', targetClass: '_User' },
        products: { type: 'Array' },
        total: { type: 'Number' },
        status: { type: 'String' }
      }
    },
    'Review': {
      fields: {
        objectId: { type: 'String' },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
        product: { type: 'Pointer', targetClass: 'Product' },
        user: { type: 'Pointer', targetClass: '_User' },
        rating: { type: 'Number' },
        comment: { type: 'String' }
      }
    },
    'Category': {
      fields: {
        objectId: { type: 'String' },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
        name: { type: 'String' },
        description: { type: 'String' },
        parent: { type: 'Pointer', targetClass: 'Category' }
      }
    },
    'Media': {
      fields: {
        objectId: { type: 'String' },
        createdAt: { type: 'Date' },
        updatedAt: { type: 'Date' },
        name: { type: 'String' },
        file: { type: 'File' },
        type: { type: 'String' },
        size: { type: 'Number' }
      }
    }
  };
  
  res.json({
    content: {
      classes: schemaClasses
    },
    success: true,
    generated: new Date().toISOString()
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
  
  // Return comprehensive analytics data
  res.json({
    // API and Events Data
    apiRequests: 67890,
    pushNotifications: 2345,
    cloudCodeExecution: 891,
    fileUploads: 234,
    customEvents: 3456,
    
    // Performance Data
    avgResponseTime: 189,
    errorRate: 1.2,
    successfulRequests: 66789,
    failedRequests: 1101,
    p95ResponseTime: 425,
    p99ResponseTime: 678,
    
    // Error Distribution
    errorData: {
      '4xx': 456,
      '5xx': 234,
      timeouts: 89,
      other: 322
    },
    
    // Top Events
    topEvents: [
      { name: 'user_login', count: 5234, trend: 15.2 },
      { name: 'page_view', count: 12456, trend: 8.7 },
      { name: 'item_purchase', count: 1789, trend: -2.1 },
      { name: 'user_signup', count: 678, trend: 23.4 },
      { name: 'share_content', count: 2345, trend: 12.8 }
    ],
    
    // Recent Activity
    recentActivity: [
      { time: '1 minute ago', event: 'New user registered from iOS app', type: 'user', severity: 'info' },
      { time: '3 minutes ago', event: 'API rate limit exceeded for endpoint /users', type: 'error', severity: 'warning' },
      { time: '5 minutes ago', event: 'Push notification sent to 2,847 devices', type: 'push', severity: 'success' },
      { time: '8 minutes ago', event: 'Cloud function "processPayment" completed successfully', type: 'function', severity: 'info' },
      { time: '12 minutes ago', event: 'Slow database query detected (>800ms)', type: 'performance', severity: 'warning' },
      { time: '15 minutes ago', event: 'File upload completed: user_avatar.jpg', type: 'file', severity: 'info' }
    ],
    
    // Legacy time series data
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

// Explorer analytics endpoint - handles preset queries for Explorer component
app.post('/apps/:appSlug/analytics_explorer', (req, res) => {
  console.log('Analytics Explorer request for app:', req.params.appSlug, req.body);
  
  const { endpoint, audienceType, stride = 'day', from, to } = req.body;
  
  // Convert from/to timestamps to dates
  const fromDate = from ? new Date(from * 1000) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to * 1000) : new Date();
  
  console.log(`Generating explorer data for ${endpoint}/${audienceType} from ${fromDate.toISOString()} to ${toDate.toISOString()}`);
  
  // Generate time series data based on the endpoint
  const generateExplorerData = () => {
    const days = Math.ceil((toDate - fromDate) / (24 * 60 * 60 * 1000));
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(fromDate.getTime() + i * 24 * 60 * 60 * 1000);
      let value = 0;
      
      // Generate realistic data based on endpoint type
      switch (endpoint) {
        case 'audience':
          switch (audienceType) {
            case 'daily_users':
              value = Math.floor(Math.random() * 500) + 1000; // 1000-1500 daily active users
              break;
            case 'daily_installations':
              value = Math.floor(Math.random() * 100) + 50; // 50-150 daily installations
              break;
            case 'weekly_users':
              value = Math.floor(Math.random() * 2000) + 3000; // 3000-5000 weekly users
              break;
            case 'weekly_installations':
              value = Math.floor(Math.random() * 400) + 200; // 200-600 weekly installations
              break;
            case 'monthly_users':
              value = Math.floor(Math.random() * 5000) + 8000; // 8000-13000 monthly users
              break;
            case 'monthly_installations':
              value = Math.floor(Math.random() * 1000) + 500; // 500-1500 monthly installations
              break;
            default:
              value = Math.floor(Math.random() * 100) + 50;
          }
          break;
        case 'api_request':
          value = Math.floor(Math.random() * 10000) + 5000; // 5000-15000 API requests
          break;
        case 'analytics_request':
          value = Math.floor(Math.random() * 100) + 20; // 20-120 analytics requests
          break;
        case 'file_request':
          value = Math.floor(Math.random() * 200) + 50; // 50-250 file requests
          break;
        case 'push_request':
          value = Math.floor(Math.random() * 50) + 10; // 10-60 push requests
          break;
        default:
          value = Math.floor(Math.random() * 100) + 50;
      }
      
      // Return data in Parse date format
      data.push([
        {
          __type: "Date",
          iso: date.toISOString()
        },
        value
      ]);
    }
    
    return data;
  };
  
  const data = generateExplorerData();
  
  res.json(data);
});

// Analytics Explorer endpoint
app.post('/apps/:appSlug/analytics_explorer', (req, res) => {
  const { appSlug } = req.params;
  const { source, groups, aggregation, from, to } = req.body;
  
  console.log('Analytics Explorer request:', { appSlug, source, groups, aggregation, from, to });
  
  // Generate data based on the query type
  const startTime = from ? new Date(from * 1000) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endTime = to ? new Date(to * 1000) : new Date();
  const points = [];
  
  // Generate daily data points between start and end time
  const daysDiff = Math.ceil((endTime - startTime) / (24 * 60 * 60 * 1000));
  const numPoints = Math.min(daysDiff, 30); // Max 30 data points
  
  for (let i = 0; i < numPoints; i++) {
    const date = new Date(startTime.getTime() + (i * (endTime - startTime) / (numPoints - 1)));
    let value = 0;
    
    // Generate different data patterns based on source
    switch (source) {
      case 'api_request':
        value = Math.floor(Math.random() * 5000) + 1000;
        break;
      case 'push_sent':
        value = Math.floor(Math.random() * 1000) + 100;
        break;
      case 'parse_errors':
        value = Math.floor(Math.random() * 50) + 5;
        break;
      case 'app_opens':
        value = Math.floor(Math.random() * 2000) + 500;
        break;
      default:
        value = Math.floor(Math.random() * 1000) + 100;
    }
    
    points.push([
      { __type: "Date", iso: date.toISOString() },
      value
    ]);
  }
  
  res.json(points);
});

// Performance Analytics endpoint
app.get('/apps/:appSlug/performance', (req, res) => {
  const { performanceType, stride, from, to } = req.query;
  console.log(`Performance request for app: ${req.params.appSlug}`, { performanceType, stride, from, to });
  
  const fromDate = from ? new Date(parseInt(from) * 1000) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(parseInt(to) * 1000) : new Date();
  
  // Generate realistic performance data based on type
  const generatePerformanceData = (type, start, end) => {
    const data = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const current = new Date(start);
    
    while (current <= end) {
      // Use Parse date format: { __type: "Date", iso: "2025-01-01T00:00:00.000Z" }
      const parseDate = {
        __type: "Date",
        iso: current.toISOString()
      };
      let value;
      
      switch (type) {
        case 'total_requests':
          // Total requests: 1000-5000 per day with some variation
          value = Math.floor(1000 + Math.random() * 4000 + Math.sin(current.getTime() / dayMs) * 500);
          break;
        case 'request_limit':
          // Request limit: usually constant at 10000
          value = 10000;
          break;
        case 'dropped_requests':
          // Dropped requests: 0-50 per day, usually low
          value = Math.floor(Math.random() * 50 * Math.random()); // Double random for lower probability
          break;
        case 'served_requests':
          // Served requests: total - dropped
          const total = Math.floor(1000 + Math.random() * 4000 + Math.sin(current.getTime() / dayMs) * 500);
          const dropped = Math.floor(Math.random() * 50 * Math.random());
          value = total - dropped;
          break;
        default:
          value = Math.floor(Math.random() * 1000);
      }
      
      data.push([parseDate, value]);
      current.setDate(current.getDate() + 1);
    }
    
    return data;
  };
  
  // Handle request limit differently (returns array of arrays)
  if (performanceType === 'request_limit') {
    const data = generatePerformanceData(performanceType, fromDate, toDate);
    res.json(data);
    return;
  }
  
  // For other types, return in cached format
  const data = generatePerformanceData(performanceType, fromDate, toDate);
  res.json({
    cached: {
      [performanceType]: data
    },
    success: true,
    generated: new Date().toISOString()
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
        '/apps/:appSlug/slow_queries',
        '/apps/:appSlug/performance'
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
