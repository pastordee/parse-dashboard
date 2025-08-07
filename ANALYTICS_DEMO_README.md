# Parse Dashboard Analytics Demo

## 🚀 Quick Start

This Parse Dashboard includes a **custom analytics page** that connects to a **remote analytics server** with automatic fallback to a **local demo server**.

### Current Setup Status ✅

- **Parse Dashboard**: Running on http://localhost:4040
- **Demo Analytics Server**: Running on http://localhost:3001
- **Custom Analytics Page**: `custom-remote-analytics.html`
- **Configuration**: Set up in `parse-dashboard-config.json`

## 📊 How It Works

1. **Primary Connection**: Tries to connect to `192.168.0.138:${ENV.MAIN_PORT}`
2. **Fallback Connection**: If remote server unavailable, automatically connects to `localhost:3001`
3. **Demo Server**: Provides realistic, live-updating analytics data
4. **Auto-refresh**: Updates every 30 seconds

## 🔧 Configuration

Your `parse-dashboard-config.json` is configured to use the custom analytics page:

```json
{
  "apps": [
    {
      "analyticsPage": "/Users/prayercircle/Development/parse-dashboard/parse-dashboard-analytics-dist/custom-remote-analytics.html"
    }
  ]
}
```

## 🖥️ Available Commands

```bash
# Start Parse Dashboard (already running)
npm run dev

# Start Demo Analytics Server (already running)
npm run demo-analytics:3001

# Alternative demo server commands
npm run demo-analytics          # Default port
npm run demo-analytics:remote   # Port 3001 for remote access
```

## 📡 Analytics Server API

The demo server provides these endpoints:

- `GET /api/analytics/overview` - Overall metrics
- `GET /api/analytics/users` - User statistics  
- `GET /api/analytics/performance` - Server performance
- `GET /api/analytics/realtime` - Live data updates
- `GET /health` - Health check

### Example Response:
```json
{
  "timestamp": "2025-08-07T06:41:10.917Z",
  "metrics": {
    "totalUsers": 2905,
    "totalObjects": 15526,
    "apiCalls": 1256,
    "activeSessions": 110
  },
  "changes": {
    "users": "+10.2% this month",
    "objects": "+17.7% this week",
    "api": "+8.9% today",
    "sessions": "+15.8% this hour"
  },
  "source": "live-demo"
}
```

## 🌐 Accessing the Analytics Dashboard

1. **Open Parse Dashboard**: http://localhost:4040
2. **Navigate to your app** in the dashboard
3. **Click on Analytics** - it will load your custom analytics page
4. **View real-time data** from the demo server

## 🔄 Connection Flow

```
┌─────────────────┐    ❌ Unavailable    ┌──────────────────┐
│ Remote Server   │ ──────────────────→ │ Demo Server      │
│ 192.168.0.138   │                     │ localhost:3001   │
└─────────────────┘                     └──────────────────┘
                                                 │
                                                 │ ✅ Connected
                                                 ▼
                                        ┌──────────────────┐
                                        │ Analytics        │
                                        │ Dashboard        │
                                        └──────────────────┘
```

## 🎯 Next Steps

1. **Deploy your analytics server** to `192.168.0.138` with the same API endpoints
2. **Update the port** in the custom analytics page if needed
3. **Customize the dashboard** styling and metrics as desired
4. **Add authentication** if required for your production server

## 🛠️ Customization

The custom analytics page is fully customizable:
- **Styling**: Modify the CSS in `custom-remote-analytics.html`
- **Metrics**: Add new metric cards and charts
- **Endpoints**: Update API endpoints to match your server
- **Refresh Rate**: Change the 30-second auto-refresh interval

## 📝 Files Created

- `demo-analytics-server.js` - Demo analytics server
- `custom-remote-analytics.html` - Custom analytics dashboard
- Updated `package.json` with demo server scripts
- Updated `parse-dashboard-config.json` with analytics page configuration

Your analytics demo is now fully functional! 🚀
