#!/bin/bash

# Script to prepare your custom Parse Dashboard with Analytics for distribution

set -e  # Exit on any error

PACKAGE_NAME="parse-dashboard-analytics"
PACKAGE_VERSION="1.0.0"
AUTHOR_NAME="pastordee"

echo "🚀 Preparing custom Parse Dashboard with Analytics..."

# Create a new directory for your custom package
CUSTOM_DIR="custom-parse-dashboard-analytics"
rm -rf "$CUSTOM_DIR"  # Remove if exists
mkdir -p "$CUSTOM_DIR"

echo "📁 Creating package structure..."

# Copy necessary files and directories
cp -r Parse-Dashboard "$CUSTOM_DIR/"
cp -r src "$CUSTOM_DIR/"
cp -r webpack "$CUSTOM_DIR/"
cp -r bin "$CUSTOM_DIR/"
cp -r testing "$CUSTOM_DIR/"
cp package.json "$CUSTOM_DIR/package.json.bak"
cp README.md "$CUSTOM_DIR/"
cp LICENSE "$CUSTOM_DIR/"
cp babel.config.js "$CUSTOM_DIR/"
cp eslint.config.js "$CUSTOM_DIR/"
cp jsconfig.json "$CUSTOM_DIR/"

cd "$CUSTOM_DIR"

echo "🔧 Creating new package.json..."

# Create the new package.json manually
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
    "node": ">=18.20.4 <19.0.0 || >=20.18.0 <21.0.0 || >=22.12.0 <23.0.0"
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
EOF

# Copy dependencies from original package.json
echo "  \"dependencies\": {" >> package.json
grep -A 100 '"dependencies"' package.json.bak | grep -E '^\s*"' | head -n -1 >> package.json
echo "  }," >> package.json

echo "  \"devDependencies\": {" >> package.json  
grep -A 100 '"devDependencies"' package.json.bak | grep -E '^\s*"' | head -n -1 >> package.json
echo "  }," >> package.json

echo "  \"scripts\": {" >> package.json
grep -A 20 '"scripts"' package.json.bak | grep -E '^\s*"' | head -n -1 >> package.json
echo "  }," >> package.json

echo "  \"jest\": {" >> package.json
grep -A 20 '"jest"' package.json.bak | grep -E '^\s*' | grep -v '"jest"' | head -n 10 >> package.json
echo "  }," >> package.json

echo "  \"husky\": {" >> package.json
grep -A 10 '"husky"' package.json.bak | grep -E '^\s*' | grep -v '"husky"' | head -n 5 >> package.json
echo "  }," >> package.json

echo "  \"lint-staged\": {" >> package.json
grep -A 10 '"lint-staged"' package.json.bak | grep -E '^\s*' | grep -v '"lint-staged"' | head -n 5 >> package.json
echo "  }" >> package.json

echo "}" >> package.json

# Clean up
rm package.json.bak

echo "📝 Creating custom README..."

cat > README.md << 'EOF'
# Parse Dashboard Analytics

A beautiful web-based dashboard for managing Parse Server apps with **enhanced analytics capabilities**.

![Parse Dashboard Analytics](https://img.shields.io/badge/Parse-Dashboard-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![Node](https://img.shields.io/badge/node-18%2B-brightgreen)

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

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/pastordee/parse-dashboard-analytics.git
cd parse-dashboard-analytics

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## 🐳 Docker Support

```bash
# Build Docker image
docker build -t parse-dashboard-analytics .

# Run with Docker
docker run -p 4040:4040 -v /path/to/config.json:/app/config.json parse-dashboard-analytics
```

## 📚 Documentation

Visit our [documentation](https://github.com/pastordee/parse-dashboard-analytics/wiki) for detailed guides on:

- Setting up analytics endpoints
- Customizing the dashboard
- Adding custom metrics
- Deploying to production

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the same terms as Parse Dashboard. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on top of the amazing [Parse Dashboard](https://github.com/parse-community/parse-dashboard)
- Enhanced with modern analytics capabilities
- Maintained by the Parse community

## 🔗 Links

- [Parse Platform](https://parseplatform.org)
- [Parse Server](https://github.com/parse-community/parse-server)  
- [Parse Community](https://github.com/parse-community)

---

**Parse Dashboard Analytics** - Making Parse Server management more insightful! 📊✨
EOF

echo "🐳 Creating Docker configuration..."

cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY Parse-Dashboard ./Parse-Dashboard
COPY bin ./bin

# Create config directory
RUN mkdir -p /app/config

# Health check (commented out as curl is not available in alpine by default)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:4040/ || exit 1

EXPOSE 4040

ENTRYPOINT ["node", "Parse-Dashboard/index.js"]
CMD ["--config", "/app/config/parse-dashboard-config.json"]
EOF

cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
EOF

echo "📦 Creating npm publish configuration..."

cat > .npmignore << 'EOF'
# Development files
src/
webpack/
testing/
.git/
.gitignore
.dockerignore
Dockerfile
create-custom-package.sh

# Build artifacts
node_modules/
npm-debug.log*
.npm/

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
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
EOF

echo "🔨 Building the project..."

# Install dependencies
npm install

# Build the project  
npm run build

echo "✅ Package created successfully!"
echo ""
echo "📁 Your custom package is ready in: $CUSTOM_DIR"
echo ""
echo "🚀 Next steps:"
echo "  1. cd $CUSTOM_DIR"
echo "  2. Update the author email in package.json"
echo "  3. Update the repository URLs if needed" 
echo "  4. Test your package: npm start"
echo "  5. Publish to npm: npm publish"
echo ""
echo "🔗 GitHub repository setup:"
echo "  1. Create a new repo: https://github.com/new"
echo "  2. Name it: parse-dashboard-analytics"
echo "  3. git init && git add . && git commit -m 'Initial commit'"
echo "  4. git remote add origin https://github.com/$AUTHOR_NAME/parse-dashboard-analytics.git"
echo "  5. git push -u origin main"
echo ""
echo "📊 Your Parse Dashboard now includes advanced analytics! 🎉"
