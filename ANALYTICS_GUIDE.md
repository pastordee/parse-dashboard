# Parse Dashboard Analytics - Comprehensive Guide

A complete analytics solution for Parse Server applications, providing real-time insights into user behavior, performance metrics, retention analysis, and more.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Analytics Components](#analytics-components)
- [Demo Server Setup](#demo-server-setup)
- [Production Deployment](#production-deployment)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## Overview

Parse Dashboard Analytics extends the standard Parse Dashboard with comprehensive analytics capabilities, including:

- **Real-time Metrics**: Live user, installation, and performance data
- **Retention Analysis**: User retention tracking with configurable time periods
- **Performance Monitoring**: Slow query detection and optimization insights
- **Trend Analysis**: Historical data visualization and trend identification
- **Custom Analytics**: Extensible framework for custom metrics

## Features

### 📊 Core Analytics
- **Overview Dashboard**: Key metrics at a glance
- **User Analytics**: Active users, new registrations, retention rates
- **Installation Tracking**: Device installations and platform distribution
- **Performance Metrics**: API response times, error rates, throughput

### 📈 Advanced Analytics
- **Retention Analysis**: Configurable periods from 28 days to 5 years
- **Slow Query Detection**: Identify and optimize database bottlenecks
- **Trend Visualization**: Interactive charts and graphs
- **Real-time Updates**: Live data refresh and automatic updates

### 🔧 Developer Features
- **Easy Integration**: Drop-in replacement for standard Parse Dashboard
- **Flexible Configuration**: Centralized configuration management
- **Demo Server**: Complete mock server for testing and development
- **Production Ready**: Optimized builds and deployment options

## Installation

### Option 1: NPM Package (Recommended)

```bash
npm install parse-dashboard-analytics
```

### Option 2: Clone Repository

```bash
git clone https://github.com/pastordee/parse-dashboard.git
cd parse-dashboard
npm install
```

## Quick Start

### 1. Basic Setup

Create a configuration file `parse-dashboard-config.json`:

```json
{
  "apps": [
    {
      "serverURL": "http://localhost:1337/parse",
      "appId": "your-app-id",
      "masterKey": "your-master-key",
      "appName": "My App",
      "analytics": {
        "enabled": true,
        "serverURL": "http://localhost:1339"
      }
    }
  ],
  "users": [
    {
      "user": "admin",
      "pass": "password"
    }
  ]
}
```

### 2. Start the Dashboard

```bash
# Using NPM package
npx parse-dashboard --config parse-dashboard-config.json

# Using cloned repository
npm start
```

### 3. Access Analytics

Open your browser to `http://localhost:4040` and navigate to the Analytics section.

## Configuration

### Dashboard Configuration

The analytics system uses centralized configuration through `parse-dashboard-config.json`:

```json
{
  "apps": [
    {
      "serverURL": "http://localhost:1337/parse",
      "appId": "myapp",
      "masterKey": "master-key",
      "appName": "My Application",
      "analytics": {
        "enabled": true,
        "serverURL": "http://localhost:1339",
        "endpoints": {
          "overview": "/apps/myapp/analytics_content_audience",
          "retention": "/apps/myapp/analytics_retention",
          "slowQueries": "/apps/myapp/analytics_slow_queries",
          "performance": "/apps/myapp/performance",
          "explorer": "/apps/myapp/analytics_explorer",
          "schema": "/apps/myapp/analytics_schema"
        }
      }
    }
  ],
  "users": [
    {
      "user": "admin",
      "pass": "secure-password",
      "apps": [{"appId": "myapp"}]
    }
  ],
  "useEncryptedPasswords": true,
  "trustProxy": 1
}
```

### Analytics Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable/disable analytics |
| `serverURL` | string | - | Analytics server endpoint |
| `endpoints` | object | - | Custom endpoint mappings |
| `refreshInterval` | number | `30000` | Auto-refresh interval (ms) |
| `retentionPeriods` | array | `['28_days', '3_months', '6_months', '1_year', '2_years', '5_years']` | Available retention periods |

## Analytics Components

### 1. Overview Dashboard

**Purpose**: High-level metrics and KPIs

**Features**:
- Total and active users
- Installation metrics
- Trend indicators
- Quick health check

**Usage**:
```javascript
// Access via: /dashboard/analytics/overview
// Automatically refreshes every 30 seconds
```

### 2. Retention Analysis

**Purpose**: User retention tracking and analysis

**Features**:
- Configurable time periods (28 days to 5 years)
- Cohort analysis
- Automatic data refresh
- Visual retention curves

**Configuration**:
```json
{
  "analytics": {
    "retention": {
      "periods": ["28_days", "3_months", "6_months", "1_year", "2_years", "5_years"],
      "defaultPeriod": "28_days",
      "autoRefresh": true
    }
  }
}
```

**Available Periods**:
- **28 days**: Daily granularity, perfect for mobile apps
- **3 months**: Weekly trends, good for SaaS applications
- **6 months**: Monthly patterns, ideal for e-commerce
- **1 year**: Quarterly analysis, great for enterprise
- **2 years**: Long-term trends, subscription services
- **5 years**: Historical analysis, mature products

### 3. Performance Monitor

**Purpose**: Database and API performance tracking

**Features**:
- Slow query detection
- Response time monitoring
- Error rate tracking
- Performance bottleneck identification

**Metrics**:
- Average response time
- P95/P99 percentiles
- Error rates by endpoint
- Database query performance

### 4. Slow Queries Analyzer

**Purpose**: Database optimization insights

**Features**:
- Query performance analysis
- Class-based filtering
- Platform-specific metrics
- Optimization recommendations

**Sample Output**:
```javascript
{
  "slowQueries": [
    {
      "className": "User",
      "query": "where={\"status\":\"active\"}",
      "count": 1247,
      "slowPercent": "15.2%",
      "timeouts": 3,
      "scannedAvg": "2,345",
      "medianMs": 234,
      "p90Ms": 456
    }
  ]
}
```

### 5. Explorer Tool

**Purpose**: Custom analytics queries and exploration

**Features**:
- Custom time range selection
- Multiple data sources
- Flexible aggregation
- Export capabilities

## Demo Server Setup

For development and testing, use the included demo server:

### 1. Start Demo Server

```bash
# From the project directory
node parse-analytics-demo-server.js
```

The server will start on `http://localhost:1339` with comprehensive mock data.

### 2. Demo Server Features

- **Realistic Data**: Generates believable analytics data
- **Full API Coverage**: All analytics endpoints implemented
- **CORS Enabled**: Works with development setups
- **Logging**: Detailed request/response logging

### 3. Available Endpoints

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `/apps/:appSlug/analytics_content_audience` | User metrics | Overview data |
| `/apps/:appSlug/analytics_retention` | Retention analysis | Cohort data |
| `/apps/:appSlug/analytics_slow_queries` | Performance | Slow queries |
| `/apps/:appSlug/performance` | System performance | Response times |
| `/apps/:appSlug/analytics_explorer` | Custom queries | Flexible analytics |
| `/apps/:appSlug/analytics_schema` | Schema info | Class definitions |

### 4. Mock Data Characteristics

The demo server generates realistic data patterns:

- **User Growth**: Organic growth patterns with seasonal variations
- **Retention Curves**: Realistic retention drop-off patterns
- **Performance Metrics**: Variable response times with occasional spikes
- **Error Rates**: Low but realistic error patterns

## Production Deployment

### 1. Environment Setup

```bash
# Install production dependencies
npm install --production

# Build optimized assets
npm run build

# Set environment variables
export NODE_ENV=production
export PORT=4040
export ANALYTICS_SERVER_URL=https://your-analytics-server.com
```

### 2. Server Configuration

```json
{
  "apps": [
    {
      "serverURL": "https://your-parse-server.com/parse",
      "appId": "production-app-id",
      "masterKey": "production-master-key",
      "appName": "Production App",
      "analytics": {
        "enabled": true,
        "serverURL": "https://your-analytics-server.com",
        "refreshInterval": 60000
      }
    }
  ],
  "users": [
    {
      "user": "$DASHBOARD_USER",
      "pass": "$DASHBOARD_PASS"
    }
  ],
  "useEncryptedPasswords": true,
  "trustProxy": 1
}
```

### 3. Analytics Server Requirements

Your production analytics server should implement:

- **Authentication**: Secure API endpoints
- **Rate Limiting**: Prevent abuse
- **Caching**: Optimize performance
- **Monitoring**: Track server health

### 4. Deployment Options

#### Option A: Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 4040
CMD ["npm", "start"]
```

#### Option B: Process Manager (PM2)

```json
{
  "apps": [{
    "name": "parse-dashboard-analytics",
    "script": "Parse-Dashboard/index.js",
    "env": {
      "NODE_ENV": "production",
      "PORT": 4040
    }
  }]
}
```

## API Reference

### Analytics Configuration

The `AnalyticsConfig.js` utility provides centralized endpoint management:

```javascript
import { buildAnalyticsUrl, getAnalyticsConfig } from './lib/AnalyticsConfig';

// Get configured analytics URL
const overviewUrl = buildAnalyticsUrl('overview');
const retentionUrl = buildAnalyticsUrl('retention');

// Get full analytics configuration
const config = getAnalyticsConfig();
```

### Component Integration

Analytics components automatically integrate with the dashboard:

```javascript
// In your React component
import { fetchAnalyticsData } from './lib/AnalyticsAPI';

class MyAnalyticsComponent extends React.Component {
  async fetchData() {
    try {
      const data = await fetchAnalyticsData('overview');
      this.setState({ data, loading: false });
    } catch (error) {
      this.setState({ error, loading: false });
    }
  }
}
```

### Custom Analytics Endpoints

Extend the analytics system with custom endpoints:

```javascript
// In your analytics server
app.get('/apps/:appSlug/custom_analytics', (req, res) => {
  const { metric, period, filters } = req.query;
  
  // Your custom analytics logic
  const data = generateCustomMetrics(metric, period, filters);
  
  res.json({
    content: data,
    success: true,
    generated: new Date().toISOString()
  });
});
```

## Troubleshooting

### Common Issues

#### 1. Analytics Not Loading

**Symptoms**: Empty analytics pages, loading states persist

**Solutions**:
```bash
# Check configuration
cat parse-dashboard-config.json | grep -A 5 analytics

# Verify server connectivity
curl http://localhost:1339/apps/demo/analytics_content_audience

# Check browser console for errors
# Open DevTools → Console
```

#### 2. Data Not Refreshing

**Symptoms**: Stale data, no automatic updates

**Solutions**:
```javascript
// Check auto-refresh configuration
{
  "analytics": {
    "refreshInterval": 30000  // 30 seconds
  }
}

// Force refresh in component
this.componentDidMount = () => {
  this.fetchData();
  setInterval(this.fetchData, 30000);
}
```

#### 3. Slow Query Performance

**Symptoms**: Long loading times, timeouts

**Solutions**:
```bash
# Optimize server response
# Add caching layer
# Reduce data payload size
# Implement pagination
```

### Debug Mode

Enable debug logging:

```bash
# Environment variable
export DEBUG=parse-dashboard:analytics

# Or in configuration
{
  "analytics": {
    "debug": true,
    "logLevel": "verbose"
  }
}
```

### Health Checks

Monitor system health:

```bash
# Check analytics server health
curl http://localhost:1339/parse/health

# Verify dashboard connectivity
curl http://localhost:4040/health

# Test authentication
curl -H "X-Parse-Application-Id: your-app-id" \
     -H "X-Parse-Master-Key: your-master-key" \
     http://localhost:1339/parse/serverInfo
```

## Advanced Usage

### Custom Retention Periods

Define custom retention analysis periods:

```javascript
// In retention component configuration
const customPeriods = {
  '14_days': { label: '2 Weeks', days: 14 },
  '60_days': { label: '2 Months', days: 60 },
  '18_months': { label: '1.5 Years', days: 548 }
};
```

### Performance Optimization

Optimize analytics performance:

```javascript
// Implement caching
const cacheConfig = {
  overview: { ttl: 300 },      // 5 minutes
  retention: { ttl: 3600 },    // 1 hour
  performance: { ttl: 60 }     // 1 minute
};

// Use data compression
app.use(compression());

// Implement pagination
const paginatedQuery = {
  limit: 100,
  skip: page * 100
};
```

### Custom Visualizations

Add custom charts and visualizations:

```javascript
import { LineChart, BarChart, PieChart } from 'recharts';

const CustomAnalytics = ({ data }) => (
  <div className="custom-analytics">
    <LineChart data={data.timeSeries} />
    <BarChart data={data.distribution} />
    <PieChart data={data.breakdown} />
  </div>
);
```

### Real-time Analytics

Implement real-time data updates:

```javascript
// WebSocket connection
const ws = new WebSocket('ws://localhost:1339/realtime');

ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === 'analytics_update') {
    this.setState({ liveData: data });
  }
};

// Server-sent events
const eventSource = new EventSource('/analytics/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  this.updateAnalytics(data);
};
```

### Integration with External Services

Connect with external analytics platforms:

```javascript
// Google Analytics integration
gtag('event', 'custom_analytics_view', {
  event_category: 'Analytics',
  event_label: 'Dashboard View'
});

// Mixpanel integration
mixpanel.track('Analytics Dashboard', {
  component: 'retention',
  period: '28_days'
});

// Custom webhook integration
fetch('/webhook/analytics', {
  method: 'POST',
  body: JSON.stringify({ metrics: data })
});
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: This guide and inline code comments
- **Issues**: GitHub issues for bug reports and feature requests
- **Community**: Join our Discord server for real-time support
- **Enterprise**: Contact us for enterprise support options

---

**Version**: 1.1.2  
**Last Updated**: January 2025  
**Compatibility**: Parse Server 6.0+, Node.js 18+
