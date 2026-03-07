#!/bin/bash
set -e

echo "🔍 Career Portal - Health Check"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get API service URL
railway service api
API_URL=$(railway variables get RAILWAY_PUBLIC_DOMAIN 2>/dev/null || echo "")

if [ -z "$API_URL" ]; then
    echo -e "${RED}❌ Could not get API URL${NC}"
    exit 1
fi

API_URL="https://$API_URL"

echo -e "${BLUE}Testing API: ${API_URL}${NC}"
echo ""

# Test API health
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✅ API is responding (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ API health check failed (HTTP $HTTP_CODE)${NC}"
fi

# Get Web service URL
railway service web
WEB_URL=$(railway variables get RAILWAY_PUBLIC_DOMAIN 2>/dev/null || echo "")

if [ -z "$WEB_URL" ]; then
    echo -e "${RED}❌ Could not get Web URL${NC}"
    exit 1
fi

WEB_URL="https://$WEB_URL"

echo -e "${BLUE}Testing Web: ${WEB_URL}${NC}"
echo ""

# Test Web health
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Web is responding (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Web health check failed (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo -e "${YELLOW}📊 Service URLs:${NC}"
echo -e "  API: ${API_URL}"
echo -e "  Web: ${WEB_URL}"
