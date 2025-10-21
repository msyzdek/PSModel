#!/bin/bash

# Test holders endpoint with authentication

echo "Testing Holders API with Authentication..."
echo ""

# Login and get cookie
echo "1. Logging in..."
COOKIE_FILE=$(mktemp)
LOGIN_RESPONSE=$(curl -s -c $COOKIE_FILE -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')

echo "Login response: $LOGIN_RESPONSE"
echo ""

# Test holders endpoint with cookie
echo "2. Testing GET /api/holders with cookie..."
HOLDERS_RESPONSE=$(curl -s -b $COOKIE_FILE -X GET "http://localhost:8000/api/holders?active_only=true")
echo "Holders response: $HOLDERS_RESPONSE"
echo ""

# Check if it worked
if echo "$HOLDERS_RESPONSE" | grep -q "detail.*Could not validate"; then
  echo "❌ Authentication failed - cookie not working"
else
  echo "✅ Authentication successful!"
fi

# Cleanup
rm -f $COOKIE_FILE
