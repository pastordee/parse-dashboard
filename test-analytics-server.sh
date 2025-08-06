#!/bin/bash

# Test Script for Parse Analytics Demo Server
echo "🧪 Testing Parse Analytics Demo Server"
echo "======================================"

# Check if server is running
echo "1. Checking server health..."
curl -s http://localhost:1339/parse/health | jq '.' || echo "❌ Server not running on port 1339"

echo ""
echo "2. Testing serverInfo endpoint..."
curl -s http://localhost:1339/parse/serverInfo | jq '.'

echo ""
echo "3. Testing analytics audience endpoint..."
curl -s "http://localhost:1339/apps/demo/analytics_content_audience?audienceType=total_users&at=1609459200" | jq '.'

echo ""
echo "4. Testing analytics time series endpoint..."  
curl -s "http://localhost:1339/apps/demo/analytics?endpoint=audience&audienceType=daily_users&stride=day" | jq '.requested_data | length'

echo ""
echo "5. Testing billing endpoints..."
curl -s http://localhost:1339/apps/demo/billing_file_storage | jq '.'

echo ""
echo "6. Testing schemas endpoint..."
curl -s http://localhost:1339/parse/schemas | jq '.results | length'

echo ""
echo "✅ Analytics server test complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the analytics demo server: node parse-analytics-demo-server.js"
echo "2. Start Parse Dashboard with: npm run dashboard -- --config analytics-demo-config.json" 
echo "3. Visit http://localhost:4040 to see analytics in action"
