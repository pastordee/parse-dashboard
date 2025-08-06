# Parse Dashboard Analytics

A beautiful web-based dashboard for managing Parse Server apps with **enhanced analytics capabilities**.

![Parse Dashboard Analytics](https://img.shields.io/badge/Parse-Dashboard-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![Node](https://img.shields.io/badge/node-14%2B-brightgreen)

## ✨ Features

### Standard Parse Dashboard Features
- **Data Browser** - View and edit your app's data
- **Cloud Code** - Manage and run cloud functions  
- **Push Notifications** - Send targeted push notifications
- **Config Management** - Update app configuration
- **API Console** - Test REST and GraphQL APIs
- **User Management** - Handle authentication and permissions
- **Logs Viewer** - Monitor app logs in real-time

### 🆕 Enhanced Analytics Features
- **📊 Comprehensive Analytics Dashboard** - Beautiful overview of key metrics
- **📈 Real-time Metrics** - Track users, requests, and performance
- **🎯 User Engagement Analytics** - Monitor active users and retention
- **🔍 Error Monitoring** - Track and analyze API errors
- **📅 Time-based Filtering** - View data across different time periods
- **📱 Responsive Design** - Works perfectly on mobile and desktop
- **🎨 Modern UI** - Clean, intuitive interface

## 🚀 Quick Start

### Installation

```bash
npm install -g parse-dashboard-analytics
```

### Usage

```bash
# Run with config file
parse-dashboard-analytics --config config.json

# Run with environment variables
parse-dashboard-analytics --appId APP_ID --masterKey MASTER_KEY --serverURL https://your-parse-server.com/parse
```

### Configuration

Create a `config.json` file:

```json
{
  "apps": [
    {
      "serverURL": "https://your-parse-server.com/parse",
      "appId": "YOUR_APP_ID", 
      "masterKey": "YOUR_MASTER_KEY",
      "appName": "My Parse App"
    }
  ],
  "iconsFolder": "icons"
}
```

## 📊 Analytics Features

### Dashboard Overview
- Total Users, Daily/Weekly/Monthly Active Users
- API Request metrics and success rates
- Push notification statistics
- Performance monitoring with response times
- Error rate tracking and distribution

### Visual Components  
- Interactive donut charts for user engagement
- Error distribution visualization
- Trend indicators with percentage changes
- Responsive metric cards
- Time-based filtering options

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the same terms as Parse Dashboard. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on top of the amazing [Parse Dashboard](https://github.com/parse-community/parse-dashboard)
- Enhanced with modern analytics capabilities
- Maintained by the Parse community

---

**Parse Dashboard Analytics** - Making Parse Server management more insightful! 📊✨
