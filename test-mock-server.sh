#!/bin/bash

# Test script for comprehensive mock Parse Server
SERVER_URL="http://localhost:1338"

echo "Testing Mock Parse Server at $SERVER_URL"
echo "========================================="

# Test server info
echo -e "\n1. Testing /parse/serverInfo:"
curl -s -X GET "$SERVER_URL/parse/serverInfo" | jq '.' || curl -s -X GET "$SERVER_URL/parse/serverInfo"

# Test config
echo -e "\n2. Testing /parse/config:"
curl -s -X GET "$SERVER_URL/parse/config" | jq '.' || curl -s -X GET "$SERVER_URL/parse/config"

# Test health
echo -e "\n3. Testing /parse/health:"
curl -s -X GET "$SERVER_URL/parse/health" | jq '.' || curl -s -X GET "$SERVER_URL/parse/health"

# Test schemas
echo -e "\n4. Testing /parse/schemas:"
curl -s -X GET "$SERVER_URL/parse/schemas" | jq '.' || curl -s -X GET "$SERVER_URL/parse/schemas"

# Test classes
echo -e "\n5. Testing /parse/classes/TestClass:"
curl -s -X GET "$SERVER_URL/parse/classes/TestClass" | jq '.' || curl -s -X GET "$SERVER_URL/parse/classes/TestClass"

# Test jobs
echo -e "\n6. Testing /parse/jobs:"
curl -s -X GET "$SERVER_URL/parse/jobs" | jq '.' || curl -s -X GET "$SERVER_URL/parse/jobs"

# Test functions
echo -e "\n7. Testing /parse/functions:"
curl -s -X GET "$SERVER_URL/parse/functions" | jq '.' || curl -s -X GET "$SERVER_URL/parse/functions"

# Test hooks
echo -e "\n8. Testing /parse/hooks/functions:"
curl -s -X GET "$SERVER_URL/parse/hooks/functions" | jq '.' || curl -s -X GET "$SERVER_URL/parse/hooks/functions"

# Test batch
echo -e "\n9. Testing /parse/batch:"
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"requests":[{"method":"GET","path":"/parse/schemas"}]}' \
  "$SERVER_URL/parse/batch" | jq '.' || curl -s -X POST -H "Content-Type: application/json" \
  -d '{"requests":[{"method":"GET","path":"/parse/schemas"}]}' \
  "$SERVER_URL/parse/batch"

# Test file upload
echo -e "\n10. Testing /parse/files/test.txt:"
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"data":"test content"}' \
  "$SERVER_URL/parse/files/test.txt" | jq '.' || curl -s -X POST -H "Content-Type: application/json" \
  -d '{"data":"test content"}' \
  "$SERVER_URL/parse/files/test.txt"

echo -e "\n========================================="
echo "All tests completed!"
