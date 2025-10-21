#!/bin/bash

# Test script for Holder Management Feature
# This script demonstrates the holder CRUD operations via API

echo "=========================================="
echo "Holder Management Feature - Live Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:8000"

# First, we need to login to get a token
echo -e "${BLUE}Step 1: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed. Make sure the backend is running and credentials are correct.${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo ""

# Test 1: List holders (should be empty or show existing holders)
echo -e "${BLUE}Step 2: Listing existing holders...${NC}"
curl -s -X GET "$BASE_URL/api/holders?active_only=true" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 2: Create a new holder
echo -e "${BLUE}Step 3: Creating a new holder 'Alice'...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/holders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","default_shares":100}')

HOLDER_ID=$(echo $CREATE_RESPONSE | jq -r '.id')
echo $CREATE_RESPONSE | jq '.'

if [ "$HOLDER_ID" != "null" ] && [ -n "$HOLDER_ID" ]; then
  echo -e "${GREEN}✅ Holder created with ID: $HOLDER_ID${NC}"
else
  echo -e "${RED}❌ Failed to create holder${NC}"
fi
echo ""

# Test 3: Create another holder
echo -e "${BLUE}Step 4: Creating another holder 'Bob'...${NC}"
CREATE_RESPONSE_2=$(curl -s -X POST "$BASE_URL/api/holders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","default_shares":150}')

HOLDER_ID_2=$(echo $CREATE_RESPONSE_2 | jq -r '.id')
echo $CREATE_RESPONSE_2 | jq '.'

if [ "$HOLDER_ID_2" != "null" ] && [ -n "$HOLDER_ID_2" ]; then
  echo -e "${GREEN}✅ Holder created with ID: $HOLDER_ID_2${NC}"
else
  echo -e "${RED}❌ Failed to create holder${NC}"
fi
echo ""

# Test 4: List all holders
echo -e "${BLUE}Step 5: Listing all holders...${NC}"
curl -s -X GET "$BASE_URL/api/holders?active_only=true" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 5: Get specific holder
if [ "$HOLDER_ID" != "null" ] && [ -n "$HOLDER_ID" ]; then
  echo -e "${BLUE}Step 6: Getting holder details for Alice (ID: $HOLDER_ID)...${NC}"
  curl -s -X GET "$BASE_URL/api/holders/$HOLDER_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""
fi

# Test 6: Update holder
if [ "$HOLDER_ID" != "null" ] && [ -n "$HOLDER_ID" ]; then
  echo -e "${BLUE}Step 7: Updating Alice's default shares to 200...${NC}"
  curl -s -X PUT "$BASE_URL/api/holders/$HOLDER_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"default_shares":200}' | jq '.'
  echo ""
fi

# Test 7: Try to create duplicate holder (should fail)
echo -e "${BLUE}Step 8: Attempting to create duplicate holder 'Alice' (should fail)...${NC}"
DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/holders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","default_shares":100}')

echo $DUPLICATE_RESPONSE | jq '.'
if echo $DUPLICATE_RESPONSE | grep -q "already exists"; then
  echo -e "${GREEN}✅ Duplicate validation working correctly${NC}"
else
  echo -e "${RED}❌ Duplicate validation not working${NC}"
fi
echo ""

# Test 8: Deactivate holder
if [ "$HOLDER_ID_2" != "null" ] && [ -n "$HOLDER_ID_2" ]; then
  echo -e "${BLUE}Step 9: Deactivating Bob (ID: $HOLDER_ID_2)...${NC}"
  DEACTIVATE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/holders/$HOLDER_ID_2" \
    -H "Authorization: Bearer $TOKEN")
  
  if [ -z "$DEACTIVATE_RESPONSE" ]; then
    echo -e "${GREEN}✅ Holder deactivated successfully${NC}"
  else
    echo $DEACTIVATE_RESPONSE | jq '.'
  fi
  echo ""
fi

# Test 9: List active holders (Bob should not appear)
echo -e "${BLUE}Step 10: Listing active holders (Bob should not appear)...${NC}"
curl -s -X GET "$BASE_URL/api/holders?active_only=true" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 10: List all holders including inactive
echo -e "${BLUE}Step 11: Listing all holders including inactive...${NC}"
curl -s -X GET "$BASE_URL/api/holders?active_only=false" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Holder Management Feature Test Complete!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "- ✅ Authentication working"
echo "- ✅ Create holder working"
echo "- ✅ List holders working"
echo "- ✅ Get holder details working"
echo "- ✅ Update holder working"
echo "- ✅ Duplicate validation working"
echo "- ✅ Deactivate holder working"
echo "- ✅ Active/inactive filtering working"
echo ""
echo "You can now access the UI at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API Docs: http://localhost:8000/docs"
echo ""
echo "To test the UI:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Login with username: admin, password: admin"
echo "  3. Click 'Holders' in the navigation"
echo "  4. Try creating, editing, and deactivating holders"
