# Parse Dashboard Analytics - Quick Reference

A developer-focused quick reference for integrating and using Parse Dashboard Analytics.

## 🚀 Quick Setup (5 minutes)

### 1. Install Package
```bash
npm install parse-dashboard-analytics
```

### 2. Create Config File
```json
{
  "apps": [{
    "serverURL": "http://localhost:1337/parse",
    "appId": "your-app-id", 
    "masterKey": "your-master-key",
    "appName": "My App",
    "analytics": {
      "enabled": true,
      "serverURL": "http://localhost:1339"
    }
  }],
  "users": [{"user": "admin", "pass": "password"}]
}
```

### 3. Start Demo Server & Dashboard
```bash
# Terminal 1: Start demo analytics server
node parse-analytics-demo-server.js

# Terminal 2: Start dashboard
npx parse-dashboard --config parse-dashboard-config.json
```

### 4. Access Analytics
Open `http://localhost:4040` → Navigate to Analytics tab

## 📊 Analytics Components

| Component | Purpose | URL Pattern | Auto-Refresh |
|-----------|---------|-------------|--------------|
| **Overview** | Key metrics dashboard | `/analytics/overview` | ✅ 30s |
| **Retention** | User retention analysis | `/analytics/retention` | ✅ Auto on period change |
| **Performance** | System performance metrics | `/analytics/performance` | ✅ 60s |
| **Slow Queries** | Database optimization | `/analytics/slow-queries` | ✅ 2min |
| **Explorer** | Custom analytics queries | `/analytics/explorer` | Manual |

## 🔧 Configuration Reference

### Analytics Config Structure
```javascript
{
  "analytics": {
    "enabled": true,                    // Enable analytics
    "serverURL": "http://localhost:1339", // Analytics server
    "refreshInterval": 30000,           // Auto-refresh (ms)
    "retentionPeriods": [               // Available periods
      "28_days", "3_months", "6_months", 
      "1_year", "2_years", "5_years"
    ],
    "endpoints": {                      // Custom endpoints
      "overview": "/apps/{appSlug}/analytics_content_audience",
      "retention": "/apps/{appSlug}/analytics_retention",
      "slowQueries": "/apps/{appSlug}/analytics_slow_queries",
      "performance": "/apps/{appSlug}/performance",
      "explorer": "/apps/{appSlug}/analytics_explorer",
      "schema": "/apps/{appSlug}/analytics_schema"
    }
  }
}
```

## 🛠 API Endpoints Reference

### Demo Server Endpoints (localhost:1339)

| Method | Endpoint | Purpose | Parameters |
|--------|----------|---------|------------|
| `GET` | `/apps/:appSlug/analytics_content_audience` | Overview metrics | `audienceType`, `at` |
| `GET` | `/apps/:appSlug/analytics_retention` | Retention data | `date`, `period`, `maxDays` |
| `GET` | `/apps/:appSlug/analytics_slow_queries` | Slow queries | `className`, `os`, `version`, `from`, `to` |
| `GET` | `/apps/:appSlug/performance` | Performance metrics | `performanceType`, `stride`, `from`, `to` |
| `POST` | `/apps/:appSlug/analytics_explorer` | Custom analytics | `endpoint`, `audienceType`, `stride`, `from`, `to` |
| `GET` | `/apps/:appSlug/analytics_schema` | Schema classes | - |

### Response Formats

#### Overview Response
```json
{
  "totalUsers": 15847,
  "dailyActiveUsers": 3421,
  "weeklyActiveUsers": 9234,
  "monthlyActiveUsers": 13456,
  "newUsers": 587,
  "returningUsers": 2834
}
```

#### Retention Response
```json
{
  "content": {
    "days_old_1": {
      "day_1": {"total": 100, "active": 85},
      "day_2": {"total": 100, "active": 72}
    }
  },
  "period": "28_days",
  "maxDays": 28
}
```

## 🎯 Common Use Cases

### 1. Custom Retention Periods
```javascript
// Add custom period in component
const customPeriods = {
  '14_days': { label: '2 Weeks', maxDays: 14 },
  '90_days': { label: '3 Months', maxDays: 90 }
};
```

### 2. Manual Data Refresh
```javascript
// Force refresh in component
handleRefresh = async () => {
  this.setState({ loading: true });
  await this.fetchData();
  this.setState({ loading: false });
};
```

### 3. Custom Analytics URL
```javascript
import { buildAnalyticsUrl } from './lib/AnalyticsConfig';

// Build URL from config
const url = buildAnalyticsUrl('retention', { 
  period: '90_days',
  date: '2025-01-01'
});
```

## 🔍 Debugging Checklist

### Analytics Not Loading?
```bash
# 1. Check server is running
curl http://localhost:1339/parse/health

# 2. Verify configuration
cat parse-dashboard-config.json | grep -A 10 analytics

# 3. Check browser console
# Open DevTools → Console tab

# 4. Test API directly
curl "http://localhost:1339/apps/demo/analytics_content_audience"
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Analytics server not configured` | Missing `analytics.serverURL` | Add `serverURL` to config |
| `Network Error` | Server not running | Start analytics server |
| `Cannot read properties of undefined` | Missing data structure | Check server response format |
| `Loading retention data...` forever | Auto-refresh not working | Check `componentDidUpdate` implementation |

## 📈 Performance Tips

### 1. Optimize Data Loading
```javascript
// Use React.memo for expensive components
const AnalyticsChart = React.memo(({ data }) => {
  return <Chart data={data} />;
});

// Implement proper loading states
{loading ? <Spinner /> : <Analytics data={data} />}
```

### 2. Cache Analytics Data
```javascript
// Simple in-memory cache
const analyticsCache = new Map();

const fetchWithCache = async (endpoint, ttl = 300000) => {
  const cached = analyticsCache.get(endpoint);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetch(endpoint).then(r => r.json());
  analyticsCache.set(endpoint, { data, timestamp: Date.now() });
  return data;
};
```

### 3. Reduce Bundle Size
```javascript
// Import only what you need
import { LineChart } from 'recharts/lib/chart/LineChart';
import { XAxis, YAxis } from 'recharts/lib/cartesian/Axis';

// Use code splitting
const Analytics = lazy(() => import('./Analytics'));
```

## 🚢 Production Deployment

### Environment Variables
```bash
NODE_ENV=production
PORT=4040
ANALYTICS_SERVER_URL=https://your-analytics-server.com
DASHBOARD_USER=admin
DASHBOARD_PASS=secure-password
```

### Production Config Template
```json
{
  "apps": [{
    "serverURL": "https://your-parse-server.com/parse",
    "appId": "$APP_ID",
    "masterKey": "$MASTER_KEY", 
    "appName": "Production App",
    "analytics": {
      "enabled": true,
      "serverURL": "$ANALYTICS_SERVER_URL",
      "refreshInterval": 60000
    }
  }],
  "users": [{"user": "$DASHBOARD_USER", "pass": "$DASHBOARD_PASS"}],
  "useEncryptedPasswords": true,
  "trustProxy": 1
}
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 4040
CMD ["npm", "start"]
```

## 🧪 Testing

### Component Testing
```javascript
import { render, screen } from '@testing-library/react';
import Analytics from './Analytics';

test('renders analytics overview', async () => {
  const mockData = { totalUsers: 1000, dailyActiveUsers: 100 };
  
  render(<Analytics data={mockData} />);
  
  expect(screen.getByText('1,000')).toBeInTheDocument();
  expect(screen.getByText('100')).toBeInTheDocument();
});
```

### API Testing
```javascript
// Test analytics endpoints
describe('Analytics API', () => {
  test('returns overview data', async () => {
    const response = await fetch('/apps/demo/analytics_content_audience');
    const data = await response.json();
    
    expect(data).toHaveProperty('totalUsers');
    expect(data).toHaveProperty('dailyActiveUsers');
  });
});
```

## 📚 Code Examples

### Custom Analytics Component
```javascript
import React, { Component } from 'react';
import { buildAnalyticsUrl } from '../lib/AnalyticsConfig';

class CustomAnalytics extends Component {
  state = { data: null, loading: true, error: null };

  async componentDidMount() {
    await this.fetchData();
  }

  fetchData = async () => {
    try {
      this.setState({ loading: true });
      const url = buildAnalyticsUrl('overview');
      const response = await fetch(url);
      const data = await response.json();
      this.setState({ data, loading: false });
    } catch (error) {
      this.setState({ error, loading: false });
    }
  };

  render() {
    const { data, loading, error } = this.state;
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    
    return (
      <div className="custom-analytics">
        <h2>Custom Analytics</h2>
        <div>Total Users: {data.totalUsers}</div>
        <div>Active Users: {data.dailyActiveUsers}</div>
      </div>
    );
  }
}
```

### Retention Analysis Hook
```javascript
import { useState, useEffect } from 'react';
import { buildAnalyticsUrl } from '../lib/AnalyticsConfig';

export const useRetentionData = (period = '28_days') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRetention = async () => {
      try {
        setLoading(true);
        const url = buildAnalyticsUrl('retention', { period });
        const response = await fetch(url);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRetention();
  }, [period]);

  return { data, loading, error };
};
```

## 📖 Additional Resources

- **Full Documentation**: See `ANALYTICS_GUIDE.md`
- **Source Code**: Browse the repository for implementation details
- **Demo Server**: `parse-analytics-demo-server.js` for complete API examples
- **Configuration**: `AnalyticsConfig.js` for URL building utilities

---

**Quick Links**:
- [NPM Package](https://www.npmjs.com/package/parse-dashboard-analytics)
- [GitHub Repository](https://github.com/pastordee/parse-dashboard)
- [Demo Server Source](./parse-analytics-demo-server.js)
- [Configuration Utility](./src/lib/AnalyticsConfig.js)
