# Installation Guide - Parse Dashboard Analytics

Simple installation and setup instructions for the NPM package.

## 📦 NPM Installation

### Quick Install
```bash
npm install parse-dashboard-analytics
```

### Global Install (Optional)
```bash
npm install -g parse-dashboard-analytics
```

## 🚀 Basic Setup

### 1. Create Configuration File
Create `parse-dashboard-config.json` in your project directory:

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

### 2. Download Demo Server (Development)
For testing and development, download the analytics demo server:

```bash
curl -o parse-analytics-demo-server.js https://raw.githubusercontent.com/pastordee/parse-dashboard/main/parse-analytics-demo-server.js
npm install express cors
```

### 3. Start Demo Server
```bash
node parse-analytics-demo-server.js
```

### 4. Start Dashboard
```bash
npx parse-dashboard --config parse-dashboard-config.json
```

### 5. Access Analytics
Open `http://localhost:4040` and navigate to the Analytics section.

## 🔧 Package Contents

When you install `parse-dashboard-analytics`, you get:

- **Complete Parse Dashboard** with analytics integration
- **Production builds** optimized for performance  
- **CLI tool** for easy server management
- **Analytics components** ready to use

## 📁 Directory Structure

After installation, your NPM package contains:

```
node_modules/parse-dashboard-analytics/
├── Parse-Dashboard/          # Main dashboard application
│   ├── app.js               # Express server
│   ├── public/              # Built assets
│   └── ...
├── bin/
│   └── parse-dashboard      # CLI executable
├── package.json
└── README.md
```

## 🌐 Production Setup

### Environment Variables
```bash
export NODE_ENV=production
export PORT=4040
export ANALYTICS_SERVER_URL=https://your-analytics-server.com
```

### Production Configuration
```json
{
  "apps": [{
    "serverURL": "https://your-parse-server.com/parse",
    "appId": "production-app-id",
    "masterKey": "production-master-key",
    "appName": "Production App",
    "analytics": {
      "enabled": true,
      "serverURL": "https://your-analytics-server.com",
      "refreshInterval": 60000
    }
  }],
  "users": [{"user": "admin", "pass": "secure-password"}],
  "useEncryptedPasswords": true,
  "trustProxy": 1
}
```

## 🔗 Integration with Existing Parse Server

To integrate with your existing Parse Server, implement these analytics endpoints:

### Required Endpoints
- `GET /apps/:appSlug/analytics_content_audience` - Overview metrics
- `GET /apps/:appSlug/analytics_retention` - Retention data  
- `GET /apps/:appSlug/analytics_slow_queries` - Performance data
- `GET /apps/:appSlug/performance` - System metrics
- `POST /apps/:appSlug/analytics_explorer` - Custom queries

### Example Implementation
```javascript
// In your Parse Server
app.get('/apps/:appSlug/analytics_content_audience', (req, res) => {
  // Implement your analytics logic
  res.json({
    totalUsers: await getUserCount(),
    dailyActiveUsers: await getDailyActiveUsers(),
    // ... other metrics
  });
});
```

## 📚 Next Steps

1. **Learn More**: Read the [Complete Guide](ANALYTICS_GUIDE.md)
2. **Quick Reference**: Check the [Developer Reference](QUICK_REFERENCE.md)  
3. **Tutorial**: Follow the [Step-by-Step Tutorial](TUTORIAL.md)
4. **Demo**: Explore with the included demo server

## 💡 Tips

- **Development**: Use the demo server for testing and development
- **Production**: Implement real analytics endpoints in your Parse Server
- **Customization**: Modify configuration to match your needs
- **Security**: Use encrypted passwords and HTTPS in production

## 🆘 Need Help?

- **Issues**: Check the [Troubleshooting](QUICK_REFERENCE.md#troubleshooting) section
- **Questions**: Read the [FAQ](ANALYTICS_GUIDE.md#troubleshooting)
- **Support**: Open an issue on GitHub

---

**Package Version**: 1.1.2  
**Compatibility**: Parse Server 6.0+, Node.js 18+
