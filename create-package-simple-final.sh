#!/bin/bash

# Script to prepare your custom Parse Dashboard with Analytics for distribution (Simple Version)

set -e  # Exit on any error

PACKAGE_NAME="parse-dashboard-analytics"
PACKAGE_VERSION="1.0.0"
AUTHOR_NAME="pastordee"

echo "🚀 Preparing custom Parse Dashboard with Analytics (Simple Distribution)..."

# Create a new directory for your custom package
CUSTOM_DIR="parse-dashboard-analytics-dist"
rm -rf "$CUSTOM_DIR"  # Remove if exists
mkdir -p "$CUSTOM_DIR"

echo "📁 Creating package structure..."

# Copy necessary files and directories
cp -r Parse-Dashboard "$CUSTOM_DIR/"
cp -r bin "$CUSTOM_DIR/"
cp README.md "$CUSTOM_DIR/"
cp LICENSE "$CUSTOM_DIR/"

cd "$CUSTOM_DIR"

echo "🔧 Creating distribution package.json..."

# Create a simplified package.json for distribution
cat > package.json << 'EOF'
{
  "name": "parse-dashboard-analytics",
  "version": "1.0.0",
  "description": "Parse Dashboard with Enhanced Analytics - A beautiful web-based dashboard for managing Parse Server apps with advanced analytics features",
  "keywords": [
    "parse",
    "dashboard",
    "analytics",
    "parse-server",
    "mongodb",
    "backend",
    "baas",
    "parse-platform"
  ],
  "author": {
    "name": "pastordee",
    "email": "your.email@domain.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/pastordee/parse-dashboard-analytics.git"
  },
  "homepage": "https://github.com/pastordee/parse-dashboard-analytics",
  "bugs": {
    "url": "https://github.com/pastordee/parse-dashboard-analytics/issues"
  },
  "license": "SEE LICENSE IN LICENSE",
  "main": "Parse-Dashboard/app.js",
  "bin": {
    "parse-dashboard-analytics": "./bin/parse-dashboard"
  },
  "files": [
    "Parse-Dashboard",
    "bin",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=14.0.0"
  },
  "parseDashboardFeatures": [
    "Data Browser",
    "Cloud Code Viewer", 
    "Cloud Code Jobs Viewer and Runner",
    "Parse Config",
    "REST API Console",
    "GraphQL API Console",
    "JS Custom Query Console",
    "Class Level Permissions Editor",
    "Pointer Permissions Editor",
    "Send Push Notifications",
    "Logs Viewer",
    "Push Status Page",
    "Relation Editor",
    "Advanced Analytics Dashboard"
  ],
  "dependencies": {
    "bcryptjs": "2.4.3",
    "body-parser": "1.20.2",
    "commander": "9.4.1",
    "connect-flash": "0.1.1",
    "cookie-session": "2.0.0",
    "csurf": "1.11.0",
    "express": "4.18.2",
    "graphiql": "2.0.8",
    "graphql": "16.6.0",
    "inquirer": "8.2.5",
    "js-beautify": "1.14.7",
    "node-fetch": "2.6.7",
    "otpauth": "8.0.3",
    "package-json": "6.5.0",
    "parse": "3.4.4",
    "passport": "0.5.3",
    "passport-local": "1.0.0",
    "prismjs": "1.29.0",
    "qrcode": "1.5.3"
  },
  "scripts": {
    "start": "node ./Parse-Dashboard/index.js",
    "help": "node ./Parse-Dashboard/index.js --help"
  }
}
EOF

echo "📝 Creating README..."

cat > README.md << 'EOF'
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
EOF

echo "📋 Creating a sample config file..."

cat > config.sample.json << 'EOF'
{
  "apps": [
    {
      "serverURL": "https://your-parse-server.com/parse",
      "appId": "YOUR_APP_ID",
      "masterKey": "YOUR_MASTER_KEY",
      "appName": "My Parse App",
      "iconName": "",
      "primaryBackgroundColor": "",
      "secondaryBackgroundColor": ""
    }
  ],
  "iconsFolder": "icons"
}
EOF

echo "📦 Creating npm publish configuration..."

cat > .npmignore << 'EOF'
# Development files
*.sample.json
create-package*.sh

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Coverage
coverage/
.nyc_output/

# Environment
.env*
EOF

echo "✅ Package created successfully!"
echo ""
echo "📁 Your distribution package is ready in: $CUSTOM_DIR"
echo ""
echo "🚀 Next steps:"
echo "  1. cd $CUSTOM_DIR"
echo "  2. Test your package: npm start --config config.sample.json"
echo "  3. Create an npm account: https://www.npmjs.com/signup"
echo "  4. Login: npm login"
echo "  5. Publish to npm: npm publish"
echo ""
echo "🔗 GitHub repository setup (Optional):"
echo "  1. Create a new repo: https://github.com/new"
echo "  2. Name it: parse-dashboard-analytics"
echo "  3. git init && git add . && git commit -m 'Parse Dashboard with Analytics'"
echo "  4. git remote add origin https://github.com/$AUTHOR_NAME/parse-dashboard-analytics.git"
echo "  5. git push -u origin main"
echo ""
echo "📊 Your Parse Dashboard now includes advanced analytics! 🎉"
echo ""
echo "💡 Tips:"
echo "   • Update the author email in package.json before publishing"
echo "   • The built dashboard files are already included"
echo "   • This package can be installed and run immediately"
echo "   • Test locally with: npm pack && npm install -g ./parse-dashboard-analytics-1.0.0.tgz"
