# Parse Dashboard Analytics - Step-by-Step Tutorial

A hands-on tutorial to get you up and running with Parse Dashboard Analytics in under 15 minutes.

## Prerequisites

- Node.js 18+ installed
- Basic knowledge of Parse Server
- Command line familiarity

## Tutorial Overview

By the end of this tutorial, you'll have:
- ✅ A working Parse Dashboard with analytics
- ✅ A demo server providing realistic data
- ✅ Understanding of all analytics components
- ✅ Knowledge of customization options

**Estimated Time**: 15 minutes

---

## What You'll Build

By following this tutorial, you'll create a fully functional analytics dashboard:

![Complete Analytics Dashboard](https://github.com/pastordee/parse-dashboard/blob/pc_link_with_parse_server/analytic_image/1.png)
*The complete analytics dashboard you'll have running in 15 minutes*

---

## Step 1: Installation (2 minutes)

### Option A: Use NPM Package (Recommended)

```bash
# Create a new directory for your project
mkdir my-analytics-dashboard
cd my-analytics-dashboard

# Install the package
npm install parse-dashboard-analytics

# Verify installation
npx parse-dashboard --help
```

### Option B: Clone Repository

```bash
# Clone the repository
git clone https://github.com/pastordee/parse-dashboard.git
cd parse-dashboard

# Install dependencies
npm install

# Build the project
npm run build
```

**✅ Checkpoint**: You should see help text for the parse-dashboard command.

---

## Step 2: Configuration Setup (3 minutes)

### Create Configuration File

Create a file named `parse-dashboard-config.json`:

```json
{
  "apps": [
    {
      "serverURL": "http://localhost:1337/parse",
      "appId": "analytics-demo-app",
      "masterKey": "demo-master-key",
      "appName": "Analytics Demo",
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

### Download Demo Server

If you used the NPM package, download the demo server:

```bash
# Download the demo server file
curl -o parse-analytics-demo-server.js https://raw.githubusercontent.com/pastordee/parse-dashboard/main/parse-analytics-demo-server.js

# Install required dependencies
npm install express cors
```

**✅ Checkpoint**: You should have `parse-dashboard-config.json` and `parse-analytics-demo-server.js` files.

---

## Step 3: Start the Demo Server (1 minute)

Open a new terminal window and start the analytics demo server:

```bash
# Start the demo server
node parse-analytics-demo-server.js
```

You should see output like:
```
🚀 Parse Analytics Demo Server running on http://localhost:1339

📊 Analytics endpoints ready:
   - Overview: http://localhost:1339/apps/demo/analytics_content_audience
   - Time series: http://localhost:1339/apps/demo/analytics
   - Billing: http://localhost:1339/apps/demo/billing_file_storage

🔧 Configure Parse Dashboard with:
   - Server URL: http://localhost:1339/parse
   - App ID: analytics-demo-app
   - Master Key: your-master-key-here
```

### Test the Demo Server

In another terminal, test that the server is working:

```bash
# Test overview endpoint
curl "http://localhost:1339/apps/analytics-demo-app/analytics_content_audience"

# You should see JSON response with user metrics
```

**✅ Checkpoint**: Demo server is running and responding to requests.

---

## Step 4: Start Parse Dashboard (1 minute)

In your main terminal (not the one running the demo server):

```bash
# If using NPM package
npx parse-dashboard --config parse-dashboard-config.json

# If using cloned repository
npm start -- --config parse-dashboard-config.json
```

You should see:
```
Parse Dashboard running on port 4040.
```

**✅ Checkpoint**: Dashboard is accessible at `http://localhost:4040`.

---

## Step 5: Access Analytics Dashboard (2 minutes)

1. **Open Browser**: Navigate to `http://localhost:4040`

2. **Login**: Use credentials from your config:
   - Username: `admin`
   - Password: `password`

3. **Select App**: Click on "Analytics Demo" app

4. **Navigate to Analytics**: Look for the "Analytics" tab in the navigation

5. **Explore Components**:
   - **Overview**: See total users, active users, and trends
   - **Retention**: View user retention analysis
   - **Performance**: Monitor system performance
   - **Slow Queries**: Identify database bottlenecks

![Analytics Navigation](https://github.com/pastordee/parse-dashboard/blob/pc_link_with_parse_server/analytic_image/1.png)
*The analytics dashboard showing all available components*

**✅ Checkpoint**: You can see analytics data and navigate between different analytics views.

---

## Step 6: Understanding the Components (3 minutes)

### Overview Dashboard
![App Overview](https://github.com/pastordee/parse-dashboard/blob/pc_link_with_parse_server/analytic_image/2.png)
- **Purpose**: High-level KPIs and metrics
- **Refresh**: Automatically updates every 30 seconds
- **Data**: User counts, installation metrics, trends

### Retention Analysis
![Retention Matrix](https://github.com/pastordee/parse-dashboard/blob/pc_link_with_parse_server/analytic_image/5.png
- **Purpose**: Track how users return over time
- **Features**: 
  - Multiple time periods (28 days to 5 years)
  - Automatic refresh when period changes
  - Visual retention curves
- **Try**: Change the time period and watch data auto-refresh

### Performance Monitor
![Performance Charts](https://github.com/pastordee/parse-dashboard/blob/pc_link_with_parse_server/analytic_image/4.png)
- **Purpose**: System performance tracking
- **Metrics**: Response times, error rates, throughput
- **Charts**: Real-time performance visualization

### Slow Queries
![Slow Query Analysis](https://github.com/pastordee/parse-dashboard/blob/pc_link_with_parse_server/analytic_image/6.png)
- **Purpose**: Database optimization
- **Features**: Query analysis, class filtering, performance recommendations
- **Use Case**: Identify slow database operations

### Explorer Tool
![Explorer Interface](https://github.com/pastordee/parse-dashboard/blob/pc_link_with_parse_server/analytic_image/3.png)
- **Purpose**: Custom analytics queries
- **Features**: Flexible date ranges, multiple query types
- **Use Case**: Build custom reports and analyze specific metrics

**✅ Checkpoint**: You understand what each analytics component does.

---

## Step 7: Customization Example (3 minutes)

Let's customize the retention periods to see how configuration works.

### Modify Configuration

Edit your `parse-dashboard-config.json` to add custom retention periods:

```json
{
  "apps": [
    {
      "serverURL": "http://localhost:1337/parse",
      "appId": "analytics-demo-app", 
      "masterKey": "demo-master-key",
      "appName": "Analytics Demo",
      "analytics": {
        "enabled": true,
        "serverURL": "http://localhost:1339",
        "retentionPeriods": [
          "28_days",
          "3_months", 
          "6_months",
          "1_year"
        ],
        "refreshInterval": 15000
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

### Restart Dashboard

```bash
# Stop the dashboard (Ctrl+C) and restart
npx parse-dashboard --config parse-dashboard-config.json
```

### Test Changes

1. Go back to the retention analytics page
2. Notice the refresh interval is now 15 seconds (faster)
3. Check available retention periods

**✅ Checkpoint**: You've successfully customized the analytics configuration.

---

## Step 8: Production Preparation (Optional)

### Environment Variables

Create a `.env` file for production:

```bash
NODE_ENV=production
PORT=4040
ANALYTICS_SERVER_URL=https://your-analytics-server.com
DASHBOARD_USER=admin
DASHBOARD_PASS=secure-password-here
APP_ID=your-production-app-id
MASTER_KEY=your-production-master-key
SERVER_URL=https://your-parse-server.com/parse
```

### Production Configuration

Create `parse-dashboard-config.production.json`:

```json
{
  "apps": [
    {
      "serverURL": "$SERVER_URL",
      "appId": "$APP_ID",
      "masterKey": "$MASTER_KEY",
      "appName": "Production App",
      "analytics": {
        "enabled": true,
        "serverURL": "$ANALYTICS_SERVER_URL",
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

**✅ Checkpoint**: You understand how to configure for production.

---

## Next Steps & Advanced Features

### 1. Real Parse Server Integration

Replace the demo server with your actual Parse Server:

```json
{
  "analytics": {
    "serverURL": "https://your-parse-server.com"
  }
}
```

### 2. Custom Analytics Endpoints

Implement your own analytics endpoints:

```javascript
// In your Parse Server
app.get('/apps/:appSlug/custom_analytics', (req, res) => {
  // Your custom analytics logic
  res.json({ customMetric: calculateCustomMetric() });
});
```

### 3. Advanced Retention Analysis

Configure custom retention periods:

```json
{
  "analytics": {
    "customPeriods": {
      "14_days": { "label": "2 Weeks", "maxDays": 14 },
      "quarter": { "label": "Quarter", "maxDays": 90 },
      "half_year": { "label": "6 Months", "maxDays": 180 }
    }
  }
}
```

### 4. Performance Optimization

For large datasets, implement caching:

```javascript
// Server-side caching
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

app.get('/analytics/overview', (req, res) => {
  const cached = cache.get('overview');
  if (cached) return res.json(cached);
  
  const data = generateOverviewData();
  cache.set('overview', data);
  res.json(data);
});
```

### 5. Real-time Updates

Implement WebSocket for real-time analytics:

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  // Send real-time analytics updates
  setInterval(() => {
    ws.send(JSON.stringify({
      type: 'analytics_update',
      data: getCurrentMetrics()
    }));
  }, 5000);
});
```

---

## Troubleshooting Common Issues

### Issue 1: "Analytics not configured"

**Problem**: Analytics tab is missing or shows configuration error.

**Solution**:
```bash
# Check your configuration file
cat parse-dashboard-config.json | grep -A 5 analytics

# Ensure analytics.enabled is true
# Ensure analytics.serverURL is correct
```

### Issue 2: "Network Error" in analytics

**Problem**: Analytics components show network errors.

**Solution**:
```bash
# Verify demo server is running
curl http://localhost:1339/parse/health

# Check server logs for errors
# Ensure CORS is properly configured
```

### Issue 3: Data not refreshing

**Problem**: Analytics show stale data.

**Solution**:
- Check `refreshInterval` in configuration
- Verify automatic refresh is enabled
- Check browser console for JavaScript errors

### Issue 4: Demo server not starting

**Problem**: `node parse-analytics-demo-server.js` fails.

**Solution**:
```bash
# Install missing dependencies
npm install express cors

# Check if port 1339 is available
lsof -i :1339

# Try a different port
PORT=1340 node parse-analytics-demo-server.js
```

---

## What You've Learned

✅ **Installation**: How to install and set up Parse Dashboard Analytics  
✅ **Configuration**: How to configure analytics endpoints and options  
✅ **Components**: Understanding of all analytics components and their purposes  
✅ **Demo Server**: How to use the demo server for development and testing  
✅ **Customization**: How to modify configuration for your needs  
✅ **Production**: Best practices for production deployment  
✅ **Troubleshooting**: Common issues and their solutions  

## Resources for Continued Learning

- **Full Documentation**: `ANALYTICS_GUIDE.md` - Comprehensive reference
- **Quick Reference**: `QUICK_REFERENCE.md` - Developer cheat sheet
- **Source Code**: Browse the repository for implementation details
- **Demo Server**: Study `parse-analytics-demo-server.js` for API patterns
- **NPM Package**: [parse-dashboard-analytics](https://www.npmjs.com/package/parse-dashboard-analytics)

---

**Congratulations!** 🎉 You now have a fully functional Parse Dashboard with analytics capabilities. The foundation is set for building powerful insights into your Parse applications.
