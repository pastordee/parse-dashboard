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
cp README.md "$CUSTOM_DIR/"
cp LICENSE "$CUSTOM_DIR/"
cp babel.config.js "$CUSTOM_DIR/"
cp eslint.config.js "$CUSTOM_DIR/"
cp jsconfig.json "$CUSTOM_DIR/"

cd "$CUSTOM_DIR"

echo "🔧 Creating new package.json..."

# Create the new package.json with all necessary fields
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
  "dependencies": {
    "@babel/runtime": "7.27.4",
    "@babel/runtime-corejs3": "7.27.4",
    "bcryptjs": "3.0.2",
    "body-parser": "2.2.0",
    "commander": "13.1.0",
    "connect-flash": "0.1.1",
    "cookie-session": "2.1.1",
    "copy-to-clipboard": "3.3.3",
    "core-js": "3.42.0",
    "csurf": "1.11.0",
    "express": "4.21.2",
    "fast-deep-equal": "3.1.3",
    "graphiql": "2.0.8",
    "graphql": "16.11.0",
    "immutable": "5.1.3",
    "immutable-devtools": "0.1.5",
    "inquirer": "12.6.3",
    "js-beautify": "1.15.4",
    "node-fetch": "3.3.2",
    "otpauth": "8.0.3",
    "package-json": "7.0.0",
    "parse": "3.5.1",
    "passport": "0.5.3",
    "passport-local": "1.0.0",
    "prismjs": "1.30.0",
    "prop-types": "15.8.1",
    "qrcode": "1.5.4",
    "react": "16.14.0",
    "react-ace": "14.0.1",
    "react-dnd": "10.0.2",
    "react-dnd-html5-backend": "16.0.1",
    "react-dom": "16.14.0",
    "react-draggable": "4.5.0",
    "react-helmet": "6.1.0",
    "react-json-view": "1.21.3",
    "react-popper-tooltip": "4.4.2",
    "react-resizable": "3.0.5",
    "react-router-dom": "6.30.1",
    "regenerator-runtime": "0.14.1"
  },
  "devDependencies": {
    "@actions/core": "1.11.1",
    "@babel/core": "7.27.4",
    "@babel/eslint-parser": "7.28.0",
    "@babel/plugin-proposal-decorators": "7.27.1",
    "@babel/plugin-transform-runtime": "7.28.0",
    "@babel/preset-env": "7.27.2",
    "@babel/preset-react": "7.27.1",
    "@eslint/compat": "1.3.1",
    "@saithodev/semantic-release-backmerge": "4.0.1",
    "@semantic-release/changelog": "6.0.3",
    "@semantic-release/commit-analyzer": "13.0.1",
    "@semantic-release/git": "10.0.1",
    "@semantic-release/github": "11.0.3",
    "@semantic-release/npm": "12.0.1",
    "@semantic-release/release-notes-generator": "14.0.3",
    "@types/jest": "30.0.0",
    "all-node-versions": "13.0.1",
    "babel-loader": "10.0.0",
    "css-loader": "6.7.3",
    "eslint": "9.28.0",
    "eslint-plugin-jest": "29.0.1",
    "eslint-plugin-react": "7.37.5",
    "globals": "16.2.0",
    "http-server": "14.1.1",
    "husky": "9.1.7",
    "jest": "30.0.4",
    "jest-environment-jsdom": "30.0.5",
    "madge": "8.0.0",
    "marked": "15.0.12",
    "null-loader": "4.0.1",
    "prettier": "3.6.2",
    "puppeteer": "24.12.1",
    "react-test-renderer": "16.13.1",
    "request": "2.88.2",
    "request-promise": "4.2.6",
    "sass": "1.89.2",
    "sass-loader": "13.2.0",
    "semantic-release": "24.2.7",
    "semver": "7.7.2",
    "style-loader": "3.3.1",
    "svg-prep": "1.0.4",
    "typescript": "5.8.2",
    "webpack": "5.99.9",
    "webpack-cli": "6.0.1",
    "yaml": "2.8.0"
  },
  "scripts": {
    "ci:check": "node ./ci/ciCheck.js",
    "ci:checkNodeEngine": "node ./ci/nodeEngineCheck.js",
    "dev": "node ./Parse-Dashboard/index.js & webpack --config webpack/build.config.js --devtool eval-source-map --progress --watch",
    "dashboard": "node ./Parse-Dashboard/index.js & webpack --config webpack/build.config.js --progress --watch",
    "pig": "http-server ./PIG -p 4041 -s & webpack --config webpack/PIG.config.js --progress --watch",
    "build": "webpack --node-env=production --config webpack/production.config.js && webpack --config webpack/PIG.config.js",
    "test": "jest",
    "lint": "eslint --cache ./",
    "lint:fix": "DEBUG=eslint:cli-engine eslint --fix --cache ./",
    "prettier": "prettier --write '{src,webpack}/**/*.js'",
    "generate": "node scripts/generate.js",
    "prepare": "webpack --config webpack/publish.config.js --progress",
    "start": "node ./Parse-Dashboard/index.js",
    "madge:circular": "node_modules/.bin/madge ./src --circular",
    "semantic-release": "semantic-release"
  },
  "jest": {
    "roots": [
      "src/lib"
    ],
    "transform": {
      ".*": "<rootDir>/testing/preprocessor.js"
    },
    "moduleNameMapper": {
      "\\.(css|less)$": "<rootDir>/testing/styleMock.js"
    },
    "unmockedModulePathPatterns": [
      "react",
      "react-dom",
      "react-addons-test-utils",
      "fbjs"
    ]
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "{src,webpack}/{**/*,*}.js": [
      "prettier --write",
      "eslint --fix --cache",
      "git add"
    ]
  }
}
EOF

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
src/
webpack/
testing/
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
create-custom-package*.sh

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
.env*

# Other
*.orig
*.rej
*~
EOF

echo "📋 Creating a sample config file..."

cat > sample-config.json << 'EOF'
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

echo "🔨 Installing dependencies and building..."

# Install dependencies
npm install --production

echo "✅ Package created successfully!"
echo ""
echo "📁 Your custom package is ready in: $CUSTOM_DIR"
echo ""
echo "🚀 Next steps:"
echo "  1. cd $CUSTOM_DIR"
echo "  2. Update the author email in package.json"
echo "  3. Update the repository URLs if needed" 
echo "  4. Test your package: npm start --config sample-config.json"
echo "  5. Create an npm account: https://www.npmjs.com/signup"
echo "  6. Login: npm login"
echo "  7. Publish to npm: npm publish"
echo ""
echo "🔗 GitHub repository setup:"
echo "  1. Create a new repo: https://github.com/new"
echo "  2. Name it: parse-dashboard-analytics"
echo "  3. git init && git add . && git commit -m 'Initial commit with analytics dashboard'"
echo "  4. git remote add origin https://github.com/$AUTHOR_NAME/parse-dashboard-analytics.git"
echo "  5. git push -u origin main"
echo ""
echo "📊 Your Parse Dashboard now includes advanced analytics! 🎉"
echo ""
echo "💡 Tip: Before publishing, you can test locally with:"
echo "   npm pack"
echo "   npm install -g ./parse-dashboard-analytics-1.0.0.tgz"
