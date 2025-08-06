#!/bin/bash

echo "🚀 Testing Enhanced Comprehensive Mock Parse Server"
echo "=================================================="

# Test root endpoint
echo "1. Testing root endpoint..."
curl -s http://localhost:1338/ | jq '.'

echo -e "\n2. Testing server info..."
curl -s http://localhost:1338/parse/serverInfo | jq '.'

echo -e "\n3. Testing config..."
curl -s http://localhost:1338/parse/config | jq '.'

echo -e "\n4. Testing schemas..."
curl -s http://localhost:1338/parse/schemas | jq '.results[] | {className: .className, fields: .fields | keys}'

echo -e "\n5. Testing _User class with data..."
curl -s http://localhost:1338/parse/classes/_User | jq '.results[] | {objectId: .objectId, username: .username, email: .email}'

echo -e "\n6. Testing TestClass with data..."
curl -s http://localhost:1338/parse/classes/TestClass | jq '.results[] | {objectId: .objectId, name: .name, description: .description}'

echo -e "\n7. Testing login functionality..."
curl -s -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}' http://localhost:1338/parse/login | jq '{objectId: .objectId, username: .username, sessionToken: .sessionToken}'

echo -e "\n8. Testing user session validation..."
curl -s -H "X-Parse-Session-Token: mock-session-token" http://localhost:1338/parse/users/me | jq '{objectId: .objectId, username: .username}'

echo -e "\n9. Testing jobs..."
curl -s http://localhost:1338/parse/jobs | jq '.'

echo -e "\n10. Testing cloud functions..."
curl -s http://localhost:1338/parse/functions | jq '.'

echo -e "\n11. Testing hooks..."
curl -s http://localhost:1338/parse/hooks/functions | jq '.'

echo -e "\n12. Testing file upload..."
curl -s -X POST -H "Content-Type: application/json" -d '{"content":"test data"}' http://localhost:1338/parse/files/test.txt | jq '.'

echo -e "\n13. Testing health check..."
curl -s http://localhost:1338/parse/health | jq '.'

echo -e "\n✅ All tests completed!"
echo "=================================================="
