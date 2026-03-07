#!/bin/bash
set -e

echo "🚀 Deploying Career Portal"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Run ./scripts/deploy-setup.sh first${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Deploying API service...${NC}"
railway service api
railway up --detach

echo ""
echo -e "${YELLOW}⏳ Waiting for API to be ready (30s)...${NC}"
sleep 30

echo ""
echo -e "${BLUE}🎨 Deploying Web service...${NC}"
railway service web
railway up --detach

echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo ""
echo -e "${BLUE}📊 Check deployment status:${NC}"
echo "  railway service api"
echo "  railway logs"
echo ""
echo "  railway service web"
echo "  railway logs"
echo ""
echo -e "${YELLOW}🌐 Your app will be available at the domains shown in the Railway dashboard${NC}"
